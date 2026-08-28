import React, { memo } from 'react';
import { getConnectorLabel, getTxId } from '../utils/sessionFormatters';
import SocPopoverCell from '../../../components/ui/SocPopoverCell';
import MeterValuesPopoverCell from '../../../components/ui/MeterValuesPopoverCell';
import TelemetryActionButton from './TelemetryActionButton';

function LiveSessionsRow({
  session,
  resolveStation,
  resolveChargePoint,
  onNavigateStation,
  onNavigateChargePoint,
  onNavigateLogs
}) {
  const stationObj = typeof resolveStation === 'function' ? resolveStation(session.chargingStationId || session.chargingStation || session.station) : null;
  const cpObj = typeof resolveChargePoint === 'function' ? resolveChargePoint(session.chargePointId || session.chargePoint || session.chargePointCode) : null;

  const stationName =
    stationObj?.name ||
    (typeof session.chargingStation === 'object' ? session.chargingStation?.name : null) ||
    session.chargingStationName ||
    (typeof session.station === 'object' ? session.station?.name : (typeof session.station === 'string' ? session.station : null)) ||
    (typeof session.chargingStation === 'string' ? session.chargingStation : null) ||
    'DLF Cybercity Fast Hub';

  const cpName =
    cpObj?.name ||
    (typeof session.chargePoint === 'object' ? (session.chargePoint?.name || session.chargePoint?.code) : null) ||
    session.chargePointName ||
    (typeof session.chargePoint === 'string' && session.chargePoint !== '-' ? session.chargePoint : null) ||
    session.chargePointCode ||
    session.cpCode ||
    'Fast Charger CP1';

  const activeStationObj = stationObj || (typeof session.chargingStation === 'object' ? session.chargingStation : { id: session.chargingStationId || stationObj?.id || session.station || stationName, name: stationName });
  const activeCpObj = cpObj || (typeof session.chargePoint === 'object' ? session.chargePoint : { id: session.chargePointId || cpObj?.id || session.chargePointCode || session.chargePoint || cpName, name: cpName, code: cpName });

  return (
    <tr className="hover:bg-slate-50/80 transition-colors duration-150 text-xs group/row">
      {/* 1. Actions */}
      <td className="px-4 py-3 whitespace-nowrap">
        <TelemetryActionButton session={session} onNavigateLogs={onNavigateLogs} />
      </td>

      {/* 2. User */}
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center gap-2.5">
          <div className={`w-7 h-7 rounded-full ${session.userColor || 'bg-indigo-100 text-indigo-700'} flex items-center justify-center font-bold text-[11px] shrink-0`}>
            {session.userInitials || session.userName?.[0] || 'U'}
          </div>
          <span className="font-semibold text-slate-800">{session.userName || 'EV Driver'}</span>
        </div>
      </td>

      {/* 3. Charge Point */}
      <td className="px-4 py-3 whitespace-nowrap">
        {activeCpObj ? (
          <button
            onClick={() => onNavigateChargePoint(activeCpObj)}
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
        {activeStationObj ? (
          <button
            onClick={() => onNavigateStation(activeStationObj)}
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
        <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
          Charging
        </span>
      </td>

      {/* 8. SoC */}
      <td className="px-4 py-3 whitespace-nowrap">
        <SocPopoverCell initialSoc={session.soc?.initial ?? session.initialSoc} currentSoc={session.soc?.current ?? session.currentSoc} />
      </td>

      {/* 9. Telemetry */}
      <td className="px-4 py-3 whitespace-nowrap">
        <MeterValuesPopoverCell row={session} meterValues={session.meterValues} />
      </td>

      {/* 10. Energy */}
      <td className="px-4 py-3 font-bold text-slate-900 font-mono whitespace-nowrap">
        {typeof session.kwhDelivered === 'number' ? session.kwhDelivered.toFixed(2) : (session.kwhDelivered || '0.00')} kWh
      </td>

      {/* 11. Cost */}
      <td className="px-4 py-3 font-extrabold text-emerald-700 font-mono whitespace-nowrap">
        ₹{session.cost || (typeof session.totalCost === 'number' ? session.totalCost.toFixed(2) : '0.00')}
      </td>

      {/* 12. Duration */}
      <td className="px-4 py-3 text-stone-500 font-medium whitespace-nowrap">
        {session.duration || '00:00:00'}
      </td>
    </tr>
  );
}

export default memo(LiveSessionsRow);
