import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getConnectorLabel, getTxId } from '../utils/sessionFormatters';
import SocPopoverCell from '../../../components/ui/SocPopoverCell';
import MeterValuesPopoverCell from '../../../components/ui/MeterValuesPopoverCell';
import TelemetryActionButton from './TelemetryActionButton';

export default function SessionHistoryRow({
  session,
  onNavigateStation,
  onNavigateChargePoint,
  onNavigateLogs
}) {
  const navigate = useNavigate();

  const cp = session.chargePoint;
  const cpName = cp?.name || cp?.code || '-';

  const station = session.chargingStation;
  const stationName = station?.name || '-';

  const billNumber = session.billNumber;
  const isCompleted = session.status === 'Completed' || session.status === 'Stopped';

  const handleNavigateToBill = (e) => {
    e.stopPropagation();
    if (isCompleted && billNumber && billNumber !== '-') {
      navigate(`/bills?search=${encodeURIComponent(billNumber)}`);
    }
  };

  return (
    <tr className="hover:bg-slate-50/80 transition-colors duration-150 text-xs group/row">
      {/* 1. Actions */}
      <td className="px-4 py-3 whitespace-nowrap">
        <TelemetryActionButton session={session} onNavigateLogs={onNavigateLogs} />
      </td>

      {/* 2. User */}
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#4DA944]/20 to-[#4DA944]/10 border border-[#4DA944]/30 text-[#30702a] font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
            {session.userInitials || 'U'}
          </div>
          <span className="font-bold text-slate-900 block group-hover/row:text-[#4DA944] transition-colors">
            {session.userName || 'EV Driver'}
          </span>
        </div>
      </td>

      {/* 3. Charge Point */}
      <td className="px-4 py-3 whitespace-nowrap">
        {cp?.id && onNavigateChargePoint && cpName !== '-' ? (
          <button
            onClick={() => onNavigateChargePoint(cp)}
            className="text-[13px] font-semibold text-slate-800 hover:text-sky-600 cursor-pointer transition-colors text-left"
            title={`View Charge Point: ${cpName}`}
          >
            {cpName}
          </button>
        ) : (
          <span className="text-[13px] text-slate-800 font-semibold">{cpName}</span>
        )}
      </td>

      {/* 4. Charging Station */}
      <td className="px-4 py-3 whitespace-nowrap">
        {station?.id && onNavigateStation && stationName !== '-' ? (
          <button
            onClick={() => onNavigateStation(station)}
            className="text-[13px] font-semibold text-slate-800 hover:text-sky-600 cursor-pointer transition-colors text-left"
            title={`View Charging Station: ${stationName}`}
          >
            {stationName}
          </button>
        ) : (
          <span className="text-[13px] text-slate-800 font-semibold">{stationName}</span>
        )}
      </td>

      {/* 5. Txn Id */}
      <td className="px-4 py-3 font-mono font-bold text-sky-600 whitespace-nowrap">
        {getTxId(session.chargeTxCode || session.id)}
      </td>

      {/* 6. Connector */}
      <td className="px-4 py-3 whitespace-nowrap font-mono text-stone-600 font-medium">
        {getConnectorLabel(session.connector)}
      </td>

      {/* 7. Status */}
      <td className="px-4 py-3 whitespace-nowrap">
        {isCompleted ? (
          <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Completed
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Failed
          </span>
        )}
      </td>

      {/* 8. SoC */}
      <td className="px-4 py-3 whitespace-nowrap">
        <SocPopoverCell initialSoc={session.initialSoc} currentSoc={session.currentSoc} />
      </td>

      {/* 9. Telemetry */}
      <td className="px-4 py-3 whitespace-nowrap">
        <MeterValuesPopoverCell meterValues={session.meterValues} />
      </td>

      {/* 10. Energy */}
      <td className="px-4 py-3 font-bold text-slate-900 font-mono whitespace-nowrap">
        {(session.kwhDelivered ?? 0).toFixed(2)} kWh
      </td>

      {/* 11. Cost */}
      <td className="px-4 py-3 font-extrabold text-emerald-700 font-mono whitespace-nowrap">
        ₹{(session.totalCost ?? 0).toFixed(2)}
      </td>

      {/* 12. Bill ID */}
      <td className="px-4 py-3 font-mono whitespace-nowrap">
        {isCompleted && billNumber ? (
          <button
            onClick={handleNavigateToBill}
            className="text-sky-600 hover:text-sky-800 font-semibold cursor-pointer"
          >
            {billNumber}
          </button>
        ) : (
          <span className="text-stone-400 font-medium">-</span>
        )}
      </td>

      {/* 13. Date */}
      <td className="px-4 py-3 text-stone-500 font-medium whitespace-nowrap">
        {session.createdAt ? new Date(session.createdAt).toLocaleString() : '-'}
      </td>
    </tr>
  );
}
