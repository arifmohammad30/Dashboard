import React from 'react';
import { to12Hour, to24Hour } from '../utils/timeUtils';

const HOURS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

/**
 * 12-Hour Time Picker Component (HH : MM AM/PM)
 * Renders hour and minute dropdown selects with an AM/PM toggle button.
 * Automatically converts and emits standard 24-hour time strings ("HH:mm") upstream.
 */
export default function TimePicker12h({ value, onChange, disabled, id, name }) {
  const val12 = to12Hour(value);
  const match = val12.match(/^(\d{2}):(\d{2})\s*(AM|PM)$/);
  const hh = match ? match[1] : '12';
  const mm = match ? match[2] : '00';
  const period = match ? match[3] : 'AM';

  const updateTime = (newHh, newMm, newPeriod) => {
    const time12Str = `${newHh}:${newMm} ${newPeriod}`;
    const time24Str = to24Hour(time12Str);
    onChange(time24Str);
  };

  const hourId = id ? `${id}-hour` : (name ? `${name}-hour` : 'time-hour');
  const minuteId = id ? `${id}-minute` : (name ? `${name}-minute` : 'time-minute');

  return (
    <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-xl px-2 py-1.5 shadow-2xs focus-within:border-slate-800 transition-colors">
      <select
        id={hourId}
        name={name ? `${name}_hour` : 'hour'}
        autoComplete="off"
        aria-label="Hour"
        disabled={disabled}
        value={hh}
        onChange={(e) => updateTime(e.target.value, mm, period)}
        className="bg-transparent text-xs font-bold text-stone-900 focus:outline-none cursor-pointer"
      >
        {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
      </select>
      <span className="text-stone-400 font-bold text-xs">:</span>
      <select
        id={minuteId}
        name={name ? `${name}_minute` : 'minute'}
        autoComplete="off"
        aria-label="Minute"
        disabled={disabled}
        value={mm}
        onChange={(e) => updateTime(hh, e.target.value, period)}
        className="bg-transparent text-xs font-bold text-stone-900 focus:outline-none cursor-pointer"
      >
        {MINUTES.map(m => <option key={m} value={m}>{m}</option>)}
      </select>
      <button
        type="button"
        disabled={disabled}
        onClick={() => updateTime(hh, mm, period === 'AM' ? 'PM' : 'AM')}
        className={`ml-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold transition-all cursor-pointer border select-none ${period === 'PM'
            ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
            : 'bg-sky-500 text-white border-sky-600 shadow-2xs'
          }`}
      >
        {period}
      </button>
    </div>
  );
}
