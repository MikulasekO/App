
import React from 'react';
import { AnalysisResult, RiskLevel } from '../types';

interface Props {
  result: AnalysisResult;
  onReset: () => void;
}

const getRiskColor = (level: RiskLevel): string => {
  switch (level) {
    case 'Kritické': return 'bg-red-600 text-white';
    case 'Vysoké': return 'bg-orange-600 text-white';
    case 'Střední': return 'bg-yellow-500 text-white';
    case 'Nízké': return 'bg-green-600 text-white';
    case 'Neznámé': return 'bg-gray-800 text-white';
    default: return 'bg-blue-600 text-white';
  }
};

const AnalysisResultView: React.FC<Props> = ({ result, onReset }) => {
  const isCritical = result.riskLevel === 'Kritické' || result.riskLevel === 'Vysoké';

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className={`p-6 rounded-2xl shadow-xl border-t-8 border-opacity-50 ${isCritical ? 'bg-red-50 border-red-600' : 'bg-white border-blue-500'}`}>
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Výsledek analýzy</h2>
          <span className={`px-4 py-2 rounded-full text-sm font-black uppercase tracking-wider ${getRiskColor(result.riskLevel)}`}>
            {result.riskLevel} RIZIKO
          </span>
        </div>

        <div className="space-y-8">
          <section>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-2">Seznam látek</h3>
            <p className="text-xl font-medium text-gray-800">{result.substances}</p>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-2">Klíčové nebezpečí</h3>
            <p className="text-lg text-gray-800 leading-relaxed font-semibold">
              {result.keyDanger}
            </p>
          </section>

          <section className="bg-gray-100 p-4 rounded-xl border-l-4 border-gray-400">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-2">Mechanismus účinku</h3>
            <p className="text-gray-700 leading-relaxed italic">
              {result.mechanism}
            </p>
          </section>

          <section className="bg-amber-50 p-4 rounded-xl border border-amber-200">
            <h4 className="text-amber-800 font-bold mb-1 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Varování
            </h4>
            <p className="text-amber-700 text-sm">
              {result.warning}
            </p>
          </section>
        </div>
      </div>

      <button
        onClick={onReset}
        className="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-bold transition-colors"
      >
        Nová analýza
      </button>

      <div className="grid grid-cols-2 gap-4 mt-8">
        <a 
          href="https://tripsit.me/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-center p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-400 transition-colors group"
        >
          <span className="text-gray-600 group-hover:text-blue-600 font-medium">TripSit Guide</span>
        </a>
        <a 
          href="https://psychonautwiki.org/wiki/Main_Page" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-center p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-400 transition-colors group"
        >
          <span className="text-gray-600 group-hover:text-blue-600 font-medium">PsychonautWiki</span>
        </a>
      </div>
    </div>
  );
};

export default AnalysisResultView;
