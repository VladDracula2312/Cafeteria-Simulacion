// Servicio de Conexión Dual y Resiliente con el Backend C# / Fallback Local
// Asignatura: Simulación Digital
// Docente: Luis Carlos Tovar Garrido
// Estudiantes: Pedro Eli Diaz Olarte & Vlad Esteban Preciado Ruiz

import { CustomerGroup, EstadoFinalCliente, SimulationParams, SimulationResult } from '../types/simulation';
import { runClientSimulation } from './simulationEngine';
import { exportSimulationToExcel } from './excelService';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const LOCAL_STORAGE_HISTORY_KEY = 'cafeteria_simulaciones_historial';

export interface HealthCheckResult {
  isOnline: boolean;
  message: string;
}

export async function checkBackendHealth(): Promise<HealthCheckResult> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(`${API_BASE}/api/simulation/status`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return {
        isOnline: true,
        message: `API C# Conectada (${data.databaseEngine || 'MySQL'})`,
      };
    }
    return { isOnline: false, message: 'Backend no respondió correctamente' };
  } catch {
    return { isOnline: false, message: 'Modo Offline / Resiliente (Motor TypeScript Activo)' };
  }
}

interface BackendCustomerRecord {
  groupId: number;
  groupSize: number;
  customerIndexInGroup: number;
  arrivalMinute: number;
  decisionTimeMinutes: number;
  queueEntryMinute: number;
  serviceStartMinute: number | null;
  serviceEndMinute: number | null;
  orderReadyMinute: number | null;
  tableSeatedMinute: number | null;
  tableLeaveMinute: number | null;
  exitMinute: number | null;
  queueWaitTimeMinutes: number;
  cashierId: number | null;
  tableNumber: number | null;
  tableCapacity: number | null;
  status: number;
  isTakeaway: boolean;
  buysFood: boolean;
  itemsOrderedCount: number;
  patienceLimitMinutes: number;
}

interface BackendSimulationRun {
  id: string;
  createdAt: string;
  horizonMinutes: number;
  totalGroupsArrived: number;
  totalCustomersArrived: number;
  totalCustomersServed: number;
  totalServedDineIn: number;
  totalServedTakeaway: number;
  totalAbandonedQueue: number;
  totalAbandonedNoTable: number;
  totalItemsSold: number;
  avgQueueWaitTimeMinutes: number;
  overallCashierUtilizationPercent: number;
  avgTableChairsOccupancyPercent: number;
  databaseEngineUsed?: string;
  customerRecords?: BackendCustomerRecord[];
}

interface BackendCashierMetric {
  cashierId: number;
  utilizationPercent: number;
}

interface BackendResponse {
  run: BackendSimulationRun;
  cashierMetrics?: BackendCashierMetric[];
}

function mapStatusToFinalState(status: number): EstadoFinalCliente {
  switch (status) {
    case 1:
      return 'Atendido';
    case 2:
      return 'ParaLlevar';
    case 3:
      return 'AbandonoCola';
    case 4:
      return 'AbandonoSilla';
    default:
      return 'Atendido';
  }
}

