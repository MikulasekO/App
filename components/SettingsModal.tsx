
import React, { useState, useEffect, useRef } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onClearHistory: () => void;
}

const SettingsModal: React.FC<Props> = ({ isOpen, onClose, isDarkMode, onToggleDarkMode, onClearHistory }) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isConfirming && countdown > 0) {
      timerRef.current = window.setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (countdown === 0 && timerRef.current) {
      window.clearInterval(timerRef.current);
    }
    
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [isConfirming, countdown]);

  const handleStartDelete = () => {
    setIsConfirming(true);
    setCountdown(3);
  };

  const handleCancelDelete = () => {
    setIsConfirming(false);
    setCountdown(3);
    if (timerRef.current) window.clearInterval(timerRef.current);
  };

  const handleFinalDelete = () => {
    onClearHistory();
    setIsConfirming(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-3xl shadow-2xl border border-slate-200 dark:border-gray-800 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {!isConfirming ? (
          <>
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
              <section className="flex flex-col items-center">
                <h3 className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-6 w-full text-center">Vzhled aplikace</h3>
                
                <div className="relative inline-flex bg-slate-100 dark:bg-gray-800 p-1.5 rounded-2xl w-48 shadow-inner">
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

              <section className="pt-4 border-t border-slate-100 dark:border-gray-800">
                <button 
                  onClick={handleStartDelete}
                  className="w-full py-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors border border-red-100 dark:border-red-900/50 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Vymazat historii užití
                </button>
              </section>

              <div className="pt-4 text-center">
                <p className="text-[10px] text-slate-400 dark:text-gray-500 font-medium tracking-wide">V1.7.0 • Stable Build</p>
              </div>
            </div>
          </>
        ) : (
          <div className="p-8 text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-black uppercase text-slate-900 dark:text-white">Opravdu smazat?</h3>
              <p className="text-sm text-slate-500 dark:text-gray-400">Tato akce odstraní celou vaši historii a resetuje metabolické grafy. Nastavení zůstane zachováno.</p>
            </div>

            <div className="space-y-3 pt-4">
              <button 
                onClick={handleFinalDelete}
                disabled={countdown > 0}
                className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg ${
                  countdown > 0 
                    ? 'bg-slate-200 dark:bg-gray-800 text-slate-400 cursor-not-allowed' 
                    : 'bg-red-600 hover:bg-red-500 text-white shadow-red-500/20'
                }`}
              >
                {countdown > 0 ? `Počkejte ${countdown}s` : 'Ano, smazat historii'}
              </button>
              
              <button 
                onClick={handleCancelDelete}
                className="w-full py-4 bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-gray-300 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-gray-700 transition-colors"
              >
                Zrušit
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsModal;
