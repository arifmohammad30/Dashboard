import React from 'react';
import { getConnectorLabel, getTxId, getBillCode } from '../utils/sessionFormatters';
import SocPopoverCell from '../../../components/ui/SocPopoverCell';
import MeterValuesPopoverCell from '../../../components/ui/MeterValuesPopoverCell';

export default function LiveSessionsRow({
  session,
  resolveStation,
  resolveChargePoint,
  onNavigateStation,
  onNavigateChargePoint,
  onNavigateLogs
}) {
  const stationObj = resolveStation(session.station || session.chargingStationId);
  const cpObj = resolveChargePoint(session.chargePoint || session.chargePointId);

  return (
    <tr className="hover:bg-slate-50/80 transition-colors duration-150 text-xs">
      <td className="px-4 py-3 font-mono font-bold text-sky-600 whitespace-nowrap">
        #{getTxId(session.id)}
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center gap-2.5">
          <div className={`w-7 h-7 rounded-full ${session.userColor || 'bg-indigo-100 text-indigo-700'} flex items-center justify-center font-bold text-[11px] shrink-0`}>
            {session.userInitials || session.userName?.[0] || 'U'}
          </div>
          <span className="font-semibold text-slate-800">{session.userName || 'EV Driver'}</span>
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        {stationObj ? (
          <button
            onClick={() => onNavigateStation(stationObj)}
            className="font-bold text-sky-600 hover:text-sky-800 hover:underline cursor-pointer transition-colors text-left"
          >
            {session.station || stationObj.name}
          </button>
        ) : (
          <span className="text-stone-700 font-medium">{session.station || '-'}</span>
        )}
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        {cpObj ? (
          <button
            onClick={() => onNavigateChargePoint(cpObj)}
            className="font-bold text-sky-600 hover:text-sky-800 hover:underline cursor-pointer transition-colors text-left"
          >
            {session.chargePoint || cpObj.name}
          </button>
        ) : (
          <span className="text-stone-700 font-medium">{session.chargePoint || '-'}</span>
        )}
      </td>
      <td className="px-4 py-3 whitespace-nowrap font-mono text-stone-600 font-medium">
        {getConnectorLabel(session.connector)}
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
          Charging
        </span>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <SocPopoverCell initialSoc={session.initialSoc} currentSoc={session.currentSoc} />
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <MeterValuesPopoverCell row={session} />
      </td>
      <td className="px-4 py-3 font-bold text-slate-900 font-mono whitespace-nowrap">
        {session.kwhDelivered || session.energy || '0.00'} kWh
      </td>
      <td className="px-4 py-3 font-extrabold text-emerald-700 font-mono whitespace-nowrap">
        ₹{session.cost || session.billedAmount || '0.00'}
      </td>
      <td className="px-4 py-3 font-mono text-sky-600 hover:text-sky-800 font-semibold whitespace-nowrap cursor-pointer">
        {getBillCode(session.id)}
      </td>
      <td className="px-4 py-3 text-stone-500 font-medium whitespace-nowrap">
        {session.duration || '00:15:20'}
      </td>
      <td className="px-4 py-3 text-right whitespace-nowrap">
        <button
          onClick={() => onNavigateLogs(session)}
          className="px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-lg text-[11px] transition-colors cursor-pointer"
        >
          View Telemetry
        </button>
      </td>
    </tr>
  );
}
