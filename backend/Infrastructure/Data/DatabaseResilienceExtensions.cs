using Microsoft.EntityFrameworkCore;
using MySqlConnector;

namespace CafeteriaSimulacion.Api.Infrastructure.Data;

public static class DatabaseResilienceExtensions
{
    public static IServiceCollection AddResilientCafeteriaDbContext(this IServiceCollection services, IConfiguration configuration)
    {
        var statusService = new DatabaseStatusService();
        services.AddSingleton<IDatabaseStatusService>(statusService);

        string? connString = configuration.GetConnectionString("DefaultConnection");
        bool mySqlAvailable = false;
        string? failureReason = null;

        if (!string.IsNullOrWhiteSpace(connString))
        {
            try
            {
                // Agregamos un timeout corto de prueba (3 segundos) para no demorar el arranque si MySQL no está levantado
                var builder = new MySqlConnectionStringBuilder(connString)
                {
                    ConnectionTimeout = 3
                };

                using var testConn = new MySqlConnection(builder.ConnectionString);
                testConn.Open();
                mySqlAvailable = true;
                testConn.Close();
            }
            catch (Exception ex)
            {
                mySqlAvailable = false;
                failureReason = ex.Message;
            }
        }
        else
        {
            failureReason = "Cadena de conexión 'DefaultConnection' no especificada o vacía.";
        }

        if (mySqlAvailable && !string.IsNullOrWhiteSpace(connString))
        {
            try
            {
                services.AddDbContext<AppDbContext>(options =>
                {
                    options.UseMySql(connString, ServerVersion.AutoDetect(connString), mySqlOptions =>
                    {
                        mySqlOptions.EnableRetryOnFailure(
                            maxRetryCount: 3,
                            maxRetryDelay: TimeSpan.FromSeconds(5),
                            errorNumbersToAdd: null);
                    });
                });

                statusService.SetStatus("MySQL Server", false);
                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine("[DATABASE RESILIENCE] Conexión exitosa con el servidor MySQL. Persistencia relacional activada.");
                Console.ResetColor();
            }
            catch (Exception ex)
            {
                Console.ForegroundColor = ConsoleColor.Yellow;
                Console.WriteLine($"[DATABASE RESILIENCE] Error configurando EF Core con MySQL: {ex.Message}. Conmutando a InMemory.");
                Console.ResetColor();

                services.AddDbContext<AppDbContext>(options =>
                {
                    options.UseInMemoryDatabase("CafeteriaSimulacionDb");
                });
                statusService.SetStatus("InMemory (Fallback Resiliente)", true, ex.Message);
            }
        }
        else
        {
            Console.ForegroundColor = ConsoleColor.Yellow;
            Console.WriteLine("================================================================================");
            Console.WriteLine("[DATABASE RESILIENCE] Servidor MySQL no disponible o no accesible.");
            Console.WriteLine($"[DATABASE RESILIENCE] Motivo: {failureReason}");
            Console.WriteLine("[DATABASE RESILIENCE] Activando automáticamente 'Microsoft.EntityFrameworkCore.InMemory'.");
            Console.WriteLine("[DATABASE RESILIENCE] La API y todas las simulaciones funcionarán al 100% de manera fluida y sin interrupciones.");
            Console.WriteLine("================================================================================");
            Console.ResetColor();

            services.AddDbContext<AppDbContext>(options =>
            {
                options.UseInMemoryDatabase("CafeteriaSimulacionDb");
            });

            statusService.SetStatus("InMemory (Fallback Resiliente)", true, failureReason);
        }

        return services;
    }

    public static void EnsureDatabaseCreated(this IApplicationBuilder app)
    {
        using var scope = app.ApplicationServices.CreateScope();
        try
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Database.EnsureCreated();
        }
        catch (Exception ex)
        {
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine($"[DATABASE WARNING] Error al ejecutar EnsureCreated: {ex.Message}");
            Console.ResetColor();
        }
    }
}
