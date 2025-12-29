
import React, { useState } from 'react';
import { AppState, AnalysisResult } from './types';
import { analyzeSubstances } from './services/geminiService';
import SubstanceInput from './components/SubstanceInput';
import AnalysisResultView from './components/AnalysisResultView';

const App: React.FC = () => {
  const [substances, setSubstances] = useState<string[]>([]);
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAddSubstance = (s: string) => {
    if (!substances.includes(s)) {
      setSubstances(prev => [...prev, s]);
    }
  };

  const handleRemoveSubstance = (idx: number) => {
    setSubstances(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAnalyze = async () => {
    if (substances.length === 0) return;
    
    setState(AppState.LOADING);
    setError(null);
    try {
      const data = await analyzeSubstances(substances);
      setResult(data);
      setState(AppState.RESULT);
    } catch (err: any) {
      console.error(err);
      setError('Nepodařilo se provést analýzu. Zkuste to prosím znovu za chvíli.');
      setState(AppState.ERROR);
    }
  };

  const handleReset = () => {
    setSubstances([]);
    setResult(null);
    setError(null);
    setState(AppState.IDLE);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <header className="text-center mb-12">
          <div className="inline-block p-4 bg-blue-600 rounded-2xl shadow-lg mb-4">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Harm Reduction Analyzer</h1>
          <p className="mt-3 text-lg text-gray-600 max-w-lg mx-auto leading-relaxed">
            Nástroj pro analýzu bezpečnosti kombinací psychoaktivních látek. 
            Snižujeme rizika pomocí objektivních dat.
          </p>
        </header>

        <main className="glass-effect p-8 rounded-3xl shadow-2xl border border-white">
          {state === AppState.IDLE || state === AppState.LOADING || state === AppState.ERROR ? (
            <>
              <div className="mb-8">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Postup</h3>
                <ol className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="bg-blue-100 text-blue-600 w-5 h-5 flex items-center justify-center rounded-full flex-shrink-0 font-bold">1</span>
                    Přidejte všechny látky, které plánujete užít.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-blue-100 text-blue-600 w-5 h-5 flex items-center justify-center rounded-full flex-shrink-0 font-bold">2</span>
                    Klikněte na tlačítko analýzy.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-blue-100 text-blue-600 w-5 h-5 flex items-center justify-center rounded-full flex-shrink-0 font-bold">3</span>
                    Důkladně prostudujte rizika a varování.
                  </li>
                </ol>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-3">
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}

              <SubstanceInput
                substances={substances}
                onAdd={handleAddSubstance}
                onRemove={handleRemoveSubstance}
                onAnalyze={handleAnalyze}
                isLoading={state === AppState.LOADING}
              />
            </>
          ) : (
            result && <AnalysisResultView result={result} onReset={handleReset} />
          )}
        </main>

        <footer className="mt-12 text-center text-gray-400 text-sm max-w-md mx-auto">
          <p className="mb-2 italic font-medium">„Know your substance, know your body, know your dose, know your source.“</p>
          <p>© {new Date().getFullYear()} Harm Reduction AI. Používejte s rozumem. Data jsou pouze informativní.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
