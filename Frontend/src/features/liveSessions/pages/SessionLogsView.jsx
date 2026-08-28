import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import LogsTab from '../../../components/LogsTab';
import {
  ArrowLeft,
  Copy,
  Check,
  User as UserIcon,
  Zap,
  CreditCard,
  Hash
} from 'lucide-react';
import { apiClient } from '../../../lib/apiClient';
import { getTxId } from '../utils/sessionFormatters';

export default function SessionLogsView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [sessionData, setSessionData] = useState(location.state?.session || null);
  const [copiedSessionId, setCopiedSessionId] = useState(false);

  useEffect(() => {
    if (id) {
      apiClient(`/api/live-sessions/${id}`)
        .then(res => {
          if (res) {
            setSessionData(res);
          }
        })
        .catch(err => {
          console.warn("Could not fetch session details by ID:", err);
        });
    }
  }, [id]);

  const activeSession = sessionData || {
    id: id || '',
    userName: 'Driver',
    chargingStationName: 'Station',
    chargePointName: 'Charge Point',
    connector: 1,
    status: 'Completed',
    kwhDelivered: 0.00,
    cost: 0.00
  };

  const stationDisplayName =
    (typeof activeSession.station === 'object' ? activeSession.station?.name : null) ||
    (typeof activeSession.chargingStation === 'object' ? activeSession.chargingStation?.name : null) ||
    activeSession.chargingStationName ||
    (typeof activeSession.station === 'string' ? activeSession.station : null) ||
    'Charging Station';

  const cpDisplayName =
    (typeof activeSession.chargePoint === 'object' ? (activeSession.chargePoint?.name || activeSession.chargePoint?.code) : null) ||
    activeSession.chargePointName ||
    (typeof activeSession.chargePoint === 'string' && activeSession.chargePoint !== '-' ? activeSession.chargePoint : null) ||
    activeSession.chargePointCode ||
    'Charge Point';

  const stationId = activeSession.chargingStationId || activeSession.stationId || activeSession.chargingStation?.id;
  const chargePointId = activeSession.chargePointId || activeSession.chargePoint?.id;

  const handleStationClick = (e) => {
    e?.stopPropagation();
    if (stationId) {
      navigate(`/charging-stations/${stationId}`);
    }
  };

  const handleChargePointClick = (e) => {
    e?.stopPropagation();
    if (chargePointId) {
      navigate(`/charge-points/${chargePointId}`);
    }
  };

  const handleCopySessionId = () => {
    if (activeSession.id) {
      navigator.clipboard.writeText(activeSession.id);
      setCopiedSessionId(true);
      setTimeout(() => setCopiedSessionId(false), 2000);
    }
  };

  const cpMock = {
    name: cpDisplayName,
    code: activeSession.chargePointCode || activeSession.chargePoint?.code || `CP-${activeSession.id || ''}`
  };

  return (
    <div className="flex flex-col gap-3.5 max-w-[1500px] w-full mx-auto pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/live-sessions')}
            className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-stone-900 transition-all cursor-pointer border border-stone-200/80 shrink-0"
            title="Back to Live Sessions"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.2]" />
          </button>

          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-extrabold text-stone-900 tracking-tight">
                Session {getTxId(activeSession)} Logs
              </h1>

              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 border shadow-2xs ${
                  activeSession.status === 'Ongoing'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80'
                    : activeSession.status === 'Failed'
                    ? 'bg-rose-50 text-rose-700 border-rose-200/80'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {activeSession.status === 'Ongoing' && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                )}
                <span>{activeSession.status || 'Completed'}</span>
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-stone-500 font-medium flex-wrap">
              <span className="font-semibold text-stone-600">Logs</span>
              <span className="text-stone-300">•</span>

              <span>Station:</span>
              <button
                onClick={handleStationClick}
                className="font-bold text-slate-800 hover:text-sky-600 transition-colors cursor-pointer bg-transparent border-0 p-0 text-xs"
                title={`Open station details: ${stationDisplayName}`}
              >
                {stationDisplayName}
              </button>

              <span className="text-stone-300">•</span>

              <span>Charge Point:</span>
              <button
                onClick={handleChargePointClick}
                className="font-bold text-slate-800 hover:text-sky-600 transition-colors cursor-pointer bg-transparent border-0 p-0 text-xs"
                title={`Open charge point details: ${cpDisplayName}`}
              >
                {cpDisplayName}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-stone-200/80 rounded-xl px-3 py-1.5 text-xs shadow-2xs">
            <UserIcon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span className="font-semibold text-stone-500">User:</span>
            <span className="font-bold text-stone-900">{activeSession.userName || activeSession.driver?.name || 'Simulated Driver'}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-stone-200/80 rounded-xl px-3 py-1.5 text-xs shadow-2xs">
            <Zap className="w-3.5 h-3.5 text-sky-500 shrink-0" />
            <span className="font-semibold text-stone-500">Energy:</span>
            <span className="font-mono font-bold text-stone-900">{activeSession.kwhDelivered !== undefined ? `${Number(activeSession.kwhDelivered).toFixed(2)} kWh` : '0.00 kWh'}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-stone-200/80 rounded-xl px-3 py-1.5 text-xs shadow-2xs">
            <CreditCard className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="font-semibold text-stone-500">Cost:</span>
            <span className="font-mono font-bold text-stone-900">₹{activeSession.cost !== undefined || activeSession.totalCost !== undefined ? parseFloat(activeSession.cost ?? activeSession.totalCost ?? 0).toFixed(2) : '0.00'}</span>
          </div>

          <button
            onClick={handleCopySessionId}
            className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all duration-150 cursor-pointer shadow-2xs ${
              copiedSessionId
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-white hover:bg-stone-50 border-stone-200/90 text-stone-800'
            }`}
            title="Click to copy full Session ID"
          >
            <div className="p-1 rounded-md bg-stone-100 text-stone-600 group-hover:bg-violet-100 group-hover:text-violet-700 transition-colors duration-150">
              <Hash className="w-3 h-3 stroke-[2.5]" />
            </div>
            <span className="font-semibold text-stone-500">ID:</span>
            <span className="font-mono font-bold tracking-tight text-[11px] max-w-[120px] truncate">{activeSession.id}</span>

            {copiedSessionId ? (
              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5] animate-in zoom-in-75 duration-150 ml-0.5" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-stone-400 group-hover:text-violet-600 transition-colors duration-150 ml-0.5" />
            )}
          </button>
        </div>
      </div>

      <LogsTab cp={cpMock} sessionData={activeSession} />
    </div>
  );
}
