namespace CafeteriaSimulacion.Api.Simulation.Model;

public class SimulationParameters
{
    public double HorizonMinutes { get; set; } = 60.0;
    public int CashiersCount { get; set; } = 2;
    public int TablesOf4Count { get; set; } = 20; // 80 sillas
    public int TablesOf2Count { get; set; } = 10; // 20 sillas
    public int TotalChairs => (TablesOf4Count * 4) + (TablesOf2Count * 2); // 100 sillas
    public int? Seed { get; set; } = null;
    public string? Description { get; set; } = "Simulación Cafetería Universitaria";
}
