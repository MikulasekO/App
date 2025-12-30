
import React, { useEffect, useState } from 'react';

interface Props {
  isOpen: boolean;
  newSubstances: string[];
  historicalSubstances: string[];
  riskDetails: {
    riskLevel: string;
    keyDanger: string;
    warning: string;
  } | null;
  onProceed: () => void;
  onCancel: () => void;
}

const CumulativeRiskModal: React.FC<Props> = ({ 
  isOpen, 
  newSubstances, 
  historicalSubstances, 
  riskDetails, 
  onProceed, 
  onCancel 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) setIsVisible(true);
    else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isVisible && !isOpen) return null;

  return (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
      
      {/* Aggressive Red Backdrop with Pulse */}
      <div className="absolute inset-0 bg-red-950/90 backdrop-blur-xl animate-pulse" />
      
      <div className="relative bg-black border-4 border-red-600 w-full max-w-lg rounded-3xl shadow-[0_0_100px_rgba(220,38,38,0.5)] overflow-hidden transform transition-all duration-300 scale-100 flex flex-col">
        
        {/* Header Icon */}
        <div className="bg-red-600 p-6 flex justify-center">
          <div className="bg-white rounded-full p-4 animate-bounce shadow-xl">
            <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>

        <div className="p-8 text-center space-y-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">
              METABOLICKÁ KOLIZE
            </h2>
            <p className="text-red-500 font-bold uppercase text-[10px] tracking-[0.3em]">Pharmacokinetic Safety Alert</p>
          </div>
          
          <div className="bg-red-900/30 border border-red-500/30 p-5 rounded-2xl">
            <p className="text-white text-base font-bold leading-relaxed">
              Detekována kolize s aktivními látkami, které jsou stále přítomny ve tvém systému.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 text-left">
            <div className="p-4 bg-gray-900 rounded-xl border border-gray-800">
              <p className="text-gray-500 font-bold uppercase text-[9px] tracking-widest mb-2">Chystáš se zapsat:</p>
              <p className="text-white font-black text-lg">{newSubstances.join(', ')}</p>
            </div>
            
            <div className="p-4 bg-red-950/20 rounded-xl border border-red-900/50">
              <p className="text-red-500/80 font-bold uppercase text-[9px] tracking-widest mb-2">Stále v systému (biologicky aktivní):</p>
              <div className="space-y-1">
                {historicalSubstances.map((s, idx) => (
                  <p key={idx} className="text-red-100 font-bold text-sm">
                    • {s}
                  </p>
                ))}
              </div>
            </div>
          </div>

          {riskDetails && (
            <div className="text-left space-y-2 bg-black/40 p-4 rounded-xl border border-gray-800">
              <p className="text-red-500 font-black uppercase text-[10px] tracking-widest">Klinické riziko kombinace:</p>
              <p className="text-gray-300 text-sm leading-relaxed font-medium italic">{riskDetails.keyDanger}</p>
            </div>
          )}

          <div className="grid gap-3 pt-4">
            <button 
              onClick={onCancel}
              className="w-full py-4 bg-white hover:bg-gray-200 text-black rounded-xl font-black uppercase tracking-widest shadow-lg transition-transform active:scale-95"
            >
              Zrušit a počkat (Bezpečné)
            </button>
            
            <button 
              onClick={onProceed}
              className="w-full py-4 border-2 border-red-800 text-red-500 hover:text-red-400 hover:border-red-600 hover:bg-red-900/20 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-colors"
            >
              Rozumím riziku kumulace, uložit
            </button>

            <button 
               onClick={() => window.open('tel:155')}
               className="mt-2 text-red-500 underline text-[10px] font-bold uppercase tracking-widest hover:text-white"
            >
              Nouzové volání (155)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CumulativeRiskModal;
