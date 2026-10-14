using System.Text.Json.Serialization;
using Microsoft.OpenApi.Models;
using CafeteriaSimulacion.Api.Infrastructure.Data;
using CafeteriaSimulacion.Api.Infrastructure.Excel;
using CafeteriaSimulacion.Api.Simulation.Engine;
using CafeteriaSimulacion.Api.Simulation.Stochastic;

var builder = WebApplication.CreateBuilder(args);

// Configuración de Controladores y Serialización JSON
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

// Configuración de CORS permisivo (Frontend Vercel, Localhost, etc.)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Configuración de Persistencia Resiliente (MySQL con fallback a InMemory)
builder.Services.AddResilientCafeteriaDbContext(builder.Configuration);

// Inyección de Dependencias del Motor de Simulación y Exportador Excel
builder.Services.AddTransient<IStochasticGenerator, StochasticGenerator>();
builder.Services.AddScoped<ISimulationEngine, SimulationEngine>();
builder.Services.AddScoped<ISimulationExcelExporter, SimulationExcelExporter>();

// Swagger / OpenAPI con metadatos
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Cafetería Universitaria - Simulación de Eventos Discretos API",
        Version = "v1",
        Description = "API de Simulación Estocástica de Eventos Discretos (DES).\n" +
                      "Asignatura: Simulación Digital\n" +
                      "Docente: Luis Carlos Tovar Garrido\n" +
                      "Estudiantes: Pedro Eli Diaz Olarte & Vlad Esteban Preciado Ruiz",
        Contact = new OpenApiContact
        {
            Name = "Pedro Eli Diaz Olarte & Vlad Esteban Preciado Ruiz"
        }
    });
});

var app = builder.Build();

// Garantizar esquema de Base de Datos listo (MySQL o InMemory)
app.EnsureDatabaseCreated();

// Pipeline de Middleware
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Cafetería Simulación API v1");
    c.RoutePrefix = string.Empty; // Swagger en la raíz "/" para acceso inmediato
});

app.UseCors("AllowAll");

app.UseAuthorization();

app.MapControllers();

app.Run();
