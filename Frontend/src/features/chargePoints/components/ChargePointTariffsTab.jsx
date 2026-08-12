import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowUpRight } from 'lucide-react';

export default function ChargePointTariffsTab({ cp }) {
  const navigate = useNavigate();

  const tariffId = cp?.tariffId || (typeof cp?.tariff === 'object' ? cp?.tariff?.id : null);
  const tariffName = cp?.tariff?.name || cp?.tariffProfiles || 'DLF Park Place DC';

  const handleClick = () => {
    if (tariffId) {
      navigate(`/tariffs?id=${encodeURIComponent(tariffId)}`);
    } else {
      navigate(`/tariffs?search=${encodeURIComponent(tariffName)}`);
    }
  };

  return (
    <div className="py-2 max-w-sm">
      <button
        type="button"
        onClick={handleClick}
        className="group w-full p-4 bg-slate-50/90 hover:bg-gradient-to-r hover:from-sky-50/90 hover:to-indigo-50/90 border border-stone-200/90 hover:border-sky-300 rounded-2xl shadow-2xs transition-all duration-200 cursor-pointer flex items-center justify-between gap-4 text-left active:scale-[0.99]"
        title="Click to view tariff in catalog"
      >
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-base font-extrabold text-slate-900 group-hover:text-sky-700 transition-colors tracking-tight truncate">
            {tariffName}
          </span>
          <span className="text-[11px] font-medium text-stone-500 group-hover:text-sky-600/80 transition-colors mt-0.5 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            Active tariff profile
          </span>
        </div>

        <div className="w-8 h-8 rounded-xl bg-white border border-stone-200/80 group-hover:border-sky-200 text-stone-400 group-hover:text-sky-600 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-all">
          <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </div>
      </button>
    </div>
  );
}
