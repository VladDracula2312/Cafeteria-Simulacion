// Pie de Página Institucional con Temática del Carnaval de Barranquilla
// Asignatura: Simulación Digital
// Docente: Luis Carlos Tovar Garrido
// Estudiantes: Pedro Eli Diaz Olarte & Vlad Esteban Preciado Ruiz
// CERO EMOJIS: Uso exclusivo de SVGs y Lucide Icons

import React from 'react';
import { SombreroVueltiaoBorder } from './FolkloreDecorations';
import { ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-slate-950 border-t border-slate-800 mt-12 text-slate-400">
      <SombreroVueltiaoBorder />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white tracking-wide">
              Simulador Estocástico de Cafetería Universitaria
            </h4>
            <p className="text-xs text-slate-400">
              Proyecto de Investigación y Modelado para la asignatura de <strong className="text-carnaval-yellow">Simulación Digital</strong>
            </p>
            <p className="text-xs text-slate-400">
              Docente Titular: <strong className="text-slate-200">Luis Carlos Tovar Garrido</strong>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 text-xs">
            <div className="bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl text-center">
              <span className="text-[10px] uppercase font-bold text-carnaval-yellow block tracking-wider">
                Desarrollado Por
              </span>
              <span className="font-semibold text-white">
                Pedro Eli Diaz Olarte & Vlad Esteban Preciado Ruiz
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-400">
              <ShieldCheck className="w-4 h-4 text-carnaval-green" />
              <span>Despliegue Vercel Ready</span>
            </div>
          </div>

        </div>

        <div className="mt-6 pt-4 border-t border-slate-900 text-[11px] text-slate-400 text-center flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Inspirado en la cultura folclórica del Caribe y el Carnaval de Barranquilla</span>
          <span>© 2026 Simulación Digital - Todos los derechos reservados</span>
        </div>
      </div>
    </footer>
  );
};
