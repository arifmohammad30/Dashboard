import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowUpRight, Tag, Settings2, Check, Loader2, X } from 'lucide-react';
import { useChargePointTariff } from '../hooks/useChargePointTariff';

export default function ChargePointTariffsTab({ cp, onUpdate }) {
  const navigate = useNavigate();
  const {
    activeTariff,
    activeTariffId,
    activeTariffName,
    tariffsCatalog,
    loadingTariffs,
    isAssigning,
    isModalOpen,
    setIsModalOpen,
    handleAssignTariff
  } = useChargePointTariff(cp, onUpdate);

  const handleNavigateCatalog = () => {
    if (activeTariffId) {
      navigate(`/tariffs?id=${encodeURIComponent(activeTariffId)}`);
    } else {
      navigate(`/tariffs?search=${encodeURIComponent(activeTariffName)}`);
    }
  };

  return (
    <div className="py-2 max-w-xl flex flex-col gap-4">
      <div className="bg-white border border-stone-200/90 shadow-2xs rounded-2xl p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">Assigned Tariff Profile</span>
              <h3 className="text-lg font-extrabold text-slate-900 tracking-tight mt-0.5">{activeTariffName}</h3>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-1.5 bg-stone-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Change Tariff</span>
          </button>
        </div>

        {activeTariff && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-stone-100 text-xs">
            <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-150">
              <span className="text-[11px] font-semibold text-stone-500 block">Base Rate</span>
              <span className="font-extrabold text-slate-900 text-sm mt-0.5 block">₹{activeTariff.baseRate || 15}/kWh</span>
            </div>
            <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-150">
              <span className="text-[11px] font-semibold text-stone-500 block">GST Tax</span>
              <span className="font-extrabold text-slate-900 text-sm mt-0.5 block">{activeTariff.gstPercentage || 18}%</span>
            </div>
            <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-150 col-span-2 sm:col-span-1">
              <span className="text-[11px] font-semibold text-stone-500 block">Tariff Code</span>
              <span className="font-mono font-bold text-slate-900 text-xs mt-1 block truncate">{activeTariff.code || '-'}</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] font-medium text-stone-500 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            Active billing tariff profile bound to this charge point.
          </span>

          <button
            type="button"
            onClick={handleNavigateCatalog}
            className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>Catalog Details</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Change Tariff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-md w-full p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Tag className="w-4 h-4 text-violet-600" />
                Assign Tariff Profile
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 cursor-pointer p-1 rounded-lg hover:bg-stone-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {loadingTariffs ? (
              <div className="py-8 flex items-center justify-center text-stone-400 text-xs gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
                <span>Loading available tariffs catalog...</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto scrollbar-thin pr-1">
                {tariffsCatalog.map(t => {
                  const isSelected = String(t.id) === String(activeTariffId);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      disabled={isAssigning}
                      onClick={() => handleAssignTariff(t.id)}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${isSelected
                        ? 'bg-violet-50/80 border-violet-300 text-violet-950 font-bold'
                        : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-800'
                        }`}
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="font-extrabold text-xs tracking-tight truncate">{t.name}</span>
                        <span className="text-[11px] text-stone-500 font-medium mt-0.5">₹{t.baseRate || 15}/kWh • GST {t.gstPercentage || 18}%</span>
                      </div>

                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
