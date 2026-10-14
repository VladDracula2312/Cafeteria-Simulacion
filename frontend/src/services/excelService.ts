// Servicio de Exportación a Excel (.xlsx) usando SheetJS (xlsx)
// Asignatura: Simulación Digital
// Docente: Luis Carlos Tovar Garrido
// Estudiantes: Pedro Eli Diaz Olarte & Vlad Esteban Preciado Ruiz

import * as XLSX from 'xlsx';
import { SimulationResult } from '../types/simulation';

export function exportSimulationToExcel(result: SimulationResult, filename?: string) {
  const wb = XLSX.utils.book_new();

  // Hoja 1: Resumen General y KPIs Institucionales
  const resumenData = [
    ['SIMULACIÓN DIGITAL - CAFETERÍA UNIVERSITARIA'],
    ['UNIVERSIDAD DE CARTAGENA / FACULTAD DE INGENIERÍA'],
    ['Docente:', 'Luis Carlos Tovar Garrido'],
    ['Estudiantes:', 'Pedro Eli Diaz Olarte & Vlad Esteban Preciado Ruiz'],
    ['Fecha de Simulación:', new Date(result.fechaEjecucion).toLocaleString()],
    ['Origen de Ejecución:', result.origen],
    ['Horizonte de Simulación (min):', result.horizonteMinutos],
    [],
    ['INDICADORES CLAVE DE DESEMPEÑO (KPIS)', 'VALOR', 'UNIDAD / DESCRIPCIÓN'],
    ['Total de Grupos Llegados', result.totalGrupos, 'grupos'],
    ['Total de Personas / Clientes', result.totalPersonas, 'personas'],
    ['Clientes Atendidos en Sala', result.totalAtendidos, 'grupos'],
    ['Pedidos Para Llevar', result.totalParaLlevar, 'pedidos'],
    ['Abandonos en Cola (Impaciencia)', result.totalAbandonoCola, 'grupos'],
    ['Abandonos por Falta de Silla/Mesa', result.totalAbandonoSilla, 'grupos'],
    ['Total de Items / Productos Vendidos', result.totalItemsVendidos, 'unidades'],
    ['Tiempo Promedio de Espera en Cola', result.promedioEsperaColaMinutos, 'minutos'],
    ['Utilización de Cajero 1', `${result.utilizacionCajero1}%`, 'porcentaje de ocupación'],
    ['Utilización de Cajero 2', `${result.utilizacionCajero2}%`, 'porcentaje de ocupación'],
    ['Ocupación Promedio de Mesas (30 mesas)', `${result.ocupacionPromedioMesas}%`, 'porcentaje de ocupación global'],
    [],
    ['CONFIGURACIÓN DEL SISTEMA'],
    ['Cajeros Disponibles:', 2, 'Cajero 1 y Cajero 2'],
    ['Total de Mesas:', 30, '20 mesas de 4 personas + 10 mesas de 2 personas'],
    ['Capacidad Total de Sillas:', 100, '80 sillas (mesas 4p) + 20 sillas (mesas 2p)'],
    ['Disciplina de Cola:', 'FIFO (First-In, First-Out)', 'Cola única'],
  ];

  const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
  // Ajuste de anchos de columna
  wsResumen['!cols'] = [{ wch: 38 }, { wch: 25 }, { wch: 35 }];
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen_KPIs');

  // Hoja 2: Detalle Completo de Clientes
  const clientesHeaders = [
    'ID',
    'NumeroGrupo',
    'TamanoGrupo',
    'EsParaLlevar',
    'CompraAlgo',
    'ItemsComprados',
    'HoraLlegada (min)',
    'TiempoAntesPedir (min)',
    'TiempoLlegadaCola (min)',
    'TiempoEsperaCola (min)',
    'TiempoInicioCaja (min)',
    'TiempoFinCaja (min)',
    'CajeroAsignado',
    'TiempoInicioPrep (min)',
    'TiempoFinPrep (min)',
    'MesaAsignada',
    'TipoMesa',
    'TiempoInicioComer (min)',
    'TiempoFinComer (min)',
    'TiempoSalida (min)',
    'EstadoFinal'
  ];

  const clientesRows = result.clientes.map(c => [
    c.id,
    c.numeroGrupo,
    c.tamanoGrupo,
    c.esParaLlevar ? 'SI' : 'NO',
    c.compraAlgo ? 'SI' : 'NO',
    c.itemsComprados,
    c.horaLlegada,
    c.tiempoAntesPedir,
    c.tiempoLlegadaCola,
    c.tiempoEsperaCola,
    c.tiempoInicioCaja ?? 'N/A',
    c.tiempoFinCaja ?? 'N/A',
    c.cajeroAsignado ? `Cajero ${c.cajeroAsignado}` : 'N/A',
    c.tiempoInicioPrep ?? 'N/A',
    c.tiempoFinPrep ?? 'N/A',
    c.mesaAsignada ? `Mesa ${c.mesaAsignada}` : 'N/A',
    c.tipoMesa ?? 'N/A',
    c.tiempoInicioComer ?? 'N/A',
    c.tiempoFinComer ?? 'N/A',
    c.tiempoSalida,
    c.estadoFinal
  ]);

  const wsClientes = XLSX.utils.aoa_to_sheet([clientesHeaders, ...clientesRows]);
  wsClientes['!cols'] = [
    { wch: 6 },  // ID
    { wch: 13 }, // Grupo
    { wch: 12 }, // Tamano
    { wch: 12 }, // Llevar
    { wch: 12 }, // Compra
    { wch: 14 }, // Items
    { wch: 16 }, // Llegada
    { wch: 20 }, // AntesPedir
    { wch: 20 }, // LlegadaCola
    { wch: 20 }, // EsperaCola
    { wch: 18 }, // InicioCaja
    { wch: 16 }, // FinCaja
    { wch: 15 }, // Cajero
    { wch: 18 }, // InicioPrep
    { wch: 16 }, // FinPrep
    { wch: 14 }, // Mesa
    { wch: 14 }, // TipoMesa
    { wch: 18 }, // InicioComer
    { wch: 16 }, // FinComer
    { wch: 16 }, // Salida
    { wch: 16 }, // EstadoFinal
  ];
  XLSX.utils.book_append_sheet(wb, wsClientes, 'Detalle_Clientes');

  // Hoja 3: Distribución y Capacidad de Mesas
  const mesasHeaders = ['Mesa #', 'Tipo', 'Capacidad Sillas', 'Total Ocupaciones en Simulación'];
  const ocupacionesPorMesa = new Array(31).fill(0);
  result.clientes.forEach(c => {
    if (c.mesaAsignada && c.mesaAsignada >= 1 && c.mesaAsignada <= 30) {
      ocupacionesPorMesa[c.mesaAsignada]++;
    }
  });

  const mesasRows = [];
  for (let m = 1; m <= 30; m++) {
    const tipo = m <= 20 ? 'Mesa Familiar / Grande' : 'Mesa Individual / Doble';
    const cap = m <= 20 ? 4 : 2;
    mesasRows.push([`Mesa ${m}`, tipo, cap, ocupacionesPorMesa[m]]);
  }

  const wsMesas = XLSX.utils.aoa_to_sheet([mesasHeaders, ...mesasRows]);
  wsMesas['!cols'] = [{ wch: 12 }, { wch: 25 }, { wch: 18 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, wsMesas, 'Estadisticas_Mesas');

  const finalName = filename || `Simulacion_Cafeteria_${result.horizonteMinutos}min_${Date.now()}.xlsx`;
  XLSX.writeFile(wb, finalName);
}
