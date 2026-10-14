// Definición de tipos para la Simulación Digital de Cafetería Universitaria
// Asignatura: Simulación Digital
// Docente: Luis Carlos Tovar Garrido
// Estudiantes: Pedro Eli Diaz Olarte & Vlad Esteban Preciado Ruiz

export interface SimulationParams {
  horizonteMinutos: number;
  tasaLlegadasPorMinuto?: number; // Lambda (ej. 0.45 grupos/min)
  probabilidadLlevar?: number;    // Ej. 0.25 (25% para llevar)
  probabilidadCompra?: number;    // Ej. 0.95 (95% compran)
  semilla?: number;
}

export type EstadoFinalCliente = 'Atendido' | 'ParaLlevar' | 'AbandonoCola' | 'AbandonoSilla';

export interface CustomerGroup {
  id: number;
  numeroGrupo: number;
  tamanoGrupo: number;           // 1 a 4 personas
  esParaLlevar: boolean;
  compraAlgo: boolean;
  itemsComprados: number;
  horaLlegada: number;           // Minuto de llegada general
  tiempoAntesPedir: number;      // Tiempo antes de entrar a la cola
  tiempoLlegadaCola: number;     // Minuto en que entra a la cola
  tiempoInicioCaja: number | null;
  tiempoFinCaja: number | null;
  cajeroAsignado: number | null; // 1 o 2
  tiempoInicioPrep: number | null;
  tiempoFinPrep: number | null;
  mesaAsignada: number | null;   // 1 a 30
  tipoMesa: string | null;       // 'Mesa 4p' | 'Mesa 2p'
  tiempoInicioComer: number | null;
  tiempoFinComer: number | null;
  tiempoSalida: number;
  tiempoEsperaCola: number;
  pacienciaMaxCola: number;
  estadoFinal: EstadoFinalCliente;
}

export interface CashierInfo {
  id: 1 | 2;
  estado: 'Libre' | 'Atendiendo';
  grupoActualId: number | null;
  tiempoFinAtencion: number | null;
  totalAtendidos: number;
  tiempoTotalOcupado: number;
}

export interface TableInfo {
  id: number;                   // 1 a 30
  capacidad: 4 | 2;             // 1..20 = 4 puestos, 21..30 = 2 puestos
  personasSentadas: number;
  grupoActualId: number | null;
  tiempoLiberacion: number | null;
  estado: 'Libre' | 'Parcial' | 'Lleno';
}

export interface SimulationResult {
  id: number | string;
  fechaEjecucion: string;
  horizonteMinutos: number;
  totalGrupos: number;
  totalPersonas: number;
  totalAtendidos: number;
  totalParaLlevar: number;
  totalAbandonoCola: number;
  totalAbandonoSilla: number;
  totalItemsVendidos: number;
  promedioEsperaColaMinutos: number;
  utilizacionCajero1: number;
  utilizacionCajero2: number;
  ocupacionPromedioMesas: number;
  notas?: string;
  clientes: CustomerGroup[];
  origen: 'API Backend C#' | 'Simulador Local (TypeScript)';
}
