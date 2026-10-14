using Microsoft.EntityFrameworkCore;
using CafeteriaSimulacion.Api.Infrastructure.Data;
using CafeteriaSimulacion.Api.Simulation.Engine;
using CafeteriaSimulacion.Api.Simulation.Model;
using Xunit;

namespace CafeteriaSimulacion.Tests;

public class DatabaseResilienceTests
{
    [Fact]
    public async Task InMemoryDatabase_PersistsSimulationRunAndRetrievesCorrectly()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var engine = new SimulationEngine();
        var result = engine.RunSimulation(new SimulationParameters { HorizonMinutes = 20, Seed = 99 });
        result.Run.DatabaseEngineUsed = "InMemory (Fallback Resiliente)";

        using (var context = new AppDbContext(options))
        {
            context.SimulationRuns.Add(result.Run);
            await context.SaveChangesAsync();
        }

        using (var readContext = new AppDbContext(options))
        {
            var savedRun = await readContext.SimulationRuns
                .Include(r => r.CustomerRecords)
                .Include(r => r.Events)
                .FirstOrDefaultAsync(r => r.Id == result.Run.Id);

            Assert.NotNull(savedRun);
            Assert.Equal("InMemory (Fallback Resiliente)", savedRun.DatabaseEngineUsed);
            Assert.Equal(result.Run.TotalCustomersArrived, savedRun.TotalCustomersArrived);
            Assert.NotEmpty(savedRun.CustomerRecords);
            Assert.NotEmpty(savedRun.Events);
        }
    }
}
