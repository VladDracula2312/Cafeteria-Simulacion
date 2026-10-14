// Componentes Vectoriales SVG con Temática del Carnaval de Barranquilla
// Guardas de Sombrero Vueltiao, Ondas de Cumbia y Motivos Folclóricos Caribeños
// PROHIBIDO EL USO DE EMOJIS: Todo se renderiza mediante SVG y Lucide Icons

import React from 'react';

// Cenefa / Guarda geométrica inspirada en el tejido 'trenzado caña flecha' del Sombrero Vueltiao
export const SombreroVueltiaoBorder: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`w-full overflow-hidden h-3 flex items-center ${className}`}>
      <svg
        className="w-full h-full text-carnaval-yellow"
        viewBox="0 0 1200 12"
        fill="currentColor"
        preserveAspectRatio="none"
      >
        <pattern id="vueltiao-pattern" width="30" height="12" patternUnits="userSpaceOnUse">
          {/* Geometría trenzada del sombrero vueltiao */}
          <path d="M0 6 L7.5 0 L15 6 L7.5 12 Z" fill="#FFB703" opacity="0.85" />
          <path d="M15 6 L22.5 0 L30 6 L22.5 12 Z" fill="#D90429" opacity="0.75" />
          <circle cx="7.5" cy="6" r="1.5" fill="#0F172A" />
          <circle cx="22.5" cy="6" r="1.5" fill="#2A9D8F" />
        </pattern>
        <rect width="1200" height="12" fill="url(#vueltiao-pattern)" />
      </svg>
    </div>
  );
};

// Cinta de ondas de cumbia con los 4 colores del Carnaval
export const CumbiaWaveDivider: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`w-full overflow-hidden h-2 ${className}`}>
      <svg
        className="w-full h-full"
        viewBox="0 0 1000 8"
        preserveAspectRatio="none"
        fill="none"
      >
        <path
          d="M0 4 Q 125 0, 250 4 T 500 4 T 750 4 T 1000 4"
          stroke="url(#cumbia-gradient)"
          strokeWidth="3"
        />
        <defs>
          <linearGradient id="cumbia-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#D90429" />
            <stop offset="30%" stopColor="#FFB703" />
            <stop offset="65%" stopColor="#0077B6" />
            <stop offset="100%" stopColor="#2A9D8F" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

// Escudo Folclórico del Carnaval de Barranquilla (SVG Limpio sin emojis)
export const CarnavalShield: React.FC<{ size?: number; className?: string }> = ({
  size = 36,
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Escudo base */}
      <path
        d="M24 4L6 10V22C6 33.2 13.8 43.4 24 46C34.2 43.4 42 33.2 42 22V10L24 4Z"
        fill="#0F172A"
        stroke="#FFB703"
        strokeWidth="2.5"
      />
      {/* Cuadrantes festivos */}
      <path
        d="M24 6L8 11.5V22C8 28 11 34 16 38.5L24 22V6Z"
        fill="#D90429"
        opacity="0.8"
      />
      <path
        d="M24 6L40 11.5V22C40 28 37 34 32 38.5L24 22V6Z"
        fill="#0077B6"
        opacity="0.8"
      />
      <path
        d="M24 22L16 38.5C18.3 40.8 21.1 42.6 24 43.8V22Z"
        fill="#FFB703"
        opacity="0.9"
      />
      <path
        d="M24 22L32 38.5C29.7 40.8 26.9 42.6 24 43.8V22Z"
        fill="#2A9D8F"
        opacity="0.9"
      />
      {/* Detalle central: Sol de Cumbia */}
      <circle cx="24" cy="22" r="5" fill="#FFB703" stroke="#0F172A" strokeWidth="1.5" />
      <path d="M24 14V17M24 27V30M16 22H19M29 22H32" stroke="#0F172A" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
};
