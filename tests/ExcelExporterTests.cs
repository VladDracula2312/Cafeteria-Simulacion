using ClosedXML.Excel;
using CafeteriaSimulacion.Api.Infrastructure.Excel;
using CafeteriaSimulacion.Api.Simulation.Engine;
using CafeteriaSimulacion.Api.Simulation.Model;
using Xunit;

namespace CafeteriaSimulacion.Tests;

public class ExcelExporterTests
{
    [Fact]
    public void ExportToExcel_GeneratesValidWorkbookWithThreeStyledSheets()
    {
        var engine = new SimulationEngine();
        var result = engine.RunSimulation(new SimulationParameters { HorizonMinutes = 30, Seed = 77 });

        var exporter = new SimulationExcelExporter();
        byte[] bytes = exporter.ExportToExcel(result.Run, result.TableMetrics, result.CashierMetrics);

        Assert.NotNull(bytes);
        Assert.NotEmpty(bytes);

        // Abrir el binario generado con ClosedXML para verificar la integridad
        using var stream = new MemoryStream(bytes);
        using var workbook = new XLWorkbook(stream);

        Assert.Equal(3, workbook.Worksheets.Count);

        // Validar Hoja 1: Resumen Ejecutivo
        var sheet1 = workbook.Worksheet("Resumen Ejecutivo");
        Assert.NotNull(sheet1);
        string sheet1Text = string.Join(" ", sheet1.CellsUsed().Select(c => c.GetString()));
        Assert.Contains("Luis Carlos Tovar Garrido", sheet1Text);
        Assert.Contains("Pedro Eli Diaz Olarte", sheet1Text);
        Assert.Contains("Vlad Esteban Preciado Ruiz", sheet1Text);
        Assert.Contains("Simulación Digital", sheet1Text);

        // Validar Hoja 2: Detalle Clientes
        var sheet2 = workbook.Worksheet("Detalle Clientes");
        Assert.NotNull(sheet2);
        Assert.True(sheet2.RowCount() >= 2); // Encabezado + clientes

        // Validar Hoja 3: Cajeros y Mesas
        var sheet3 = workbook.Worksheet("Cajeros y Mesas");
        Assert.NotNull(sheet3);
        string sheet3Text = string.Join(" ", sheet3.CellsUsed().Select(c => c.GetString()));
        Assert.Contains("Cajero #1", sheet3Text);
        Assert.Contains("Cajero #2", sheet3Text);
        Assert.Contains("Mesa 01", sheet3Text);
        Assert.Contains("Mesa 30", sheet3Text);
    }
}
