using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CafeteriaSimulacion.Api.Domain.Entities;
using CafeteriaSimulacion.Api.DTOs;
using CafeteriaSimulacion.Api.Infrastructure.Data;
using CafeteriaSimulacion.Api.Infrastructure.Excel;
using CafeteriaSimulacion.Api.Simulation.Engine;
using CafeteriaSimulacion.Api.Simulation.Model;

namespace CafeteriaSimulacion.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SimulationController : ControllerBase
{
    private readonly ISimulationEngine _engine;
    private readonly AppDbContext _dbContext;
    private readonly ISimulationExcelExporter _excelExporter;
    private readonly IDatabaseStatusService _dbStatus;
    private readonly ILogger<SimulationController> _logger;

    public SimulationController(
        ISimulationEngine engine,
        AppDbContext dbContext,
        ISimulationExcelExporter excelExporter,
        IDatabaseStatusService dbStatus,
        ILogger<SimulationController> logger)
    {
        _engine = engine;
        _dbContext = dbContext;
        _excelExporter = excelExporter;
        _dbStatus = dbStatus;
        _logger = logger;
    }

    /// <summary>
    /// Diagnóstico del estado del backend y el motor de base de datos activo.
    /// </summary>
    [HttpGet("status")]
    public IActionResult GetStatus()
    {
        return Ok(new SystemStatusDto
        {
            Status = "Online",
            DatabaseEngine = _dbStatus.ActiveEngine,
            IsFallbackInMemory = _dbStatus.IsFallbackInMemory,
            FallbackReason = _dbStatus.FailureReason,
            ServerTime = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Ejecuta una simulación estocástica de eventos discretos (DES) y persiste los resultados.
    /// </summary>
    [HttpPost("run")]
    public async Task<IActionResult> RunSimulation([FromBody] RunSimulationRequest request)
    {
        try
        {
            var parameters = new SimulationParameters
            {
                HorizonMinutes = request.HorizonMinutes > 0 ? request.HorizonMinutes : 60.0,
                CashiersCount = request.CashiersCount > 0 ? request.CashiersCount : 2,
                TablesOf4Count = request.TablesOf4Count > 0 ? request.TablesOf4Count : 20,
                TablesOf2Count = request.TablesOf2Count > 0 ? request.TablesOf2Count : 10,
                Seed = request.Seed,
                Description = string.IsNullOrWhiteSpace(request.Description) ? "Simulación Cafetería Universitaria" : request.Description
            };

            var result = _engine.RunSimulation(parameters);
            result.Run.DatabaseEngineUsed = _dbStatus.ActiveEngine;

            // Guardar en la base de datos (MySQL o InMemory de fallback)
            _dbContext.SimulationRuns.Add(result.Run);
            await _dbContext.SaveChangesAsync();

            _logger.LogInformation("Simulación ejecutada y guardada exitosamente con ID: {SimulationId} en {Engine}",
                result.Run.Id, _dbStatus.ActiveEngine);

            return Ok(new SimulationDetailResponse
            {
                Run = result.Run,
                TableMetrics = result.TableMetrics,
                CashierMetrics = result.CashierMetrics
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error crítico durante la ejecución o persistencia de la simulación.");
            return StatusCode(500, new { message = "Error interno ejecutando la simulación", error = ex.Message });
        }
    }

    /// <summary>
    /// Obtiene el historial resumido de simulaciones ejecutadas.
    /// </summary>
    [HttpGet("history")]
    public async Task<IActionResult> GetHistory()
    {
        try
        {
            var list = await _dbContext.SimulationRuns
                .AsNoTracking()
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new SimulationSummaryDto
                {
                    Id = r.Id,
                    CreatedAt = r.CreatedAt,
                    HorizonMinutes = r.HorizonMinutes,
                    ActualTotalTimeMinutes = r.ActualTotalTimeMinutes,
                    TotalGroupsArrived = r.TotalGroupsArrived,
                    TotalCustomersArrived = r.TotalCustomersArrived,
                    TotalCustomersServed = r.TotalCustomersServed,
                    TotalServedDineIn = r.TotalServedDineIn,
                    TotalServedTakeaway = r.TotalServedTakeaway,
                    TotalAbandonedQueue = r.TotalAbandonedQueue,
                    TotalAbandonedNoTable = r.TotalAbandonedNoTable,
                    TotalItemsSold = r.TotalItemsSold,
                    AvgQueueWaitTimeMinutes = r.AvgQueueWaitTimeMinutes,
                    AvgCashierServiceTimeMinutes = r.AvgCashierServiceTimeMinutes,
                    AvgKitchenPrepTimeMinutes = r.AvgKitchenPrepTimeMinutes,
                    AvgDiningTimeMinutes = r.AvgDiningTimeMinutes,
                    AvgTotalTimeInSystemMinutes = r.AvgTotalTimeInSystemMinutes,
                    OverallCashierUtilizationPercent = r.OverallCashierUtilizationPercent,
                    AvgTableChairsOccupancyPercent = r.AvgTableChairsOccupancyPercent,
                    MaxQueueLength = r.MaxQueueLength,
                    DatabaseEngineUsed = r.DatabaseEngineUsed,
                    Description = r.Description
                })
                .ToListAsync();

            return Ok(list);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error obteniendo el historial de simulaciones.");
            return StatusCode(500, new { message = "Error recuperando el historial", error = ex.Message });
        }
    }

    /// <summary>
    /// Obtiene el detalle completo de una simulación por ID, incluyendo clientes y eventos.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetSimulationById(Guid id)
    {
        try
        {
            var run = await _dbContext.SimulationRuns
                .Include(r => r.CustomerRecords)
                .Include(r => r.Events)
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.Id == id);

            if (run == null)
            {
                return NotFound(new { message = $"Simulación con ID {id} no encontrada." });
            }

            // Ordenar los eventos y clientes para una presentación impecable
            run.Events = run.Events.OrderBy(e => e.TimestampMinute).ToList();
            run.CustomerRecords = run.CustomerRecords.OrderBy(c => c.GroupId).ThenBy(c => c.CustomerIndexInGroup).ToList();

            return Ok(new SimulationDetailResponse
            {
                Run = run,
                TableMetrics = CalculateTableMetrics(run),
                CashierMetrics = CalculateCashierMetrics(run)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error obteniendo detalle de la simulación {SimulationId}", id);
            return StatusCode(500, new { message = "Error recuperando la simulación", error = ex.Message });
        }
    }

    /// <summary>
    /// Genera y descarga un archivo Excel (.xlsx) altamente estilizado con ClosedXML para la simulación especificada.
    /// </summary>
    [HttpGet("{id:guid}/export-excel")]
    public async Task<IActionResult> ExportToExcel(Guid id)
    {
        try
        {
            var run = await _dbContext.SimulationRuns
                .Include(r => r.CustomerRecords)
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.Id == id);

            if (run == null)
            {
                return NotFound(new { message = $"Simulación con ID {id} no encontrada." });
            }

            var tableMetrics = CalculateTableMetrics(run);
            var cashierMetrics = CalculateCashierMetrics(run);

            byte[] excelBytes = _excelExporter.ExportToExcel(run, tableMetrics, cashierMetrics);
            string fileName = $"Simulacion_Cafeteria_{run.Id.ToString()[..8]}_{DateTime.UtcNow:yyyyMMdd_HHmmss}.xlsx";

            return File(
                excelBytes,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                fileName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generando reporte Excel para la simulación {SimulationId}", id);
            return StatusCode(500, new { message = "Error exportando archivo Excel", error = ex.Message });
        }
    }

    private static List<TableOccupancyMetric> CalculateTableMetrics(SimulationRun run)
    {
        double simDuration = run.ActualTotalTimeMinutes > 0 ? run.ActualTotalTimeMinutes : run.HorizonMinutes;
        var list = new List<TableOccupancyMetric>();

        for (int i = 1; i <= 30; i++)
        {
            int cap = i <= 20 ? 4 : 2;
            var records = run.CustomerRecords.Where(r => r.TableNumber == i).ToList();
            double occupiedMinutes = records.Sum(r => (r.DiningDurationMinutes + r.PostMealDurationMinutes));
            double possibleMinutes = cap * simDuration;
            double pct = possibleMinutes > 0 ? Math.Min(100.0, (occupiedMinutes / possibleMinutes) * 100.0) : 0;
            int groups = records.Select(r => r.GroupId).Distinct().Count();

            list.Add(new TableOccupancyMetric
            {
                TableNumber = i,
                Capacity = cap,
                TotalChairMinutesUsed = Math.Round(occupiedMinutes, 2),
                TotalPossibleChairMinutes = Math.Round(possibleMinutes, 2),
                OccupancyPercentage = Math.Round(pct, 2),
                TotalGroupsHosted = groups
            });
        }

        return list;
    }

    private static List<CashierOccupancyMetric> CalculateCashierMetrics(SimulationRun run)
    {
        double simDuration = run.ActualTotalTimeMinutes > 0 ? run.ActualTotalTimeMinutes : run.HorizonMinutes;
        return new List<CashierOccupancyMetric>
        {
            new()
            {
                CashierId = 1,
                BusyTimeMinutes = Math.Round(simDuration * (run.Cashier1UtilizationPercent / 100.0), 2),
                TotalSimulationMinutes = Math.Round(simDuration, 2),
                UtilizationPercentage = run.Cashier1UtilizationPercent,
                TotalCustomersServed = run.CustomerRecords.Count(c => c.CashierId == 1)
            },
            new()
            {
                CashierId = 2,
                BusyTimeMinutes = Math.Round(simDuration * (run.Cashier2UtilizationPercent / 100.0), 2),
                TotalSimulationMinutes = Math.Round(simDuration, 2),
                UtilizationPercentage = run.Cashier2UtilizationPercent,
                TotalCustomersServed = run.CustomerRecords.Count(c => c.CashierId == 2)
            }
        };
    }
}
