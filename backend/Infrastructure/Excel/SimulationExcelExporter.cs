using ClosedXML.Excel;
using CafeteriaSimulacion.Api.Domain.Entities;
using CafeteriaSimulacion.Api.Simulation.Model;

namespace CafeteriaSimulacion.Api.Infrastructure.Excel;

public class SimulationExcelExporter : ISimulationExcelExporter
{
    private static readonly XLColor PrimaryHeaderBg = XLColor.FromArgb(27, 54, 93);     // Azul institucional oscuro
    private static readonly XLColor SecondaryHeaderBg = XLColor.FromArgb(41, 128, 185); // Azul medio
    private static readonly XLColor SubHeaderBg = XLColor.FromArgb(220, 230, 242);       // Azul pastel tenue
    private static readonly XLColor ZebraBg = XLColor.FromArgb(248, 249, 250);          // Gris muy tenue

    public byte[] ExportToExcel(SimulationRun run, List<TableOccupancyMetric>? tableMetrics = null, List<CashierOccupancyMetric>? cashierMetrics = null)
    {
        using var workbook = new XLWorkbook();

        // 1. Hoja Resumen
        BuildSummarySheet(workbook, run);

        // 2. Hoja Detalle Clientes
        BuildCustomersSheet(workbook, run);

        // 3. Hoja Ocupación de Mesas y Cajeros
        BuildResourcesSheet(workbook, run, tableMetrics, cashierMetrics);

        using var memoryStream = new MemoryStream();
        workbook.SaveAs(memoryStream);
        return memoryStream.ToArray();
    }

    private static void SetCellSafeValue(IXLCell cell, object? val)
    {
        if (val == null)
        {
            cell.Value = "-";
        }
        else if (val is double d)
        {
            cell.Value = Math.Round(d, 2);
        }
        else if (val is int i)
        {
            cell.Value = i;
        }
        else if (val is bool b)
        {
            cell.Value = b ? "SÍ" : "NO";
        }
        else
        {
            cell.Value = val.ToString() ?? "-";
        }
    }

