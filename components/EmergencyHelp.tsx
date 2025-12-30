
import React, { useState, useRef, useEffect, useCallback } from 'react';

interface SliderProps {
  label: string;
  onConfirm: () => void;
  colorClass: string;
}

const EmergencySlider: React.FC<SliderProps> = ({ label, onConfirm, colorClass }) => {
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [isTriggered, setIsTriggered] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<number | null>(null);

  // Funkce pro úplný reset do výchozího stavu
  const reset = useCallback(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setProgress(0);
    setIsHolding(false);
    setIsDragging(false);
    setCountdown(3);
    // isTriggered necháváme, aby uživatel viděl nápis "VOLÁM" i po puštění na konci
  }, []);

  const startCountdown = useCallback(() => {
    if (intervalRef.current) return;
    
    setCountdown(3);
    intervalRef.current = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) {
            window.clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setIsTriggered(true);
          onConfirm();
          // Po úspěšném triggeru počkáme a pak resetujeme vše pro další použití
          setTimeout(() => {
            setIsTriggered(false);
            reset();
          }, 2000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [onConfirm, reset]);

  // Logika pohybu - počítá se vůči kontejneru
  const handleMove = useCallback((clientX: number) => {
    if (!isDragging || isTriggered || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const p = Math.max(0, Math.min((x / rect.width) * 100, 100));
    
    setProgress(p);

    // Aktivace odpočtu při dosažení konce (nad 98% pro "pocit doražení")
    if (p > 98) {
      if (!isHolding) {
        setIsHolding(true);
        startCountdown();
      }
    } else {
      // Pokud uhne z konce, resetujeme odpočet
      if (isHolding) {
        setIsHolding(false);
        setCountdown(3);
        if (intervalRef.current) {
          window.clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    }
  }, [isDragging, isTriggered, isHolding, startCountdown]);

  // Event Listenery pro okno (zajišťují plynulý tah i mimo úzký pruh slideru)
  useEffect(() => {
    if (!isDragging) return;

    const onGlobalMove = (e: MouseEvent) => handleMove(e.clientX);
    const onGlobalTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientX);
    const onGlobalUp = () => {
      if (!isTriggered) {
        reset();
      }
      setIsDragging(false);
    };

    window.addEventListener('mousemove', onGlobalMove);
    window.addEventListener('mouseup', onGlobalUp);
    window.addEventListener('touchmove', onGlobalTouchMove, { passive: false });
    window.addEventListener('touchend', onGlobalUp);

    return () => {
      window.removeEventListener('mousemove', onGlobalMove);
      window.removeEventListener('mouseup', onGlobalUp);
      window.removeEventListener('touchmove', onGlobalTouchMove);
      window.removeEventListener('touchend', onGlobalUp);
    };
  }, [isDragging, handleMove, reset, isTriggered]);

  return (
    <div className="relative mb-6">
      <div 
        ref={containerRef}
        className="h-16 bg-gray-200 rounded-full overflow-hidden relative select-none touch-none border-2 border-transparent shadow-inner"
      >
        {/* Textová vrstva - nápisy se mění podle stavu */}
        <div className="absolute inset-0 flex items-center justify-center font-bold pointer-events-none z-20">
          {isTriggered ? (
            <span className="text-white animate-bounce tracking-widest uppercase">VOLÁM...</span>
          ) : isHolding ? (
            <span className="text-white drop-shadow-md text-lg">
              DRŽTE: {countdown}s
            </span>
          ) : (
            <span className={`transition-all duration-300 uppercase text-xs tracking-wider ${progress > 50 ? 'text-white' : 'text-gray-500'}`}>
              {progress > 5 ? '' : label}
            </span>
          )}
        </div>
        
        {/* Barevná výplň (Progress Bar) */}
        <div 
          className={`absolute top-0 left-0 h-full ${colorClass} transition-opacity duration-300 ${isDragging ? 'opacity-100' : 'opacity-70'}`}
          style={{ width: `${progress}%` }}
        >
           {isHolding && (
             <div className="absolute inset-0 bg-white/30 animate-pulse" />
           )}
        </div>
        
        {/* Jezdec (Thumb) - Pouze uchopením za toto tlačítko se slider pohne */}
        <div 
          onMouseDown={(e) => { e.stopPropagation(); setIsDragging(true); }}
          onTouchStart={(e) => { e.stopPropagation(); setIsDragging(true); }}
          className={`absolute top-1 bottom-1 w-14 bg-white rounded-full shadow-2xl border-2 border-gray-100 cursor-grab active:cursor-grabbing flex items-center justify-center z-30 transition-all duration-150 ${isDragging ? 'scale-110 shadow-blue-200 border-blue-100' : ''}`}
          style={{ 
            left: `calc(${progress}% - ${progress > 50 ? '56px' : '0px'})`,
            transform: isDragging ? 'scale(1.1)' : 'scale(1)'
          }}
        >
          <div className={`p-1 rounded-full transition-colors ${isDragging ? 'bg-blue-50' : ''}`}>
            <svg className={`w-6 h-6 transition-colors ${isTriggered ? 'text-green-600' : isHolding ? 'text-red-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

const EmergencyHelp: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const triggerCall = (number: string, name: string) => {
    alert(`DEMO: Nyní by se vytočilo ${number} (${name}).\n\nV reálné aplikaci by následoval systémový hovor.`);
  };

  return (
    <div className="mt-8 border-t-2 border-red-100 pt-8">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-5 rounded-2xl font-black transition-all shadow-lg active:scale-95 ${isOpen ? 'bg-gray-800 text-white' : 'bg-red-600 text-white'}`}
      >
        <div className="flex items-center gap-3 uppercase tracking-widest">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Nouzová pomoc
        </div>
        <svg className={`w-6 h-6 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="mt-6 animate-in slide-in-from-top-4 duration-500 bg-red-50/30 p-4 rounded-3xl border border-red-100">
          <div className="mb-6 bg-white p-3 rounded-2xl shadow-sm border border-red-100 text-center">
             <p className="text-xs font-bold text-red-600 uppercase tracking-tighter mb-1">Bezpečnostní pojistka</p>
             <p className="text-sm text-gray-700 font-medium">Uchopte bílý jezdec, přejeďte doprava a držte 3 sekundy.</p>
          </div>
          
          <EmergencySlider 
            label="Záchranka (155)" 
            colorClass="bg-red-600"
            onConfirm={() => triggerCall('155', 'Záchranná služba')}
          />
          
          <EmergencySlider 
            label="Linka bezpečí" 
            colorClass="bg-orange-500"
            onConfirm={() => triggerCall('116 111', 'Linka bezpečí')}
          />
          
          <div className="mt-6 pt-6 border-t border-red-200">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center mb-3">Oficiální informační zdroje</h4>
            <div className="grid grid-cols-2 gap-3">
              <a 
                href="https://www.nzip.cz" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center justify-center p-3 bg-white border border-red-100 rounded-xl hover:shadow-md transition-shadow text-red-700 font-bold text-xs text-center"
              >
                NZIP.cz
              </a>
              <a 
                href="https://www.linkabezpeci.cz" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center justify-center p-3 bg-white border border-orange-100 rounded-xl hover:shadow-md transition-shadow text-orange-700 font-bold text-xs text-center"
              >
                Linka bezpečí
              </a>
            </div>
            <p className="mt-4 text-[9px] text-gray-400 text-center leading-tight">
              Pamatujte: Tato aplikace nenahrazuje odbornou lékařskou pomoc.<br/>
              V kritickém stavu vždy volejte 112 nebo 155.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmergencyHelp;
