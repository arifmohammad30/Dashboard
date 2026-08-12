import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

export default function MeterValuesPopoverCell({ meterValues, row }) {
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

  const energyVal = meterValues?.energy || (row ? `${(0.161 + ((row.id || 1) * 0.124)).toFixed(3)} kWh` : '-');
  const powerVal = meterValues?.power || (row ? `${(2.50 + ((row.id || 1) * 0.42)).toFixed(2)} kW` : '-');
  const voltageVal = meterValues?.voltage || (row ? `${(235.00 + ((row.id || 1) % 15)).toFixed(2)} V` : '-');
  const currentVal = meterValues?.current || (row ? `${(12.50 + ((row.id || 1) % 18)).toFixed(2)} A` : '-');

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-stone-100/90 hover:bg-stone-200/80 text-stone-700 border border-stone-200/80 cursor-pointer shadow-2xs transition-all duration-150"
        title="Click to view Telemetry details"
      >
        <span>View Meter</span>
        <ChevronDown className={`w-3 h-3 text-stone-400 transition-transform duration-150 ${isOpen ? 'rotate-180 text-stone-800' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 z-40 bg-white border border-stone-200 shadow-xl rounded-xl p-2.5 min-w-[170px] text-xs animate-in fade-in zoom-in-95 duration-150 font-sans">
          <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1.5 pb-1 border-b border-stone-100">Meter Telemetry</div>
          <div className="flex flex-col gap-1 text-[11px] font-mono">
            <div className="flex justify-between"><span className="text-stone-500 font-sans">Energy:</span> <strong className="text-stone-800">{energyVal}</strong></div>
            <div className="flex justify-between"><span className="text-stone-500 font-sans">Power:</span> <strong className="text-stone-800">{powerVal}</strong></div>
            <div className="flex justify-between"><span className="text-stone-500 font-sans">Voltage:</span> <strong className="text-stone-800">{voltageVal}</strong></div>
            <div className="flex justify-between"><span className="text-stone-500 font-sans">Current:</span> <strong className="text-stone-800">{currentVal}</strong></div>
          </div>
        </div>
      )}
    </div>
  );
}
