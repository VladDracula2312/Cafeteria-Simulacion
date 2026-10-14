using CafeteriaSimulacion.Api.Domain.Entities;
using CafeteriaSimulacion.Api.Simulation.Model;

namespace CafeteriaSimulacion.Api.Infrastructure.Excel;

public interface ISimulationExcelExporter
{
    byte[] ExportToExcel(SimulationRun run, List<TableOccupancyMetric>? tableMetrics = null, List<CashierOccupancyMetric>? cashierMetrics = null);
}
