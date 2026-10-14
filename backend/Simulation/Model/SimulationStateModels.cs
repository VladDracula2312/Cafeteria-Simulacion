using CafeteriaSimulacion.Api.Domain.Enums;

namespace CafeteriaSimulacion.Api.Simulation.Model;

public class CashierState
{
    public int Id { get; set; }
    public bool IsBusy { get; set; }
    public SimCustomer? CurrentCustomer { get; set; }
    public double TotalBusyTimeMinutes { get; set; }
    public double LastServiceStartTime { get; set; }
    public int TotalCustomersServed { get; set; }

    public CashierState(int id)
    {
        Id = id;
    }
}

public class TableState
{
    public int TableNumber { get; set; }
    public int Capacity { get; set; }
    public int OccupiedChairs { get; set; }
    public int FreeChairs => Capacity - OccupiedChairs;
    public bool IsCompletelyFree => OccupiedChairs == 0;
    public double TotalChairMinutesUsed { get; set; }
    public double LastStateChangeTime { get; set; }
    public int TotalGroupsHosted { get; set; }

    public TableState(int tableNumber, int capacity)
    {
        TableNumber = tableNumber;
        Capacity = capacity;
        OccupiedChairs = 0;
    }
}

public class SimCustomer
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public int GroupId { get; set; }
    public int IndexInGroup { get; set; }
    public int GroupSize { get; set; }

    // Minutos de simulación
    public double ArrivalMinute { get; set; }
    public double DecisionTimeMinutes { get; set; }
    public double QueueEntryMinute { get; set; }
    public double? ServiceStartMinute { get; set; }
    public double? ServiceEndMinute { get; set; }
    public double? OrderReadyMinute { get; set; }
    public double? TableSeatedMinute { get; set; }
    public double? TableLeaveMinute { get; set; }
    public double? ExitMinute { get; set; }

    public double QueueWaitTimeMinutes => ServiceStartMinute.HasValue
        ? Math.Max(0, ServiceStartMinute.Value - QueueEntryMinute)
        : (ExitMinute.HasValue ? Math.Max(0, ExitMinute.Value - QueueEntryMinute) : 0);

    public double CashierServiceDurationMinutes => ServiceEndMinute.HasValue && ServiceStartMinute.HasValue
        ? Math.Max(0, ServiceEndMinute.Value - ServiceStartMinute.Value)
        : 0;

    public double PreparationDurationMinutes => OrderReadyMinute.HasValue && ServiceEndMinute.HasValue
        ? Math.Max(0, OrderReadyMinute.Value - ServiceEndMinute.Value)
        : 0;

    public double DiningDurationMinutes => TableLeaveMinute.HasValue && TableSeatedMinute.HasValue
        ? Math.Max(0, TableLeaveMinute.Value - TableSeatedMinute.Value)
        : 0;

    public double PostMealDurationMinutes { get; set; }

    public double TotalTimeInSystemMinutes => ExitMinute.HasValue
        ? Math.Max(0, ExitMinute.Value - ArrivalMinute)
        : 0;

    public int? CashierId { get; set; }
    public int? TableNumber { get; set; }
    public int? TableCapacity { get; set; }
    public bool SharedTable { get; set; }

    public CustomerStatus Status { get; set; } = CustomerStatus.EsperandoFila;
    public bool IsTakeaway { get; set; }
    public bool BuysFood { get; set; }
    public bool BringsOwnFood { get; set; }
    public int ItemsOrderedCount { get; set; }
    public double PatienceLimitMinutes { get; set; }
    public bool WillingToShareTable { get; set; }
    public bool HadToLeaveQueueForPatience { get; set; }
    public bool HadToLeaveForNoTable { get; set; }
}

public class SimGroup
{
    public int GroupId { get; set; }
    public int Size { get; set; }
    public double ArrivalMinute { get; set; }
    public List<SimCustomer> Customers { get; set; } = new();
    public bool IsTakeaway { get; set; }
    public bool WillingToShareTable { get; set; }
    public int? AssignedTableNumber { get; set; }
    public int? AssignedTableCapacity { get; set; }
}
