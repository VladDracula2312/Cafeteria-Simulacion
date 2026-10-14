using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using CafeteriaSimulacion.Api.Domain.Enums;

namespace CafeteriaSimulacion.Api.Domain.Entities;

public class SimulationCustomerRecord
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid SimulationRunId { get; set; }

    [JsonIgnore]
    [ForeignKey(nameof(SimulationRunId))]
    public SimulationRun? SimulationRun { get; set; }

    public int GroupId { get; set; }
    public int GroupSize { get; set; }
    public int CustomerIndexInGroup { get; set; }

    // Tiempos (minutos de reloj)
    public double ArrivalMinute { get; set; }
    public double DecisionTimeMinutes { get; set; }
    public double QueueEntryMinute { get; set; }
    public double? ServiceStartMinute { get; set; }
    public double? ServiceEndMinute { get; set; }
    public double? OrderReadyMinute { get; set; }
    public double? TableSeatedMinute { get; set; }
    public double? TableLeaveMinute { get; set; }
    public double? ExitMinute { get; set; }

    // Duraciones
    public double QueueWaitTimeMinutes { get; set; }
    public double CashierServiceDurationMinutes { get; set; }
    public double PreparationDurationMinutes { get; set; }
    public double DiningDurationMinutes { get; set; }
    public double PostMealDurationMinutes { get; set; }
    public double TotalTimeInSystemMinutes { get; set; }

    // Recursos asignados
    public int? CashierId { get; set; }
    public int? TableNumber { get; set; }
    public int? TableCapacity { get; set; }
    public bool SharedTable { get; set; }

    // Comportamiento estocástico
    public CustomerStatus Status { get; set; }
    public bool IsTakeaway { get; set; }
    public bool BuysFood { get; set; }
    public bool BringsOwnFood { get; set; }
    public int ItemsOrderedCount { get; set; }
    public double PatienceLimitMinutes { get; set; }
    public bool WillingToShareTable { get; set; }
    public bool HadToLeaveQueueForPatience { get; set; }
    public bool HadToLeaveForNoTable { get; set; }
}
