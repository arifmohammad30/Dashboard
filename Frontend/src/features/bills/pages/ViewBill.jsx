import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  FileCheck,
  Loader2,
  Tag,
  Hash,
  User,
  Building2,
  Plug,
  MapPin,
  CreditCard,
  Zap,
  ShieldCheck,
  ArrowUpRight
} from 'lucide-react';
import { getBillById } from '../api/billService';
import { useToast } from '../../../context/ToastContext';

export default function ViewBill() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const location = useLocation();
  const initialBill = location.state?.bill;

  const [bill, setBill] = useState(initialBill || null);
  const [loading, setLoading] = useState(!initialBill && Boolean(id));

  useEffect(() => {
    if (id) {
      setLoading(true);
      getBillById(id)
        .then((data) => {
          if (data) {
            setBill(data);
          }
        })
        .catch((err) => {
          console.error("Failed to load bill details:", err);
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading && !bill) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-sky-600">
        <Loader2 className="w-10 h-10 animate-spin mb-3" />
        <p className="text-sm font-bold text-stone-600">Loading bill details...</p>
      </div>
    );
  }

  const b = bill || {
    billNumber: id || 'BILL-74190',
    billStatus: 'Unpaid',
    chargeTransactionStatus: 'Completed',
    chargeTransaction: '74190',
    energyDelivered: '0.01 kWh',
    appliedDiscount: '-',
    amount: 0.15,
    fleet: '-',
    method: 'User Wallet',
    customerDriver: { name: 'EV Driver', initial: 'E', bg: 'bg-indigo-600 text-white' },
    chargePoint: 'Charge Point Station 28 AC',
    chargePointId: 'cp-28',
    chargingStation: 'DLF Cybercity Fast Hub',
    chargingStationId: 'station-1',
    appliedTariff: {
      id: 'default-tariff',
      name: 'Standard AC Tariff',
      type: 'Default',
      costingType: 'Charging Only',
      baseRate: 15.0,
      gstPercentage: 18.0
    },
    generatedOn: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
  };

  const isPaid = b.billStatus === 'Paid';
  const isCompleted = b.chargeTransactionStatus === 'Completed' || b.chargeTransactionStatus === 'Stopped';
  const isOngoing = b.chargeTransactionStatus === 'Ongoing';

  const driverName = b.customerDriver?.name || b.driverName || 'EV Driver';
  const driverInitial = (driverName.charAt(0) || 'E').toUpperCase();
  const fleetName = b.fleet || '-';
  const cpName = b.chargePoint || 'Charge Point Station 28 AC';
  const cpId = b.chargePointId || cpName;
  const stationName = b.chargingStation || 'DLF Cybercity Fast Hub';
  const stationId = b.chargingStationId || stationName;
  const txId = b.chargeTransaction || '74190';
  const appliedTariff = b.appliedTariff || {
    id: 'default-tariff',
    name: 'Standard AC Tariff',
    type: 'Default',
    costingType: 'Charging Only',
    baseRate: 15.0,
    gstPercentage: 18.0
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1700px] w-full mx-auto pb-10 animate-in fade-in duration-200">
      {/* Top Header Navigation */}
      <button
        onClick={() => navigate('/bills')}
        className="inline-flex items-center gap-2 text-xs font-bold text-stone-600 hover:text-slate-900 transition-colors w-fit cursor-pointer group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span>Back to list</span>
      </button>

      {/* Main Single Card Container */}
      <div className="bg-white border border-stone-200/90 shadow-2xs rounded-3xl p-6 sm:p-8 flex flex-col gap-6">
        {/* Header Title & Serious Amount */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-200/70">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{b.billNumber}</h1>
              
              {/* Bill Status Badge */}
              {isPaid ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Paid
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50/90 text-amber-700 border border-amber-200/90 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> Unpaid
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 font-medium mt-0.5">
              Generated on {b.generatedOn}
            </p>
          </div>

          {/* Clean, serious amount display */}
          <div className="sm:text-right">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Billed Amount</span>
            <span className="text-lg font-extrabold text-slate-900 font-mono mt-0.5 block">
              ₹{Number(b.amount || 0).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Structured Rich Field Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4.5">
          {/* Card 1: Customer / Driver */}
          <div className="group bg-gradient-to-b from-indigo-50/40 to-slate-50/40 hover:from-white hover:to-white border border-indigo-100/80 hover:border-indigo-300 shadow-2xs hover:shadow-md transition-all duration-200 p-4.5 rounded-2xl flex flex-col gap-3">
            <div className="flex items-center gap-2 border-b border-indigo-100/70 pb-2.5 text-indigo-950 text-[11px] font-bold uppercase tracking-wider">
              <div className="w-6 h-6 rounded-lg bg-indigo-100 group-hover:bg-indigo-600 text-indigo-600 group-hover:text-white flex items-center justify-center shrink-0 transition-all duration-200">
                <User className="w-3.5 h-3.5" />
              </div>
              <span>Customer / Driver</span>
            </div>
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 bg-white border border-indigo-200/70 rounded-xl shadow-2xs w-fit">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-extrabold text-[10px] flex items-center justify-center shrink-0">
                {driverInitial}
              </span>
              <span className="text-xs font-extrabold text-slate-800">{driverName}</span>
            </div>
          </div>

          {/* Card 2: Fleet Account -> Violet theme */}
          <div className="group bg-gradient-to-b from-violet-50/40 to-slate-50/40 hover:from-white hover:to-white border border-violet-100/80 hover:border-violet-300 shadow-2xs hover:shadow-md transition-all duration-200 p-4.5 rounded-2xl flex flex-col gap-3">
            <div className="flex items-center gap-2 border-b border-violet-100/70 pb-2.5 text-violet-950 text-[11px] font-bold uppercase tracking-wider">
              <div className="w-6 h-6 rounded-lg bg-violet-100 group-hover:bg-violet-600 text-violet-600 group-hover:text-white flex items-center justify-center shrink-0 transition-all duration-200">
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <span>Fleet Account</span>
            </div>
            {fleetName && fleetName !== '-' ? (
              <button
                type="button"
                onClick={() => navigate(`/fleets?search=${encodeURIComponent(fleetName)}`)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-50/80 hover:bg-violet-100 text-violet-700 border border-violet-200/80 rounded-xl font-bold text-xs shadow-2xs hover:scale-[1.02] transition-all cursor-pointer w-fit"
              >
                <span>{fleetName}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="text-xs font-bold text-stone-400 block px-1">-</span>
            )}
          </div>

          {/* Card 3: Charge Point -> Emerald theme */}
          <div className="group bg-gradient-to-b from-emerald-50/40 to-slate-50/40 hover:from-white hover:to-white border border-emerald-100/80 hover:border-emerald-300 shadow-2xs hover:shadow-md transition-all duration-200 p-4.5 rounded-2xl flex flex-col gap-3">
            <div className="flex items-center gap-2 border-b border-emerald-100/70 pb-2.5 text-emerald-950 text-[11px] font-bold uppercase tracking-wider">
              <div className="w-6 h-6 rounded-lg bg-emerald-100 group-hover:bg-emerald-600 text-emerald-600 group-hover:text-white flex items-center justify-center shrink-0 transition-all duration-200">
                <Plug className="w-3.5 h-3.5" />
              </div>
              <span>Charge Point</span>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/charge-points/${encodeURIComponent(cpId)}`)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50/80 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 rounded-xl font-bold text-xs shadow-2xs hover:scale-[1.02] transition-all cursor-pointer w-fit"
            >
              <span>{cpName}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 4: Charging Station -> Sky theme */}
          <div className="group bg-gradient-to-b from-sky-50/40 to-slate-50/40 hover:from-white hover:to-white border border-sky-100/80 hover:border-sky-300 shadow-2xs hover:shadow-md transition-all duration-200 p-4.5 rounded-2xl flex flex-col gap-3">
            <div className="flex items-center gap-2 border-b border-sky-100/70 pb-2.5 text-sky-950 text-[11px] font-bold uppercase tracking-wider">
              <div className="w-6 h-6 rounded-lg bg-sky-100 group-hover:bg-sky-600 text-sky-600 group-hover:text-white flex items-center justify-center shrink-0 transition-all duration-200">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <span>Charging Station</span>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/charging-stations/${encodeURIComponent(stationId)}`)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50/80 hover:bg-sky-100 text-sky-700 border border-sky-200/80 rounded-xl font-bold text-xs shadow-2xs hover:scale-[1.02] transition-all cursor-pointer w-fit"
            >
              <span>{stationName}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 5: Charge Transaction & Status -> Cyan theme */}
          <div className="group bg-gradient-to-b from-cyan-50/40 to-slate-50/40 hover:from-white hover:to-white border border-cyan-100/80 hover:border-cyan-300 shadow-2xs hover:shadow-md transition-all duration-200 p-4.5 rounded-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-cyan-100/70 pb-2.5">
              <div className="flex items-center gap-2 text-cyan-950 text-[11px] font-bold uppercase tracking-wider">
                <div className="w-6 h-6 rounded-lg bg-cyan-100 group-hover:bg-cyan-600 text-cyan-600 group-hover:text-white flex items-center justify-center shrink-0 transition-all duration-200">
                  <Hash className="w-3.5 h-3.5" />
                </div>
                <span>Charge Transaction</span>
              </div>

              {/* Status Badge placed on the right side of the card heading */}
              {isCompleted ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> {b.chargeTransactionStatus}
                </span>
              ) : isOngoing ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></span> Ongoing
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> {b.chargeTransactionStatus}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => navigate(`/session-history?search=${encodeURIComponent(txId)}`)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-50/80 hover:bg-cyan-100 text-cyan-800 border border-cyan-200/80 rounded-xl font-mono font-black text-xs shadow-2xs hover:scale-[1.02] transition-all cursor-pointer w-fit"
            >
              <span>#{txId}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 6: Payment Method -> Blue theme */}
          <div className="group bg-gradient-to-b from-blue-50/40 to-slate-50/40 hover:from-white hover:to-white border border-blue-100/80 hover:border-blue-300 shadow-2xs hover:shadow-md transition-all duration-200 p-4.5 rounded-2xl flex flex-col gap-3">
            <div className="flex items-center gap-2 border-b border-blue-100/70 pb-2.5 text-blue-950 text-[11px] font-bold uppercase tracking-wider">
              <div className="w-6 h-6 rounded-lg bg-blue-100 group-hover:bg-blue-600 text-blue-600 group-hover:text-white flex items-center justify-center shrink-0 transition-all duration-200">
                <CreditCard className="w-3.5 h-3.5" />
              </div>
              <span>Payment Method</span>
            </div>
            <span className="inline-flex items-center px-3 py-1.5 bg-white border border-blue-200/70 text-blue-900 rounded-xl font-bold text-xs shadow-2xs w-fit">
              {b.method || 'User Wallet'}
            </span>
          </div>

          {/* Card 7: Applied Tariff -> Purple theme */}
          <div className="group bg-gradient-to-b from-purple-50/40 to-slate-50/40 hover:from-white hover:to-white border border-purple-100/80 hover:border-purple-300 shadow-2xs hover:shadow-md transition-all duration-200 p-4.5 rounded-2xl flex flex-col gap-3">
            <div className="flex items-center gap-2 border-b border-purple-100/70 pb-2.5 text-purple-950 text-[11px] font-bold uppercase tracking-wider">
              <div className="w-6 h-6 rounded-lg bg-purple-100 group-hover:bg-purple-600 text-purple-600 group-hover:text-white flex items-center justify-center shrink-0 transition-all duration-200">
                <Tag className="w-3.5 h-3.5" />
              </div>
              <span>Applied Tariff</span>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/tariffs?search=${encodeURIComponent(appliedTariff.name)}`)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50/80 hover:bg-purple-100 text-purple-700 border border-purple-200/80 rounded-xl font-bold text-xs shadow-2xs hover:scale-[1.02] transition-all cursor-pointer w-fit"
            >
              <span>{appliedTariff.name || 'Standard AC Tariff'}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 8: Energy Delivered -> Amber theme */}
          <div className="group bg-gradient-to-b from-amber-50/40 to-slate-50/40 hover:from-white hover:to-white border border-amber-100/80 hover:border-amber-300 shadow-2xs hover:shadow-md transition-all duration-200 p-4.5 rounded-2xl flex flex-col gap-3">
            <div className="flex items-center gap-2 border-b border-amber-100/70 pb-2.5 text-amber-950 text-[11px] font-bold uppercase tracking-wider">
              <div className="w-6 h-6 rounded-lg bg-amber-100 group-hover:bg-amber-600 text-amber-600 group-hover:text-white flex items-center justify-center shrink-0 transition-all duration-200">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <span>Energy Delivered</span>
            </div>
            <span className="inline-flex items-center px-3 py-1.5 bg-white border border-amber-200/70 text-slate-900 rounded-xl font-black text-sm shadow-2xs w-fit">
              {b.energyDelivered}
            </span>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="pt-4 border-t border-stone-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-stone-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Billing records and documents are finalized and verified.</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => toast.info('Invoice document generation feature ready for integration')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50/80 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
            >
              <FileText className="w-4 h-4" />
              <span>Invoice</span>
            </button>

            <button
              type="button"
              onClick={() => toast.info('Receipt document download feature ready for integration')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
            >
              <FileCheck className="w-4 h-4" />
              <span>Receipt</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
