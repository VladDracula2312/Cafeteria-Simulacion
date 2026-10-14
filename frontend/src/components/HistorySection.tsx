// Sección de Historial de Simulaciones con Descarga de Excel
// Asignatura: Simulación Digital
// Docente: Luis Carlos Tovar Garrido
// Estudiantes: Pedro Eli Diaz Olarte & Vlad Esteban Preciado Ruiz
// CERO EMOJIS: Uso exclusivo de Lucide Icons

import React from 'react';
import {
  History,
  Calendar,
  Clock,
  Eye,
  Trash2,
  Users,
  Award,
  UtensilsCrossed,
  FileSpreadsheet,
} from 'lucide-react';
import { SimulationResult } from '../types/simulation';

interface HistorySectionProps {
  history: SimulationResult[];
  onSelectSimulation: (item: SimulationResult) => void;
  onDownloadExcel: (item: SimulationResult) => void;
  onClearHistory: () => void;
}

export const HistorySection: React.FC<HistorySectionProps> = ({
  history,
  onSelectSimulation,
  onDownloadExcel,
  onClearHistory,
}) => {
  if (history.length === 0) {
    return null;
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-carnaval-yellow" />
            Historial de Simulaciones Ejecutadas
          </h3>
          <p className="text-xs text-slate-400">
            Registro de corridas anteriores con descarga independiente en formato Excel (.xlsx)
          </p>
        </div>

        <button
          type="button"
          onClick={onClearHistory}
          className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1.5 transition"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Limpiar Historial</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {history.map((item, idx) => {
          const dateStr = new Date(item.fechaEjecucion).toLocaleDateString();
          const timeStr = new Date(item.fechaEjecucion).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <div
              key={item.id || idx}
              className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition shadow-md hover:shadow-lg flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Calendar className="w-3.5 h-3.5 text-carnaval-yellow" />
                    <span>{dateStr} {timeStr}</span>
                  </div>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-carnaval-yellow/10 text-carnaval-yellow border border-carnaval-yellow/30">
                    {item.horizonteMinutos} min
                  </span>
                </div>

                {/* Métricas clave */}
                <div className="grid grid-cols-2 gap-2 my-3 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Users className="w-3.5 h-3.5 text-blue-400" />
                    <span>Grupos: <strong className="text-white">{item.totalGrupos}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Award className="w-3.5 h-3.5 text-carnaval-green" />
                    <span>Atendidos: <strong className="text-white">{item.totalAtendidos}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Espera: <strong className="text-white">{item.promedioEsperaColaMinutos}m</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <UtensilsCrossed className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Mesas: <strong className="text-white">{item.ocupacionPromedioMesas}%</strong></span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-800/60 pt-2">
                  <span>Cajeros: C1 {item.utilizacionCajero1}% | C2 {item.utilizacionCajero2}%</span>
                  <span className="text-slate-400">{item.origen}</span>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onSelectSimulation(item)}
                  className="flex-1 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <Eye className="w-3.5 h-3.5 text-carnaval-yellow" />
                  <span>Visualizar</span>
                </button>

                <button
                  type="button"
                  onClick={() => onDownloadExcel(item)}
                  className="py-1.5 px-3 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition"
                  title="Descargar archivo Excel (.xlsx)"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Excel</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
