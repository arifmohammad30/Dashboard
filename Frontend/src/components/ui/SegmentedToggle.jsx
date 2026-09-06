import React from 'react';


export default function SegmentedToggle({
  options = [],
  value,
  onChange,
  disabled = false,
  fullWidth = false,
  className = '',
  buttonClassName = ''
}) {
  return (
    <div className={`inline-flex items-center p-1 bg-slate-50 rounded-xl border border-slate-200/80 gap-1 ${fullWidth ? 'w-full' : 'w-fit'} ${className}`}>
      {options.map((option) => {
        const optionValue = typeof option === 'object' ? option.value : option;
        const optionLabel = typeof option === 'object' ? option.label : option;
        const isSelected = value === optionValue;

        return (
          <button
            key={String(optionValue)}
            type="button"
            disabled={disabled}
            onClick={() => onChange && onChange(optionValue)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed ${fullWidth ? 'flex-1' : 'shrink-0'
              } ${isSelected
                ? 'bg-[#0f181f] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 bg-transparent font-normal hover:bg-slate-100/60'
              } ${buttonClassName}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors duration-150 ${isSelected ? 'bg-[#1EB8D4]' : 'bg-slate-300'
                }`}
            />
            <span className="whitespace-nowrap">{optionLabel}</span>
          </button>
        );
      })}
    </div>
  );
}