    private void BuildSummarySheet(XLWorkbook workbook, SimulationRun run)
    {
        var ws = workbook.Worksheets.Add("Resumen Ejecutivo");
        ws.ShowGridLines = true;

        // Banner Institucional
        ws.Range("B2:H2").Merge();
        var titleCell = ws.Cell("B2");
        titleCell.Value = "SIMULACIÓN DIGITAL - CAFETERÍA UNIVERSITARIA";
        titleCell.Style.Font.Bold = true;
        titleCell.Style.Font.FontSize = 16;
        titleCell.Style.Font.FontColor = XLColor.White;
        titleCell.Style.Fill.BackgroundColor = PrimaryHeaderBg;
        titleCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        titleCell.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        ws.Row(2).Height = 35;

        // Fila de datos institucionales
        int row = 4;
        void WriteMetadataRow(string label, string val)
        {
            ws.Cell(row, 2).Value = label;
            ws.Cell(row, 2).Style.Font.Bold = true;
            ws.Cell(row, 2).Style.Fill.BackgroundColor = SubHeaderBg;
            ws.Range(row, 3, row, 6).Merge();
            ws.Cell(row, 3).Value = val;
            ws.Range(row, 2, row, 6).Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
            row++;
        }

        WriteMetadataRow("Asignatura:", "Simulación Digital");
        WriteMetadataRow("Docente:", "Luis Carlos Tovar Garrido");
        WriteMetadataRow("Estudiantes:", "Pedro Eli Diaz Olarte & Vlad Esteban Preciado Ruiz");
        WriteMetadataRow("Fecha de Ejecución:", run.CreatedAt.ToLocalTime().ToString("yyyy-MM-dd HH:mm:ss"));
        WriteMetadataRow("ID de Corrida:", run.Id.ToString());
        WriteMetadataRow("Motor de Base de Datos:", run.DatabaseEngineUsed);
        WriteMetadataRow("Descripción:", run.Description ?? "Simulación de Cafetería Universitaria");

        row += 2;

        // Sección: Parámetros del Modelo
        ws.Range(row, 2, row, 5).Merge();
        var paramsHeader = ws.Cell(row, 2);
        paramsHeader.Value = "PARÁMETROS DE CONFIGURACIÓN";
        paramsHeader.Style.Font.Bold = true;
        paramsHeader.Style.Font.FontColor = XLColor.White;
        paramsHeader.Style.Fill.BackgroundColor = SecondaryHeaderBg;
        row++;

        void WriteKpiRow(int r, string kpi, object val, string unit = "")
        {
            ws.Cell(r, 2).Value = kpi;
            SetCellSafeValue(ws.Cell(r, 3), val);
            ws.Cell(r, 4).Value = unit;
            ws.Range(r, 2, r, 4).Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
            ws.Range(r, 2, r, 4).Style.Border.InsideBorder = XLBorderStyleValues.Thin;
        }

        WriteKpiRow(row++, "Horizonte Programado", run.HorizonMinutes, "minutos");
        WriteKpiRow(row++, "Tiempo Total Efectivo de Corrida", run.ActualTotalTimeMinutes, "minutos");
        WriteKpiRow(row++, "Número de Cajeros", run.CashiersCount, "cajeros");
        WriteKpiRow(row++, "Mesas para 4 personas", run.TablesOf4Count, "mesas (80 sillas)");
        WriteKpiRow(row++, "Mesas para 2 personas", run.TablesOf2Count, "mesas (20 sillas)");
        WriteKpiRow(row++, "Total Sillas Disponibles", run.TotalChairsCount, "sillas");

        row += 2;

        // Sección: Afluencia y Demanda
        ws.Range(row, 2, row, 5).Merge();
        var flowHeader = ws.Cell(row, 2);
        flowHeader.Value = "AFLUENCIA Y RESULTADOS DE ATENCIÓN";
        flowHeader.Style.Font.Bold = true;
        flowHeader.Style.Font.FontColor = XLColor.White;
        flowHeader.Style.Fill.BackgroundColor = SecondaryHeaderBg;
        row++;

        WriteKpiRow(row++, "Total de Grupos que Llegaron", run.TotalGroupsArrived, "grupos");
        WriteKpiRow(row++, "Total de Clientes que Llegaron", run.TotalCustomersArrived, "clientes");
        WriteKpiRow(row++, "Total Clientes Atendidos Exitosamente", run.TotalCustomersServed, "clientes");
        WriteKpiRow(row++, "Clientes Atendidos en Mesa (Dine-in)", run.TotalServedDineIn, "clientes");
        WriteKpiRow(row++, "Clientes Atendidos Para Llevar", run.TotalServedTakeaway, "clientes");
        WriteKpiRow(row++, "Abandonos por Paciencia en Fila", run.TotalAbandonedQueue, "clientes");
        WriteKpiRow(row++, "Abandonos por Falta de Silla", run.TotalAbandonedNoTable, "clientes");
        WriteKpiRow(row++, "Clientes que Solo Acompañaron", run.TotalCompanionsOnly, "clientes");
        WriteKpiRow(row++, "Total Ítems de Comida/Bebida Vendidos", run.TotalItemsSold, "unidades");

        row += 2;

        // Sección: Métricas de Tiempos Promedio
        ws.Range(row, 2, row, 5).Merge();
        var timesHeader = ws.Cell(row, 2);
        timesHeader.Value = "TIEMPOS PROMEDIO EN EL SISTEMA";
        timesHeader.Style.Font.Bold = true;
        timesHeader.Style.Font.FontColor = XLColor.White;
        timesHeader.Style.Fill.BackgroundColor = SecondaryHeaderBg;
        row++;

        WriteKpiRow(row++, "Tiempo Promedio de Espera en Fila", run.AvgQueueWaitTimeMinutes, "minutos");
        WriteKpiRow(row++, "Tiempo Promedio de Atención en Caja", run.AvgCashierServiceTimeMinutes, "minutos");
        WriteKpiRow(row++, "Tiempo Promedio de Preparación en Cocina", run.AvgKitchenPrepTimeMinutes, "minutos");
        WriteKpiRow(row++, "Tiempo Promedio de Consumo en Mesa", run.AvgDiningTimeMinutes, "minutos");
        WriteKpiRow(row++, "Tiempo Promedio Total en Cafetería", run.AvgTotalTimeInSystemMinutes, "minutos");

        row += 2;

        // Sección: Utilización de Recursos
        ws.Range(row, 2, row, 5).Merge();
        var utilHeader = ws.Cell(row, 2);
        utilHeader.Value = "UTILIZACIÓN DE RECURSOS";
        utilHeader.Style.Font.Bold = true;
        utilHeader.Style.Font.FontColor = XLColor.White;
        utilHeader.Style.Fill.BackgroundColor = SecondaryHeaderBg;
        row++;

        WriteKpiRow(row++, "Utilización Cajero 1", $"{run.Cashier1UtilizationPercent}%", "del tiempo");
        WriteKpiRow(row++, "Utilización Cajero 2", $"{run.Cashier2UtilizationPercent}%", "del tiempo");
        WriteKpiRow(row++, "Utilización Global de Cajeros", $"{run.OverallCashierUtilizationPercent}%", "promedio");
        WriteKpiRow(row++, "Ocupación Promedio de Sillas", $"{run.AvgTableChairsOccupancyPercent}%", "de capacidad");
        WriteKpiRow(row++, "Longitud Máxima de Fila en Caja", run.MaxQueueLength, "personas");

        ws.Columns(2, 6).AdjustToContents();
    }

