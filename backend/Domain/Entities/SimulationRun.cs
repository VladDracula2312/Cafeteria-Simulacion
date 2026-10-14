using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using CafeteriaSimulacion.Api.Domain.Enums;

namespace CafeteriaSimulacion.Api.Domain.Entities;

public class SimulationRun
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public double HorizonMinutes { get; set; } = 60.0;
    public double ActualTotalTimeMinutes { get; set; }

    public int CashiersCount { get; set; } = 2;
    public int TablesOf4Count { get; set; } = 20;
    public int TablesOf2Count { get; set; } = 10;
    public int TotalChairsCount { get; set; } = 100;

    // Métricas de clientes
    public int TotalGroupsArrived { get; set; }
    public int TotalCustomersArrived { get; set; }
    public int TotalCustomersServed { get; set; }
    public int TotalServedDineIn { get; set; }
    public int TotalServedTakeaway { get; set; }
    public int TotalAbandonedQueue { get; set; }
    public int TotalAbandonedNoTable { get; set; }
    public int TotalCompanionsOnly { get; set; }
    public int TotalItemsSold { get; set; }

    // Tiempos promedio (en minutos)
    public double AvgQueueWaitTimeMinutes { get; set; }
    public double AvgCashierServiceTimeMinutes { get; set; }
    public double AvgKitchenPrepTimeMinutes { get; set; }
    public double AvgDiningTimeMinutes { get; set; }
    public double AvgTotalTimeInSystemMinutes { get; set; }

    // Métricas de recursos
    public double Cashier1UtilizationPercent { get; set; }
    public double Cashier2UtilizationPercent { get; set; }
    public double OverallCashierUtilizationPercent { get; set; }
    public double AvgTableChairsOccupancyPercent { get; set; }
    public int MaxQueueLength { get; set; }

    [MaxLength(50)]
    public string DatabaseEngineUsed { get; set; } = "MySQL";

    [MaxLength(255)]
    public string? Description { get; set; }

    // Navegación
    public List<SimulationCustomerRecord> CustomerRecords { get; set; } = new();
    public List<SimulationEvent> Events { get; set; } = new();
}
