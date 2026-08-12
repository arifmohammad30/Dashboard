import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import LogsTab from '../../../components/LogsTab';
import {
  ArrowLeft,
  RefreshCw,
  Copy,
  Check,
  MapPin,
  Plug,
  User as UserIcon,
  Zap,
  CreditCard,
  ExternalLink,
  Hash
} from 'lucide-react';
import { apiClient } from '../../../lib/apiClient';

export default function SessionLogsView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const sessionData = location.state?.session || {
    id: id || '1042',
    userInitials: 'B',
    userName: 'B108901020',
    station: 'Location 3 Hub',
    chargePoint: 'Charge Point Station 11',
    connector: 1,
    status: 'Ongoing',
    kwhDelivered: 14.23,
    cost: 177.50
  };

  const [resolvedStation, setResolvedStation] = useState(null);
  const [resolvedChargePoint, setResolvedChargePoint] = useState(null);
  const [resolving, setResolving] = useState(true);
  const [copiedSessionId, setCopiedSessionId] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setResolving(true);

    Promise.all([
      apiClient('/api/charging-stations').catch(() => []),
      apiClient('/api/charge-points').catch(() => [])
    ])
      .then(([stationsRes, chargePointsRes]) => {
        if (!isMounted) return;

        const stationsList = Array.isArray(stationsRes) ? stationsRes : (stationsRes?.data && Array.isArray(stationsRes.data) ? stationsRes.data : []);
        const chargePointsList = Array.isArray(chargePointsRes) ? chargePointsRes : (chargePointsRes?.data && Array.isArray(chargePointsRes.data) ? chargePointsRes.data : []);

        const targetStationId = sessionData.stationId || sessionData.chargingStationId;
        const searchName = sessionData.station?.trim().toLowerCase();
        let matchedStation = null;

        if (targetStationId) {
          matchedStation = stationsList.find(s => String(s.id) === String(targetStationId));
        }
        if (!matchedStation && searchName) {
          matchedStation = stationsList.find(s => s.name?.trim().toLowerCase() === searchName)
            || stationsList.find(s => s.name?.trim().toLowerCase().includes(searchName) || searchName.includes(s.name?.trim().toLowerCase()));
        }

        if (matchedStation) {
          setResolvedStation(matchedStation);
        }

        const targetCPId = sessionData.chargePointId;
        const searchCPName = sessionData.chargePoint?.trim().toLowerCase();
        let matchedCP = null;

        if (targetCPId) {
          matchedCP = chargePointsList.find(cp => String(cp.id) === String(targetCPId));
        }
        if (!matchedCP && searchCPName) {
          matchedCP = chargePointsList.find(cp => cp.name?.trim().toLowerCase() === searchCPName)
            || chargePointsList.find(cp => cp.name?.trim().toLowerCase().includes(searchCPName) || searchCPName.includes(cp.name?.trim().toLowerCase()));
        }

        if (matchedCP) {
          setResolvedChargePoint(matchedCP);
        }
      })
      .finally(() => {
        if (isMounted) setResolving(false);
      });

    return () => {
      isMounted = false;
    };
  }, [sessionData]);

  const handleStationClick = (e) => {
    e?.stopPropagation();
    const stationName = sessionData.station || 'Charging Station';
    const targetId = resolvedStation?.id || encodeURIComponent(stationName);
    const stationObj = resolvedStation || { name: stationName, id: targetId };
    navigate(`/charging-stations/${targetId}`, { state: { station: stationObj } });
  };

  const handleChargePointClick = (e) => {
    e?.stopPropagation();
    const cpName = sessionData.chargePoint || 'Charge Point';
    const targetId = resolvedChargePoint?.id || encodeURIComponent(cpName);
    const cpObj = resolvedChargePoint || { name: cpName, id: targetId };
    navigate(`/charge-points/${targetId}`, { state: { chargePoint: cpObj } });
  };

  const handleCopySessionId = () => {
    navigator.clipboard.writeText(sessionData.id);
    setCopiedSessionId(true);
    setTimeout(() => setCopiedSessionId(false), 2000);
  };

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const cpMock = {
    name: sessionData.chargePoint || 'Charge Point Station 11',
    code: `CP-${sessionData.id || '1042'}`
  };

  return (
    <div className="flex flex-col gap-4 max-w-[1400px] w-full mx-auto pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/live-sessions')}
            className="p-1 -ml-1 text-stone-600 hover:text-slate-950 hover:-translate-x-1 transition-all duration-150 cursor-pointer bg-transparent border-0 outline-none"
            title="Back to Live Sessions"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-stone-900 tracking-tight">
                Session #{sessionData.id} Logs
              </h1>

              <span
                className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 border ${
                  sessionData.status === 'Ongoing'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                {sessionData.status === 'Ongoing' && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                )}
                <span>{sessionData.status === 'Ongoing' ? 'Ongoing' : sessionData.status}</span>
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-stone-500 font-medium mt-0.5 flex-wrap">
              <span>Station:</span>
              <button
                onClick={handleStationClick}
                disabled={resolving}
                className="font-bold text-slate-800 hover:text-indigo-600 transition-colors cursor-pointer disabled:opacity-60 bg-transparent border-0 p-0 text-xs"
                title={`Open station details: ${sessionData.station}`}
              >
                {sessionData.station}
              </button>

              <span className="text-stone-300">•</span>

              <span>Charge Point:</span>
              <button
                onClick={handleChargePointClick}
                disabled={resolving}
                className="font-bold text-slate-800 hover:text-sky-700 transition-colors cursor-pointer disabled:opacity-60 bg-transparent border-0 p-0 text-xs"
                title={`Open charge point details: ${sessionData.chargePoint}`}
              >
                {sessionData.chargePoint}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-50/90 border border-stone-200/80 rounded-xl px-3 py-1.5 text-xs shadow-2xs">
            <UserIcon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span className="font-semibold text-stone-500">User:</span>
            <span className="font-bold text-stone-900">{sessionData.userName}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50/90 border border-stone-200/80 rounded-xl px-3 py-1.5 text-xs shadow-2xs">
            <Zap className="w-3.5 h-3.5 text-sky-500 shrink-0" />
            <span className="font-semibold text-stone-500">Energy:</span>
            <span className="font-mono font-bold text-stone-900">{sessionData.kwhDelivered || '14.23'} kWh</span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50/90 border border-stone-200/80 rounded-xl px-3 py-1.5 text-xs shadow-2xs">
            <CreditCard className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="font-semibold text-stone-500">Cost:</span>
            <span className="font-mono font-bold text-stone-900">₹{sessionData.cost ? parseFloat(sessionData.cost).toFixed(2) : '177.50'}</span>
          </div>

          <button
            onClick={handleCopySessionId}
            className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all duration-150 cursor-pointer shadow-2xs ${
              copiedSessionId
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-white hover:bg-stone-50 border-stone-200/90 text-stone-800'
            }`}
            title="Click to copy Session ID"
          >
            <div className="p-1 rounded-md bg-stone-100 text-stone-600 group-hover:bg-violet-100 group-hover:text-violet-700 transition-colors duration-150">
              <Hash className="w-3 h-3 stroke-[2.5]" />
            </div>
            <span className="font-semibold text-stone-500">ID:</span>
            <span className="font-mono font-bold tracking-tight">{sessionData.id}</span>

            {copiedSessionId ? (
              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5] animate-in zoom-in-75 duration-150 ml-0.5" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-stone-400 group-hover:text-violet-600 transition-colors duration-150 ml-0.5" />
            )}
          </button>

          <button
            onClick={handleManualRefresh}
            className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all duration-150 cursor-pointer shadow-2xs ${
              isRefreshing
                ? 'bg-sky-50 text-sky-700 border-sky-300'
                : 'bg-white hover:bg-stone-50 border-stone-200/90 text-stone-700 hover:text-slate-900'
            }`}
            title="Sync & refresh telemetry stream"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-sky-500 transition-transform duration-500 ${
                isRefreshing ? 'animate-spin text-sky-600' : 'group-hover:text-sky-600 group-hover:rotate-180'
              }`}
            />
            <span className="hidden sm:inline font-bold">
              {isRefreshing ? 'Syncing...' : 'Sync Logs'}
            </span>
          </button>
        </div>
      </div>

      <LogsTab cp={cpMock} sessionData={sessionData} />
    </div>
  );
}
