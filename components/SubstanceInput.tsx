
import React, { useState } from 'react';

interface Props {
  substances: string[];
  onAdd: (substance: string) => void;
  onRemove: (index: number) => void;
  onAnalyze: () => void;
  isLoading: boolean;
}

const SubstanceInput: React.FC<Props> = ({ substances, onAdd, onRemove, onAnalyze, isLoading }) => {
  const [current, setCurrent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (current.trim()) {
      onAdd(current.trim());
      setCurrent('');
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          placeholder="Zadejte název látky (např. LSD, MDMA, Alkohol...)"
          className="flex-1 p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all shadow-sm"
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-md"
        >
          Přidat
        </button>
      </form>

      <div className="flex flex-wrap gap-2 min-h-[40px]">
        {substances.map((s, idx) => (
          <span
            key={idx}
            className="inline-flex items-center bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full border border-blue-200 text-sm font-medium animate-in fade-in slide-in-from-bottom-1"
          >
            {s}
            <button
              onClick={() => onRemove(idx)}
              className="ml-2 hover:text-red-500 font-bold"
            >
              &times;
            </button>
          </span>
        ))}
        {substances.length === 0 && (
          <p className="text-gray-400 text-sm italic py-2">Zatím nebyly přidány žádné látky.</p>
        )}
      </div>

      <button
        onClick={onAnalyze}
        disabled={substances.length < 1 || isLoading}
        className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg ${
          substances.length < 1 || isLoading
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-indigo-600 hover:bg-indigo-700 text-white transform hover:-translate-y-1'
        }`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-3">
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Analyzuji rizika...
          </div>
        ) : (
          'Spustit analýzu interakcí'
        )}
      </button>
    </div>
  );
};

export default SubstanceInput;
