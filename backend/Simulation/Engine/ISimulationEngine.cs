using CafeteriaSimulacion.Api.Simulation.Model;

namespace CafeteriaSimulacion.Api.Simulation.Engine;

public interface ISimulationEngine
{
    SimulationResult RunSimulation(SimulationParameters parameters);
}
