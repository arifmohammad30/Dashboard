import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Battery } from 'lucide-react';

export default function SocPopoverCell({ initialSoc, currentSoc }) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const formatSoc = (val, fallback) => {
    if (val === undefined || val === null || val === '') return fallback;
    if (typeof val === 'number') return `${val.toFixed(1)}%`;
    const str = String(val).trim();
    return str.endsWith('%') ? str : `${str}%`;
  };

  const initialDisplay = formatSoc(initialSoc, '20.0%');
  const currentDisplay = formatSoc(currentSoc, '20.0%');

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50/90 hover:bg-emerald-100/90 text-emerald-800 border border-emerald-200/80 cursor-pointer shadow-2xs transition-all duration-150"
        title="Click to view State of Charge details"
      >
        <Battery className="w-3 h-3 text-emerald-600 shrink-0" />
        <span className="font-mono font-bold text-emerald-900">{currentDisplay}</span>
        <ChevronDown className={`w-3 h-3 text-emerald-500 transition-transform duration-150 ${isOpen ? 'rotate-180 text-emerald-800' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 z-40 bg-white border border-stone-200 shadow-xl rounded-xl p-2.5 min-w-[165px] text-xs animate-in fade-in zoom-in-95 duration-150 font-sans">
          <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1.5 pb-1 border-b border-stone-100">State of Charge</div>
          <div className="flex flex-col gap-1.5 text-[11px]">
            <div className="flex justify-between"><span className="text-stone-500">Initial SoC:</span> <strong className="font-mono text-stone-800">{initialDisplay}</strong></div>
            <div className="flex justify-between"><span className="text-stone-500">Current SoC:</span> <strong className="font-mono text-emerald-700">{currentDisplay}</strong></div>
          </div>
        </div>
      )}
    </div>
  );
}
