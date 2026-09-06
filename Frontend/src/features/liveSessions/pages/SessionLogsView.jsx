import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LogsTab from '../components/LogsTab';
import {
  ArrowLeft,
  Copy,
  Check,
  User as UserIcon,
  Zap,
  CreditCard,
  Hash,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { getSessionById } from '../api/sessionService';
import { getTxId } from '../utils/sessionFormatters';

// Container view for inspecting telemetry and OCPP protocol logs for a specific session
export default function SessionLogsView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedSessionId, setCopiedSessionId] = useState(false);

  // Fetch real authoritative session details by ID from backend
  useEffect(() => {
    if (!id) {
      setError('No session ID provided');
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    getSessionById(id)
      .then(res => {
        if (!isMounted) return;
        if (res && res.id) {
          setSessionData(res);
          setError(null);
        } else {
          setError('Session not found');
        }
      })
      .catch(err => {
        if (!isMounted) return;
        console.error('[SessionLogsView] Error fetching session details:', err);
        setError(err.message || 'Failed to load session details');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Authoritative Station and Charge Point fields from backend contract
  const stationDisplayName = sessionData?.station || '-';
  const cpDisplayName = sessionData?.chargePointName || '-';

  // Authoritative foreign key IDs from backend contract
  const stationId = sessionData?.chargingStationId;
  const chargePointId = sessionData?.chargePointId;

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
    if (sessionData?.id) {
      navigator.clipboard.writeText(sessionData.id);
      setCopiedSessionId(true);
      setTimeout(() => setCopiedSessionId(false), 2000);
    }
  };

  // Loading state
  if (loading && !sessionData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] gap-3 text-stone-500">
        <RefreshCw className="w-6 h-6 animate-spin text-sky-500" />
        <span className="text-xs font-semibold">Loading session details...</span>
      </div>
    );
  }

  // Error state
  if (error && !sessionData) {
    return (
      <div className="max-w-[1500px] w-full mx-auto p-6">
        <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-medium">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          <div className="flex-1">
            <h3 className="font-bold text-sm text-rose-900">Session Error</h3>
            <p>{error}</p>
          </div>
          <button
            onClick={() => navigate('/live-sessions')}
            className="px-3 py-1.5 bg-white border border-rose-200 hover:bg-rose-100 text-rose-800 font-bold rounded-xl transition cursor-pointer"
          >
            Back to Live Sessions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3.5 max-w-[1500px] w-full mx-auto pb-8">
      {/* Top header with session details */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-stone-900 transition-all cursor-pointer border border-stone-200/80 shrink-0"
            title="Go Back"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.2]" />
          </button>

          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-extrabold text-stone-900 tracking-tight">
                Session {sessionData ? getTxId(sessionData) : ''} Logs
              </h1>

              {sessionData?.status && (
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 border shadow-2xs ${
                    sessionData.status === 'Ongoing'
                      ? 'bg-cyan-50 text-cyan-800 border-cyan-200/80'
                      : sessionData.status === 'Failed'
                      ? 'bg-rose-50 text-rose-700 border-rose-200/80'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {sessionData.status === 'Ongoing' && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                    </span>
                  )}
                  <span>{sessionData.status}</span>
                </span>
              )}
            </div>

            {/* Breadcrumb info with clickable Station and Charge Point */}
            <div className="flex items-center gap-2 text-xs text-stone-500 font-medium flex-wrap">
              <span className="font-semibold text-stone-600">Logs</span>
              <span className="text-stone-300">•</span>

              <span>Station:</span>
              {stationId ? (
                <button
                  onClick={handleStationClick}
                  className="font-bold text-slate-800 hover:text-sky-600 transition-colors cursor-pointer bg-transparent border-0 p-0 text-xs"
                  title={`Open station details: ${stationDisplayName}`}
                >
                  {stationDisplayName}
                </button>
              ) : (
                <span className="font-bold text-slate-800">{stationDisplayName}</span>
              )}

              <span className="text-stone-300">•</span>

              <span>Charge Point:</span>
              {chargePointId ? (
                <button
                  onClick={handleChargePointClick}
                  className="font-bold text-slate-800 hover:text-sky-600 transition-colors cursor-pointer bg-transparent border-0 p-0 text-xs"
                  title={`Open charge point details: ${cpDisplayName}`}
                >
                  {cpDisplayName}
                </button>
              ) : (
                <span className="font-bold text-slate-800">{cpDisplayName}</span>
              )}
            </div>
          </div>
        </div>

        {/* Metric pills on the right */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* User / Driver Name */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-stone-200/80 rounded-xl px-3 py-1.5 text-xs shadow-2xs">
            <UserIcon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span className="font-semibold text-stone-500">User:</span>
            <span className="font-bold text-stone-900">{sessionData?.userName || '-'}</span>
          </div>

          {/* Energy Delivered */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-stone-200/80 rounded-xl px-3 py-1.5 text-xs shadow-2xs">
            <Zap className="w-3.5 h-3.5 text-sky-500 shrink-0" />
            <span className="font-semibold text-stone-500">Energy:</span>
            <span className="font-mono font-bold text-stone-900">
              {sessionData?.kwhDelivered != null
                ? `${Number(sessionData.kwhDelivered).toFixed(2)} kWh`
                : '-'}
            </span>
          </div>

          {/* Total Cost */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-stone-200/80 rounded-xl px-3 py-1.5 text-xs shadow-2xs">
            <CreditCard className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
            <span className="font-semibold text-stone-500">Cost:</span>
            <span className="font-mono font-bold text-stone-900">
              {sessionData?.cost != null
                ? `₹${Number(sessionData.cost).toFixed(2)}`
                : '-'}
            </span>
          </div>

          {/* Copyable Session ID */}
          {sessionData?.id && (
            <button
              onClick={handleCopySessionId}
              className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all duration-150 cursor-pointer shadow-2xs ${
                copiedSessionId
                  ? 'bg-cyan-50 text-cyan-800 border-cyan-300'
                  : 'bg-white hover:bg-stone-50 border-stone-200/90 text-stone-800'
              }`}
              title="Click to copy full Session ID"
            >
              <div className="p-1 rounded-md bg-stone-100 text-stone-600 group-hover:bg-violet-100 group-hover:text-violet-700 transition-colors duration-150">
                <Hash className="w-3 h-3 stroke-[2.5]" />
              </div>
              <span className="font-semibold text-stone-500">ID:</span>
              <span className="font-mono font-bold tracking-tight text-[11px] max-w-[120px] truncate">{sessionData.id}</span>

              {copiedSessionId ? (
                <Check className="w-3.5 h-3.5 text-cyan-600 stroke-[2.5] animate-in zoom-in-75 duration-150 ml-0.5" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-stone-400 group-hover:text-violet-600 transition-colors duration-150 ml-0.5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Telemetry and OCPP logs table */}
      <LogsTab sessionData={sessionData} sessionId={id} />
    </div>
  );
}
