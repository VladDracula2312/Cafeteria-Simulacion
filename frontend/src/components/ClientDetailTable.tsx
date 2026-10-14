// Tabla de Detalle de Clientes y Trazabilidad de Eventos
// Muestra cada grupo con hora de llegada, espera en cola, cajero asignado, mesa y estado final
// CERO EMOJIS: Uso exclusivo de Lucide Icons

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  Armchair,
  Users,
  ChevronLeft,
  ChevronRight,
  Download,
} from 'lucide-react';
import { CustomerGroup, EstadoFinalCliente } from '../types/simulation';

interface ClientDetailTableProps {
  clientes: CustomerGroup[];
  onExportExcel: () => void;
}

export const ClientDetailTable: React.FC<ClientDetailTableProps> = ({
  clientes,
  onExportExcel,
}) => {
  const [filterState, setFilterState] = useState<string>('TODOS');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 15;

  const filteredClientes = useMemo(() => {
    return clientes.filter((c) => {
      // Filtro por estado
      if (filterState !== 'TODOS' && c.estadoFinal !== filterState) {
        return false;
      }
      // Filtro por término de búsqueda (ej. número de grupo)
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const grupoStr = `grupo ${c.numeroGrupo} g${c.numeroGrupo} #${c.numeroGrupo}`;
        if (!grupoStr.includes(query) && !c.numeroGrupo.toString().includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [clientes, filterState, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredClientes.length / pageSize));
  const pagedClientes = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredClientes.slice(start, start + pageSize);
  }, [filteredClientes, currentPage, pageSize]);

  const getStatusBadge = (estado: EstadoFinalCliente) => {
    switch (estado) {
      case 'Atendido':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Atendido en Sala
          </span>
        );
      case 'ParaLlevar':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <ShoppingBag className="w-3.5 h-3.5" />
            Para Llevar
          </span>
        );
      case 'AbandonoCola':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5" />
            Abandono Cola
          </span>
        );
      case 'AbandonoSilla':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/30">
            <Armchair className="w-3.5 h-3.5" />
            Abandono Silla
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      
      {/* Barra de control superior con filtros y buscador */}
      <div className="p-5 border-b border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-carnaval-yellow" />
            Registro Detallado de Clientes y Trazabilidad
          </h3>
          <p className="text-xs text-slate-400">
            Mostrando {filteredClientes.length} de {clientes.length} grupos registrados
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Buscador */}
          <div className="relative min-w-[160px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar grupo..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-carnaval-yellow"
            />
          </div>

          {/* Selector de filtro por estado */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1" />
            {['TODOS', 'Atendido', 'ParaLlevar', 'AbandonoCola', 'AbandonoSilla'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => {
                  setFilterState(st);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  filterState === st
                    ? 'bg-carnaval-yellow text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st === 'TODOS'
                  ? 'Todos'
                  : st === 'Atendido'
                  ? 'Atendidos'
                  : st === 'ParaLlevar'
                  ? 'Llevar'
                  : st === 'AbandonoCola'
                  ? 'Ab. Cola'
                  : 'Ab. Silla'}
              </button>
            ))}
          </div>

          {/* Botón rápido de exportación a Excel */}
          <button
            type="button"
            onClick={onExportExcel}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-md"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Tabla responsiva */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Grupo #</th>
              <th className="py-3 px-3">Personas</th>
              <th className="py-3 px-3">Llegada</th>
              <th className="py-3 px-3">Espera Cola</th>
              <th className="py-3 px-3">Cajero</th>
              <th className="py-3 px-3">Ítems</th>
              <th className="py-3 px-3">Mesa Asignada</th>
              <th className="py-3 px-3">Fin Comida</th>
              <th className="py-3 px-3">Salida</th>
              <th className="py-3 px-4 text-center">Estado Final</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {pagedClientes.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-8 text-center text-slate-500 font-sans">
                  No se encontraron grupos que coincidan con los filtros aplicados.
                </td>
              </tr>
            ) : (
              pagedClientes.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-bold text-white font-sans">
                    Grupo #{c.numeroGrupo}
                  </td>
                  <td className="py-3 px-3 text-slate-300 font-sans">
                    {c.tamanoGrupo} {c.tamanoGrupo === 1 ? 'persona' : 'personas'}
                  </td>
                  <td className="py-3 px-3 text-slate-300">
                    {c.horaLlegada.toFixed(1)} min
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`font-bold ${
                        c.tiempoEsperaCola > 6.0 ? 'text-amber-400' : 'text-slate-300'
                      }`}
                    >
                      {c.tiempoEsperaCola.toFixed(1)} min
                    </span>
                  </td>
                  <td className="py-3 px-3 font-sans">
                    {c.cajeroAsignado ? (
                      <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-medium text-[11px]">
                        Cajero {c.cajeroAsignado}
                      </span>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-carnaval-yellow font-bold">
                    {c.itemsComprados}
                  </td>
                  <td className="py-3 px-3 font-sans">
                    {c.mesaAsignada ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-medium text-[11px]">
                        Mesa {c.mesaAsignada} ({c.tipoMesa})
                      </span>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-400">
                    {c.tiempoFinComer !== null ? `${c.tiempoFinComer.toFixed(1)} min` : '-'}
                  </td>
                  <td className="py-3 px-3 text-slate-300">
                    {c.tiempoSalida.toFixed(1)} min
                  </td>
                  <td className="py-3 px-4 text-center font-sans">
                    {getStatusBadge(c.estadoFinal)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div>
          Página <span className="font-bold text-white">{currentPage}</span> de{' '}
          <span className="font-bold text-white">{totalPages}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
};
