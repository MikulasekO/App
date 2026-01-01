
import React, { useState, useEffect, useMemo } from 'react';
import { DiaryData, AnalysisMode, DiaryEntry } from '../types';

type Mode = 'menu' | 'breathing' | 'grounding' | 'levels' | 'inventory';

interface Props {
  diaryData?: DiaryData;
  analysisMode?: AnalysisMode;
}

// Half-life data (T1/2) in hours
const HALF_LIVES: Record<string, number> = {
  'DMT': 0.25,        // 15 min
  'LSD': 3,
  'Psilocybin': 3,
  'Mushrooms': 3,
  'MDMA': 8,
  'Cocaine': 1,
  'Kokain': 1,
  'Methamphetamine': 10,
  'THC': 20,
  'Cannabis': 20,
  'Ketamine': 2.5,
  'Amphetamines': 10,
  'Alcohol': 4,
  'Benzodiazepines': 18,
  'Caffeine': 5,
  'Nicotine': 2,
  'Kratom': 24,
  'Tramadol': 6,
  'Opioids': 3,
  'Heroin': 0.5,
  'Fentanyl': 4
};

// Constant for time to reach < 1% of peak level (log0.5(0.01) approx 6.6438)
const ELIMINATION_CONSTANT = 6.6438;

const CalmZone: React.FC<Props> = ({ diaryData = {}, analysisMode = 'VERIFIED' }) => {
  const [mode, setMode] = useState<Mode>('menu');
  const [groundingStep, setGroundingStep] = useState(0);
  const [breathingText, setBreathingText] = useState('Nadechni se...');
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  
  const [checklist, setChecklist] = useState<Record<number, boolean>>({});

  const isAi = analysisMode === 'AI';
  const themeColor = isAi ? 'indigo' : 'emerald';

  const groundingSteps = [
    { label: "Pojmenuj 5 věcí, které právě teď vidíš kolem sebe.", count: 5 },
    { label: "Pojmenuj 4 věci, kterých se můžeš dotknout (textura, teplota).", count: 4 },
    { label: "Pojmenuj 3 věci, které právě teď slyšíš.", count: 3 },
    { label: "Pojmenuj 2 věci, které cítíš nosem (vůně nebo pachy).", count: 2 },
    { label: "Pojmenuj 1 věc, kterou můžeš ochutnat (nebo tvá oblíbená chuť).", count: 1 }
  ];

  const inventoryItems = [
    "Mám bezpečné a klidné prostředí?",
    "Cítím se vnitřně připraven/a?",
    "Mám u sebe dostatek vody?",
    "Mám nablízku osobu, které věřím?",
    "Moje záměry jsou jasné?"
  ];

  // Advanced Pharmacokinetic Calculation - Refined to use "Last usage" logic
  const activeLevels = useMemo(() => {
    const now = Date.now();
    const latestUsageMap: Record<string, number> = {};

    // 1. Traverse history to find the LATEST usage timestamp of each substance
    (Object.values(diaryData).flat() as DiaryEntry[]).forEach(entry => {
      entry.substances.forEach(s => {
        if (!latestUsageMap[s] || entry.timestamp > latestUsageMap[s]) {
          latestUsageMap[s] = entry.timestamp;
        }
      });
    });

    // 2. Map and filter: show only substances that haven't reached elimination threshold (<1%)
    return Object.entries(latestUsageMap)
      .map(([name, lastUsageTs]) => {
        const key = Object.keys(HALF_LIVES).find(k => name.toLowerCase().includes(k.toLowerCase())) || name;
        const h = HALF_LIVES[key] || 4;
        
        // Time to reach < 1% of peak from last usage
        const totalDurationHrs = h * ELIMINATION_CONSTANT;
        const totalDurationMs = totalDurationHrs * 60 * 60 * 1000;
        const timePassedMs = now - lastUsageTs;
        const remainingMs = Math.max(0, totalDurationMs - timePassedMs);
        
        // Biological level calculation for graph display (N(t) = 100 * 0.5^(t/h))
        const timePassedHrs = timePassedMs / (1000 * 60 * 60);
        const currentLevel = 100 * Math.pow(0.5, timePassedHrs / h);

        return {
          name,
          level: currentLevel,
          remainingTimeHrs: remainingMs / (1000 * 60 * 60),
          totalDurationHrs
        };
      })
      .filter(item => item.level > 1.0) // Strictly remove any substance that has reached < 1% level
      .sort((a, b) => b.level - a.level);
  }, [diaryData]);

  useEffect(() => {
    if (mode !== 'breathing') return;
    let timer: number;
    const runCycle = () => {
      setBreathPhase('inhale');
      setBreathingText('Nadechni se...');
      timer = window.setTimeout(() => {
        setBreathPhase('hold');
        setBreathingText('Zadrž dech...');
        timer = window.setTimeout(() => {
          setBreathPhase('exhale');
          setBreathingText('Pomalý výdech...');
          timer = window.setTimeout(runCycle, 4000);
        }, 4000);
      }, 4000);
    };
    runCycle();
    return () => clearTimeout(timer);
  }, [mode]);

  const formatTime = (totalHrs: number) => {
    const hrs = Math.floor(totalHrs);
    const mins = Math.round((totalHrs - hrs) * 60);
    return `${hrs}h ${mins}min`;
  };

  return (
    <div className={`mt-8 bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 shadow-2xl border-2 transition-colors duration-500 ${
      isAi ? 'border-indigo-100 dark:border-indigo-900/50 shadow-indigo-500/5' : 'border-emerald-100 dark:border-emerald-900/50 shadow-emerald-500/5'
    }`}>
      
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter flex items-center gap-3">
          <div className={`p-2 rounded-xl bg-${themeColor}-100 dark:bg-${themeColor}-900/30 text-${themeColor}-600`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          Klidová zóna
        </h3>
        {mode !== 'menu' && (
          <button 
            onClick={() => setMode('menu')}
            className="p-2 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-full text-slate-400 transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        )}
      </div>

      {mode === 'menu' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button onClick={() => setMode('breathing')} className={`group p-6 rounded-3xl border-2 transition-all text-left space-y-2 ${isAi ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-500/20 hover:border-indigo-400' : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-500/20 hover:border-emerald-400'}`}>
            <div className={`w-10 h-10 rounded-xl bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center text-${themeColor}-600 group-hover:scale-110 transition-transform`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg>
            </div>
            <p className="font-black uppercase tracking-widest text-[10px] text-slate-400">Práce s dechem</p>
            <h4 className="text-slate-900 dark:text-white font-bold">Dechové cvičení</h4>
          </button>
          <button onClick={() => setMode('grounding')} className={`group p-6 rounded-3xl border-2 transition-all text-left space-y-2 ${isAi ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-500/20 hover:border-indigo-400' : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-500/20 hover:border-emerald-400'}`}>
            <div className={`w-10 h-10 rounded-xl bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center text-${themeColor}-600 group-hover:scale-110 transition-transform`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
            <p className="font-black uppercase tracking-widest text-[10px] text-slate-400">Ukotvení reality</p>
            <h4 className="text-slate-900 dark:text-white font-bold">Teď a tady</h4>
          </button>
          <button onClick={() => setMode('inventory')} className={`group p-6 rounded-3xl border-2 transition-all text-left space-y-2 ${isAi ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-500/20 hover:border-indigo-400' : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-500/20 hover:border-emerald-400'}`}>
            <div className={`w-10 h-10 rounded-xl bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center text-${themeColor}-600 group-hover:scale-110 transition-transform`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </div>
            <p className="font-black uppercase tracking-widest text-[10px] text-slate-400">Set & Setting</p>
            <h4 className="text-slate-900 dark:text-white font-bold">Vnitřní inventura</h4>
          </button>
          <button onClick={() => setMode('levels')} className={`group p-6 rounded-3xl border-2 transition-all text-left space-y-2 ${isAi ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-500/20 hover:border-indigo-400' : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-500/20 hover:border-emerald-400'}`}>
            <div className={`w-10 h-10 rounded-xl bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center text-${themeColor}-600 group-hover:scale-110 transition-transform`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <p className="font-black uppercase tracking-widest text-[10px] text-slate-400">Metabolická křivka</p>
            <h4 className="text-slate-900 dark:text-white font-bold">Stav látek v těle</h4>
          </button>
        </div>
      )}

      {mode === 'inventory' && (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
           <div className="bg-slate-50 dark:bg-gray-800/40 p-4 rounded-2xl mb-4">
             <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed italic">Důkladná příprava prostředí a vlastní mysli je klíčová pro bezpečný zážitek.</p>
           </div>
           <div className="space-y-3">
             {inventoryItems.map((item, idx) => (
               <label key={idx} className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800/60 rounded-2xl border border-slate-100 dark:border-gray-700 cursor-pointer hover:bg-slate-50 transition-colors">
                 <input type="checkbox" checked={!!checklist[idx]} onChange={() => setChecklist(prev => ({...prev, [idx]: !prev[idx]}))} className={`w-6 h-6 rounded-lg text-${themeColor}-600 focus:ring-${themeColor}-500 border-gray-300`}/>
                 <span className={`text-sm font-medium transition-opacity ${checklist[idx] ? 'opacity-40 line-through' : 'opacity-100'}`}>{item}</span>
               </label>
             ))}
           </div>
        </div>
      )}

      {mode === 'levels' && (
        <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
          <div className="bg-slate-50 dark:bg-gray-800/40 p-4 rounded-2xl mb-4 text-center">
            <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Pharmacokinetic Logic (T1/2)</h5>
            <p className="text-[10px] text-slate-500 dark:text-gray-400 italic">Odhad nasycení plazmy a čas do eliminace</p>
          </div>
          
          {activeLevels.length > 0 ? (
            <div className="space-y-10">
              {activeLevels.map((item, idx) => (
                <div key={idx} className="space-y-3">
                  <div className="flex justify-between items-end px-1">
                    <div className="flex flex-col">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-gray-200">{item.name}</span>
                      <span className={`text-[11px] font-bold text-${themeColor}-600`}>Zbývající čas v systému: {formatTime(item.remainingTimeHrs)}</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[10px] font-bold text-slate-400 dark:text-gray-500">Celková detekce: {Math.round(item.totalDurationHrs)}h</span>
                    </div>
                  </div>
                  
                  {/* Double Line UI */}
                  <div className="relative h-4 bg-slate-100 dark:bg-gray-800 rounded-full shadow-inner p-1">
                    <div className="absolute inset-y-1.5 left-1 right-1 bg-slate-300 dark:bg-gray-700/50 rounded-full opacity-40" />
                    <div 
                      className={`h-full bg-gradient-to-r shadow-lg transition-all duration-1000 ease-out rounded-full ${isAi ? 'from-indigo-400 to-indigo-600' : 'from-emerald-400 to-emerald-600'}`}
                      style={{ width: `${Math.min(item.level, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
              
              <p className="text-[9px] text-slate-400 dark:text-gray-600 text-center leading-tight pt-4 border-t border-slate-100 dark:border-gray-800">
                Výpočet je matematický model na bázi T1/2, biologická realita se může lišit.
              </p>
            </div>
          ) : (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto text-slate-300">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">Tělo je aktuálně čisté</p>
            </div>
          )}
        </div>
      )}

      {/* Breathing, Grounding screens kept identical as they don't use pharmacokinetic display */}
      {mode === 'breathing' && (
        <div className="flex flex-col items-center py-12 animate-in zoom-in-95 duration-500">
          <div className="relative flex items-center justify-center w-64 h-64 sm:w-80 sm:h-80">
            <div className={`absolute rounded-full opacity-20 transition-all duration-[4000ms] ease-in-out ${breathPhase === 'inhale' ? 'scale-[2.2] bg-orange-400' : breathPhase === 'hold' ? 'scale-[2.2] bg-orange-400' : `scale-[1.3] bg-${themeColor}-400`}`}/>
            <div className={`w-40 h-40 sm:w-48 sm:h-48 rounded-full shadow-[0_0_60px_rgba(0,0,0,0.1)] transition-all duration-[4000ms] ease-in-out flex items-center justify-center border-4 border-white dark:border-gray-800 ${breathPhase === 'inhale' ? 'scale-150 bg-orange-500 shadow-orange-500/40' : breathPhase === 'hold' ? 'scale-150 bg-orange-600 shadow-orange-600/40' : `scale-100 bg-${themeColor}-600 shadow-${themeColor}-500/40`}`}>
              <div className="text-white font-black uppercase tracking-widest text-[10px] animate-pulse">
                {breathPhase === 'inhale' ? 'Nádech' : breathPhase === 'hold' ? 'Drž' : 'Výdech'}
              </div>
            </div>
          </div>
          <div className="mt-16 text-center space-y-2">
            <p className={`text-2xl font-black uppercase tracking-tighter transition-colors duration-1000 ${breathPhase === 'inhale' ? 'text-orange-600' : `text-${themeColor}-600`}`}>{breathingText}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.4em]">Box Breathing Protocol</p>
          </div>
        </div>
      )}

      {mode === 'grounding' && (
        <div className="py-4 animate-in slide-in-from-right-4 duration-300">
          <div className="mb-8 p-6 bg-slate-50 dark:bg-gray-800 rounded-[2rem] border border-slate-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <span className={`text-6xl font-black text-${themeColor}-100 dark:text-${themeColor}-900`}>{5 - groundingStep}</span>
              <div className="text-right">
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Krok cvičení</span>
                <span className="text-xl font-bold text-slate-800 dark:text-white">{groundingStep + 1} / 5</span>
              </div>
            </div>
            <p className="text-lg text-slate-800 dark:text-gray-100 leading-relaxed font-bold">{groundingSteps[groundingStep].label}</p>
          </div>
          <div className="flex gap-4">
            {groundingStep < 4 ? (
              <button onClick={() => setGroundingStep(s => s + 1)} className={`flex-1 py-5 bg-${themeColor}-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs shadow-xl shadow-${themeColor}-500/20 active:scale-95 transition-all`}>Mám to</button>
            ) : (
              <button onClick={() => setMode('menu')} className="flex-1 py-5 bg-emerald-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-500/20 active:scale-95 transition-all">Cítím se lépe</button>
            )}
            <button onClick={() => setMode('menu')} className="px-6 py-5 bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-gray-400 rounded-[1.5rem] font-bold text-xs uppercase transition-colors">Zrušit</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalmZone;
