
import React from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  // Added onFullReset to Props to fix "Property 'onFullReset' does not exist on type 'IntrinsicAttributes & Props'" error in App.tsx line 468
  onFullReset: () => void;
}

const SettingsModal: React.FC<Props> = ({ isOpen, onClose, isDarkMode, onToggleDarkMode, onFullReset }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-3xl shadow-2xl border border-slate-200 dark:border-gray-800 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 dark:border-gray-800 flex justify-between items-center bg-slate-50/50 dark:bg-gray-800/20">
          <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">Nastavení</h2>
          <button 
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-200 dark:hover:bg-gray-800 rounded-xl transition-colors text-slate-500 font-bold text-xs uppercase"
          >
            <span>Zavřít</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Sekce Vzhled - Ikonický přepínač */}
          <section className="flex flex-col items-center">
            <h3 className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-6 w-full text-center">Vzhled aplikace</h3>
            
            <div className="relative inline-flex bg-slate-100 dark:bg-gray-800 p-1.5 rounded-2xl w-48 shadow-inner">
              {/* Posuvník */}
              <div 
                className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white dark:bg-gray-700 rounded-xl shadow-md transition-all duration-500 ease-out ${isDarkMode ? 'translate-x-[100%]' : 'translate-x-0'}`}
              />
              
              <button 
                onClick={() => isDarkMode && onToggleDarkMode()}
                className={`relative z-10 w-1/2 py-3 flex items-center justify-center gap-2 transition-colors duration-300 ${!isDarkMode ? 'text-blue-600' : 'text-slate-400 hover:text-slate-300'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
              </button>
              
              <button 
                onClick={() => !isDarkMode && onToggleDarkMode()}
                className={`relative z-10 w-1/2 py-3 flex items-center justify-center gap-2 transition-colors duration-300 ${isDarkMode ? 'text-blue-400' : 'text-slate-400 hover:text-slate-500'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              </button>
            </div>
          </section>

          {/* Dangerous actions section using the onFullReset prop */}
          <section className="pt-4 border-t border-slate-100 dark:border-gray-800">
            <h3 className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-4 w-full text-center">Nebezpečná zóna</h3>
            <button 
              onClick={onFullReset}
              className="w-full py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors border border-red-100 dark:border-red-900/50"
            >
              Smazat všechna data
            </button>
          </section>

          <div className="pt-4 text-center">
            <p className="text-[10px] text-slate-400 dark:text-gray-500 font-medium tracking-wide">V1.6.0 Stable • Final Edition</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