    private void BuildCustomersSheet(XLWorkbook workbook, SimulationRun run)
    {
        var ws = workbook.Worksheets.Add("Detalle Clientes");
        ws.ShowGridLines = true;

        string[] headers =
        {
            "ID Registro",
            "Grupo #",
            "Tamaño Grupo",
            "Cliente #",
            "Llegada (min)",
            "T. Decisión (min)",
            "Ingreso Fila (min)",
            "Inicio Caja (min)",
            "Fin Caja (min)",
            "Espera Fila (min)",
            "Atención Caja (min)",
            "Cajero #",
            "Listo Entrega (min)",
            "Prep. Cocina (min)",
            "Mesa #",
            "Cap. Mesa",
            "Mesa Compartida",
            "Ocupó Mesa (min)",
            "Liberó Mesa (min)",
            "Tiempo Consumo (min)",
            "Sobremesa (min)",
            "Salida Sistema (min)",
            "T. Total Sistema (min)",
            "Estado Final",
            "¿Para Llevar?",
            "¿Compró Comida?",
            "¿Trajo Comida Propia?",
            "Ítems Pedidos",
            "Paciencia (min)",
            "¿Abandono Paciencia?",
            "¿Abandono Sin Silla?"
        };

        for (int c = 1; c <= headers.Length; c++)
        {
            var cell = ws.Cell(1, c);
            cell.Value = headers[c - 1];
            cell.Style.Font.Bold = true;
            cell.Style.Font.FontColor = XLColor.White;
            cell.Style.Fill.BackgroundColor = PrimaryHeaderBg;
            cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        }

        int row = 2;
        foreach (var cust in run.CustomerRecords.OrderBy(c => c.GroupId).ThenBy(c => c.CustomerIndexInGroup))
        {
            ws.Cell(row, 1).Value = cust.Id.ToString()[..8];
            ws.Cell(row, 2).Value = cust.GroupId;
            ws.Cell(row, 3).Value = cust.GroupSize;
            ws.Cell(row, 4).Value = cust.CustomerIndexInGroup;
            ws.Cell(row, 5).Value = cust.ArrivalMinute;
            ws.Cell(row, 6).Value = cust.DecisionTimeMinutes;
            ws.Cell(row, 7).Value = cust.QueueEntryMinute;
            SetCellSafeValue(ws.Cell(row, 8), cust.ServiceStartMinute);
            SetCellSafeValue(ws.Cell(row, 9), cust.ServiceEndMinute);
            ws.Cell(row, 10).Value = cust.QueueWaitTimeMinutes;
            ws.Cell(row, 11).Value = cust.CashierServiceDurationMinutes;
            SetCellSafeValue(ws.Cell(row, 12), cust.CashierId);
            SetCellSafeValue(ws.Cell(row, 13), cust.OrderReadyMinute);
            ws.Cell(row, 14).Value = cust.PreparationDurationMinutes;
            SetCellSafeValue(ws.Cell(row, 15), cust.TableNumber);
            SetCellSafeValue(ws.Cell(row, 16), cust.TableCapacity);
            ws.Cell(row, 17).Value = cust.SharedTable ? "SÍ" : "NO";
            SetCellSafeValue(ws.Cell(row, 18), cust.TableSeatedMinute);
            SetCellSafeValue(ws.Cell(row, 19), cust.TableLeaveMinute);
            ws.Cell(row, 20).Value = cust.DiningDurationMinutes;
            ws.Cell(row, 21).Value = cust.PostMealDurationMinutes;
            SetCellSafeValue(ws.Cell(row, 22), cust.ExitMinute);
            ws.Cell(row, 23).Value = cust.TotalTimeInSystemMinutes;
            ws.Cell(row, 24).Value = cust.Status.ToString();
            ws.Cell(row, 25).Value = cust.IsTakeaway ? "SÍ" : "NO";
            ws.Cell(row, 26).Value = cust.BuysFood ? "SÍ" : "NO";
            ws.Cell(row, 27).Value = cust.BringsOwnFood ? "SÍ" : "NO";
            ws.Cell(row, 28).Value = cust.ItemsOrderedCount;
            ws.Cell(row, 29).Value = cust.PatienceLimitMinutes;
            ws.Cell(row, 30).Value = cust.HadToLeaveQueueForPatience ? "SÍ" : "NO";
            ws.Cell(row, 31).Value = cust.HadToLeaveForNoTable ? "SÍ" : "NO";

            if (row % 2 == 1)
            {
                ws.Range(row, 1, row, headers.Length).Style.Fill.BackgroundColor = ZebraBg;
            }

            row++;
        }

        ws.Columns(1, headers.Length).AdjustToContents();
    }

