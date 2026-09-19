import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import BackButton from '../../../components/ui/BackButton';
import {
  FileText,
  FileCheck,
  Loader2,
  Tag,
  User,
  Truck,
  PlugZap,
  MapPin,
  ArrowLeftRight,
  CreditCard,
  Zap,
  ShieldCheck,
  Copy,
  Check,
  ChevronRight
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
  const [copiedBillNo, setCopiedBillNo] = useState(false);
  const [isExportingInvoice, setIsExportingInvoice] = useState(false);
  const [isExportingReceipt, setIsExportingReceipt] = useState(false);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    if (!bill) setLoading(true);

    getBillById(id)
      .then((data) => {
        if (isMounted && data) {
          setBill(data);
        }
      })
      .catch((err) => {
        console.error("Failed to load bill details:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading && !bill) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-sky-600">
        <Loader2 className="w-8 h-8 animate-spin mb-3" />
        <p className="text-xs font-bold text-stone-500">Loading invoice details...</p>
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-stone-500 gap-4">
        <p className="text-sm font-bold text-stone-700">Invoice record not found</p>
        <button
          onClick={() => navigate('/bills')}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg text-xs transition active:scale-95 cursor-pointer"
        >
          Back to Invoices
        </button>
      </div>
    );
  }

  const b = bill;
  const isPaid = b.billStatus === 'Paid';
  const txStatus = (typeof b.chargeTransaction === 'object' ? b.chargeTransaction?.status : b.chargeTransactionStatus) || b.chargeTransactionStatus || 'Completed';
  const isCompleted = txStatus === 'Completed' || txStatus === 'Stopped';
  const isOngoing = txStatus === 'Ongoing';

  const driverName = (typeof b.customerDriver === 'object' ? b.customerDriver?.name : b.customerDriver) || b.driverName || 'B108901020';

  const fleetName = (typeof b.fleet === 'object' ? b.fleet?.name : b.fleet) || '-';
  const cpName = (typeof b.chargePoint === 'object' ? b.chargePoint?.name : b.chargePoint) || b.chargePointName || 'Charge Point Station 28 AC';
  const cpId = (typeof b.chargePoint === 'object' ? b.chargePoint?.id : b.chargePointId) || cpName;

  const stationName = (typeof b.chargingStation === 'object' ? b.chargingStation?.name : b.chargingStation) || b.chargingStationName || 'Location 6 Hub';
  const stationId = (typeof b.chargingStation === 'object' ? b.chargingStation?.id : b.chargingStationId) || stationName;

  const rawTxCode = (typeof b.chargeTransaction === 'object' ? (b.chargeTransaction?.txCode || b.chargeTransaction?.id) : b.chargeTransaction) || b.chargeTxCode || '48727';
  const txCode = String(rawTxCode).replace(/^#/, '');

  const appliedTariff = b.appliedTariff || null;
  const tariffName = (typeof appliedTariff === 'object' && appliedTariff?.name)
    ? appliedTariff.name
    : (typeof appliedTariff === 'string' && appliedTariff.trim() !== '')
      ? appliedTariff
      : 'Fleet Special';

  const handleNavigateTariff = () => {
    if (tariffName && tariffName !== 'Standard AC Tariff') {
      navigate(`/tariffs?search=${encodeURIComponent(tariffName)}`);
    } else {
      navigate('/tariffs');
    }
  };

  const handleCopyBillNumber = () => {
    if (b.billNumber) {
      navigator.clipboard.writeText(b.billNumber);
      setCopiedBillNo(true);
      toast.success(`Copied bill ${b.billNumber} to clipboard`, { code: 200 });
      setTimeout(() => setCopiedBillNo(false), 2000);
    }
  };

  const handleInvoiceExport = () => {
    setIsExportingInvoice(true);
    setTimeout(() => {
      setIsExportingInvoice(false);
      toast.success('Invoice document ready for export / printing.', { code: 200 });
      window.print();
    }, 450);
  };

  const handleReceiptExport = () => {
    setIsExportingReceipt(true);
    setTimeout(() => {
      setIsExportingReceipt(false);
      toast.success('Receipt generated and ready.', { code: 200 });
      window.print();
    }, 450);
  };

  return (
    <div className="flex flex-col gap-4 max-w-[1600px] w-full mx-auto pt-2 pb-10 animate-in fade-in duration-200">
      {/* Print Stylesheet */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-bill-wrapper, #printable-bill-wrapper * {
            visibility: visible;
          }
          #printable-bill-wrapper {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Top Header Navigation */}
      <div className="flex items-center justify-between no-print">
        <BackButton to="/bills" label="Back to Bills" />
      </div>

      <div id="printable-bill-wrapper" className="flex flex-col gap-5">
        {/* Page Header (Outside Card) */}
        <div className="flex flex-row items-center justify-between gap-4 py-1 px-1 sm:px-2">
          <div className="flex items-center gap-4">
            {/* Header Document Icon Box */}
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-center text-slate-800 shrink-0">
              <FileText className="w-6 h-6 sm:w-7 sm:h-7 stroke-[1.75]" />
            </div>

            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={handleCopyBillNumber}
                  className="group/num inline-flex items-center gap-2 text-left cursor-pointer transition-all duration-150"
                  title="Click to copy Bill Number"
                >
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight group-hover/num:text-indigo-600 transition-colors">
                    {b.billNumber || 'BILL-48727'}
                  </h1>
                  <span className="p-1 rounded-md bg-stone-100/80 group-hover/num:bg-indigo-50 text-stone-400 group-hover/num:text-indigo-600 transition-all duration-150 active:scale-90">
                    {copiedBillNo ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 stroke-[2]" />
                    )}
                  </span>
                </button>

                {/* Bill Status Badge */}
                {isPaid ? (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Paid
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-[#fef3eb] text-[#d97706] border border-[#fde68a]/60">
                    <span className="w-2 h-2 rounded-full bg-[#d97706]"></span> Unpaid
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-[13px] text-slate-400 font-medium mt-1">
                Generated on {b.generatedOn || 'Sep 17, 2026 06:09 pm'}
              </p>
            </div>
          </div>

          {/* Amount Display (Shifted Inward / Left with Refined Typography) */}
          <div className="text-right shrink-0 pr-4 sm:pr-8 md:pr-12">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest block">
              BILLED AMOUNT
            </span>
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono tracking-tight mt-0.5 block">
              ₹{Number(b.amount || 0).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Main Card Container (Wrapping Only the Inner Cards & Footer) */}
        <div
          id="printable-bill-container"
          className="bg-white border border-slate-200/90 shadow-sm rounded-2xl p-6 sm:p-7 flex flex-col gap-6"
        >
        {/* Structured Field Cards Grid (4 Columns x 2 Rows) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Customer / Driver (Informational / Non-clickable - No description) */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 min-h-[108px] flex items-center justify-between gap-3.5">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-xl bg-blue-50 border border-blue-100/80 flex items-center justify-center text-blue-500 shrink-0">
                <User className="w-6 h-6 stroke-[2.25]" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
                  CUSTOMER / DRIVER
                </span>
                <span className="text-base sm:text-lg font-bold text-slate-900 truncate mt-1">
                  {driverName}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Fleet Account (Clickable when fleet assigned) */}
          {fleetName && fleetName !== '-' ? (
            <div
              onClick={() => navigate(`/fleets?search=${encodeURIComponent(fleetName)}`)}
              className="group bg-white border border-slate-200/80 hover:border-slate-300 hover:shadow-sm rounded-xl p-5 min-h-[108px] flex items-center justify-between gap-3.5 transition-all duration-150 cursor-pointer"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-xl bg-purple-50 border border-purple-100/80 flex items-center justify-center text-purple-500 shrink-0">
                  <Truck className="w-6 h-6 stroke-[2.25]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
                    FLEET ACCOUNT
                  </span>
                  <span className="text-base sm:text-lg font-bold text-slate-900 truncate mt-0.5">
                    {fleetName}
                  </span>
                  <span className="text-xs text-slate-400 truncate mt-0.5">
                    Manage fleet accounts
                  </span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-slate-800 group-hover:bg-slate-100 group-hover:translate-x-0.5 transition-all duration-150 shrink-0">
                <ChevronRight className="w-4.5 h-4.5 stroke-[2.5]" />
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200/80 rounded-xl p-5 min-h-[108px] flex items-center justify-between gap-3.5">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-xl bg-purple-50 border border-purple-100/80 flex items-center justify-center text-purple-500 shrink-0">
                  <Truck className="w-6 h-6 stroke-[2.25]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
                    FLEET ACCOUNT
                  </span>
                  <span className="text-base sm:text-lg font-bold text-slate-900 truncate mt-1">
                    -
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Card 3: Charge Point (Clickable) */}
          <div
            onClick={() => navigate(`/charge-points/${encodeURIComponent(cpId)}`)}
            className="group bg-white border border-slate-200/80 hover:border-slate-300 hover:shadow-sm rounded-xl p-5 min-h-[108px] flex items-center justify-between gap-3.5 transition-all duration-150 cursor-pointer"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-xl bg-emerald-50 border border-emerald-100/80 flex items-center justify-center text-emerald-500 shrink-0">
                <PlugZap className="w-6 h-6 stroke-[2.25]" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
                  CHARGE POINT
                </span>
                <span className="text-base sm:text-lg font-bold text-slate-900 truncate mt-0.5">
                  {cpName}
                </span>
                <span className="text-xs text-slate-400 truncate mt-0.5">
                  View charge point details
                </span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-slate-800 group-hover:bg-slate-100 group-hover:translate-x-0.5 transition-all duration-150 shrink-0">
              <ChevronRight className="w-4.5 h-4.5 stroke-[2.5]" />
            </div>
          </div>

          {/* Card 4: Charging Station (Clickable) */}
          <div
            onClick={() => navigate(`/charging-stations/${encodeURIComponent(stationId)}`)}
            className="group bg-white border border-slate-200/80 hover:border-slate-300 hover:shadow-sm rounded-xl p-5 min-h-[108px] flex items-center justify-between gap-3.5 transition-all duration-150 cursor-pointer"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-xl bg-sky-50 border border-sky-100/80 flex items-center justify-center text-sky-500 shrink-0">
                <MapPin className="w-6 h-6 stroke-[2.25]" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
                  CHARGING STATION
                </span>
                <span className="text-base sm:text-lg font-bold text-slate-900 truncate mt-0.5">
                  {stationName}
                </span>
                <span className="text-xs text-slate-400 truncate mt-0.5">
                  View station location and settings
                </span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-slate-800 group-hover:bg-slate-100 group-hover:translate-x-0.5 transition-all duration-150 shrink-0">
              <ChevronRight className="w-4.5 h-4.5 stroke-[2.5]" />
            </div>
          </div>

          {/* Card 5: Charge Transaction (Clickable) */}
          <div
            onClick={() => navigate(`/session-history?search=${encodeURIComponent(txCode)}`)}
            className="group bg-white border border-slate-200/80 hover:border-slate-300 hover:shadow-sm rounded-xl p-5 min-h-[108px] flex items-center justify-between gap-3.5 transition-all duration-150 cursor-pointer"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-xl bg-teal-50 border border-teal-100/80 flex items-center justify-center text-teal-500 shrink-0">
                <ArrowLeftRight className="w-6 h-6 stroke-[2.25]" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
                  CHARGE TRANSACTION
                </span>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-base sm:text-lg font-bold text-slate-900 font-mono truncate">
                    #{txCode}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border shrink-0 ${
                    isCompleted ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80' :
                    isOngoing ? 'bg-sky-50 text-sky-700 border-sky-200/80' :
                    'bg-rose-50 text-rose-700 border-rose-200/80'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isCompleted ? 'bg-emerald-500' : isOngoing ? 'bg-sky-500 animate-pulse' : 'bg-rose-500'}`} />
                    {txStatus}
                  </span>
                </div>
                <span className="text-xs text-slate-400 truncate mt-0.5">
                  View transaction details
                </span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-slate-800 group-hover:bg-slate-100 group-hover:translate-x-0.5 transition-all duration-150 shrink-0">
              <ChevronRight className="w-4.5 h-4.5 stroke-[2.5]" />
            </div>
          </div>

          {/* Card 6: Payment Method (Informational / Non-clickable - No description) */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 min-h-[108px] flex items-center justify-between gap-3.5">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-xl bg-blue-50 border border-blue-100/80 flex items-center justify-center text-blue-500 shrink-0">
                <CreditCard className="w-6 h-6 stroke-[2.25]" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
                  PAYMENT METHOD
                </span>
                <span className="text-base sm:text-lg font-bold text-slate-900 truncate mt-1">
                  {b.method || 'User Wallet'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 7: Applied Tariff (Clickable) */}
          <div
            onClick={handleNavigateTariff}
            className="group bg-white border border-slate-200/80 hover:border-slate-300 hover:shadow-sm rounded-xl p-5 min-h-[108px] flex items-center justify-between gap-3.5 transition-all duration-150 cursor-pointer"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-xl bg-purple-50 border border-purple-100/80 flex items-center justify-center text-purple-500 shrink-0">
                <Tag className="w-6 h-6 stroke-[2.25]" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
                  APPLIED TARIFF
                </span>
                <span className="text-base sm:text-lg font-bold text-slate-900 truncate mt-0.5">
                  {tariffName}
                </span>
                <span className="text-xs text-slate-400 truncate mt-0.5">
                  View tariff and pricing details
                </span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-slate-800 group-hover:bg-slate-100 group-hover:translate-x-0.5 transition-all duration-150 shrink-0">
              <ChevronRight className="w-4.5 h-4.5 stroke-[2.5]" />
            </div>
          </div>

          {/* Card 8: Energy Delivered (Informational / Non-clickable - No description) */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 min-h-[108px] flex items-center justify-between gap-3.5">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-xl bg-amber-50 border border-amber-100/80 flex items-center justify-center text-amber-500 shrink-0">
                <Zap className="w-6 h-6 stroke-[2.25]" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
                  ENERGY DELIVERED
                </span>
                <span className="text-base sm:text-lg font-bold text-slate-900 font-mono truncate mt-1">
                  {b.energyDelivered || '0.01 kWh'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <ShieldCheck className="w-5 h-5 text-emerald-600 stroke-[2] shrink-0" />
            <span>Billing records and documents are finalized and verified.</span>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            {/* Invoice Action Button */}
            <button
              type="button"
              disabled={isExportingInvoice}
              onClick={handleInvoiceExport}
              className="group inline-flex items-center gap-2 px-5 py-2.5 bg-[#0f4339] hover:bg-[#0b332b] text-white rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer shadow-xs active:scale-95 disabled:opacity-75"
              title="Generate / Print Invoice PDF"
            >
              {isExportingInvoice ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-300" />
              ) : (
                <FileText className="w-4 h-4 text-white" />
              )}
              <span>{isExportingInvoice ? 'Preparing...' : 'Invoice'}</span>
            </button>

            {/* Receipt Action Button */}
            <button
              type="button"
              disabled={isExportingReceipt}
              onClick={handleReceiptExport}
              className="group inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer shadow-2xs active:scale-95 disabled:opacity-75"
              title="Print Receipt"
            >
              {isExportingReceipt ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
              ) : (
                <FileCheck className="w-4 h-4 text-slate-500 group-hover:text-slate-700" />
              )}
              <span>{isExportingReceipt ? 'Preparing...' : 'Receipt'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}
