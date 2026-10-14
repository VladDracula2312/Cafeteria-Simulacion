using CafeteriaSimulacion.Api.Domain.Entities;
using CafeteriaSimulacion.Api.Domain.Enums;

namespace CafeteriaSimulacion.Api.Simulation.Model;

public class InternalSimEvent
{
    public double Time { get; set; }
    public EventType EventType { get; set; }
    public string Description { get; set; } = string.Empty;
    public string EntityRef { get; set; } = string.Empty;
    public Action Execute { get; set; } = () => { };

    public InternalSimEvent(double time, EventType eventType, string entityRef, string description, Action execute)
    {
        Time = time;
        EventType = eventType;
        EntityRef = entityRef;
        Description = description;
        Execute = execute;
    }
}

public class TableOccupancyMetric
{
    public int TableNumber { get; set; }
    public int Capacity { get; set; }
    public double TotalChairMinutesUsed { get; set; }
    public double TotalPossibleChairMinutes { get; set; }
    public double OccupancyPercentage { get; set; }
    public int TotalGroupsHosted { get; set; }
}

public class CashierOccupancyMetric
{
    public int CashierId { get; set; }
    public double BusyTimeMinutes { get; set; }
    public double TotalSimulationMinutes { get; set; }
    public double UtilizationPercentage { get; set; }
    public int TotalCustomersServed { get; set; }
}

public class SimulationResult
{
    public SimulationRun Run { get; set; } = new();
    public List<SimCustomer> Customers { get; set; } = new();
    public List<SimulationEvent> EventsLog { get; set; } = new();
    public List<TableOccupancyMetric> TableMetrics { get; set; } = new();
    public List<CashierOccupancyMetric> CashierMetrics { get; set; } = new();
}
