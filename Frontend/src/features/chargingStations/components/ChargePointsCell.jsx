import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight } from 'lucide-react';

export const ChargePointsCell = ({ station, navigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cpList = station.chargePointsList || [];
  const totalCount = cpList.length;

  if (totalCount === 0) {
    return (
      <span className="text-stone-400 font-normal text-[11px] italic">
        No charge points linked
      </span>
    );
  }

  const primaryCp = cpList[0];

  return (
    <div className="relative inline-block text-left" ref={popoverRef}>
      <div className="flex flex-col min-w-0">
        <span
          onClick={(e) => {
            e.stopPropagation();
            if (primaryCp?.id) {
              navigate(`/charge-points/${primaryCp.id}`);
            } else if (primaryCp?.name) {
              navigate(`/charge-points?search=${encodeURIComponent(primaryCp.name)}`);
            }
          }}
          className="text-stone-900 font-semibold text-[12px] hover:text-cyan-600 transition-colors cursor-pointer truncate max-w-[170px]"
          title={primaryCp?.name ? `Go to ${primaryCp.name}` : ''}
        >
          {primaryCp?.name}
        </span>

        {totalCount > 1 ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            className="text-[11px] font-normal text-stone-500 hover:text-cyan-600 transition-colors flex items-center gap-0.5 cursor-pointer w-fit mt-0.5"
          >
            <span>{totalCount} linked charge points</span>
            <ChevronRight className={`w-3 h-3 transition-transform duration-150 ${isOpen ? 'rotate-90 text-cyan-600' : 'text-stone-400'}`} />
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (primaryCp?.id) {
                navigate(`/charge-points/${primaryCp.id}`);
              } else if (primaryCp?.name) {
                navigate(`/charge-points?search=${encodeURIComponent(primaryCp.name)}`);
              }
            }}
            className="text-[11px] font-normal text-stone-400 hover:text-cyan-600 transition-colors flex items-center gap-0.5 cursor-pointer w-fit mt-0.5"
          >
            <span>1 linked charge point</span>
            <ChevronRight className="w-3 h-3 text-stone-400" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 z-30 w-64 bg-white/98 backdrop-blur-xl border border-stone-200/90 shadow-[0_12px_32px_rgba(0,0,0,0.12)] rounded-2xl p-3 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2 mb-2 px-1">
            <div>
              <span className="text-[11px] font-semibold text-stone-800 uppercase tracking-wider block">
                Linked Charge Points
              </span>
              <span className="text-[10px] text-stone-400 font-normal">
                {station.name} ({totalCount})
              </span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-stone-400 hover:text-stone-700 text-xs font-medium cursor-pointer">✕</button>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1 custom-scrollbar pr-0.5">
            {cpList.map((cp, i) => (
              <div
                key={cp.id || i}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  if (cp.id) {
                    navigate(`/charge-points/${cp.id}`);
                  } else {
                    navigate(`/charge-points?search=${encodeURIComponent(cp.name)}`);
                  }
                }}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-stone-50/80 hover:bg-cyan-50/80 border border-stone-100/80 hover:border-cyan-200 transition-colors cursor-pointer group/item text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 shrink-0"></span>
                  <span className="font-semibold text-stone-800 group-hover/item:text-cyan-700 truncate text-[11px]">
                    {cp.name}
                  </span>
                </div>
                <span className="text-[9.5px] font-mono font-medium text-stone-400 group-hover/item:text-cyan-600 shrink-0 ml-1.5">
                  {cp.code || '-'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChargePointsCell;
