using CafeteriaSimulacion.Api.Domain.Enums;
using CafeteriaSimulacion.Api.Simulation.Engine;
using CafeteriaSimulacion.Api.Simulation.Model;
using Xunit;

namespace CafeteriaSimulacion.Tests;

public class SimulationEngineTests
{
    [Fact]
    public void RunSimulation_Standard60Minutes_ProducesConsistentResults()
    {
        var engine = new SimulationEngine();
        var parameters = new SimulationParameters
        {
            HorizonMinutes = 60.0,
            CashiersCount = 2,
            TablesOf4Count = 20,
            TablesOf2Count = 10,
            Seed = 42
        };

        var result = engine.RunSimulation(parameters);

        Assert.NotNull(result);
        Assert.NotNull(result.Run);
        Assert.Equal(60.0, result.Run.HorizonMinutes);
        Assert.True(result.Run.ActualTotalTimeMinutes >= 60.0);
        Assert.Equal(2, result.Run.CashiersCount);
        Assert.Equal(20, result.Run.TablesOf4Count);
        Assert.Equal(10, result.Run.TablesOf2Count);
        Assert.Equal(100, result.Run.TotalChairsCount);

        // Clientes y Grupos
        Assert.True(result.Run.TotalGroupsArrived > 0);
        Assert.True(result.Run.TotalCustomersArrived >= result.Run.TotalGroupsArrived);

        // Consistencia de la suma de estados
        int sumStatuses = result.Run.TotalCustomersServed
                        + result.Run.TotalAbandonedQueue
                        + result.Run.TotalAbandonedNoTable
                        + result.Run.TotalCompanionsOnly;

        Assert.Equal(result.Run.TotalCustomersArrived, sumStatuses);

        // Clientes atendidos = DineIn + Takeaway
        Assert.Equal(result.Run.TotalCustomersServed, result.Run.TotalServedDineIn + result.Run.TotalServedTakeaway);

        // Utilizaciones válidas
        Assert.InRange(result.Run.Cashier1UtilizationPercent, 0.0, 100.0);
        Assert.InRange(result.Run.Cashier2UtilizationPercent, 0.0, 100.0);
        Assert.InRange(result.Run.OverallCashierUtilizationPercent, 0.0, 100.0);
        Assert.InRange(result.Run.AvgTableChairsOccupancyPercent, 0.0, 100.0);

        // Tiempos promedio válidos
        Assert.True(result.Run.AvgQueueWaitTimeMinutes >= 0);
        Assert.True(result.Run.AvgCashierServiceTimeMinutes >= 0);
        Assert.True(result.Run.AvgKitchenPrepTimeMinutes >= 0);
        Assert.True(result.Run.AvgTotalTimeInSystemMinutes >= 0);

        // Mesas y Cajeros
        Assert.Equal(30, result.TableMetrics.Count);
        Assert.Equal(2, result.CashierMetrics.Count);

        // Eventos registrados
        Assert.NotEmpty(result.EventsLog);
        Assert.Contains(result.EventsLog, e => e.EventType == EventType.CierreLlegadas);
    }

    [Fact]
    public void RunSimulation_Reproducibility_WithSameSeed_YieldsIdenticalMetrics()
    {
        var engine = new SimulationEngine();
        var p1 = new SimulationParameters { HorizonMinutes = 60, Seed = 12345 };
        var p2 = new SimulationParameters { HorizonMinutes = 60, Seed = 12345 };

        var r1 = engine.RunSimulation(p1);
        var r2 = engine.RunSimulation(p2);

        Assert.Equal(r1.Run.TotalCustomersArrived, r2.Run.TotalCustomersArrived);
        Assert.Equal(r1.Run.TotalCustomersServed, r2.Run.TotalCustomersServed);
        Assert.Equal(r1.Run.TotalItemsSold, r2.Run.TotalItemsSold);
        Assert.Equal(r1.Run.AvgQueueWaitTimeMinutes, r2.Run.AvgQueueWaitTimeMinutes);
        Assert.Equal(r1.Run.OverallCashierUtilizationPercent, r2.Run.OverallCashierUtilizationPercent);
    }
}
