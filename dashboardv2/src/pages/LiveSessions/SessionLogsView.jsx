
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import ChargePointLogsTab from '../../components/ChargePointLogsTab';
import { ArrowLeft, ExternalLink, Loader2 } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';

export default function SessionLogsView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const sessionData = location.state?.session || {
    id: id || '1042',
    userInitials: 'B',
    userName: 'B108901020',
    station: 'Lodha The Park, Mumbai',
    chargePoint: 'EVRE Lodha The Park AC1',
    connector: 1,
    status: 'Ongoing',
    kwhDelivered: 14.2,
    cost: 177.50
  };

  // Resolved entities for deep-linking
  const [station, setStation] = useState(null);
  const [chargePoint, setChargePoint] = useState(null);
  const [resolving, setResolving] = useState(true);

  useEffect(() => {
    // Fetch all charging stations & charge points,
    // then match by name to get the complete objects.
    Promise.all([
      apiClient('/api/charging-stations').catch(() => []),
      apiClient('/api/charge-points').catch(() => [])
    ])
      .then(([stations, chargePoints]) => {
        // Match charging station by name
        const matchedStation = (stations || []).find(
          (s) =>
            s.name?.trim().toLowerCase() ===
            sessionData.station?.trim().toLowerCase()
        );

        if (matchedStation) {
          setStation(matchedStation);
        }

        // Match charge point by name
        const matchedChargePoint = (chargePoints || []).find(
          (cp) =>
            cp.name?.trim().toLowerCase() ===
            sessionData.chargePoint?.trim().toLowerCase()
        );

        if (matchedChargePoint) {
          setChargePoint(matchedChargePoint);
        }
      })
      .finally(() => setResolving(false));
  }, [sessionData.station, sessionData.chargePoint]);

  const handleStationClick = () => {
    if (station?.id) {
      // Same behavior as ChargingStationsList
      navigate(`/charging-stations/${station.id}`, {
        state: {
          station: station
        }
      });
    } else {
      navigate(
        `/charging-stations?search=${encodeURIComponent(
          sessionData.station
        )}`
      );
    }
  };

  const handleChargePointClick = () => {
    if (chargePoint?.id) {
      // Same behavior as ChargePointsList
      navigate(`/charge-points/${chargePoint.id}`, {
        state: {
          chargePoint: chargePoint
        }
      });
    } else {
      navigate(
        `/charge-points?search=${encodeURIComponent(
          sessionData.chargePoint
        )}`
      );
    }
  };

  const cpMock = {
    name: sessionData.chargePoint || 'EVRE Lodha The Park AC1',
    code: `CP-${sessionData.id || '1042'}`
  };

  return (
    <div className="flex flex-col gap-4 max-w-[1400px] w-full mx-auto pb-6">

      {/* Top Navigation & Action Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/live-sessions')}
          className="w-9 h-9 rounded-xl bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
          title="Back to Live Sessions"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <h1 className="text-xl font-extrabold text-stone-900">
            OCPP Telemetry & Protocol Logs
          </h1>

          <span className="text-sm font-bold text-stone-500">
            Session #{sessionData.id}
          </span>

          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${sessionData.status === 'Ongoing'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-stone-100 text-stone-600 border border-stone-200'
              }`}
          >
            {sessionData.status}
          </span>
        </div>
      </div>

      <p className="text-sm text-stone-500">
        Live OCPP 1.6J frame exchange and telemetry logs for session #
        {sessionData.id}
      </p>

      {/* Session Quick Details Header Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">

        {/* User Card */}
        <div className="bg-white border border-stone-200/90 rounded-2xl p-4 shadow-2xs">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-1.5">
            User
          </span>

          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 text-xs font-extrabold flex items-center justify-center shrink-0">
              {sessionData.userInitials || 'U'}
            </div>

            <span className="font-extrabold text-stone-900 text-sm truncate">
              {sessionData.userName}
            </span>
          </div>
        </div>

        {/* Charging Station Card */}
        <div className="bg-white border border-stone-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Charging Station
            </span>
          </div>

          <button
            onClick={handleStationClick}
            disabled={resolving}
            className="font-extrabold text-sky-600 hover:text-sky-800 text-sm truncate block text-left hover:underline underline-offset-2 transition-colors cursor-pointer bg-transparent border-0 p-0 disabled:cursor-wait disabled:opacity-70"
            title={`Go to: ${sessionData.station}`}
          >
            {sessionData.station}
          </button>
        </div>

        {/* Charge Point Card */}
        <div className="bg-white border border-stone-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Charge Point
            </span>
          </div>

          <button
            onClick={handleChargePointClick}
            disabled={resolving}
            className="font-extrabold text-sky-600 hover:text-sky-800 text-sm truncate block text-left hover:underline underline-offset-2 transition-colors cursor-pointer bg-transparent border-0 p-0 disabled:cursor-wait disabled:opacity-70"
            title={`Go to: ${sessionData.chargePoint}`}
          >
            {sessionData.chargePoint}
          </button>
        </div>

        {/* Energy Delivered Card */}
        <div className="bg-white border border-stone-200/90 rounded-2xl p-4 shadow-2xs">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-1.5">
            Energy Delivered
          </span>

          <span className="font-extrabold text-sky-700 text-sm font-mono">
            {sessionData.kwhDelivered || 14.2} kWh
          </span>
        </div>

        {/* Session Cost Card */}
        <div className="bg-white border border-stone-200/90 rounded-2xl p-4 shadow-2xs col-span-2 sm:col-span-1">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-1.5">
            Session Cost
          </span>

          <span className="font-extrabold text-emerald-700 text-sm font-mono">
            ₹
            {sessionData.cost
              ? parseFloat(sessionData.cost).toFixed(2)
              : '177.50'}
          </span>
        </div>
      </div>

      {/* Main Interactive Logs Component */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs">
        <ChargePointLogsTab cp={cpMock} />
      </div>
    </div>
  );
}
