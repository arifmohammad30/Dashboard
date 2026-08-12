import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  ChevronDown,
  Hash,
  Layers,
  Plug,
  CheckCircle2,
  Zap,
  Battery,
  Activity,
  IndianRupee,
  FileText,
  Clock,
  AlertCircle,
  Tag,
  User as UserIcon,
  CreditCard,
  Cpu,
  Shield
} from 'lucide-react';
import SocPopoverCell from '../../../components/ui/SocPopoverCell';
import MeterValuesPopoverCell from '../../../components/ui/MeterValuesPopoverCell';

export default function StationTransactionsTab({ transactions }) {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState('Last 30 Days');
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const dateOptions = ['Today', 'Last 7 Days', 'Last 30 Days', 'Last 90 Days', 'All Time'];

  return (
    <div className="bg-[#F6F8FB] border border-stone-200/90 shadow-2xs rounded-2xl overflow-hidden flex flex-col min-h-[450px]">
      <div className="px-5 py-3 flex items-center justify-end gap-3 bg-white border-b border-stone-200/80">
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
              className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 font-bold rounded-xl shadow-2xs transition-colors duration-200 text-xs cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-orange-500" />
              <span>{dateRange}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-200 ${isDateDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDateDropdownOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setIsDateDropdownOpen(false)}></div>
                <div className="absolute right-0 mt-1.5 w-44 bg-white border border-stone-200 shadow-xl rounded-xl py-1 z-30 animate-in fade-in zoom-in-95 duration-150">
                  {dateOptions.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        setDateRange(opt);
                        setIsDateDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs font-semibold flex items-center justify-between cursor-pointer ${dateRange === opt ? 'bg-orange-50 text-orange-600 font-bold' : 'text-stone-700 hover:bg-stone-50'
                        }`}
                    >
                      <span>{opt}</span>
                      {dateRange === opt && <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto flex-1 custom-scrollbar transform-gpu translate-z-0">
        <table className="w-full text-left text-xs border-collapse min-w-[2200px]">
          <thead className="bg-[#F8FAFC] border-b border-stone-200">
            <tr className="bg-[#F8FAFC]">
              <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                <div className="flex items-center gap-1.5"><Hash className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Txn Id</div>
              </th>
              <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                <div className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Charge Point</div>
              </th>
              <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                <div className="flex items-center gap-1.5"><Plug className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Connector (Connector Id)</div>
              </th>
              <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Status</div>
              </th>
              <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                <div className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Energy Delivered</div>
              </th>
              <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                <div className="flex items-center gap-1.5"><Battery className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> SoC</div>
              </th>
              <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                <div className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Meter Values</div>
              </th>
              <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                <div className="flex items-center gap-1.5"><IndianRupee className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Billed amount</div>
              </th>
              <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                <div className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Associated Bill</div>
              </th>
              <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Charging Duration</div>
              </th>
              <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                <div className="flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Stop reason by charger</div>
              </th>
              <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                <div className="flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Stop reason by system</div>
              </th>
              <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                <div className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Tariff Plan</div>
              </th>
              <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                <div className="flex items-center gap-1.5"><UserIcon className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Tagged EV User</div>
              </th>
              <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                <div className="flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Payment Gateway</div>
              </th>
              <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Start Time</div>
              </th>
              <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Stop Time</div>
              </th>
              <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                <div className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> OCPP Protocol</div>
              </th>
              <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                <div className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Auth Method</div>
              </th>
              <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                <div className="flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Payment Mode</div>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-stone-200/70 bg-white text-xs font-medium">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan="20" className="px-5 py-16 text-center text-stone-500 font-bold text-xs">
                  No charging transactions recorded for this station.
                </td>
              </tr>
            ) : (
              transactions.map((tx, idx) => (
                <tr
                  key={tx.txnId + idx}
                  className="hover:bg-[#F8FAFF] transition-colors duration-150 text-xs"
                >
                  <td className="px-4 py-3 font-mono font-bold text-sky-600 whitespace-nowrap">
                    {tx.txnId}
                  </td>
                  <td
                    onClick={() => {
                      const cp = tx.chargePointObj || { id: 'cp-101', name: 'Charge Point 1' };
                      navigate(`/charge-points/${cp.id}`, { state: { chargePoint: cp } });
                    }}
                    className="px-4 py-3 font-bold text-sky-600 hover:text-sky-800 transition-colors cursor-pointer whitespace-nowrap"
                    title="Click to view Charge Point"
                  >
                    {tx.chargePointObj?.name || tx.chargePointObj?.code || 'Charge Point'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold bg-stone-100 border border-stone-200/70 text-stone-700">
                      {typeof tx.connector === 'object' ? (tx.connector?.type || tx.connector?.name || tx.connector?.id || 'Connector') : (tx.connector || '-')}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {(() => {
                      const cpStatus = tx.chargePointObj?.status || tx.status || 'Available';
                      if (cpStatus === 'Available' || cpStatus === 'Completed') {
                        return (
                          <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-xs font-medium bg-emerald-50/90 text-emerald-800 border border-emerald-200/60 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                            {cpStatus}
                          </span>
                        );
                      }
                      if (cpStatus === 'Charging' || cpStatus === 'Active') {
                        return (
                          <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-xs font-medium bg-blue-50/90 text-blue-700 border border-blue-200/60 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 animate-pulse"></span>
                            {cpStatus}
                          </span>
                        );
                      }
                      if (cpStatus === 'Faulted' || cpStatus === 'Failed') {
                        return (
                          <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-xs font-medium bg-red-50/90 text-red-700 border border-red-200/60 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
                            Faulted
                          </span>
                        );
                      }
                      return (
                        <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-xs font-medium bg-stone-100 text-stone-600 border border-stone-200/80 shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-stone-400 shrink-0"></span>
                          {cpStatus}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-800 font-mono whitespace-nowrap">
                    {tx.energyDelivered}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <SocPopoverCell initialSoc={tx.initialSoc} currentSoc={tx.currentSoc} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <MeterValuesPopoverCell meterValues={tx.meterValues} />
                  </td>
                  <td className="px-4 py-3 font-extrabold text-slate-900 whitespace-nowrap">
                    {tx.billedAmount}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-sky-600 hover:text-sky-800 transition-colors cursor-pointer whitespace-nowrap">
                    {tx.associatedBill}
                  </td>
                  <td className="px-4 py-3 font-mono text-stone-700 font-medium whitespace-nowrap">
                    {tx.duration}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-stone-100/90 border border-stone-200/80 text-stone-600">
                      {tx.stopReason}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-stone-700 whitespace-nowrap">
                    {tx.meterStart}
                  </td>
                  <td className="px-4 py-3 text-stone-600 font-medium whitespace-nowrap">
                    {tx.startedAt}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200/70">
                      <span className="w-4 h-4 rounded-full bg-purple-600 text-white font-bold text-[9px] flex items-center justify-center">8</span>
                      <span>{tx.startedBy}</span>
                      <span className="text-sky-600 font-bold text-[10px] ml-1">SEE ID TAG</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-stone-700 whitespace-nowrap">
                    {tx.meterStop}
                  </td>
                  <td className="px-4 py-3 text-stone-600 font-medium whitespace-nowrap">
                    {tx.stoppedAt}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200/70">
                      <span className="w-4 h-4 rounded-full bg-purple-600 text-white font-bold text-[9px] flex items-center justify-center">8</span>
                      <span>{tx.stoppedBy}</span>
                      <span className="text-sky-600 font-bold text-[10px] ml-1">SEE ID TAG</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-stone-700 font-medium whitespace-nowrap">
                    {tx.tariffs}
                  </td>
                  <td className="px-4 py-3 text-stone-600 font-medium whitespace-nowrap">
                    {tx.createdOn}
                  </td>
                  <td className="px-4 py-3 rounded-r-xl whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-stone-100 text-stone-600 border border-stone-200/70">
                      {tx.ubc}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
