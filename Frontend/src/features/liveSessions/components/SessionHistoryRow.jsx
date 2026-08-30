import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getConnectorLabel, getTxId, getBillCode } from '../utils/sessionFormatters';
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

  // Read relationships directly from authoritative session payload
  const cpObj = typeof session.chargePoint === 'object' && session.chargePoint !== null ? session.chargePoint : null;
  const cpName = cpObj?.name || cpObj?.code || session.chargePointName || (typeof session.chargePoint === 'string' ? session.chargePoint : null) || '-';

  const stationObj = typeof session.chargingStation === 'object' && session.chargingStation !== null ? session.chargingStation : null;
  const stationName = stationObj?.name || stationObj?.code || session.chargingStationName || session.station || (typeof session.chargingStation === 'string' ? session.chargingStation : null) || '-';

  const billCodeStr = getBillCode(session);
  const isCompleted = session.status === 'Completed' || session.status === 'Stopped';

  const handleNavigateToBill = (e) => {
    e.stopPropagation();
    if (isCompleted && billCodeStr && billCodeStr !== '-') {
      navigate(`/bills?search=${encodeURIComponent(billCodeStr)}`);
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
            {session.userInitials || session.userName?.[0] || 'U'}
          </div>
          <div>
            <span className="font-bold text-slate-900 block group-hover/row:text-[#4DA944] transition-colors">
              {session.userName || 'EV Driver'}
            </span>
            {session.userPhone && (
              <span className="text-[11px] text-stone-400 font-mono block">
                {session.userPhone}
              </span>
            )}
          </div>
        </div>
      </td>

      {/* 3. Charge Point */}
      <td className="px-4 py-3 whitespace-nowrap">
        {cpObj?.id && onNavigateChargePoint ? (
          <button
            onClick={() => onNavigateChargePoint(cpObj)}
            className="text-[13px] font-semibold text-slate-800 hover:text-sky-600 cursor-pointer transition-colors text-left"
          >
            {cpName}
          </button>
        ) : (
          <span className="text-[13px] text-slate-800 font-semibold">{cpName}</span>
        )}
      </td>

      {/* 4. Charging Station */}
      <td className="px-4 py-3 whitespace-nowrap">
        {stationObj?.id && onNavigateStation ? (
          <button
            onClick={() => onNavigateStation(stationObj)}
            className="text-[13px] font-semibold text-slate-800 hover:text-sky-600 cursor-pointer transition-colors text-left"
          >
            {stationName}
          </button>
        ) : (
          <span className="text-[13px] text-slate-800 font-semibold">{stationName}</span>
        )}
      </td>

      {/* 5. Txn Id */}
      <td className="px-4 py-3 font-mono font-bold text-sky-600 whitespace-nowrap">
        {getTxId(session.id)}
      </td>

      {/* 6. Connector */}
      <td className="px-4 py-3 whitespace-nowrap font-mono text-stone-600 font-medium">
        {getConnectorLabel(session.connector, session)}
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
        <SocPopoverCell initialSoc={session.soc?.initial ?? session.initialSoc} currentSoc={session.soc?.current ?? session.currentSoc} />
      </td>

      {/* 9. Telemetry */}
      <td className="px-4 py-3 whitespace-nowrap">
        <MeterValuesPopoverCell row={session} />
      </td>

      {/* 10. Energy */}
      <td className="px-4 py-3 font-bold text-slate-900 font-mono whitespace-nowrap">
        {session.kwhDelivered || '0.00'} kWh
      </td>

      {/* 11. Cost */}
      <td className="px-4 py-3 font-extrabold text-emerald-700 font-mono whitespace-nowrap">
        ₹{session.cost || (typeof session.totalCost === 'number' ? session.totalCost.toFixed(2) : '0.00')}
      </td>

      {/* 12. Bill ID */}
      <td className="px-4 py-3 font-mono whitespace-nowrap">
        {isCompleted ? (
          <button
            onClick={handleNavigateToBill}
            className="text-sky-600 hover:text-sky-800 font-semibold hover:underline cursor-pointer"
          >
            {billCodeStr}
          </button>
        ) : (
          <span className="text-stone-400 font-medium">-</span>
        )}
      </td>

      {/* 13. Date */}
      <td className="px-4 py-3 text-stone-500 font-medium whitespace-nowrap">
        {session.createdAt ? new Date(session.createdAt).toLocaleString() : 'Recent'}
      </td>
    </tr>
  );
}