    private void BuildResourcesSheet(XLWorkbook workbook, SimulationRun run, List<TableOccupancyMetric>? tableMetrics, List<CashierOccupancyMetric>? cashierMetrics)
    {
        var ws = workbook.Worksheets.Add("Cajeros y Mesas");
        ws.ShowGridLines = true;

        // Tabla 1: Desempeño de Cajeros
        ws.Range("B2:F2").Merge();
        var cajerosHeader = ws.Cell("B2");
        cajerosHeader.Value = "DESEMPEÑO Y UTILIZACIÓN DE CAJEROS (2 CAJEROS)";
        cajerosHeader.Style.Font.Bold = true;
        cajerosHeader.Style.Font.FontColor = XLColor.White;
        cajerosHeader.Style.Fill.BackgroundColor = PrimaryHeaderBg;

        string[] cHeaders = { "Cajero #", "Tiempo Ocupado (min)", "Tiempo Simulación (min)", "% Utilización", "Clientes Atendidos" };
        for (int i = 0; i < cHeaders.Length; i++)
        {
            var cell = ws.Cell(3, 2 + i);
            cell.Value = cHeaders[i];
            cell.Style.Font.Bold = true;
            cell.Style.Fill.BackgroundColor = SubHeaderBg;
            cell.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
        }

        double simDuration = run.ActualTotalTimeMinutes > 0 ? run.ActualTotalTimeMinutes : run.HorizonMinutes;

        var cMetrics = cashierMetrics ?? new List<CashierOccupancyMetric>
        {
            new() { CashierId = 1, BusyTimeMinutes = Math.Round(simDuration * (run.Cashier1UtilizationPercent / 100.0), 2), TotalSimulationMinutes = simDuration, UtilizationPercentage = run.Cashier1UtilizationPercent, TotalCustomersServed = run.CustomerRecords.Count(c => c.CashierId == 1) },
            new() { CashierId = 2, BusyTimeMinutes = Math.Round(simDuration * (run.Cashier2UtilizationPercent / 100.0), 2), TotalSimulationMinutes = simDuration, UtilizationPercentage = run.Cashier2UtilizationPercent, TotalCustomersServed = run.CustomerRecords.Count(c => c.CashierId == 2) }
        };

        int cRow = 4;
        foreach (var c in cMetrics)
        {
            ws.Cell(cRow, 2).Value = $"Cajero #{c.CashierId}";
            ws.Cell(cRow, 3).Value = c.BusyTimeMinutes;
            ws.Cell(cRow, 4).Value = c.TotalSimulationMinutes;
            ws.Cell(cRow, 5).Value = $"{c.UtilizationPercentage:F2}%";
            ws.Cell(cRow, 6).Value = c.TotalCustomersServed;
            ws.Range(cRow, 2, cRow, 6).Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
            ws.Range(cRow, 2, cRow, 6).Style.Border.InsideBorder = XLBorderStyleValues.Thin;
            cRow++;
        }

        // Tabla 2: Utilización de las 30 Mesas (100 Sillas)
        cRow += 2;
        ws.Range(cRow, 2, cRow, 8).Merge();
        var mesasHeader = ws.Cell(cRow, 2);
        mesasHeader.Value = "DISTRIBUCIÓN Y OCUPACIÓN DE MESAS (20 MESAS DE 4 + 10 MESAS DE 2 = 100 SILLAS)";
        mesasHeader.Style.Font.Bold = true;
        mesasHeader.Style.Font.FontColor = XLColor.White;
        mesasHeader.Style.Fill.BackgroundColor = PrimaryHeaderBg;

        cRow++;
        string[] mHeaders = { "Mesa #", "Tipo", "Capacidad Sillas", "Minutos-Silla Ocupadas", "Minutos-Silla Posibles", "% Ocupación", "Grupos Alojados" };
        for (int i = 0; i < mHeaders.Length; i++)
        {
            var cell = ws.Cell(cRow, 2 + i);
            cell.Value = mHeaders[i];
            cell.Style.Font.Bold = true;
            cell.Style.Fill.BackgroundColor = SubHeaderBg;
            cell.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
        }

        cRow++;

        var tMetrics = tableMetrics;
        if (tMetrics == null || !tMetrics.Any())
        {
            tMetrics = new List<TableOccupancyMetric>();
            for (int i = 1; i <= 30; i++)
            {
                int cap = i <= 20 ? 4 : 2;
                var records = run.CustomerRecords.Where(r => r.TableNumber == i).ToList();
                double occupiedMinutes = records.Sum(r => (r.DiningDurationMinutes + r.PostMealDurationMinutes));
                double possibleMinutes = cap * simDuration;
                double pct = possibleMinutes > 0 ? Math.Min(100.0, (occupiedMinutes / possibleMinutes) * 100.0) : 0;
                int groups = records.Select(r => r.GroupId).Distinct().Count();

                tMetrics.Add(new TableOccupancyMetric
                {
                    TableNumber = i,
                    Capacity = cap,
                    TotalChairMinutesUsed = Math.Round(occupiedMinutes, 2),
                    TotalPossibleChairMinutes = Math.Round(possibleMinutes, 2),
                    OccupancyPercentage = Math.Round(pct, 2),
                    TotalGroupsHosted = groups
                });
            }
        }

        foreach (var t in tMetrics.OrderBy(m => m.TableNumber))
        {
            ws.Cell(cRow, 2).Value = $"Mesa {t.TableNumber:D2}";
            ws.Cell(cRow, 3).Value = t.Capacity == 4 ? "Mesa para 4" : "Mesa para 2";
            ws.Cell(cRow, 4).Value = t.Capacity;
            ws.Cell(cRow, 5).Value = t.TotalChairMinutesUsed;
            ws.Cell(cRow, 6).Value = t.TotalPossibleChairMinutes;
            ws.Cell(cRow, 7).Value = $"{t.OccupancyPercentage:F2}%";
            ws.Cell(cRow, 8).Value = t.TotalGroupsHosted;

            ws.Range(cRow, 2, cRow, 8).Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
            ws.Range(cRow, 2, cRow, 8).Style.Border.InsideBorder = XLBorderStyleValues.Thin;

            if (cRow % 2 == 1)
            {
                ws.Range(cRow, 2, cRow, 8).Style.Fill.BackgroundColor = ZebraBg;
            }
            cRow++;
        }

        ws.Columns(2, 8).AdjustToContents();
    }
}
