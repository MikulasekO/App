
import React, { useEffect, useState } from 'react';
import { AnalysisMode } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  mode: AnalysisMode;
}

const MandalaModal: React.FC<Props> = ({ isOpen, onClose, mode }) => {
  const [isVisible, setIsVisible] = useState(false);
  const isAi = mode === 'AI';

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      document.body.style.overflow = '';
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isVisible && !isOpen) return null;

  const colorClass = isAi 
    ? 'text-indigo-500 dark:text-indigo-400' 
    : 'text-emerald-500 dark:text-emerald-400';

  const glowClass = isAi
    ? 'shadow-[0_0_100px_rgba(99,102,241,0.3)]'
    : 'shadow-[0_0_100px_rgba(16,185,129,0.3)]';

  const textTintClass = isAi
    ? 'text-indigo-400/80 dark:text-indigo-300/60'
    : 'text-emerald-400/80 dark:text-emerald-300/60';

  return (
    <div 
      className={`fixed inset-0 z-[200] flex items-center justify-center transition-all duration-500 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-white/80 dark:bg-black/90 backdrop-blur-xl transition-all duration-500"
        onClick={onClose}
      />

      {/* Close Button */}
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 p-4 text-slate-400 hover:text-slate-800 dark:text-slate-500 dark:hover:text-white transition-colors z-[210] group"
      >
        <svg className="w-8 h-8 transform group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Main Content */}
      <div className={`relative z-[205] flex flex-col items-center justify-center transform transition-all duration-700 ${isOpen ? 'scale-100 translate-y-0' : 'scale-90 translate-y-10'}`}>
        
        {/* Mandala Container */}
        <div className={`relative w-[80vw] h-[80vw] max-w-[500px] max-h-[500px] rounded-full flex items-center justify-center ${colorClass}`}>
           {/* Glow Effect */}
           <div className={`absolute inset-20 rounded-full bg-current opacity-10 blur-3xl ${glowClass} animate-pulse`} />

           {/* Complex Rotating Mandala SVG */}
           <svg 
            viewBox="0 0 200 200" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="0.5"
            className="w-full h-full animate-spin-slow"
           >
             <defs>
               <filter id="glow">
                 <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
                 <feMerge>
                   <feMergeNode in="coloredBlur"/>
                   <feMergeNode in="SourceGraphic"/>
                 </feMerge>
               </filter>
             </defs>

             {/* Center Core */}
             <circle cx="100" cy="100" r="5" fill="currentColor" opacity="0.8" />
             <circle cx="100" cy="100" r="10" strokeWidth="1" />
             
             {/* Layer 1: Sacred Geometry Stars */}
             <g opacity="0.6">
               <path d="M100 20 L120 80 L180 100 L120 120 L100 180 L80 120 L20 100 L80 80 Z" />
               <rect x="50" y="50" width="100" height="100" transform="rotate(45 100 100)" />
             </g>

             {/* Layer 2: Intersecting Circles */}
             <g opacity="0.4" strokeWidth="0.8">
               <circle cx="100" cy="60" r="40" />
               <circle cx="100" cy="140" r="40" />
               <circle cx="60" cy="100" r="40" />
               <circle cx="140" cy="100" r="40" />
               <circle cx="100" cy="100" r="70" strokeDasharray="4 4" />
             </g>

             {/* Layer 3: Outer Detail Ring */}
             <g opacity="0.5">
               <circle cx="100" cy="100" r="85" strokeWidth="0.2" />
               <circle cx="100" cy="100" r="90" strokeWidth="2" strokeDasharray="1 8" strokeLinecap="round" />
               <path d="M100 5 L100 25 M100 175 L100 195 M5 100 L25 100 M175 100 L195 100" strokeWidth="1" />
               <path d="M33 33 L48 48 M152 152 L167 167 M33 167 L48 152 M152 48 L167 33" strokeWidth="1" />
             </g>

             {/* Layer 4: Rotating Elements (Inner) */}
             <g transform="rotate(45 100 100)" opacity="0.3">
               <rect x="70" y="70" width="60" height="60" />
             </g>
           </svg>
        </div>

        {/* Caption */}
        <div className="mt-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
          <p className="text-sm font-black uppercase tracking-[0.5em] text-slate-400 dark:text-slate-500 mb-2">
            {isAi ? 'Synchronizace neuronové sítě' : 'Prohledávání databáze'}
          </p>
          <p className={`text-2xl font-thin italic tracking-widest animate-pulse transition-colors duration-700 ${textTintClass}`}>
            Očišťuji tvého ducha...
          </p>
        </div>

      </div>
    </div>
  );
};

export default MandalaModal;
