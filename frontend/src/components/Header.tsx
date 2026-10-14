// Cabecera Institucional del Proyecto con Temática del Carnaval de Barranquilla
// Asignatura: Simulación Digital
// Docente: Luis Carlos Tovar Garrido
// Estudiantes: Pedro Eli Diaz Olarte & Vlad Esteban Preciado Ruiz
// CERO EMOJIS: Uso exclusivo de Lucide Icons y SVGs Folclóricos

import React from 'react';
import { BookOpen, UserCheck, Users, Sparkles, Coffee } from 'lucide-react';
import { SombreroVueltiaoBorder, CumbiaWaveDivider, CarnavalShield } from './FolkloreDecorations';

interface HeaderProps {
  isBackendOnline: boolean;
  statusMessage: string;
}

export const Header: React.FC<HeaderProps> = ({ isBackendOnline, statusMessage }) => {
  return (
    <header className="relative w-full bg-slate-900 border-b border-slate-800 shadow-2xl overflow-hidden">
      {/* Cenefa superior con patrón trenzado del sombrero vueltiao */}
      <SombreroVueltiaoBorder />

      {/* Brillo de fondo con colores del Carnaval */}
      <div className="absolute top-0 left-1/4 w-96 h-28 bg-carnaval-red/10 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute top-0 right-1/4 w-96 h-28 bg-carnaval-yellow/10 blur-3xl pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          
          {/* Lado izquierdo: Título y Temática de Carnaval */}
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-carnaval-red via-carnaval-yellow to-carnaval-green p-[2px] shadow-lg shadow-carnaval-red/20">
              <div className="bg-slate-950 p-2 rounded-2xl flex items-center justify-center">
                <CarnavalShield size={44} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-carnaval-red/15 text-carnaval-red border border-carnaval-red/30 tracking-wide uppercase">
                  <Coffee className="w-3.5 h-3.5 text-carnaval-red" />
                  Simulador de Cafetería Universitaria
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-carnaval-yellow/15 text-carnaval-yellow border border-carnaval-yellow/30">
                  <Sparkles className="w-3 h-3 text-carnaval-yellow" />
                  Edición Carnaval
                </span>
              </div>
              
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1">
                Cafetería Universitaria <span className="text-carnaval-yellow">Digital</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Modelo estocástico con cola FIFO única, 2 cajeros y 30 mesas (100 sillas)
              </p>
            </div>
          </div>

          {/* Lado derecho: Tarjeta Institucional Obligatoria */}
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl shadow-inner">
            <div className="space-y-1 text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-carnaval-yellow shrink-0" />
                <span className="text-slate-400">Asignatura:</span>
                <span className="font-bold text-white tracking-wide">Simulación Digital</span>
              </div>

              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-carnaval-green shrink-0" />
                <span className="text-slate-400">Docente:</span>
                <span className="font-semibold text-slate-200">Luis Carlos Tovar Garrido</span>
              </div>

              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-carnaval-blue shrink-0" />
                <span className="text-slate-400">Estudiantes:</span>
                <span className="font-medium text-slate-300">
                  Pedro Eli Diaz Olarte <span className="text-slate-500">|</span> Vlad Esteban Preciado Ruiz
                </span>
              </div>
            </div>

            {/* Separador vertical */}
            <div className="hidden sm:block w-px h-12 bg-slate-800 mx-1" />

            {/* Estado de conexión con el backend */}
            <div className="flex flex-col items-center sm:items-start pl-1">
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                Motor Activo
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`relative flex h-2.5 w-2.5`}>
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      isBackendOnline ? 'bg-carnaval-green' : 'bg-carnaval-yellow'
                    }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                      isBackendOnline ? 'bg-carnaval-green' : 'bg-carnaval-yellow'
                    }`}
                  />
                </span>
                <span
                  className={`text-xs font-semibold ${
                    isBackendOnline ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                  title={statusMessage}
                >
                  {isBackendOnline ? 'API C# Conectada' : 'Simulador Local TS'}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Onda de cumbia inferior */}
      <CumbiaWaveDivider />
    </header>
  );
};
