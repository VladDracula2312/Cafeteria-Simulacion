// Motor Estocástico de Simulación Digital de Cafetería Universitaria
// Asignatura: Simulación Digital
// Docente: Luis Carlos Tovar Garrido
// Estudiantes: Pedro Eli Diaz Olarte & Vlad Esteban Preciado Ruiz

import { CustomerGroup, SimulationParams, SimulationResult } from '../types/simulation';

// Generador pseudoaleatorio congruencial con soporte para semilla
class PseudoRandom {
  private seed: number;

  constructor(seed?: number) {
    this.seed = seed ?? Math.floor(Math.random() * 2147483647);
  }

  // Genera un número uniforme [0, 1)
  next(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }

  uniform(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  exponential(lambda: number): number {
    const u = Math.max(1e-7, this.next());
    return -Math.log(1 - u) / lambda;
  }

  triangular(a: number, b: number, c: number): number {
    const u = this.next();
    const fc = (c - a) / (b - a);
    if (u < fc) {
      return a + Math.sqrt(u * (b - a) * (c - a));
    } else {
      return b - Math.sqrt((1 - u) * (b - a) * (b - c));
    }
  }
}

interface TableReservation {
  tableId: number;
  tipoMesa: string;
  capacidad: 4 | 2;
  liberacionTime: number;
}

export function runClientSimulation(params: SimulationParams): SimulationResult {
  const {
    horizonteMinutos,
    tasaLlegadasPorMinuto = 0.45,
    probabilidadLlevar = 0.28,
    probabilidadCompra = 0.95,
    semilla,
  } = params;

  const rng = new PseudoRandom(semilla);
  const clientes: CustomerGroup[] = [];

  // Estado de los 2 cajeros (tiempo en que quedarán libres)
  let cajero1LibreEn = 0;
  let cajero2LibreEn = 0;
  let tiempoOcupadoCajero1 = 0;
  let tiempoOcupadoCajero2 = 0;

  // Estado de las 30 mesas:
  // 1 a 20: 4 puestos (capacidad 4)
  // 21 a 30: 2 puestos (capacidad 2)
  const mesas: TableReservation[] = [];
  for (let i = 1; i <= 20; i++) {
    mesas.push({ tableId: i, tipoMesa: 'Mesa 4p', capacidad: 4, liberacionTime: 0 });
  }
  for (let i = 21; i <= 30; i++) {
    mesas.push({ tableId: i, tipoMesa: 'Mesa 2p', capacidad: 2, liberacionTime: 0 });
  }

  // Generación de llegadas hasta el horizonte
  let tiempoActual = 0;
  let grupoSeq = 1;

  while (tiempoActual < horizonteMinutos) {
    const interArribo = rng.exponential(tasaLlegadasPorMinuto);
    tiempoActual += interArribo;

    if (tiempoActual > horizonteMinutos) break;

    // Tamaño del grupo: 1 (40%), 2 (35%), 3 (15%), 4 (10%)
    const uTam = rng.next();
    let tamano = 1;
    if (uTam < 0.40) tamano = 1;
    else if (uTam < 0.75) tamano = 2;
    else if (uTam < 0.90) tamano = 3;
    else tamano = 4;

    const compraAlgo = rng.next() <= probabilidadCompra;
    const esParaLlevar = rng.next() <= probabilidadLlevar;
    const itemsComprados = compraAlgo ? Math.max(1, Math.min(6, Math.round(rng.uniform(1, tamano * 1.5 + 0.5)))) : 0;

    // Tiempo antes de entrar a la cola (decisión / mirar el menú)
    const tiempoAntesPedir = rng.uniform(0.3, 1.2);
    const tiempoLlegadaCola = tiempoActual + tiempoAntesPedir;

    // Paciencia máxima en la cola (minutos)
    const pacienciaMax = rng.uniform(6.0, 15.0);

    clientes.push({
      id: grupoSeq,
      numeroGrupo: grupoSeq,
      tamanoGrupo: tamano,
      esParaLlevar,
      compraAlgo,
      itemsComprados,
      horaLlegada: Number(tiempoActual.toFixed(2)),
      tiempoAntesPedir: Number(tiempoAntesPedir.toFixed(2)),
      tiempoLlegadaCola: Number(tiempoLlegadaCola.toFixed(2)),
      tiempoInicioCaja: null,
      tiempoFinCaja: null,
      cajeroAsignado: null,
      tiempoInicioPrep: null,
      tiempoFinPrep: null,
      mesaAsignada: null,
      tipoMesa: null,
      tiempoInicioComer: null,
      tiempoFinComer: null,
      tiempoSalida: Number(tiempoLlegadaCola.toFixed(2)),
      tiempoEsperaCola: 0,
      pacienciaMaxCola: Number(pacienciaMax.toFixed(2)),
      estadoFinal: 'Atendido',
    });

    grupoSeq++;
  }

  // Procesamiento cronológico de la cola única FIFO con los 2 cajeros
  // Ordenar los clientes por momento en que entran a la cola
  clientes.sort((a, b) => a.tiempoLlegadaCola - b.tiempoLlegadaCola);

  // Muestreo temporal para cálculo de ocupación de mesas
  const mesaSampleStep = 0.5; // cada medio minuto
  const totalMesaSlots = Math.floor(horizonteMinutos / mesaSampleStep);
  const mesasOcupadasPorSlot = new Array(totalMesaSlots).fill(0);

  for (const c of clientes) {
    const tCola = c.tiempoLlegadaCola;

    // Próximo cajero disponible
    let cajeroElegido: 1 | 2;
    let tiempoDisponibleCajero = 0;

    if (cajero1LibreEn <= cajero2LibreEn) {
      cajeroElegido = 1;
      tiempoDisponibleCajero = cajero1LibreEn;
    } else {
      cajeroElegido = 2;
      tiempoDisponibleCajero = cajero2LibreEn;
    }

    const tiempoInicioAtencion = Math.max(tCola, tiempoDisponibleCajero);
    const esperaEnCola = tiempoInicioAtencion - tCola;

    // ¿Se agota la paciencia antes de que lo atienda el cajero?
    if (esperaEnCola > c.pacienciaMaxCola) {
      c.estadoFinal = 'AbandonoCola';
      c.tiempoSalida = Number((tCola + c.pacienciaMaxCola).toFixed(2));
      c.tiempoEsperaCola = Number(c.pacienciaMaxCola.toFixed(2));
      continue;
    }

    // Duración de la atención en caja
    // Base: 1.2 min + 0.35 min por item
    const baseCaja = rng.uniform(1.0, 2.2);
    const duracionCaja = baseCaja + (c.itemsComprados * rng.uniform(0.25, 0.6));
    const tiempoFinCaja = tiempoInicioAtencion + duracionCaja;

    c.tiempoInicioCaja = Number(tiempoInicioAtencion.toFixed(2));
    c.tiempoFinCaja = Number(tiempoFinCaja.toFixed(2));
    c.cajeroAsignado = cajeroElegido;
    c.tiempoEsperaCola = Number(esperaEnCola.toFixed(2));

    // Actualizar cajero
    if (cajeroElegido === 1) {
      cajero1LibreEn = tiempoFinCaja;
      tiempoOcupadoCajero1 += Math.min(duracionCaja, Math.max(0, horizonteMinutos - tiempoInicioAtencion));
    } else {
      cajero2LibreEn = tiempoFinCaja;
      tiempoOcupadoCajero2 += Math.min(duracionCaja, Math.max(0, horizonteMinutos - tiempoInicioAtencion));
    }

    // Preparación de alimentos/bebidas
    const tiempoPrep = c.itemsComprados > 0 ? rng.uniform(1.5, 4.0) : 0.5;
    const tiempoFinPrep = tiempoFinCaja + tiempoPrep;
    c.tiempoInicioPrep = Number(tiempoFinCaja.toFixed(2));
    c.tiempoFinPrep = Number(tiempoFinPrep.toFixed(2));

    // ¿Es para llevar?
    if (c.esParaLlevar) {
      c.estadoFinal = 'ParaLlevar';
      c.tiempoSalida = Number(tiempoFinPrep.toFixed(2));
      continue;
    }

    // Si come en la cafetería, busca una de las 30 mesas disponibles
    const horaListoParaMesa = tiempoFinPrep;

    // Algoritmo de asignación de mesas:
    // Mesas 21..30 (capacidad 2): Preferidas para grupos de 1 o 2
    // Mesas 1..20 (capacidad 4): Para grupos de 3 o 4, o si se llenan las de 2
    let mesaAsignada: TableReservation | null = null;

    if (c.tamanoGrupo <= 2) {
      // 1. Buscar en mesas de 2 libres a horaListoParaMesa
      const libre2 = mesas.filter(m => m.capacidad === 2 && m.liberacionTime <= horaListoParaMesa);
      if (libre2.length > 0) {
        mesaAsignada = libre2[0];
      } else {
        // 2. Si no hay de 2, buscar en mesas de 4 libres
        const libre4 = mesas.filter(m => m.capacidad === 4 && m.liberacionTime <= horaListoParaMesa);
        if (libre4.length > 0) {
          mesaAsignada = libre4[0];
        }
      }
    } else {
      // Grupos de 3 o 4 requieren mesas de 4
      const libre4 = mesas.filter(m => m.capacidad === 4 && m.liberacionTime <= horaListoParaMesa);
      if (libre4.length > 0) {
        mesaAsignada = libre4[0];
      }
    }

    // Si no hay mesa inmediatamente libre, verificar si se libera en una breve tolerancia (máx 3.5 min)
    if (!mesaAsignada) {
      const toleranciaMesa = 3.5;
      const candidatos = mesas
        .filter(m => (c.tamanoGrupo <= 2 || m.capacidad === 4))
        .filter(m => m.liberacionTime > horaListoParaMesa && m.liberacionTime <= horaListoParaMesa + toleranciaMesa)
        .sort((a, b) => a.liberacionTime - b.liberacionTime);

      if (candidatos.length > 0) {
        mesaAsignada = candidatos[0];
      }
    }

    if (!mesaAsignada) {
      // No encontró mesa disponible -> Abandono por falta de silla/mesa
      c.estadoFinal = 'AbandonoSilla';
      c.tiempoSalida = Number((horaListoParaMesa + 1.0).toFixed(2));
      continue;
    }

    // Mesa encontrada con éxito
    const tiempoInicioComer = Math.max(horaListoParaMesa, mesaAsignada.liberacionTime);
    // Duración de comida: Uniform(14, 28) minutos
    const duracionComer = rng.uniform(14.0, 28.0);
    const tiempoFinComer = tiempoInicioComer + duracionComer;

    mesaAsignada.liberacionTime = tiempoFinComer;
    c.mesaAsignada = mesaAsignada.tableId;
    c.tipoMesa = mesaAsignada.tipoMesa;
    c.tiempoInicioComer = Number(tiempoInicioComer.toFixed(2));
    c.tiempoFinComer = Number(tiempoFinComer.toFixed(2));
    c.tiempoSalida = Number(tiempoFinComer.toFixed(2));
    c.estadoFinal = 'Atendido';

    // Registrar ocupación de mesas para el promedio
    const slotInicio = Math.max(0, Math.floor(tiempoInicioComer / mesaSampleStep));
    const slotFin = Math.min(totalMesaSlots, Math.floor(tiempoFinComer / mesaSampleStep));
    for (let s = slotInicio; s < slotFin; s++) {
      mesasOcupadasPorSlot[s]++;
    }
  }

  // Cálculos estadísticos globales
  const totalGrupos = clientes.length;
  const totalPersonas = clientes.reduce((acc, curr) => acc + curr.tamanoGrupo, 0);
  const totalAtendidos = clientes.filter(c => c.estadoFinal === 'Atendido').length;
  const totalParaLlevar = clientes.filter(c => c.estadoFinal === 'ParaLlevar').length;
  const totalAbandonoCola = clientes.filter(c => c.estadoFinal === 'AbandonoCola').length;
  const totalAbandonoSilla = clientes.filter(c => c.estadoFinal === 'AbandonoSilla').length;
  const totalItemsVendidos = clientes
    .filter(c => c.estadoFinal === 'Atendido' || c.estadoFinal === 'ParaLlevar')
    .reduce((acc, curr) => acc + curr.itemsComprados, 0);

  // Promedio de espera en cola (para los que no abandonaron antes de hacer la cola o promedio general en cola)
  const promedioEsperaColaMinutos = totalGrupos > 0
    ? Number((clientes.reduce((acc, curr) => acc + curr.tiempoEsperaCola, 0) / totalGrupos).toFixed(2))
    : 0;

  const utilizacionCajero1 = Number(
    Math.min(100, (tiempoOcupadoCajero1 / Math.max(1, horizonteMinutos)) * 100).toFixed(2)
  );
  const utilizacionCajero2 = Number(
    Math.min(100, (tiempoOcupadoCajero2 / Math.max(1, horizonteMinutos)) * 100).toFixed(2)
  );

  // Ocupación promedio de las 30 mesas (en %)
  const sumaMesasOcupadas = mesasOcupadasPorSlot.reduce((acc, val) => acc + Math.min(30, val), 0);
  const ocupacionPromedioMesas = totalMesaSlots > 0
    ? Number(((sumaMesasOcupadas / (totalMesaSlots * 30)) * 100).toFixed(2))
    : 0;

  return {
    id: Date.now(),
    fechaEjecucion: new Date().toISOString(),
    horizonteMinutos,
    totalGrupos,
    totalPersonas,
    totalAtendidos,
    totalParaLlevar,
    totalAbandonoCola,
    totalAbandonoSilla,
    totalItemsVendidos,
    promedioEsperaColaMinutos,
    utilizacionCajero1,
    utilizacionCajero2,
    ocupacionPromedioMesas,
    notas: `Simulación ejecutada a ${horizonteMinutos} min. 30 Mesas (20x4p, 10x2p), 2 Cajeros, Cola FIFO única.`,
    clientes,
    origen: 'Simulador Local (TypeScript)',
  };
}
