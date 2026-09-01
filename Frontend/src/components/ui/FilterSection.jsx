import React from 'react';

export default function FilterSection({ title, options = [], selected = [], selectedValue, onChange }) {
  if (!options || !Array.isArray(options) || options.length === 0) return null;

  // Normalize selected values to string array
  const activeSelected = selectedValue !== undefined ? selectedValue : selected;
  const selectedArr = Array.isArray(activeSelected)
    ? activeSelected.map(v => typeof v === 'object' && v !== null ? String(v.value ?? v.id ?? '') : String(v))
    : (activeSelected !== null && activeSelected !== undefined && activeSelected !== '' 
        ? [typeof activeSelected === 'object' ? String(activeSelected.value ?? activeSelected.id ?? '') : String(activeSelected)] 
        : []);

  return (
    <div className="flex flex-col gap-3">
      {title && <h4 className="text-xs font-extrabold text-stone-500 uppercase tracking-wider">{title}</h4>}
      <div className="flex flex-wrap gap-2">
        {options.map((opt, idx) => {
          const isObject = typeof opt === 'object' && opt !== null;
          const optValue = isObject ? (opt.value ?? opt.id ?? '') : opt;
          const optLabel = isObject ? (opt.label ?? opt.name ?? String(optValue)) : String(opt);
          const optKey = isObject ? String(opt.value ?? opt.id ?? idx) : String(opt);

          const isSelected = selectedArr.includes(String(optValue));

          return (
            <label 
              key={optKey} 
              className={`flex items-center px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors duration-200 border ${isSelected
                ? 'bg-[#4DA944]/8 border-[#4DA944]/35 text-[#2d7a26] shadow-2xs'
                : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50 shadow-sm'
              }`}
            >
              <input
                type="checkbox"
                className="hidden"
                checked={isSelected}
                onChange={() => onChange && onChange(optValue)}
              />
              {optLabel || 'N/A'}
            </label>
          );
        })}
      </div>
    </div>
  );
}
