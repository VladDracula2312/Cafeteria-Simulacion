using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using CafeteriaSimulacion.Api.Domain.Enums;

namespace CafeteriaSimulacion.Api.Domain.Entities;

public class SimulationEvent
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid SimulationRunId { get; set; }

    [JsonIgnore]
    [ForeignKey(nameof(SimulationRunId))]
    public SimulationRun? SimulationRun { get; set; }

    public double TimestampMinute { get; set; }
    public EventType EventType { get; set; }

    [MaxLength(255)]
    public string Description { get; set; } = string.Empty;

    [MaxLength(50)]
    public string EntityRef { get; set; } = string.Empty;

    public int QueueLengthAtEvent { get; set; }
    public int FreeChairsAtEvent { get; set; }
    public int BusyCashiersAtEvent { get; set; }
}
