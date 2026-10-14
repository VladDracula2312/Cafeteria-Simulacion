// Visualizador Interactivo de la Cafetería Universitaria
// Muestra en tiempo real t: Cola Única FIFO, 2 Cajeros y 30 Mesas (20 de 4 puestos y 10 de 2 puestos)
// Temática: Carnaval de Barranquilla (Folclor Caribeño)
// CERO EMOJIS: Uso exclusivo de Lucide Icons y elementos SVG vectoriales

import React, { useState } from 'react';
import {
  Users,
  CreditCard,
  UtensilsCrossed,
  CheckCircle2,
  ShoppingBag,
} from 'lucide-react';
import { SimulationResult } from '../types/simulation';

interface LiveVisualizerProps {
  result: SimulationResult | null;
  currentTime: number;
}

export const LiveVisualizer: React.FC<LiveVisualizerProps> = ({ result, currentTime }) => {
  const [selectedTable, setSelectedTable] = useState<number | null>(null);

  if (!result) {
    return null;
  }

  // 1. Clientes en Cola FIFO en el minuto currentTime
  // Llegó a la cola <= currentTime Y (aún no entra a caja O caja empieza después de currentTime) Y no ha salido por abandono antes de currentTime
  const clientesEnCola = result.clientes
    .filter((c) => {
      if (c.tiempoLlegadaCola > currentTime) return false;
      // Si abandonó la cola por impaciencia antes o en currentTime
      if (c.estadoFinal === 'AbandonoCola' && c.tiempoSalida <= currentTime) return false;
      // Si ya entró a caja antes o en currentTime
      if (c.tiempoInicioCaja !== null && c.tiempoInicioCaja <= currentTime) return false;
      return true;
    })
    .sort((a, b) => a.tiempoLlegadaCola - b.tiempoLlegadaCola);

  // 2. Estado de Cajero 1 y Cajero 2 en currentTime
  const clienteCajero1 = result.clientes.find(
    (c) =>
      c.cajeroAsignado === 1 &&
      c.tiempoInicioCaja !== null &&
      c.tiempoFinCaja !== null &&
      c.tiempoInicioCaja <= currentTime &&
      c.tiempoFinCaja > currentTime
  );

  const clienteCajero2 = result.clientes.find(
    (c) =>
      c.cajeroAsignado === 2 &&
      c.tiempoInicioCaja !== null &&
      c.tiempoFinCaja !== null &&
      c.tiempoInicioCaja <= currentTime &&
      c.tiempoFinCaja > currentTime
  );

  // Clientes en preparación / entrega de pedido
  const clientesEnPrep = result.clientes.filter(
    (c) =>
      c.tiempoFinCaja !== null &&
      c.tiempoFinPrep !== null &&
      c.tiempoFinCaja <= currentTime &&
      c.tiempoFinPrep > currentTime
  );

  // 3. Estado de las 30 Mesas en currentTime
  // Mesas 1 a 20: 4 puestos (80 sillas)
  // Mesas 21 a 30: 2 puestos (20 sillas)
  const mesasEstado = [];
  let totalSillasOcupadas = 0;

  for (let m = 1; m <= 30; m++) {
    const capacidad: 4 | 2 = m <= 20 ? 4 : 2;
    const ocupante = result.clientes.find(
      (c) =>
        c.mesaAsignada === m &&
        c.tiempoInicioComer !== null &&
        c.tiempoFinComer !== null &&
        c.tiempoInicioComer <= currentTime &&
        c.tiempoFinComer > currentTime
    );

    let estado: 'Libre' | 'Parcial' | 'Lleno' = 'Libre';
    let personas = 0;

    if (ocupante) {
      personas = ocupante.tamanoGrupo;
      totalSillasOcupadas += personas;
      if (personas >= capacidad) {
        estado = 'Lleno';
      } else {
        estado = 'Parcial';
      }
    }

    mesasEstado.push({
      id: m,
      capacidad,
      estado,
      ocupante,
      personas,
    });
  }

  const selectedTableInfo = mesasEstado.find((m) => m.id === selectedTable);

  return (
    <div className="space-y-6">
      
      {/* SECCIÓN SUPERIOR: ENTRADA, COLA FIFO Y CAJEROS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* PANEL DE COLA ÚNICA FIFO (7 Columnas) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-carnaval-yellow/20 text-carnaval-yellow">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Cola Única FIFO
                    <span className="text-xs font-mono font-bold bg-carnaval-yellow text-slate-950 px-2 py-0.5 rounded-full">
                      {clientesEnCola.length} en espera
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">Disciplina First-In, First-Out con control de paciencia</p>
                </div>
              </div>

              <span className="text-xs font-mono text-slate-400">
                Minuto: <span className="text-carnaval-yellow font-bold">{currentTime.toFixed(1)}</span>
              </span>
            </div>

            {/* Listado dinámico de clientes en la cola */}
            <div className="mt-4 min-h-[140px] max-h-[220px] overflow-y-auto pr-2 space-y-2.5">
              {clientesEnCola.length === 0 ? (
                <div className="h-28 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
                  <CheckCircle2 className="w-7 h-7 text-emerald-500/50 mb-1" />
                  <span className="text-xs font-medium text-slate-400">No hay clientes esperando en cola en este minuto</span>
                </div>
              ) : (
                clientesEnCola.map((c, idx) => {
                  const esperaActual = Math.max(0, currentTime - c.tiempoLlegadaCola);
                  const ratioPaciencia = Math.min(1, esperaActual / c.pacienciaMaxCola);
                  const isNearPatience = ratioPaciencia > 0.75;

                  return (
                    <div
                      key={c.id}
                      className={`p-2.5 rounded-xl border transition flex items-center justify-between gap-3 ${
                        isNearPatience
                          ? 'bg-rose-950/40 border-rose-500/40'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Posición y Grupo */}
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white text-xs">Grupo #{c.numeroGrupo}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-medium">
                              {c.tamanoGrupo} {c.tamanoGrupo === 1 ? 'persona' : 'personas'}
                            </span>
                            {c.esParaLlevar && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-medium flex items-center gap-1">
                                <ShoppingBag className="w-2.5 h-2.5" /> Llevar
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Llegó min {c.tiempoLlegadaCola.toFixed(1)} | Espera: <span className="font-mono text-slate-200 font-bold">{esperaActual.toFixed(1)} min</span>
                          </div>
                        </div>
                      </div>

                      {/* Barra de paciencia */}
                      <div className="w-28 text-right shrink-0">
                        <div className="flex items-center justify-between text-[9px] text-slate-400 mb-1">
                          <span>Paciencia</span>
                          <span className={`font-mono font-bold ${isNearPatience ? 'text-rose-400' : 'text-slate-300'}`}>
                            {esperaActual.toFixed(1)}/{c.pacienciaMaxCola.toFixed(1)}m
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isNearPatience ? 'bg-rose-500' : 'bg-carnaval-yellow'
                            }`}
                            style={{ width: `${Math.round(ratioPaciencia * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Preparación intermedia rápida */}
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5 text-carnaval-blue" />
              Pedidos en cocina/barra: <span className="font-bold text-white">{clientesEnPrep.length}</span>
            </span>
            <span className="text-[11px] text-slate-500">
              Asignación automática al primer cajero libre
            </span>
          </div>
        </div>

        {/* PANEL DE ATENCIÓN: 2 CAJEROS (5 Columnas) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-carnaval-blue/20 text-carnaval-blue">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Módulos de Pago</h3>
                  <p className="text-xs text-slate-400">2 Cajeros en paralelo</p>
                </div>
              </div>

              <span className="text-xs font-mono font-semibold text-slate-400">
                Capacidad: 2 grupos
              </span>
            </div>

            {/* Tarjetas individuales de los 2 cajeros */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
              
              {/* CAJERO 1 */}
              <div
                className={`p-3.5 rounded-xl border transition ${
                  clienteCajero1
                    ? 'bg-blue-950/40 border-carnaval-blue/60 shadow-lg shadow-blue-500/10'
                    : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-carnaval-blue/20 text-carnaval-blue font-bold text-xs flex items-center justify-center">
                      C1
                    </div>
                    <div>
                      <span className="font-bold text-white text-xs block">Cajero 1</span>
                      <span className="text-[10px] text-slate-400">Facturación & Pago</span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      clienteCajero1
                        ? 'bg-carnaval-blue text-white animate-pulse'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {clienteCajero1 ? 'Atendiendo' : 'Libre'}
                  </span>
                </div>

                {clienteCajero1 ? (
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>Cliente:</span>
                      <span className="font-bold text-white">
                        Grupo #{clienteCajero1.numeroGrupo} ({clienteCajero1.tamanoGrupo} pers)
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>Productos:</span>
                      <span className="font-mono text-carnaval-yellow font-semibold">
                        {clienteCajero1.itemsComprados} ítems
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>Fin de pago est.:</span>
                      <span className="font-mono text-white">
                        min {clienteCajero1.tiempoFinCaja?.toFixed(1)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Disponible para recibir al próximo cliente</span>
                  </div>
                )}
              </div>

              {/* CAJERO 2 */}
              <div
                className={`p-3.5 rounded-xl border transition ${
                  clienteCajero2
                    ? 'bg-purple-950/40 border-purple-500/60 shadow-lg shadow-purple-500/10'
                    : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 font-bold text-xs flex items-center justify-center">
                      C2
                    </div>
                    <div>
                      <span className="font-bold text-white text-xs block">Cajero 2</span>
                      <span className="text-[10px] text-slate-400">Facturación & Pago</span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      clienteCajero2
                        ? 'bg-purple-600 text-white animate-pulse'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {clienteCajero2 ? 'Atendiendo' : 'Libre'}
                  </span>
                </div>

                {clienteCajero2 ? (
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>Cliente:</span>
                      <span className="font-bold text-white">
                        Grupo #{clienteCajero2.numeroGrupo} ({clienteCajero2.tamanoGrupo} pers)
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>Productos:</span>
                      <span className="font-mono text-carnaval-yellow font-semibold">
                        {clienteCajero2.itemsComprados} ítems
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>Fin de pago est.:</span>
                      <span className="font-mono text-white">
                        min {clienteCajero2.tiempoFinCaja?.toFixed(1)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Disponible para recibir al próximo cliente</span>
                  </div>
                )}
              </div>

            </div>
          </div>

          <div className="mt-3 text-[11px] text-slate-500 flex justify-between">
            <span>Utilización C1: <strong className="text-slate-300">{result.utilizacionCajero1}%</strong></span>
            <span>Utilización C2: <strong className="text-slate-300">{result.utilizacionCajero2}%</strong></span>
          </div>
        </div>

      </div>

      {/* SECCIÓN INFERIOR: MAPA DE DISTRIBUCIÓN DE MESAS (30 MESAS) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        
        {/* Cabecera del Mapa de Mesas */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5 text-carnaval-green" />
              Salón de Comedores: Distribución de 30 Mesas (100 Sillas)
            </h3>
            <p className="text-xs text-slate-400">
              Mesas 1 a 20: Capacidad 4 personas (80 sillas) | Mesas 21 a 30: Capacidad 2 personas (20 sillas)
            </p>
          </div>

          {/* Leyenda de colores del Carnaval */}
          <div className="flex items-center gap-3 text-xs flex-wrap bg-slate-950 p-2 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-carnaval-green inline-block shadow-sm shadow-carnaval-green/50" />
              <span className="text-slate-300">Libre</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-carnaval-yellow inline-block shadow-sm shadow-carnaval-yellow/50" />
              <span className="text-slate-300">Parcial</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-carnaval-red inline-block shadow-sm shadow-carnaval-red/50" />
              <span className="text-slate-300">Llena</span>
            </div>
            <div className="h-3 w-px bg-slate-700 mx-1" />
            <span className="font-mono text-slate-400 text-[11px]">
              Sillas Ocupadas: <strong className="text-carnaval-yellow">{totalSillasOcupadas}</strong>/100
            </span>
          </div>
        </div>

        {/* Subsección 1: 20 Mesas de 4 Personas */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded bg-carnaval-yellow" />
              Zona Familiar / Grupos Grandes: 20 Mesas de 4 Puestos (Mesas 1 - 20)
            </span>
            <span className="text-[11px] text-slate-400 font-mono">80 Sillas en total</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-2.5">
            {mesasEstado.slice(0, 20).map((m) => {
              const isSelected = selectedTable === m.id;
              let borderClass = 'border-slate-800 hover:border-slate-600';
              let badgeBg = 'bg-carnaval-green text-slate-950';

              if (m.estado === 'Lleno') {
                borderClass = 'border-carnaval-red/60 bg-red-950/20';
                badgeBg = 'bg-carnaval-red text-white';
              } else if (m.estado === 'Parcial') {
                borderClass = 'border-carnaval-yellow/60 bg-amber-950/20';
                badgeBg = 'bg-carnaval-yellow text-slate-950';
              } else {
                borderClass = 'border-emerald-500/30 bg-emerald-950/10';
              }

              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedTable(isSelected ? null : m.id)}
                  className={`relative p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-between min-h-[96px] ${borderClass} ${
                    isSelected ? 'ring-2 ring-white scale-105 shadow-xl' : ''
                  }`}
                >
                  <div className="flex items-center justify-between w-full text-[10px] text-slate-400">
                    <span className="font-bold text-white">M{m.id}</span>
                    <span className="font-mono text-[9px] px-1 rounded bg-slate-800 text-slate-300">4p</span>
                  </div>

                  {/* Representación visual de la mesa y sus 4 sillas */}
                  <div className="relative my-1">
                    {/* Mesa central */}
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-[10px] font-bold ${
                        m.estado === 'Lleno'
                          ? 'bg-carnaval-red text-white'
                          : m.estado === 'Parcial'
                          ? 'bg-carnaval-yellow text-slate-950'
                          : 'bg-carnaval-green text-slate-950'
                      }`}
                    >
                      {m.personas > 0 ? m.personas : '0'}
                    </div>

                    {/* 4 sillas indicadoras alrededor */}
                    <span className={`absolute -top-1 left-2.5 w-2 h-1 rounded-sm ${m.personas >= 1 ? 'bg-white' : 'bg-slate-700'}`} />
                    <span className={`absolute -bottom-1 left-2.5 w-2 h-1 rounded-sm ${m.personas >= 2 ? 'bg-white' : 'bg-slate-700'}`} />
                    <span className={`absolute top-2.5 -left-1 w-1 h-2 rounded-sm ${m.personas >= 3 ? 'bg-white' : 'bg-slate-700'}`} />
                    <span className={`absolute top-2.5 -right-1 w-1 h-2 rounded-sm ${m.personas >= 4 ? 'bg-white' : 'bg-slate-700'}`} />
                  </div>

                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${badgeBg}`}>
                    {m.estado}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Subsección 2: 10 Mesas de 2 Personas */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded bg-carnaval-blue" />
              Zona Rápida / Dobles: 10 Mesas de 2 Puestos (Mesas 21 - 30)
            </span>
            <span className="text-[11px] text-slate-400 font-mono">20 Sillas en total</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-2.5">
            {mesasEstado.slice(20, 30).map((m) => {
              const isSelected = selectedTable === m.id;
              let borderClass = 'border-slate-800 hover:border-slate-600';
              let badgeBg = 'bg-carnaval-green text-slate-950';

              if (m.estado === 'Lleno') {
                borderClass = 'border-carnaval-red/60 bg-red-950/20';
                badgeBg = 'bg-carnaval-red text-white';
              } else if (m.estado === 'Parcial') {
                borderClass = 'border-carnaval-yellow/60 bg-amber-950/20';
                badgeBg = 'bg-carnaval-yellow text-slate-950';
              } else {
                borderClass = 'border-emerald-500/30 bg-emerald-950/10';
              }

              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedTable(isSelected ? null : m.id)}
                  className={`relative p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-between min-h-[96px] ${borderClass} ${
                    isSelected ? 'ring-2 ring-white scale-105 shadow-xl' : ''
                  }`}
                >
                  <div className="flex items-center justify-between w-full text-[10px] text-slate-400">
                    <span className="font-bold text-white">M{m.id}</span>
                    <span className="font-mono text-[9px] px-1 rounded bg-slate-800 text-slate-300">2p</span>
                  </div>

                  {/* Representación visual de la mesa y sus 2 sillas */}
                  <div className="relative my-1">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[10px] font-bold ${
                        m.estado === 'Lleno'
                          ? 'bg-carnaval-red text-white'
                          : m.estado === 'Parcial'
                          ? 'bg-carnaval-yellow text-slate-950'
                          : 'bg-carnaval-green text-slate-950'
                      }`}
                    >
                      {m.personas > 0 ? m.personas : '0'}
                    </div>

                    {/* 2 sillas */}
                    <span className={`absolute top-2 -left-1 w-1 h-2 rounded-sm ${m.personas >= 1 ? 'bg-white' : 'bg-slate-700'}`} />
                    <span className={`absolute top-2 -right-1 w-1 h-2 rounded-sm ${m.personas >= 2 ? 'bg-white' : 'bg-slate-700'}`} />
                  </div>

                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${badgeBg}`}>
                    {m.estado}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detalle flotante al hacer clic en una mesa */}
        {selectedTableInfo && (
          <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-carnaval-yellow/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-carnaval-yellow/20 text-carnaval-yellow">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  Detalles de Mesa #{selectedTableInfo.id}
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    Capacidad: {selectedTableInfo.capacidad} puestos
                  </span>
                </h4>
                <p className="text-xs text-slate-400">
                  Estado actual: <span className="font-semibold text-white">{selectedTableInfo.estado}</span> (
                  {selectedTableInfo.personas} de {selectedTableInfo.capacidad} puestos ocupados)
                </p>
              </div>
            </div>

            {selectedTableInfo.ocupante ? (
              <div className="text-xs text-slate-300 space-y-1">
                <div>
                  Grupo asignado: <strong className="text-white">Grupo #{selectedTableInfo.ocupante.numeroGrupo}</strong>
                </div>
                <div className="text-slate-400 text-[11px]">
                  Comenzó a comer: min {selectedTableInfo.ocupante.tiempoInicioComer?.toFixed(1)} | Termina: min{' '}
                  <strong className="text-carnaval-yellow">{selectedTableInfo.ocupante.tiempoFinComer?.toFixed(1)}</strong>
                </div>
              </div>
            ) : (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Mesa libre y disponible
              </span>
            )}
          </div>
        )}

      </div>

    </div>
  );
};
