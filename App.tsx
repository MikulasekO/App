
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AppState, AnalysisResult, DiaryData, DiaryEntry, AnalysisMode, RiskLevel, IdentificationResult } from './types';
import { analyzeSubstances, identifySubstances } from './services/geminiService';
import SubstanceInput from './components/SubstanceInput';
import AnalysisResultView from './components/AnalysisResultView';
import Calendar from './components/Calendar';
import DailyView from './components/DailyView';
import CalmZone from './components/CalmZone';
import EmergencyHelp from './components/EmergencyHelp';
import SettingsModal from './components/SettingsModal';
import HeaderMandala from './components/HeaderMandala';
import MandalaModal from './components/MandalaModal';
import CumulativeRiskModal from './components/CumulativeRiskModal';

const STORAGE_KEY = 'hr_diary_data_v1';
const THEME_KEY = 'hr_theme_dark';
const ID_CACHE_KEY = 'hr_id_cache_v1';

const HALF_LIVES: Record<string, number> = {
  'DMT': 0.25, 'LSD': 3, 'Psilocybin': 3, 'Mushrooms': 3, 'MDMA': 8, 'Cocaine': 1,
  'Kokain': 1, 'Methamphetamine': 10, 'THC': 20, 'Cannabis': 20, 'Ketamine': 2.5,
  'Amphetamines': 10, 'Alcohol': 4, 'Benzodiazepines': 18, 'Caffeine': 5,
  'Nicotine': 2, 'Kratom': 24, 'Tramadol': 6, 'Opioids': 3, 'Heroin': 0.5, 'Fentanyl': 4
};

