// Dashboard de Indicadores Clave de Desempeño (KPIs)
// Asignatura: Simulación Digital
// Docente: Luis Carlos Tovar Garrido
// Estudiantes: Pedro Eli Diaz Olarte & Vlad Esteban Preciado Ruiz
// CERO EMOJIS: Uso exclusivo de Lucide Icons y colores festivos

import React from 'react';
import {
  Users,
  UserCheck,
  Award,
  ShoppingBag,
  UserX,
  Armchair,
  Timer,
  CreditCard,
  UtensilsCrossed,
  PackageCheck,
  TrendingUp,
} from 'lucide-react';
import { SimulationResult } from '../types/simulation';

interface KpiDashboardProps {
  result: SimulationResult | null;
}

export const KpiDashboard: React.FC<KpiDashboardProps> = ({ result }) => {
  if (!result) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
        <TrendingUp className="w-10 h-10 mx-auto text-carnaval-yellow/40 mb-3 animate-pulse" />
        <h3 className="text-base font-semibold text-slate-200">Esperando ejecución de la simulación</h3>
        <p className="text-xs text-slate-400 mt-1">
          Ajusta los minutos y presiona "Iniciar Simulación" para ver las estadísticas en tiempo real.
        </p>
      </div>
    );
  }

  const kpis = [
    {
      title: 'Total Grupos',
      value: result.totalGrupos,
      unit: 'grupos',
      description: 'Llegadas registradas',
      icon: Users,
      colorClass: 'border-blue-500/30 text-blue-400',
      bgGlow: 'bg-blue-500/10',
      iconBg: 'bg-blue-500/20 text-blue-400',
    },
    {
      title: 'Total Clientes',
      value: result.totalPersonas,
      unit: 'personas',
      description: 'Personas en grupos (1 a 4)',
      icon: UserCheck,
      colorClass: 'border-carnaval-yellow/30 text-carnaval-yellow',
      bgGlow: 'bg-carnaval-yellow/10',
      iconBg: 'bg-carnaval-yellow/20 text-carnaval-yellow',
    },
    {
      title: 'Atendidos en Sala',
      value: result.totalAtendidos,
      unit: 'grupos',
      description: 'Comieron en mesas asignadas',
      icon: Award,
      colorClass: 'border-carnaval-green/30 text-carnaval-green',
      bgGlow: 'bg-carnaval-green/10',
      iconBg: 'bg-carnaval-green/20 text-carnaval-green',
    },
    {
      title: 'Para Llevar',
      value: result.totalParaLlevar,
      unit: 'grupos',
      description: 'Atendidos sin uso de mesa',
      icon: ShoppingBag,
      colorClass: 'border-amber-500/30 text-amber-400',
      bgGlow: 'bg-amber-500/10',
      iconBg: 'bg-amber-500/20 text-amber-400',
    },
    {
      title: 'Abandono por Cola',
      value: result.totalAbandonoCola,
      unit: 'grupos',
      description: 'Excedieron paciencia en fila',
      icon: UserX,
      colorClass: 'border-carnaval-red/30 text-carnaval-red',
      bgGlow: 'bg-carnaval-red/10',
      iconBg: 'bg-carnaval-red/20 text-carnaval-red',
    },
    {
      title: 'Abandono por Silla',
      value: result.totalAbandonoSilla,
      unit: 'grupos',
      description: 'Mesas ocupadas al terminar pedido',
      icon: Armchair,
      colorClass: 'border-rose-500/30 text-rose-400',
      bgGlow: 'bg-rose-500/10',
      iconBg: 'bg-rose-500/20 text-rose-400',
    },
    {
      title: 'Espera Promedio en Cola',
      value: `${result.promedioEsperaColaMinutos} min`,
      unit: '',
      description: 'Tiempo medio antes de caja',
      icon: Timer,
      colorClass: 'border-cyan-500/30 text-cyan-400',
      bgGlow: 'bg-cyan-500/10',
      iconBg: 'bg-cyan-500/20 text-cyan-400',
    },
    {
      title: 'Utilización Cajero 1',
      value: `${result.utilizacionCajero1}%`,
      unit: '',
      description: 'Ocupación efectiva en atención',
      icon: CreditCard,
      colorClass: 'border-indigo-500/30 text-indigo-400',
      bgGlow: 'bg-indigo-500/10',
      iconBg: 'bg-indigo-500/20 text-indigo-400',
    },
    {
      title: 'Utilización Cajero 2',
      value: `${result.utilizacionCajero2}%`,
      unit: '',
      description: 'Ocupación efectiva en atención',
      icon: CreditCard,
      colorClass: 'border-purple-500/30 text-purple-400',
      bgGlow: 'bg-purple-500/10',
      iconBg: 'bg-purple-500/20 text-purple-400',
    },
    {
      title: 'Ocupación Mesas (30)',
      value: `${result.ocupacionPromedioMesas}%`,
      unit: '',
      description: 'Promedio global (100 sillas)',
      icon: UtensilsCrossed,
      colorClass: 'border-emerald-500/30 text-emerald-400',
      bgGlow: 'bg-emerald-500/10',
      iconBg: 'bg-emerald-500/20 text-emerald-400',
    },
    {
      title: 'Productos Vendidos',
      value: result.totalItemsVendidos,
      unit: 'ítems',
      description: 'Artículos facturados',
      icon: PackageCheck,
      colorClass: 'border-carnaval-yellow/30 text-carnaval-yellow',
      bgGlow: 'bg-carnaval-yellow/10',
      iconBg: 'bg-carnaval-yellow/20 text-carnaval-yellow',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-carnaval-yellow" />
          Dashboard de Indicadores Clave (KPIs)
        </h2>
        <span className="text-xs font-mono text-slate-400">
          Horizonte: <span className="text-carnaval-yellow font-bold">{result.horizonteMinutos} min</span> | Origen: {result.origen}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className={`bg-slate-900/90 border ${kpi.colorClass} rounded-2xl p-3.5 shadow-lg relative overflow-hidden transition transform hover:-translate-y-1 hover:shadow-xl`}
            >
              <div className={`absolute -right-4 -bottom-4 w-16 h-16 ${kpi.bgGlow} rounded-full blur-xl pointer-events-none`} />

              <div className="flex items-start justify-between">
                <span className="text-xs font-medium text-slate-400 line-clamp-1">{kpi.title}</span>
                <div className={`p-1.5 rounded-lg ${kpi.iconBg}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-extrabold text-white font-mono tracking-tight">
                  {kpi.value}
                </span>
                {kpi.unit && (
                  <span className="text-[11px] font-medium text-slate-400">{kpi.unit}</span>
                )}
              </div>

              <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                {kpi.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
