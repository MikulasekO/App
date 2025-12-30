
import React from 'react';
import { DiaryData } from '../types';

interface Props {
  data: DiaryData;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

const Calendar: React.FC<Props> = ({ data, selectedDate, onSelectDate }) => {
  const now = new Date();
  const month = selectedDate.getMonth();
  const year = selectedDate.getFullYear();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  // Adjust for European week (starts on Monday)
  const offset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const monthNames = [
    "Leden", "Únor", "Březen", "Duben", "Květen", "Červen",
    "Červenec", "Srpen", "Září", "Říjen", "Listopad", "Prosinec"
  ];

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: offset }, (_, i) => i);

  const isToday = (day: number) => {
    return now.getDate() === day && now.getMonth() === month && now.getFullYear() === year;
  };

  const isSelected = (day: number) => {
    return selectedDate.getDate() === day;
  };

  const hasEntries = (day: number) => {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return data[dateKey] && data[dateKey].length > 0;
  };

  const changeMonth = (delta: number) => {
    const newDate = new Date(year, month + delta, 1);
    onSelectDate(newDate);
  };

  return (
    <div className="bg-white dark:bg-gray-900 text-slate-900 dark:text-white rounded-3xl p-6 shadow-md border border-slate-100 dark:border-gray-800">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{monthNames[month]} {year}</h2>
        <div className="flex gap-2">
          <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-full transition-colors text-slate-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-full transition-colors text-slate-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'].map(d => (
          <div key={d} className="text-center text-[10px] uppercase font-bold text-slate-400 dark:text-gray-500 py-2">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {emptyDays.map(i => <div key={`empty-${i}`} className="aspect-square" />)}
        {days.map(day => (
          <button
            key={day}
            onClick={() => onSelectDate(new Date(year, month, day))}
            className={`relative aspect-square rounded-xl flex items-center justify-center text-sm font-medium transition-all
              ${isSelected(day) ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-700 dark:text-slate-300'}
              ${isToday(day) && !isSelected(day) ? 'border border-blue-500 text-blue-600 dark:text-blue-400 font-bold' : ''}
            `}
          >
            {day}
            {hasEntries(day) && (
              <span className={`absolute bottom-1 w-1 h-1 rounded-full ${isSelected(day) ? 'bg-white' : 'bg-blue-600 dark:bg-blue-400'}`} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Calendar;
