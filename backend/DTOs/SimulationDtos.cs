using CafeteriaSimulacion.Api.Domain.Entities;
using CafeteriaSimulacion.Api.Simulation.Model;

namespace CafeteriaSimulacion.Api.DTOs;

public class RunSimulationRequest
{
    public double HorizonMinutes { get; set; } = 60.0;
    public int CashiersCount { get; set; } = 2;
    public int TablesOf4Count { get; set; } = 20;
    public int TablesOf2Count { get; set; } = 10;
    public int? Seed { get; set; } = null;
    public string? Description { get; set; } = "Simulación Cafetería Universitaria";
}

public class SimulationSummaryDto
{
    public Guid Id { get; set; }
    public DateTime CreatedAt { get; set; }
    public double HorizonMinutes { get; set; }
    public double ActualTotalTimeMinutes { get; set; }
    public int TotalGroupsArrived { get; set; }
    public int TotalCustomersArrived { get; set; }
    public int TotalCustomersServed { get; set; }
    public int TotalServedDineIn { get; set; }
    public int TotalServedTakeaway { get; set; }
    public int TotalAbandonedQueue { get; set; }
    public int TotalAbandonedNoTable { get; set; }
    public int TotalItemsSold { get; set; }
    public double AvgQueueWaitTimeMinutes { get; set; }
    public double AvgCashierServiceTimeMinutes { get; set; }
    public double AvgKitchenPrepTimeMinutes { get; set; }
    public double AvgDiningTimeMinutes { get; set; }
    public double AvgTotalTimeInSystemMinutes { get; set; }
    public double OverallCashierUtilizationPercent { get; set; }
    public double AvgTableChairsOccupancyPercent { get; set; }
    public int MaxQueueLength { get; set; }
    public string DatabaseEngineUsed { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public class SimulationDetailResponse
{
    public SimulationRun Run { get; set; } = null!;
    public List<TableOccupancyMetric> TableMetrics { get; set; } = new();
    public List<CashierOccupancyMetric> CashierMetrics { get; set; } = new();
}

public class SystemStatusDto
{
    public string Status { get; set; } = "Healthy";
    public string DatabaseEngine { get; set; } = string.Empty;
    public bool IsFallbackInMemory { get; set; }
    public string? FallbackReason { get; set; }
    public DateTime ServerTime { get; set; } = DateTime.UtcNow;
}
