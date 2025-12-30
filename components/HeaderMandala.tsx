
import React, { useEffect, useState } from 'react';
import { AnalysisMode } from '../types';

interface Props {
  mode: AnalysisMode;
}

const HeaderMandala: React.FC<Props> = ({ mode }) => {
  const [pulse, setPulse] = useState(false);
  const isAi = mode === 'AI';

  // Trigger pulse effect on mode change
  useEffect(() => {
    setPulse(true);
    const timer = setTimeout(() => setPulse(false), 700);
    return () => clearTimeout(timer);
  }, [mode]);

  const colorClass = isAi 
    ? 'text-indigo-500 dark:text-indigo-400' 
    : 'text-emerald-500 dark:text-emerald-400';

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-visible">
      <div 
        className={`w-[200%] h-[200%] transition-all duration-700 ${colorClass} ${pulse ? 'scale-125 opacity-80' : 'scale-100 opacity-30'}`}
      >
        <svg 
          viewBox="0 0 100 100" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="0.5"
          className="w-full h-full animate-spin-slow origin-center"
        >
          {/* Outer Ring */}
          <circle cx="50" cy="50" r="48" strokeDasharray="2 4" opacity="0.5" />
          <circle cx="50" cy="50" r="45" opacity="0.3" />

          {/* Rotated Squares creating a star pattern */}
          <rect x="20" y="20" width="60" height="60" transform="rotate(0 50 50)" opacity="0.4" />
          <rect x="20" y="20" width="60" height="60" transform="rotate(30 50 50)" opacity="0.4" />
          <rect x="20" y="20" width="60" height="60" transform="rotate(60 50 50)" opacity="0.4" />

          {/* Inner Flower/Geometry */}
          <path d="M50 10 Q60 50 90 50 Q60 50 50 90 Q40 50 10 50 Q40 50 50 10" opacity="0.6" />
          <path d="M22 22 Q50 50 78 22 M22 78 Q50 50 78 78" opacity="0.6" />

          {/* Central Rings */}
          <circle cx="50" cy="50" r="15" strokeDasharray="1 2" strokeWidth="1" />
          <circle cx="50" cy="50" r="8" strokeWidth="1.5" opacity="0.8" />
        </svg>
      </div>
    </div>
  );
};

export default HeaderMandala;
