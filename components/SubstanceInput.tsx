
import React, { useState } from 'react';
import { AnalysisMode } from '../types';
import { useMandalaFeedback, MandalaContainer } from './MandalaEffect';

interface Props {
  substances: string[];
  onAdd: (substance: string) => void;
  onRemove: (index: number) => void;
  onAnalyze: (mode: AnalysisMode) => void;
  isLoading: boolean;
  mode: AnalysisMode;
  onModeChange: (mode: AnalysisMode) => void;
}

const SubstanceInput: React.FC<Props> = ({ 
  substances, 
  onAdd, 
  onRemove, 
  onAnalyze, 
  isLoading, 
  mode, 
  onModeChange 
}) => {
  const [current, setCurrent] = useState('');
  
  // Hook for Toggle Button Ripples (Simple)
  const { ripples: toggleRipples, createRipple: createToggleRipple } = useMandalaFeedback();
  
  // Hook for Analyze Button Effect (Complex)
  const { ripples: analyzeRipples, createRipple: createAnalyzeRipple } = useMandalaFeedback();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (current.trim()) {
      onAdd(current.trim());
      setCurrent('');
    }
  };

  const isAi = mode === 'AI';

  return (
    <div className={`space-y-6 transition-all duration-500 p-6 rounded-[2rem] shadow-2xl ${
      isAi 
        ? 'bg-indigo-950/30 border border-indigo-500/30 shadow-indigo-500/10' 
        : 'bg-emerald-950/30 border border-emerald-500/30 shadow-emerald-500/10'
    }`}>
      
      {/* Dominantní Přepínač Módů */}
      <div className="relative flex bg-gray-200/50 dark:bg-gray-800/50 p-1.5 rounded-2xl overflow-hidden backdrop-blur-sm group/toggle">
        {/* Render Container for Toggle Ripples */}
        <MandalaContainer ripples={toggleRipples} />
        
        <div 
          className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) rounded-xl shadow-lg ${
            isAi 
              ? 'translate-x-[100%] bg-indigo-600' 
              : 'translate-x-0 bg-emerald-600'
          }`}
        />
        <button
          onClick={(e) => { 
            createToggleRipple(e, 'simple', 'green'); 
            onModeChange('VERIFIED'); 
          }}
          className={`relative z-10 w-1/2 py-3 text-xs font-black uppercase tracking-widest transition-colors duration-300 overflow-hidden rounded-xl ${!isAi ? 'text-white' : 'text-gray-500 hover:text-gray-400'}`}
        >
          <div className="flex items-center justify-center gap-2 relative z-20">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Ověřený režim
          </div>
        </button>
        <button
          onClick={(e) => { 
            createToggleRipple(e, 'simple', 'purple'); 
            onModeChange('AI'); 
          }}
          className={`relative z-10 w-1/2 py-3 text-xs font-black uppercase tracking-widest transition-colors duration-300 overflow-hidden rounded-xl ${isAi ? 'text-white' : 'text-gray-500 hover:text-gray-400'}`}
        >
          <div className="flex items-center justify-center gap-2 relative z-20">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            AI Průzkumník
          </div>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          placeholder="Zadejte název látky..."
          className={`flex-1 p-4 rounded-2xl border transition-all duration-300 shadow-sm bg-white/5 dark:bg-black/40 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:outline-none ${
            isAi ? 'border-indigo-500/50 focus:ring-indigo-500 focus:border-indigo-400' : 'border-emerald-500/50 focus:ring-emerald-500 focus:border-emerald-400'
          }`}
        />
        <button
          type="submit"
          className={`px-6 rounded-2xl font-black transition-all shadow-md active:scale-90 text-white uppercase text-xs tracking-tighter ${
            isAi ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-emerald-600 hover:bg-emerald-500'
          }`}
        >
          Přidat
        </button>
      </form>

      <div className="flex flex-wrap gap-2 min-h-[48px]">
        {substances.map((s, idx) => (
          <span
            key={idx}
            className={`inline-flex items-center px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-wider animate-in fade-in slide-in-from-bottom-1 transition-all duration-500 ${
              isAi 
                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.1)]' 
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
            }`}
          >
            {s}
            <button
              onClick={() => onRemove(idx)}
              className="ml-3 hover:text-red-500 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        ))}
        {substances.length === 0 && (
          <p className="text-gray-500 dark:text-gray-600 text-[10px] font-bold uppercase tracking-widest py-4 text-center w-full opacity-60">Zatím žádné látky k analýze</p>
        )}
      </div>

      <button
        onClick={(e) => { 
          createAnalyzeRipple(e, 'complex', isAi ? 'purple' : 'green'); 
          onAnalyze(mode); 
        }}
        disabled={substances.length < 1 || isLoading}
        className={`relative overflow-hidden w-full py-5 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-sm transition-all shadow-2xl group ${
          substances.length < 1 || isLoading
            ? 'bg-gray-200 dark:bg-gray-800 cursor-not-allowed text-gray-400 dark:text-gray-600'
            : isAi 
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white transform hover:-translate-y-1 shadow-indigo-500/40'
              : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white transform hover:-translate-y-1 shadow-emerald-500/40'
        }`}
      >
        <MandalaContainer ripples={analyzeRipples} />
        <span className="relative z-10">
          {isLoading ? (
            <div className="flex items-center justify-center gap-3">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Skenuji rizika...
            </div>
          ) : (
            isAi ? 'Analyzovat přes AI ✨' : 'Prověřit databázi ✅'
          )}
        </span>
      </button>
    </div>
  );
};

export default SubstanceInput;
