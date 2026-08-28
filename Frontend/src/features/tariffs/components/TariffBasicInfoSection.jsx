import React from 'react';
import { Layers } from 'lucide-react';
import Select from '../../../components/ui/Select';

export default function TariffBasicInfoSection({
  tariffName,
  setTariffName,
  status,
  setStatus,
  isViewMode
}) {
  return (
    <div className="bg-white border border-stone-200/90 rounded-2xl p-6 shadow-2xs hover:border-stone-300 transition-all">
      <div className="pb-4 mb-5 border-b border-stone-200/80 flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-700 stroke-[2.5]" /> Basic Information
          </h2>
          <p className="text-xs text-stone-500 font-medium mt-0.5">Define the tariff title, status, and baseline properties.</p>
        </div>
        <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-stone-100 text-stone-700 border border-stone-200">
          GENERAL
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="text-xs font-bold text-stone-700 mb-1.5 block">
            Tariff Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            disabled={isViewMode}
            value={tariffName}
            onChange={(e) => setTariffName(e.target.value)}
            placeholder="Enter tariff name (e.g. Public Charging Tariff)"
            className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 text-stone-900 rounded-xl text-xs font-medium focus:bg-white focus:border-slate-800 focus:outline-none transition-all shadow-2xs"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-stone-700 mb-1.5 block">
            Status <span className="text-rose-500">*</span>
          </label>
          <Select
            disabled={isViewMode}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={['Active', 'Draft', 'Inactive']}
            placeholder="Select Status"
            buttonClassName="py-2.5 px-3.5 text-xs bg-stone-50 border-stone-200"
          />
        </div>
      </div>
    </div>
  );
}
