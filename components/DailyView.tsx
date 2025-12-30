
import React from 'react';
import { DiaryEntry, RiskLevel } from '../types';

interface Props {
  entries: DiaryEntry[];
  date: Date;
  onDelete: (id: string) => void;
}

const getRiskColorClasses = (level: RiskLevel): string => {
  switch (level) {
    case 'Kritické': return 'bg-red-100 text-red-800 dark:bg-red-600 dark:text-white';
    case 'Vysoké': return 'bg-orange-100 text-orange-800 dark:bg-orange-600 dark:text-white';
    case 'Střední': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500 dark:text-white';
    case 'Nízké': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-600 dark:text-white';
    default: return 'bg-slate-100 text-slate-800 dark:bg-slate-600 dark:text-white';
  }
};

const DailyView: React.FC<Props> = ({ entries, date, onDelete }) => {
  const formattedDate = date.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="mt-8">
      <h3 className="text-slate-400 dark:text-gray-500 text-xs font-bold uppercase tracking-widest mb-4 flex justify-between items-center">
        <span>Záznamy: {formattedDate}</span>
        <span className="bg-white dark:bg-gray-800 px-2 py-0.5 rounded text-[10px] shadow-sm border border-slate-200 dark:border-gray-800 text-slate-900 dark:text-white">{entries.length}</span>
      </h3>

      {entries.length === 0 ? (
        <div className="text-center py-12 bg-white/50 dark:bg-gray-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-gray-800">
          <p className="text-slate-400 dark:text-gray-500 text-sm italic">Pro tento den nejsou žádné záznamy.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.sort((a, b) => b.timestamp - a.timestamp).map(entry => (
            <div key={entry.id} className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-md border border-slate-100 dark:border-gray-800 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex justify-between items-start mb-3">
                <div className="flex flex-wrap gap-1">
                  {entry.substances.map((s, i) => (
                    <span key={i} className="px-2 py-0.5 bg-slate-50 dark:bg-gray-800 text-slate-600 dark:text-gray-400 text-[10px] font-bold rounded uppercase border border-slate-100 dark:border-gray-700">{s}</span>
                  ))}
                </div>
                <button 
                  onClick={() => onDelete(entry.id)}
                  className="text-slate-300 dark:text-gray-700 hover:text-red-500 transition-colors p-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
              
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${getRiskColorClasses(entry.analysis.riskLevel)}`}>
                  {entry.analysis.riskLevel}
                </span>
                <span className="text-[10px] text-slate-400 font-medium ml-auto">
                  {new Date(entry.timestamp).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              
              <p className="mt-3 text-xs text-slate-600 dark:text-gray-400 leading-relaxed border-t border-slate-50 dark:border-gray-800 pt-3">
                {entry.analysis.keyDanger}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DailyView;
