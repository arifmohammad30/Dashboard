import React from 'react';

export default function FilterSection({ title, options, selected, onChange }) {
  if (!options || options.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <h4 className="text-xs font-extrabold text-stone-500 uppercase tracking-wider">{title}</h4>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <label 
            key={opt} 
            className={`flex items-center px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors duration-200 border ${selected.includes(opt)
              ? 'bg-orange-500/10 border-orange-400/30 text-orange-700 shadow-[inset_0_1px_3px_rgba(249,115,22,0.1)]'
              : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50 shadow-sm'
            }`}
          >
            <input
              type="checkbox"
              className="hidden"
              checked={selected.includes(opt)}
              onChange={() => onChange(opt)}
            />
            {opt || 'N/A'}
          </label>
        ))}
      </div>
    </div>
  );
}
