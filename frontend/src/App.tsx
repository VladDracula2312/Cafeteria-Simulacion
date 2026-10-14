// Aplicación Principal del Simulador de Cafetería Universitaria
// Temática Folclórica: Carnaval de Barranquilla
// Asignatura: Simulación Digital
// Docente: Luis Carlos Tovar Garrido
// Estudiantes: Pedro Eli Diaz Olarte & Vlad Esteban Preciado Ruiz
// CERO EMOJIS: Uso exclusivo de Lucide Icons y SVGs

import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { ControlPanel } from './components/ControlPanel';
import { KpiDashboard } from './components/KpiDashboard';
import { LiveVisualizer } from './components/LiveVisualizer';
import { ClientDetailTable } from './components/ClientDetailTable';
import { HistorySection } from './components/HistorySection';
import { Footer } from './components/Footer';
import { SimulationResult } from './types/simulation';
import {
  checkBackendHealth,
  runSimulation,
  downloadExcelReport,
  getLocalHistory,
  clearLocalHistory,
} from './services/apiService';
import {
  Sparkles,
  LayoutDashboard,
  Table as TableIcon,
  History,
  FileSpreadsheet,
} from 'lucide-react';

export const App: React.FC = () => {
  const [horizonteMinutos, setHorizonteMinutos] = useState<number>(60);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(2);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [history, setHistory] = useState<SimulationResult[]>([]);
  const [activeTab, setActiveTab] = useState<'visualizer' | 'table' | 'history'>('visualizer');
  const [backendHealth, setBackendHealth] = useState({
    isOnline: false,
    message: 'Verificando conexión...',
  });

  // Animación del reproductor de tiempo
  const animFrameRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(performance.now());

  // Verificar backend y cargar historial inicial
  useEffect(() => {
    checkBackendHealth().then(setBackendHealth);

    const savedHistory = getLocalHistory();
    setHistory(savedHistory);

    // Ejecutar una simulación inicial automáticamente para que no cargue vacía
    handleExecuteSimulation(60, true);

    const interval = setInterval(() => {
      checkBackendHealth().then(setBackendHealth);
    }, 25000);

    return () => clearInterval(interval);
  }, []);

  // Bucle de animación para el avance del reloj de simulación
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    lastTickRef.current = performance.now();

    const loop = (now: number) => {
      const deltaSec = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      // Avanzamos los minutos de simulación en base a la velocidad
      setCurrentTime((prev) => {
        const next = prev + deltaSec * speedMultiplier * 0.8;
        if (result && next >= result.horizonteMinutos) {
          setIsPlaying(false);
          return result.horizonteMinutos;
        }
        return next;
      });

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, speedMultiplier, result]);

  const handleExecuteSimulation = async (horizonte?: number, isInitial = false) => {
    const h = horizonte ?? horizonteMinutos;
    setIsLoading(true);
    try {
      const newResult = await runSimulation({ horizonteMinutos: h });
      setResult(newResult);
      // Actualizar historial local
      setHistory(getLocalHistory());
      // Si es inicial, ponemos el reloj a la mitad o al final para apreciar mesas ocupadas
      if (isInitial) {
        setCurrentTime(Math.min(h, 28.5));
      } else {
        // Al ejecutar una nueva simulación, iniciamos la reproducción interactiva desde 0
        setCurrentTime(0);
        setIsPlaying(true);
      }
    } catch (err) {
      console.error('Error al ejecutar la simulación:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportActiveExcel = () => {
    if (!result) return;
    downloadExcelReport(result);
  };

  const handleClearHistory = () => {
    clearLocalHistory();
    setHistory([]);
  };

  const handleSelectHistoryItem = (item: SimulationResult) => {
    setResult(item);
    setHorizonteMinutos(item.horizonteMinutos);
    setCurrentTime(Math.min(item.horizonteMinutos, 25));
    setActiveTab('visualizer');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-carnaval-yellow selection:text-slate-950">
      
      {/* Cabecera Institucional Obligatoria */}
      <Header
        isBackendOnline={backendHealth.isOnline}
        statusMessage={backendHealth.message}
      />

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Banner de Estado Resiliente / Modo Dual */}
        {!backendHealth.isOnline && (
          <div className="bg-amber-950/40 border border-carnaval-yellow/40 rounded-xl px-4 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-amber-200">
              <Sparkles className="w-4 h-4 text-carnaval-yellow shrink-0" />
              <span>
                <strong>Modo Autónomo Local Activo:</strong> El motor estocástico en TypeScript y la exportación a Excel (.xlsx) están ejecutándose localmente con total precisión y resiliencia.
              </span>
            </div>
            <span className="text-[11px] font-mono font-bold text-carnaval-yellow px-2 py-0.5 rounded bg-carnaval-yellow/10 border border-carnaval-yellow/20">
              100% Funcional sin caídas
            </span>
          </div>
        )}

        {/* Panel de Controles y Parámetros */}
        <ControlPanel
          horizonteMinutos={horizonteMinutos}
          setHorizonteMinutos={setHorizonteMinutos}
          onRunSimulation={() => handleExecuteSimulation()}
          isLoading={isLoading}
          hasResult={!!result}
          currentTime={currentTime}
          setCurrentTime={setCurrentTime}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          speedMultiplier={speedMultiplier}
          setSpeedMultiplier={setSpeedMultiplier}
          onResetTime={() => setCurrentTime(0)}
          onJumpToEnd={() => {
            if (result) {
              setCurrentTime(result.horizonteMinutos);
              setIsPlaying(false);
            }
          }}
        />

        {/* Dashboard de KPIs Principales */}
        <KpiDashboard result={result} />

        {/* Barra de pestañas y botón de exportación a Excel */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
          
          {/* Navegación por Pestañas */}
          <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('visualizer')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'visualizer'
                  ? 'bg-carnaval-yellow text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Visualizador & Mesas</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('table')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'table'
                  ? 'bg-carnaval-yellow text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TableIcon className="w-4 h-4" />
              <span>Trazabilidad Clientes ({result?.clientes.length || 0})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'history'
                  ? 'bg-carnaval-yellow text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Historial ({history.length})</span>
            </button>
          </div>

          {/* Botón de Descarga Directa de Excel Activo */}
          {result && (
            <button
              type="button"
              onClick={handleExportActiveExcel}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition transform hover:scale-[1.02]"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span>Descargar Excel de Simulación (.xlsx)</span>
            </button>
          )}

        </div>

        {/* Renderizado Condicional de la Pestaña Activa */}
        {activeTab === 'visualizer' && (
          <LiveVisualizer result={result} currentTime={currentTime} />
        )}

        {activeTab === 'table' && result && (
          <ClientDetailTable
            clientes={result.clientes}
            onExportExcel={handleExportActiveExcel}
          />
        )}

        {activeTab === 'history' && (
          <HistorySection
            history={history}
            onSelectSimulation={handleSelectHistoryItem}
            onDownloadExcel={(item) => downloadExcelReport(item)}
            onClearHistory={handleClearHistory}
          />
        )}

      </main>

      {/* Pie de Página Institucional Obligatorio */}
      <Footer />

    </div>
  );
};

export default App;
