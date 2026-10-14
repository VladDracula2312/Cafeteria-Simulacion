// Panel de Controles y Parámetros de la Simulación
// Permite configurar el horizonte X minutos y controlar la reproducción paso a paso
// CERO EMOJIS: Uso exclusivo de Lucide Icons

import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Clock,
  SlidersHorizontal,
  Flame,
  CheckCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ControlPanelProps {
  horizonteMinutos: number;
  setHorizonteMinutos: (val: number) => void;
  onRunSimulation: () => void;
  isLoading: boolean;
  hasResult: boolean;
  // Controles de tiempo interactivo
  currentTime: number;
  setCurrentTime: (val: number) => void;
  isPlaying: boolean;
  setIsPlaying: (val: boolean) => void;
  speedMultiplier: number;
  setSpeedMultiplier: (val: number) => void;
  onResetTime: () => void;
  onJumpToEnd: () => void;
}

const PRESET_HORIZONS = [30, 60, 120, 240, 480];
const SPEED_OPTIONS = [1, 2, 5, 10, 25];

export const ControlPanel: React.FC<ControlPanelProps> = ({
  horizonteMinutos,
  setHorizonteMinutos,
  onRunSimulation,
  isLoading,
  hasResult,
  currentTime,
  setCurrentTime,
  isPlaying,
  setIsPlaying,
  speedMultiplier,
  setSpeedMultiplier,
  onResetTime,
  onJumpToEnd,
}) => {
  const handleRun = () => {
    // Disparar confeti carnavalero festivo
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#D90429', '#FFB703', '#0077B6', '#2A9D8F', '#FB8500'],
      });
    } catch {
      // ignore
    }
    onRunSimulation();
  };

  const formatMinutes = (minutes: number) => {
    const totalSecs = Math.floor(minutes * 60);
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
    }
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
      {/* Detalle sutil de borde superior festivo */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-carnaval-red via-carnaval-yellow via-carnaval-blue to-carnaval-green" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        {/* Sección Parámetros de Entrada (5 columnas) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-carnaval-yellow" />
              Horizonte de Simulación (Minutos)
            </label>
            <span className="text-xs font-mono text-carnaval-yellow font-bold px-2 py-0.5 rounded bg-carnaval-yellow/10 border border-carnaval-yellow/30">
              {horizonteMinutos} min ({formatMinutes(horizonteMinutos)})
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                min={10}
                max={960}
                step={5}
                value={horizonteMinutos}
                onChange={(e) => setHorizonteMinutos(Math.max(10, Math.min(960, Number(e.target.value) || 60)))}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-carnaval-yellow focus:ring-1 focus:ring-carnaval-yellow transition"
                placeholder="60"
                disabled={isLoading}
              />
            </div>

            <button
              onClick={handleRun}
              disabled={isLoading}
              className="px-6 py-2.5 rounded-xl font-bold text-white shadow-lg shadow-carnaval-red/30 bg-gradient-to-r from-carnaval-red to-carnaval-orange hover:from-carnaval-red-light hover:to-carnaval-yellow text-sm flex items-center gap-2 transition duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Simulando...</span>
                </>
              ) : (
                <>
                  <Flame className="w-4 h-4 text-carnaval-yellow" />
                  <span>Iniciar Simulación</span>
                </>
              )}
            </button>
          </div>

          {/* Chips de acceso rápido */}
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <span className="text-xs text-slate-400">Atajos:</span>
            {PRESET_HORIZONS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setHorizonteMinutos(p)}
                disabled={isLoading}
                className={`px-2.5 py-0.5 rounded-lg text-xs font-medium transition ${
                  horizonteMinutos === p
                    ? 'bg-carnaval-yellow text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {p} min
              </button>
            ))}
          </div>
        </div>

        {/* Separador vertical para pantallas grandes */}
        <div className="hidden lg:block lg:col-span-1 flex justify-center">
          <div className="w-px h-16 bg-slate-800" />
        </div>

        {/* Sección Reproductor y Línea de Tiempo Interactiva (6 columnas) */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-carnaval-green" />
                Reloj de Simulación:
              </span>
              <span className="font-mono text-sm font-bold text-white bg-slate-950 px-2.5 py-0.5 rounded-lg border border-slate-700">
                {currentTime.toFixed(1)} / {horizonteMinutos.toFixed(1)} min
              </span>
            </div>

            {hasResult && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                <CheckCircle className="w-3.5 h-3.5" />
                Simulación Lista
              </span>
            )}
          </div>

          {/* Barra de progreso interactiva (slider) */}
          <div className="relative pt-1">
            <input
              type="range"
              min={0}
              max={horizonteMinutos}
              step={0.1}
              value={currentTime}
              onChange={(e) => {
                setCurrentTime(Number(e.target.value));
                if (isPlaying) setIsPlaying(false);
              }}
              disabled={!hasResult}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-carnaval-yellow disabled:opacity-40"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>0.0 min (Inicio)</span>
              <span>{(horizonteMinutos / 2).toFixed(1)} min</span>
              <span>{horizonteMinutos.toFixed(1)} min (Fin)</span>
            </div>
          </div>

          {/* Controles de Reproducción */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onResetTime}
                disabled={!hasResult}
                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition disabled:opacity-40"
                title="Reiniciar reloj a 0 min"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                disabled={!hasResult}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-md ${
                  isPlaying
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-carnaval-green hover:bg-emerald-500 text-slate-950'
                } disabled:opacity-40`}
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>Pausar</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Reproducir</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onJumpToEnd}
                disabled={!hasResult}
                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition disabled:opacity-40"
                title="Ir directo al final de la simulación"
              >
                <FastForward className="w-4 h-4" />
              </button>
            </div>

            {/* Selector de Velocidad */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 px-1 font-semibold uppercase">Vel:</span>
              {SPEED_OPTIONS.map((spd) => (
                <button
                  key={spd}
                  type="button"
                  onClick={() => setSpeedMultiplier(spd)}
                  className={`px-2 py-0.5 rounded text-xs font-mono font-bold transition ${
                    speedMultiplier === spd
                      ? 'bg-carnaval-blue text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