const App: React.FC = () => {
  const [diaryData, setDiaryData] = useState<DiaryData>({});
  const [idCache, setIdCache] = useState<Record<string, IdentificationResult>>({});
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [state, setState] = useState<AppState>(AppState.CALENDAR);
  const [showSettings, setShowSettings] = useState(false);
  const [showMandalaModal, setShowMandalaModal] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  const [substances, setSubstances] = useState<string[]>([]);
  const [currentResult, setCurrentResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('VERIFIED');
  const [aiDisclaimerAccepted, setAiDisclaimerAccepted] = useState(false);
  const [localInteractions, setLocalInteractions] = useState<any>(null);

  const [cumulativeRiskModal, setCumulativeRiskModal] = useState<{
    isOpen: boolean;
    newSubstances: string[];
    historicalSubstances: string[];
    riskDetails: { riskLevel: string; keyDanger: string; warning: string; } | null;
    pendingResult: AnalysisResult | null; 
  }>({
    isOpen: false, newSubstances: [], historicalSubstances: [], riskDetails: null, pendingResult: null
  });

  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    const savedCache = localStorage.getItem(ID_CACHE_KEY);
    if (savedData) {
      try { 
        const parsed = JSON.parse(savedData);
        setDiaryData(parsed || {}); 
      } catch (e) { setDiaryData({}); }
    }
    if (savedCache) {
      try { 
        const parsed = JSON.parse(savedCache);
        setIdCache(parsed || {}); 
      } catch (e) { setIdCache({}); }
    }
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme !== null) setIsDarkMode(savedTheme === 'true');

    fetch('./interactions.json')
      .then(res => res.json())
      .then(data => setLocalInteractions(data))
      .catch(() => setLocalInteractions({ substances: [], interactions: [] }));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(diaryData));
    localStorage.setItem(ID_CACHE_KEY, JSON.stringify(idCache));
  }, [diaryData, idCache]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem(THEME_KEY, String(isDarkMode));
  }, [isDarkMode]);

  const getDateKey = (date: Date) => {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  };

  const dateStatusLabel = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);

    if (selected.getTime() < today.getTime()) return { label: 'Zápis do historie', color: 'text-amber-500', isPast: true };
    if (selected.getTime() > today.getTime()) return { label: 'Plánování užití', color: 'text-indigo-500', isFuture: true };
    return { label: 'Záznam užití', color: 'text-blue-600', isToday: true };
  }, [selectedDate]);

  const getActiveHistoricalSubstances = useCallback((): { name: string, lastUsageTs: number, halfLife: number }[] => {
    const now = Date.now();
    const latestUsageMap: Record<string, number> = {};
    const entries = (Object.values(diaryData || {}).flat() as DiaryEntry[]) || [];

    entries.forEach(entry => {
      if (entry && entry.substances) {
        entry.substances.forEach(s => {
          if (!latestUsageMap[s] || entry.timestamp > latestUsageMap[s]) {
            latestUsageMap[s] = entry.timestamp;
          }
        });
      }
    });

    return Object.entries(latestUsageMap)
      .map(([name, lastUsageTs]) => {
        const key = Object.keys(HALF_LIVES).find(k => name.toLowerCase().includes(k.toLowerCase())) || name;
        return { name, lastUsageTs, halfLife: HALF_LIVES[key] || 4 };
      })
      .filter(item => {
        const timePassedHrs = (now - item.lastUsageTs) / (1000 * 60 * 60);
        const currentLevel = 100 * Math.pow(0.5, timePassedHrs / item.halfLife);
        return currentLevel > 1.0; 
      });
  }, [diaryData]);

  const startNewEntry = () => {
    setSubstances([]);
    setCurrentResult(null);
    setError(null);
    setState(AppState.RECORDING);
  };

  const finishSavingEntry = (analysis: AnalysisResult, list: string[]) => {
    const dateKey = getDateKey(selectedDate);
    const nowTs = new Date();
    const targetTs = new Date(selectedDate);
    targetTs.setHours(nowTs.getHours(), nowTs.getMinutes(), nowTs.getSeconds());

    const newEntry: DiaryEntry = { 
      id: crypto.randomUUID(), 
      timestamp: targetTs.getTime(), 
      substances: list, 
      analysis 
    };

    setDiaryData(prev => ({ ...prev, [dateKey]: [...(prev[dateKey] || []), newEntry] }));
    setCurrentResult(analysis);
    setState(AppState.RESULT);
  };

  const handleClearHistory = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ID_CACHE_KEY);
    setDiaryData({});
    setIdCache({});
    setSubstances([]);
    setCurrentResult(null);
    setError(null);
    setState(AppState.CALENDAR);
  }, []);

  const checkCumulativeSafety = async (newSubstances: string[], pendingAnalysis: AnalysisResult) => {
    const activeHistory = getActiveHistoricalSubstances();
    const uniqueActiveHistory = activeHistory.filter(h => 
      !newSubstances.some(ns => ns.toLowerCase().trim() === h.name.toLowerCase().trim())
    );

    if (uniqueActiveHistory.length === 0) {
      finishSavingEntry(pendingAnalysis, newSubstances);
      return;
    }

    try {
      const auditResult = await analyzeSubstances([...newSubstances, ...uniqueActiveHistory.map(h => h.name)]);
      const isCritical = ['Kritické', 'Vysoké'].includes(auditResult.riskLevel) || /dangerous|fatal/i.test(auditResult.riskLevel);

      if (isCritical) {
        setCumulativeRiskModal({
          isOpen: true, newSubstances, historicalSubstances: uniqueActiveHistory.map(h => h.name),
          riskDetails: auditResult, pendingResult: pendingAnalysis
        });
      } else {
        finishSavingEntry(pendingAnalysis, newSubstances);
      }
    } catch (e) {
      finishSavingEntry(pendingAnalysis, newSubstances);
    }
  };

  const handleVerifiedAnalysis = async () => {
    if (!localInteractions || substances.length === 0) return;
    setIsAnalyzing(true);
    setError(null);

    try {
      const unidentifed = substances.filter(s => !idCache[s.toLowerCase()]);
      let newIds: IdentificationResult[] = [];
      if (unidentifed.length > 0) {
        newIds = await identifySubstances(unidentifed);
        const nextCache = { ...idCache };
        newIds.forEach(id => { nextCache[id.originalTerm.toLowerCase()] = id; });
        setIdCache(nextCache);
      }

      const results = substances.map(s => idCache[s.toLowerCase()] || newIds.find(n => n.originalTerm === s));
      const validKeys = results.filter(r => r?.recognized).map(r => r!.databaseKey!);
      
      if (validKeys.length === 0) {
        setIsAnalyzing(false);
        setError("Látky nebyly v databázi rozpoznány. Zkuste AI Průzkumníka.");
        return;
      }

      let foundItem = null;
      if (validKeys.length === 1) {
        foundItem = localInteractions.substances.find((s: any) => s.pair.toLowerCase() === validKeys[0].toLowerCase());
      } else if (validKeys.length === 2) {
        foundItem = localInteractions.interactions.find((inter: any) => {
          const parts = inter.pair.split(' + ').map((p: string) => p.toLowerCase().trim());
          return parts.every((p: string) => validKeys.map(vk => vk.toLowerCase()).includes(p));
        });
      }

      if (foundItem) {
        const result: AnalysisResult = {
          substances: foundItem.pair,
          riskLevel: foundItem.risk_level.includes('Low') ? 'Nízké' : foundItem.risk_level.includes('Caution') ? 'Střední' : 'Vysoké',
          keyDanger: foundItem.summary || foundItem.note,
          mechanism: foundItem.mechanism || "V ověřené DB chybí popis mechanismu.",
          warning: foundItem.warning || "Obecné varování: Nekombinovat bez dozoru.",
          rawResponse: JSON.stringify(foundItem), mode: 'VERIFIED'
        };
        await checkCumulativeSafety(substances, result);
      } else {
        setIsAnalyzing(false);
        setError("Kombinace nebyla v DB nalezena. Zkuste AI Průzkumníka.");
      }
    } catch (err) {
      setError("Chyba při zpracování. Zkuste to znovu.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAiAnalysis = async () => {
    if (!aiDisclaimerAccepted || substances.length === 0) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const data = await analyzeSubstances(substances);
      await checkCumulativeSafety(substances, { ...data, mode: 'AI' });
    } catch (err) {
      setError("AI služba je dočasně nedostupná.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const selectedDateEntries = diaryData[getDateKey(selectedDate)] || [];

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-black transition-colors duration-300 font-inter text-slate-900 dark:text-white flex flex-col">
      <div className="max-w-md mx-auto w-full flex-grow">
        <header className="flex justify-between items-center mb-10 relative z-20">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowMandalaModal(true)} className="relative flex items-center justify-center w-12 h-12 outline-none group">
               <HeaderMandala mode={analysisMode} />
               <div className="relative z-10 p-3 bg-blue-600 rounded-xl shadow-lg group-hover:scale-105 transition-transform">
                 <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
               </div>
            </button>
            <div className="relative z-20">
              <h1 className="text-xl font-black tracking-tight leading-none uppercase">Harm Reduction</h1>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${analysisMode === 'AI' ? 'text-indigo-500' : 'text-emerald-500'}`}>{analysisMode === 'AI' ? 'AI Explorer Active' : 'Verified Database'}</span>
            </div>
          </div>
          <button onClick={() => setShowSettings(true)} className="p-2.5 bg-white dark:bg-gray-900 rounded-full shadow-md border dark:border-gray-800 transition-all active:scale-90">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </button>
        </header>

        {state === AppState.CALENDAR ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
            <Calendar data={diaryData || {}} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
            <button onClick={startNewEntry} className="w-full py-5 bg-blue-600 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">+ Zapsat užití</button>
            <DailyView entries={selectedDateEntries} date={selectedDate} onDelete={(id) => {
              const dk = getDateKey(selectedDate);
              setDiaryData(prev => ({ ...prev, [dk]: (prev[dk] || []).filter(e => e.id !== id) }));
            }} />
            <CalmZone diaryData={diaryData || {}} analysisMode={analysisMode} />
            <EmergencyHelp />
          </div>
        ) : state === AppState.RECORDING ? (
          <div className="space-y-8 animate-in slide-in-from-right-4">
            <div className="flex items-center gap-4">
              <button onClick={() => setState(AppState.CALENDAR)} className="p-2 bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-full shadow-md"><svg className="w-5 h-5 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg></button>
              <div>
                <h2 className="text-xl font-bold uppercase leading-none mb-1">{dateStatusLabel.label}</h2>
                <p className={`text-[10px] font-black uppercase tracking-widest ${dateStatusLabel.color}`}>
                  {selectedDate.toLocaleDateString()}
                </p>
              </div>
            </div>
            {analysisMode === 'AI' && !aiDisclaimerAccepted ? (
              <div className="bg-white dark:bg-indigo-950/40 p-8 rounded-[2rem] border-2 border-indigo-500/50 shadow-xl text-center">
                <h3 className="text-xl font-black uppercase mb-4">AI Průzkumník</h3>
                <p className="text-sm mb-8">Upozornění: AI analýza může být nepřesná a slouží pouze pro orientaci.</p>
                <div className="space-y-3">
                  <button onClick={() => setAiDisclaimerAccepted(true)} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs">Rozumím, pokračovat</button>
                  <button onClick={() => setAnalysisMode('VERIFIED')} className="w-full py-4 bg-slate-100 dark:bg-black/40 text-slate-500 rounded-2xl font-bold text-xs uppercase">Zpět</button>
                </div>
              </div>
            ) : (
              <>
                {dateStatusLabel.isPast && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-500/30 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-left-2">
                    <div className="p-2 bg-amber-100 dark:bg-amber-800 rounded-lg">
                      <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <p className="text-[10px] font-bold text-amber-800 dark:text-amber-200 uppercase tracking-widest leading-snug">Zápis do minulosti nebude vyvolávat varování o kolizi s aktuálním stavem.</p>
                  </div>
                )}
                {dateStatusLabel.isFuture && (
                  <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-500/30 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-left-2">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-800 rounded-lg">
                      <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                    <p className="text-[10px] font-bold text-indigo-800 dark:text-indigo-200 uppercase tracking-widest leading-snug">Plánování kontroluje kolizi s momentálně aktivními látkami v těle.</p>
                  </div>
                )}
                {error && <div className="p-4 bg-red-100 text-red-700 rounded-2xl text-sm font-medium">{error}</div>}
                <SubstanceInput 
                  substances={substances}
                  onAdd={(s) => setSubstances(prev => [...prev, s])}
                  onRemove={(i) => setSubstances(prev => prev.filter((_, idx) => idx !== i))}
                  onAnalyze={(m) => m === 'VERIFIED' ? handleVerifiedAnalysis() : handleAiAnalysis()}
                  isLoading={isAnalyzing}
                  mode={analysisMode}
                  onModeChange={(m) => { setAnalysisMode(m); if (m === 'AI') setAiDisclaimerAccepted(false); }}
                />
              </>
            )}
          </div>
        ) : (
          <div className="animate-in zoom-in-95"><div className="flex items-center gap-4 mb-6"><button onClick={() => setState(AppState.CALENDAR)} className="p-2 bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-full shadow-md"><svg className="w-5 h-5 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg></button><h2 className="text-xl font-black uppercase">{currentResult?.mode === 'AI' ? 'AI Analýza ✨' : 'Nález ✅'}</h2></div>
            {currentResult && <AnalysisResultView result={currentResult} onReset={() => setState(AppState.CALENDAR)} />}
          </div>
        )}

        <CumulativeRiskModal 
          isOpen={cumulativeRiskModal.isOpen} newSubstances={cumulativeRiskModal.newSubstances}
          historicalSubstances={cumulativeRiskModal.historicalSubstances} riskDetails={cumulativeRiskModal.riskDetails}
          onProceed={() => { if (cumulativeRiskModal.pendingResult) finishSavingEntry(cumulativeRiskModal.pendingResult, cumulativeRiskModal.newSubstances); setCumulativeRiskModal(p => ({...p, isOpen: false})); }}
          onCancel={() => setCumulativeRiskModal(p => ({...p, isOpen: false}))}
        />
        <SettingsModal 
          isOpen={showSettings} 
          onClose={() => setShowSettings(false)} 
          isDarkMode={isDarkMode} 
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)} 
          onClearHistory={handleClearHistory} 
        />
        <MandalaModal isOpen={showMandalaModal} onClose={() => setShowMandalaModal(false)} mode={analysisMode} />
      </div>

      <footer className="mt-20 pb-12 text-center border-t border-slate-200/50 dark:border-white/5 pt-10 px-6">
        <div className="max-w-xs mx-auto space-y-6">
          <p className="text-xs text-slate-500 dark:text-gray-400 font-medium tracking-wide italic opacity-70 leading-relaxed">
            „Know your body, know your substance, know your dose“
          </p>
          
          <div className="space-y-2">
            <p className="text-[10px] text-slate-400 dark:text-gray-500 font-black uppercase tracking-[0.25em]">
              Anonymní lokální data
            </p>
            <p className="text-[10px] text-slate-400 dark:text-gray-600 font-medium leading-relaxed opacity-60">
              Určeno pouze pro edukační účely a harm reduction.<br />
              Nenahrazuje odbornou lékařskou pomoc.
            </p>
          </div>

          <div className="pt-4 flex flex-col items-center gap-1">
             <div className="h-px w-8 bg-slate-200 dark:bg-gray-800 mb-2"></div>
             <p className="text-[10px] text-slate-300 dark:text-gray-800 font-bold uppercase tracking-tighter">
               Made by Mikulášek Ondřej | Data by TripSit.me
             </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
