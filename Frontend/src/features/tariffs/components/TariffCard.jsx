import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Tag, IndianRupee, Percent, ShieldCheck, FileText, ExternalLink, Zap, Clock, Info } from 'lucide-react';

export default function TariffCard({ tariff, fallbackProfile = 'Standard Rate', associatedUnitName = '' }) {
  const navigate = useNavigate();

  const tariffName = tariff?.name || fallbackProfile || 'DLF Park Place DC';
  const tariffCode = tariff?.code || 'TAR-1042';
  const tariffType = tariff?.type || 'Default';
  const baseRate = tariff?.baseRate !== undefined ? tariff.baseRate : (tariff?.rate || 15.0);
  const gstRate = tariff?.gstPercentage || tariff?.rawGstPercentage || '18%';
  const description = tariff?.description || 'Standard EV charging tariff structure applicable for public fast hubs.';

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      {/* Top Banner Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-stone-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10 pointer-events-none">
          <Tag className="w-64 h-64 text-white" />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 uppercase tracking-wider">
                {tariffType} Tariff
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-white/10 text-stone-300 border border-white/10">
                {tariffCode}
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">{tariffName}</h2>
            {associatedUnitName && (
              <p className="text-xs text-stone-400 mt-1 flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Assigned & active for <strong>{associatedUnitName}</strong></span>
              </p>
            )}
          </div>

          <button
            onClick={() => navigate(`/tariffs?search=${encodeURIComponent(tariffName)}`)}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition-all cursor-pointer shadow-2xs shrink-0 self-start sm:self-auto"
          >
            <span>View Catalog Record</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200/80 flex items-center justify-center text-orange-600 shrink-0">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">Base Rate</span>
            <span className="text-base font-extrabold text-stone-900">₹{Number(baseRate).toFixed(2)} / kWh</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-600 shrink-0">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">GST Tax Rate</span>
            <span className="text-base font-extrabold text-stone-900">{String(gstRate).includes('%') ? gstRate : `${gstRate}%`}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">Costing Type</span>
            <span className="text-base font-extrabold text-stone-900">Charging Only</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200/80 flex items-center justify-center text-purple-600 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">Applicability</span>
            <span className="text-base font-extrabold text-stone-900">All Fleets</span>
          </div>
        </div>
      </div>

      {/* Detailed Fee Structure Table */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden">
        <div className="px-5 py-4 bg-[#F8FAFC] border-b border-stone-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-stone-500" />
            <h3 className="font-extrabold text-xs text-stone-900 uppercase tracking-wider">Fee Structure & Breakdown</h3>
          </div>
          <span className="text-xs font-semibold text-stone-500">ID: {tariff?.id || 'TAR-ASSIGNED'}</span>
        </div>

        <div className="divide-y divide-stone-200/70 text-xs">
          <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="font-bold text-stone-600">Energy Charge (Per kWh)</span>
            <span className="font-extrabold text-stone-900 font-mono">₹{Number(baseRate).toFixed(2)}</span>
          </div>

          <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="font-bold text-stone-600">Idle Fee</span>
            <span className="font-extrabold text-stone-900 font-mono">₹0.00 / min</span>
          </div>

          <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="font-bold text-stone-600">Parking Fee</span>
            <span className="font-extrabold text-stone-900 font-mono">NA</span>
          </div>

          <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="font-bold text-stone-600">Applicable Tax (GST)</span>
            <span className="font-extrabold text-stone-900 font-mono">{String(gstRate).includes('%') ? gstRate : `${gstRate}%`}</span>
          </div>

          <div className="p-4 flex flex-col gap-1.5 bg-stone-50/50">
            <span className="font-bold text-stone-600 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-stone-400" />
              Description & Notes
            </span>
            <p className="text-stone-600 leading-relaxed text-xs pl-5">{description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