export async function runSimulation(params: SimulationParams): Promise<SimulationResult> {
  // 1. Intentar comunicarse con la API ASP.NET Core
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(`${API_BASE}/api/simulation/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        horizonMinutes: params.horizonteMinutos,
        cashiersCount: 2,
        tablesOf4Count: 20,
        tablesOf2Count: 10,
        seed: params.semilla,
        description: `Simulación Cafetería ${params.horizonteMinutos} min`,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data: BackendResponse = await res.json();
      const run = data.run;

      // Extraer un registro por grupo (customerIndexInGroup === 0 o primero encontrado)
      const groupRecordsMap = new Map<number, CustomerGroup>();
      if (run.customerRecords) {
        for (const cr of run.customerRecords) {
          if (!groupRecordsMap.has(cr.groupId)) {
            groupRecordsMap.set(cr.groupId, {
              id: cr.groupId,
              numeroGrupo: cr.groupId,
              tamanoGrupo: cr.groupSize,
              esParaLlevar: cr.isTakeaway,
              compraAlgo: cr.buysFood,
              itemsComprados: cr.itemsOrderedCount,
              horaLlegada: Number(cr.arrivalMinute.toFixed(2)),
              tiempoAntesPedir: Number(cr.decisionTimeMinutes.toFixed(2)),
              tiempoLlegadaCola: Number(cr.queueEntryMinute.toFixed(2)),
              tiempoInicioCaja: cr.serviceStartMinute ? Number(cr.serviceStartMinute.toFixed(2)) : null,
              tiempoFinCaja: cr.serviceEndMinute ? Number(cr.serviceEndMinute.toFixed(2)) : null,
              cajeroAsignado: cr.cashierId,
              tiempoInicioPrep: cr.serviceEndMinute ? Number(cr.serviceEndMinute.toFixed(2)) : null,
              tiempoFinPrep: cr.orderReadyMinute ? Number(cr.orderReadyMinute.toFixed(2)) : null,
              mesaAsignada: cr.tableNumber,
              tipoMesa: cr.tableCapacity ? `Mesa ${cr.tableCapacity}p` : null,
              tiempoInicioComer: cr.tableSeatedMinute ? Number(cr.tableSeatedMinute.toFixed(2)) : null,
              tiempoFinComer: cr.tableLeaveMinute ? Number(cr.tableLeaveMinute.toFixed(2)) : null,
              tiempoSalida: Number((cr.exitMinute ?? cr.queueEntryMinute).toFixed(2)),
              tiempoEsperaCola: Number(cr.queueWaitTimeMinutes.toFixed(2)),
              pacienciaMaxCola: Number(cr.patienceLimitMinutes.toFixed(2)),
              estadoFinal: mapStatusToFinalState(cr.status),
            });
          }
        }
      }

      const c1Metric = data.cashierMetrics?.find(m => m.cashierId === 1);
      const c2Metric = data.cashierMetrics?.find(m => m.cashierId === 2);

      const mappedResult: SimulationResult = {
        id: Date.now(),
        fechaEjecucion: run.createdAt,
        horizonteMinutos: run.horizonMinutes,
        totalGrupos: run.totalGroupsArrived,
        totalPersonas: run.totalCustomersArrived,
        totalAtendidos: run.totalServedDineIn,
        totalParaLlevar: run.totalServedTakeaway,
        totalAbandonoCola: run.totalAbandonedQueue,
        totalAbandonoSilla: run.totalAbandonedNoTable,
        totalItemsVendidos: run.totalItemsSold,
        promedioEsperaColaMinutos: Number(run.avgQueueWaitTimeMinutes.toFixed(2)),
        utilizacionCajero1: c1Metric ? Number(c1Metric.utilizationPercent.toFixed(2)) : Number(run.overallCashierUtilizationPercent.toFixed(2)),
        utilizacionCajero2: c2Metric ? Number(c2Metric.utilizationPercent.toFixed(2)) : Number(run.overallCashierUtilizationPercent.toFixed(2)),
        ocupacionPromedioMesas: Number(run.avgTableChairsOccupancyPercent.toFixed(2)),
        notas: `Ejecutado en Backend C# (${run.databaseEngineUsed || 'MySQL'})`,
        clientes: Array.from(groupRecordsMap.values()).sort((a, b) => a.horaLlegada - b.horaLlegada),
        origen: 'API Backend C#',
      };

      saveToLocalHistory(mappedResult);
      return mappedResult;
    }
  } catch {
    // Si la API falla, continuar directamente al fallback local
  }

  // 2. Fallback estocástico autónomo en TypeScript
  const localResult = runClientSimulation(params);
  saveToLocalHistory(localResult);
  return localResult;
}

export async function downloadExcelReport(result: SimulationResult): Promise<void> {
  // Exportar siempre mediante el generador SheetJS integrado con 3 hojas institucionales
  exportSimulationToExcel(result);
}

export function getLocalHistory(): SimulationResult[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SimulationResult[];
  } catch {
    return [];
  }
}

export function saveToLocalHistory(result: SimulationResult): void {
  try {
    const current = getLocalHistory();
    const updated = [result, ...current.filter(item => item.id !== result.id)].slice(0, 15);
    localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

export function clearLocalHistory(): void {
  try {
    localStorage.removeItem(LOCAL_STORAGE_HISTORY_KEY);
  } catch {
    // ignore
  }
}
