
import React from 'react';
import { AnalysisResult, RiskLevel } from '../types';

interface Props {
  result: AnalysisResult;
  onReset: () => void;
}

const getRiskColorClasses = (level: RiskLevel): string => {
  switch (level) {
    case 'Kritické': 
      return 'bg-red-100 text-red-900 border-red-200 dark:bg-red-600 dark:text-white dark:border-none';
    case 'Vysoké': 
      return 'bg-orange-100 text-orange-900 border-orange-200 dark:bg-orange-600 dark:text-white dark:border-none';
    case 'Střední': 
      return 'bg-yellow-100 text-yellow-900 border-yellow-200 dark:bg-yellow-500 dark:text-white dark:border-none';
    case 'Nízké': 
      return 'bg-emerald-100 text-emerald-900 border-emerald-200 dark:bg-emerald-600 dark:text-white dark:border-none';
    case 'Neznámé': 
      return 'bg-slate-200 text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-white dark:border-none';
    default: 
      return 'bg-blue-100 text-blue-900 border-blue-200 dark:bg-blue-600 dark:text-white dark:border-none';
  }
};

const AnalysisResultView: React.FC<Props> = ({ result, onReset }) => {
  const isCritical = result.riskLevel === 'Kritické' || result.riskLevel === 'Vysoké';
  const isAi = result.mode === 'AI';

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div className={`p-8 rounded-[2.5rem] shadow-xl border-t-[12px] transition-all duration-700 bg-white dark:bg-gray-900 border-opacity-100 border-slate-200 dark:border-transparent ${
        isAi 
          ? 'dark:border-indigo-500 dark:bg-indigo-950/20 shadow-indigo-500/5' 
          : isCritical 
            ? 'dark:border-red-600 dark:bg-red-950/20 shadow-red-500/5' 
            : 'dark:border-emerald-500 dark:bg-emerald-950/20 shadow-emerald-500/5'
      }`}>
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none mb-2">Analýza uložena</h2>
            {result.mode && (
              <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full ${
                isAi ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
              }`}>
                Metoda: {isAi ? 'AI Explorer' : 'Verified Database'}
              </span>
            )}
          </div>
          <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm border ${getRiskColorClasses(result.riskLevel)}`}>
            {result.riskLevel} RIZIKO
          </span>
        </div>

        <div className="space-y-8">
          <section>
            <h3 className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-[0.3em] mb-3">Sledované látky</h3>
            <p className="text-2xl font-bold text-slate-800 dark:text-gray-100 tracking-tight">{result.substances}</p>
          </section>

          <section>
            <h3 className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-[0.3em] mb-3">Zjištění</h3>
            <p className="text-lg text-slate-900 dark:text-gray-100 leading-relaxed font-bold">
              {result.keyDanger}
            </p>
          </section>

          <section className="bg-slate-50 dark:bg-gray-800/40 p-6 rounded-2xl border-l-4 border-slate-300 dark:border-gray-700 shadow-sm">
            <h3 className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-[0.3em] mb-3">Detaily mechanismu</h3>
            <p className="text-slate-700 dark:text-gray-300 leading-relaxed italic text-sm font-medium">
              {result.mechanism}
            </p>
          </section>

          <section className="bg-amber-50 dark:bg-amber-500/5 p-6 rounded-2xl border border-amber-200 dark:border-amber-500/20 shadow-inner">
            <h4 className="text-amber-700 dark:text-amber-500 font-black uppercase tracking-widest mb-2 flex items-center gap-2 text-xs">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Důležité varování
            </h4>
            <p className="text-amber-900/80 dark:text-amber-200/60 text-[11px] leading-relaxed font-medium">
              {result.warning}
            </p>
          </section>
        </div>
      </div>

      <button
        onClick={onReset}
        className="w-full py-4 bg-slate-200 dark:bg-gray-900 hover:bg-slate-300 dark:hover:bg-gray-800 text-slate-700 dark:text-gray-300 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all shadow-md active:scale-95"
      >
        Zavřít nález
      </button>

      <div className="grid grid-cols-2 gap-4 mt-8">
        <a href="https://tripsit.me/" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-950 border border-slate-200 dark:border-gray-800/50 rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-600/10 transition-all group shadow-sm">
          <span className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400">Zdroj 01</span>
          <span className="text-slate-800 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 font-bold text-xs uppercase">TripSit Guide</span>
        </a>
        <a href="https://psychonautwiki.org/wiki/Main_Page" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-950 border border-slate-200 dark:border-gray-800/50 rounded-2xl hover:bg-indigo-50 dark:hover:bg-indigo-600/10 transition-all group shadow-sm">
          <span className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">Zdroj 02</span>
          <span className="text-slate-800 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 font-bold text-xs uppercase">PsychonautWiki</span>
        </a>
      </div>
    </div>
  );
};

export default AnalysisResultView;
