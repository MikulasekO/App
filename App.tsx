
import React, { useState, useEffect } from 'react';
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

// Pharmacokinetic Constants (Half-lives in hours)
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

const App: React.FC = () => {
  const [diaryData, setDiaryData] = useState<DiaryData>({});
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
  const [showDbError, setShowDbError] = useState(false);
  const [dbErrorMessage, setDbErrorMessage] = useState('');

  // State for Cumulative Risk Audit
  const [cumulativeRiskModal, setCumulativeRiskModal] = useState<{
    isOpen: boolean;
    newSubstances: string[];
    historicalSubstances: string[];
    riskDetails: { riskLevel: string; keyDanger: string; warning: string; } | null;
    pendingResult: AnalysisResult | null; 
  }>({
    isOpen: false,
    newSubstances: [],
    historicalSubstances: [],
    riskDetails: null,
    pendingResult: null
  });

  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try { setDiaryData(JSON.parse(savedData)); } catch (e) { console.error(e); }
    }
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme !== null) {
      setIsDarkMode(savedTheme === 'true');
    }
    fetch('./interactions.json')
      .then(res => res.json())
      .then(data => setLocalInteractions(data))
      .catch(err => console.error('Chyba při načítání lokální databáze', err));
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(THEME_KEY, String(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(diaryData));
  }, [diaryData]);

  const getDateKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const handleFullReset = () => {
    const isConfirmed = window.confirm("Opravdu chcete smazat veškerou historii a nastavení? Tuto akci nelze vzít zpět.");
    if (isConfirmed) {
      localStorage.clear();
      setDiaryData({});
      setSubstances([]);
      setCurrentResult(null);
      setError(null);
      setAnalysisMode('VERIFIED');
      setAiDisclaimerAccepted(false);
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  };

  // --- PHARMACOKINETIC SAFETY LOGIC ---
  const getActiveHistoricalSubstances = (): { name: string, lastUsageTs: number, halfLife: number }[] => {
    const now = Date.now();
    const latestUsageMap: Record<string, number> = {};

    // 1. Find the latest timestamp for every unique substance in history
    Object.values(diaryData).flat().forEach(entry => {
      entry.substances.forEach(s => {
        if (!latestUsageMap[s] || entry.timestamp > latestUsageMap[s]) {
          latestUsageMap[s] = entry.timestamp;
        }
      });
    });

    // 2. Filter map: Keep only those where current level N(t) is > 1%
    // Threshold for elimination: t = T1/2 * log0.5(0.01) = T1/2 * 6.6438
    return Object.entries(latestUsageMap)
      .map(([name, lastUsageTs]) => {
        const key = Object.keys(HALF_LIVES).find(k => name.toLowerCase().includes(k.toLowerCase())) || name;
        const h = HALF_LIVES[key] || 4;
        return { name, lastUsageTs, halfLife: h };
      })
      .filter(item => {
        const timePassedHrs = (now - item.lastUsageTs) / (1000 * 60 * 60);
        const currentLevel = 100 * Math.pow(0.5, timePassedHrs / item.halfLife);
        return currentLevel > 1.0; // Strictly ignore substances below 1%
      });
  };

  const checkCumulativeSafety = async (newSubstances: string[], pendingAnalysis: AnalysisResult) => {
    const activeHistory = getActiveHistoricalSubstances();
    
    // Filter history: remove substances that are exactly the same as the new input
    const uniqueActiveHistory = activeHistory.filter(h => 
      !newSubstances.some(ns => ns.toLowerCase().trim() === h.name.toLowerCase().trim())
    );

    if (uniqueActiveHistory.length === 0) {
      finishSavingEntry(pendingAnalysis, newSubstances);
      return;
    }

    try {
      const combinedList = [...newSubstances, ...uniqueActiveHistory.map(h => h.name)];
      const auditResult = await analyzeSubstances(combinedList);

      const isCritical = auditResult.riskLevel === 'Kritické' || 
                         auditResult.riskLevel === 'Vysoké' ||
                         auditResult.riskLevel.includes('Dangerous') ||
                         auditResult.riskLevel.includes('Fatal');

      if (isCritical) {
        // Updated display strings: Removed % level as requested
        const formattedHistoryStrings = uniqueActiveHistory.map(h => h.name);

        setCumulativeRiskModal({
          isOpen: true,
          newSubstances: newSubstances,
          historicalSubstances: formattedHistoryStrings,
          riskDetails: {
            riskLevel: auditResult.riskLevel,
            keyDanger: auditResult.keyDanger,
            warning: auditResult.warning
          },
          pendingResult: pendingAnalysis
        });
      } else {
        finishSavingEntry(pendingAnalysis, newSubstances);
      }
    } catch (e) {
      console.error("Audit failed", e);
      finishSavingEntry(pendingAnalysis, newSubstances);
    }
  };

  const finishSavingEntry = (analysis: AnalysisResult, list: string[]) => {
    saveEntry(analysis, list);
    setCurrentResult(analysis);
    setState(AppState.RESULT);
  };
  // -------------------------

  const saveEntry = (analysis: AnalysisResult, list: string[]) => {
    const dateKey = getDateKey(selectedDate);
    const newEntry: DiaryEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      substances: list,
      analysis: analysis
    };
    setDiaryData(prev => ({
      ...prev,
      [dateKey]: [...(prev[dateKey] || []), newEntry]
    }));
  };

  const deleteEntry = (id: string) => {
    const dateKey = getDateKey(selectedDate);
    setDiaryData(prev => {
      const updatedEntries = (prev[dateKey] || []).filter(e => e.id !== id);
      const newData = { ...prev };
      if (updatedEntries.length === 0) {
        delete newData[dateKey];
      } else {
        newData[dateKey] = updatedEntries;
      }
      return newData;
    });
  };

  const mapRiskLevel = (rawRisk: string): RiskLevel => {
    const risk = rawRisk.toUpperCase();
    if (risk.includes('FATAL')) return 'Kritické';
    if (risk.includes('DANGEROUS')) return 'Kritické';
    if (risk.includes('MODERATE')) return 'Vysoké';
    if (risk.includes('CAUTION')) return 'Střední';
    if (risk.includes('LOW')) return 'Nízké';
    return 'Neznámé';
  };

  const handleVerifiedAnalysis = async () => {
    if (!localInteractions) return;
    const count = substances.length;
    if (count === 0) return;

    setIsAnalyzing(true);
    setError(null);

    if (count >= 3) {
      setDbErrorMessage('Naše bezpečná databáze nepodporuje vícečetné kombinace látek (3+). Pro hlubší analýzu přepněte na AI Průzkumníka.');
      setShowDbError(true);
      setIsAnalyzing(false);
      return;
    }

    try {
      const identificationResults = await identifySubstances(substances);
      const validKeys: string[] = [];
      const unknownTerms: string[] = [];

      identificationResults.forEach(res => {
        if (res.recognized && res.databaseKey) {
          validKeys.push(res.databaseKey);
        } else {
          unknownTerms.push(res.originalTerm);
        }
      });

      if (unknownTerms.length > 0) {
        setDbErrorMessage(`Následující látky nebyly v naší databázi rozpoznány: ${unknownTerms.join(', ')}. Zkuste AI Průzkumníka.`);
        setShowDbError(true);
        setIsAnalyzing(false);
        return;
      }

      let foundItem = null;
      const normKeys = validKeys.map(k => k.toLowerCase().trim());

      if (validKeys.length === 1) {
        foundItem = localInteractions.substances.find((s: any) => 
          s.pair.toLowerCase().trim() === normKeys[0]
        );
      } else if (validKeys.length === 2) {
        foundItem = localInteractions.interactions.find((inter: any) => {
          const parts = inter.pair.split(' + ').map((p: string) => p.toLowerCase().trim());
          return parts.length === 2 && parts.every(p => normKeys.includes(p));
        });
      }

      if (foundItem) {
        const warningText = foundItem.warning || foundItem.note || "Specifické varování není v databázi k dispozici.";
        const mechanismText = foundItem.mechanism || "Pro detailní farmakologický mechanismus přepněte na AI Průzkumníka.";

        const result: AnalysisResult = {
          substances: foundItem.pair,
          riskLevel: mapRiskLevel(foundItem.risk_level),
          keyDanger: foundItem.summary,
          mechanism: mechanismText,
          warning: warningText,
          rawResponse: JSON.stringify(foundItem),
          source: foundItem.source || "Ověřená databáze",
          mode: 'VERIFIED'
        };

        await checkCumulativeSafety(substances, result);

      } else {
        setDbErrorMessage(`Kombinace ${validKeys.join(' + ')} nebyla v naší ověřené databázi nalezena. Chcete využít AI Průzkumníka?`);
        setShowDbError(true);
      }

    } catch (err) {
      console.error(err);
      setError('Chyba při sémantické analýze. Zkontrolujte připojení nebo zkuste AI Průzkumníka.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAiAnalysis = async () => {
    if (!aiDisclaimerAccepted) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const data = await analyzeSubstances(substances);
      const result: AnalysisResult = { ...data, mode: 'AI' };
      
      await checkCumulativeSafety(substances, result);

    } catch (err: any) {
      setError('Nepodařilo se provést AI analýzu. Zkuste to prosím znovu.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzeClick = (mode: AnalysisMode) => {
    if (substances.length < 1) {
      window.alert('Zadejte alespoň jednu látku k analýze.');
      return;
    }
    if (mode === 'VERIFIED') {
      handleVerifiedAnalysis();
    } else {
      if (!aiDisclaimerAccepted) return;
      handleAiAnalysis();
    }
  };

  const startNewEntry = () => {
    setSubstances([]);
    setCurrentResult(null);
    setAnalysisMode('VERIFIED');
    setAiDisclaimerAccepted(false);
    setState(AppState.RECORDING);
  };

  const selectedDateKey = getDateKey(selectedDate);
  const entriesForDay = diaryData[selectedDateKey] || [];
  const formattedSelectedDate = selectedDate.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-black transition-colors duration-300 font-inter text-slate-900 dark:text-white flex flex-col">
      <div className="max-w-md mx-auto w-full flex-grow">
        <header className="flex justify-between items-center mb-10 relative z-20">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowMandalaModal(true)}
              className="relative flex items-center justify-center w-12 h-12 outline-none group"
            >
               <HeaderMandala mode={analysisMode} />
               <div className="relative z-10 p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20 backdrop-blur-sm group-hover:scale-105 transition-transform duration-300">
                 <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                 </svg>
               </div>
            </button>
            
            <div className="relative z-20">
              <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white leading-none uppercase">Harm Reduction</h1>
              <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors duration-500 ${analysisMode === 'AI' ? 'text-indigo-500' : 'text-emerald-500'}`}>
                {analysisMode === 'AI' ? 'AI Explorer Active' : 'Verified Database'}
              </span>
            </div>
          </div>
          <button onClick={() => setShowSettings(true)} className="relative z-20 p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-gray-200 bg-white dark:bg-gray-900 rounded-full shadow-md border border-gray-100 dark:border-gray-800 transition-all active:scale-90">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </button>
        </header>

        {state === AppState.CALENDAR ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <Calendar data={diaryData} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
            <button 
              onClick={startNewEntry} 
              className="relative overflow-hidden w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 transition-all active:scale-95 group"
            >
              <span className="relative z-10">+ Zapsat užití</span>
            </button>
            <DailyView entries={entriesForDay} date={selectedDate} onDelete={deleteEntry} />
            <CalmZone diaryData={diaryData} analysisMode={analysisMode} />
            <EmergencyHelp />
          </div>
        ) : state === AppState.RECORDING ? (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-4 mb-4">
              <button onClick={() => setState(AppState.CALENDAR)} className="p-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-full shadow-md dark:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <div>
                <h2 className="text-xl font-bold dark:text-white uppercase tracking-tighter">Nová analýza</h2>
                <p className="text-[10px] text-blue-600 dark:text-blue-400 font-black uppercase tracking-widest">{formattedSelectedDate}</p>
              </div>
            </div>

            {analysisMode === 'AI' && !aiDisclaimerAccepted ? (
              <div className="bg-white dark:bg-indigo-950/40 p-8 rounded-[2rem] border-2 border-indigo-100 dark:border-indigo-500/50 shadow-xl animate-in zoom-in-95 backdrop-blur-md">
                <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                  <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <h3 className="text-indigo-900 dark:text-indigo-200 font-black uppercase tracking-tighter text-xl mb-4 text-center">AI Průzkumník</h3>
                <p className="text-slate-600 dark:text-indigo-100/70 text-sm leading-relaxed mb-8 text-center">
                  UPOZORNĚNÍ: AI analýza využívá technologii Gemini a může být nepřesná. 
                  Výsledky slouží pouze pro orientační účely a nenahrazují oficiální zdroje.
                </p>
                <div className="space-y-3">
                  <button onClick={() => setAiDisclaimerAccepted(true)} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-indigo-600/30">Rozumím, pokračovat</button>
                  <button onClick={() => setAnalysisMode('VERIFIED')} className="w-full py-4 bg-slate-100 dark:bg-black/40 hover:bg-slate-200 dark:hover:bg-black/60 text-slate-500 dark:text-gray-400 rounded-2xl font-bold text-xs transition-all uppercase tracking-widest">Zrušit</button>
                </div>
              </div>
            ) : (
              <>
                {error && <div className="p-4 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-500/50 text-red-700 dark:text-red-200 rounded-2xl text-sm font-medium">{error}</div>}
                <SubstanceInput 
                  substances={substances}
                  onAdd={(s) => setSubstances(prev => [...prev, s])}
                  onRemove={(i) => setSubstances(prev => prev.filter((_, idx) => idx !== i))}
                  onAnalyze={handleAnalyzeClick}
                  isLoading={isAnalyzing}
                  mode={analysisMode}
                  onModeChange={(m) => {
                    setAnalysisMode(m);
                    if (m === 'AI') setAiDisclaimerAccepted(false);
                  }}
                />
              </>
            )}
          </div>
        ) : (
          <div className="animate-in zoom-in-95 duration-300">
             <div className="flex items-center gap-4 mb-6">
              <button onClick={() => setState(AppState.CALENDAR)} className="p-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-full shadow-md dark:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <h2 className="text-xl font-black dark:text-white tracking-tighter uppercase">
                {currentResult?.mode === 'AI' ? 'AI Analýza ✨' : 'Databázový nález ✅'}
              </h2>
            </div>
            {currentResult && <AnalysisResultView result={currentResult} onReset={() => setState(AppState.CALENDAR)} />}
          </div>
        )}

        {showDbError && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-3xl shadow-2xl p-8 border border-slate-100 dark:border-gray-800 text-center animate-in zoom-in-95">
              <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="text-xl font-black uppercase text-slate-900 dark:text-white mb-3">Oznámení</h3>
              <p className="text-slate-600 dark:text-gray-400 text-sm leading-relaxed mb-8">{dbErrorMessage}</p>
              <div className="space-y-3">
                <button onClick={() => { setShowDbError(false); setAnalysisMode('AI'); setAiDisclaimerAccepted(false); }} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-indigo-600/20 active:scale-95 transition-all">Přepnout na AI</button>
                <button onClick={() => setShowDbError(false)} className="w-full py-4 bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-gray-300 rounded-2xl font-bold text-xs uppercase tracking-widest active:scale-95 transition-all">Zavřít</button>
              </div>
            </div>
          </div>
        )}
        
        <CumulativeRiskModal 
          isOpen={cumulativeRiskModal.isOpen}
          newSubstances={cumulativeRiskModal.newSubstances}
          historicalSubstances={cumulativeRiskModal.historicalSubstances}
          riskDetails={cumulativeRiskModal.riskDetails}
          onProceed={() => {
            if (cumulativeRiskModal.pendingResult) {
              finishSavingEntry(cumulativeRiskModal.pendingResult, cumulativeRiskModal.newSubstances);
            }
            setCumulativeRiskModal(prev => ({ ...prev, isOpen: false }));
          }}
          onCancel={() => {
             setCumulativeRiskModal(prev => ({ ...prev, isOpen: false }));
          }}
        />

        <SettingsModal 
          isOpen={showSettings} 
          onClose={() => setShowSettings(false)}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          onFullReset={handleFullReset}
        />
        
        <MandalaModal 
          isOpen={showMandalaModal} 
          onClose={() => setShowMandalaModal(false)} 
          mode={analysisMode} 
        />
      </div>

      <footer className="mt-16 pb-8 text-center flex-shrink-0">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Anonymní lokální šifrovaná data</p>
        <div className="h-1 w-12 bg-slate-200 dark:bg-gray-800 mx-auto rounded-full mb-6" />
        <p className="text-xs text-slate-500 dark:text-slate-500 font-medium">
          Made by Mikulášek Ondřej <span className="mx-1">|</span> Data provided by TripSit.me
        </p>
      </footer>
    </div>
  );
};

export default App;
