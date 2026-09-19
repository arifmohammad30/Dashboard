import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import BackButton from '../../../components/ui/BackButton';
import {
  BatteryCharging,
  Activity,
  Loader2,
  Edit
} from 'lucide-react';

import StationChargePointsTab from '../components/StationChargePointsTab';
import StationTransactionsTab from '../components/StationTransactionsTab';
import { getChargingStationById } from '../api/chargingStationService';
import { useToast } from '../../../context/ToastContext';
import { useSocketRoom } from '../../../hooks/useSocketRoom';


// Charging Station Details & Monitoring View Page

export default function ViewChargingStation() {

  // 1. URL Route Parameters & Room Subscriptions

  // Authoritative Charging Station primary ID extracted from URL path (/charging-stations/:id)
  const { id } = useParams();

  // Join targeted real-time WebSocket room 'chargingstation:<id>' with automatic unmount cleanup
  useSocketRoom(id ? `chargingstation:${id}` : null);

  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Prefetched station data passed via React Router navigation state (if available)
  const initialStation = location.state?.station;


  // 2. Tab Synchronization with URL Query Parameters

  // Valid active tab identifiers
  const validTabs = ['charge-points', 'transactions'];
  // Read active tab from URL query params (e.g., ?tab=transactions), fallback to 'charge-points'
  const tabFromUrl = searchParams.get('tab');
  const activeTab = validTabs.includes(tabFromUrl) ? tabFromUrl : 'charge-points';

  // Update URL search parameters when user toggles tabs
  const setActiveTab = (tabId) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('tab', tabId);
      return next;
    }, { replace: true, state: location.state });
  };


  // 3. Component State
  const [station, setStation] = useState(() => initialStation || null);
  const [loading, setLoading] = useState(() => !initialStation && Boolean(id));


  // 4. Lifecycle: Fetch Authoritative Station Details by ID
  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    if (!station) {
      setLoading(true);
    }

    getChargingStationById(id)
      .then((data) => {
        if (isMounted) {
          if (data && (data.name || data.code)) {
            setStation(prev => ({ ...(prev || {}), ...data }));
          } else {
            setStation(null);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to fetch charging station by ID:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);


  // 5. Loading State Render

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-[#4DA944]">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="text-sm font-bold text-stone-600">Loading charging station details...</p>
      </div>
    );
  }

  // Display labels with fallback defaults
  const stationName = station?.name || 'Charging Station';
  const stationCode = station?.code || '-';

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] w-full mx-auto pb-10">

      {/* Header: Back Button, Station Title, Code Badge, Action Controls */}

      <div className="shrink-0 space-y-2">
        <div>
          <BackButton to="/charging-stations" label="Back to Charging Stations" />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-0.5">
          {/* Station Title & Code Badge */}
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-stone-900 tracking-tight">{stationName}</h1>
            <span className="px-2.5 py-0.5 rounded-md bg-[#4DA944]/10 text-[#30702a] border border-[#4DA944]/20 font-mono font-bold text-xs">
              {stationCode}
            </span>
          </div>

          {/* Quick Action Controls: Edit Station */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Edit Station Navigation Button */}
            <button
              onClick={() => navigate(`/charging-stations/edit/${station?.id || id}`, { state: { station } })}
              className="flex items-center gap-2 px-4 py-2 bg-[#4DA944] hover:bg-[#43953b] text-slate-950 font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Edit className="w-4 h-4" />
              <span>Edit Details</span>
            </button>
          </div>
        </div>
      </div>


      {/* Main Tabbed Container: Charge Points & Live Transactions */}

      <div className="bg-white/70 backdrop-blur-2xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-[32px] overflow-hidden flex flex-col flex-1 min-h-0">
        {/* Tab Navigation Header */}
        <div className="shrink-0 px-6 pt-2 pb-0 bg-[#F8FAFC] border-b border-stone-200/80 overflow-x-auto md:overflow-x-visible flex items-end gap-1.5 z-10 scrollbar-none">
          {/* Charge Points Sub-Tab */}
          <button
            onClick={() => setActiveTab('charge-points')}
            className={`flex items-center gap-2.5 px-4.5 py-3 text-xs font-bold tracking-tight rounded-t-xl whitespace-nowrap cursor-pointer select-none relative -mb-px border-t border-x border-b-2 transition-colors duration-150 ${
              activeTab === 'charge-points'
                ? 'bg-white text-slate-900 border-t-stone-200/90 border-x-stone-200/90 border-b-[#4DA944] shadow-xs'
                : 'bg-transparent text-stone-500 hover:text-stone-800 hover:bg-stone-200/40 border-transparent'
            }`}
          >
            <BatteryCharging strokeWidth={2.25} className={`w-4 h-4 ${activeTab === 'charge-points' ? 'text-[#4DA944]' : 'text-stone-400'}`} />
            <span className="font-bold text-xs tracking-tight">Charge Points</span>
          </button>

          {/* Charge Transactions Sub-Tab */}
          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex items-center gap-2.5 px-4.5 py-3 text-xs font-bold tracking-tight rounded-t-xl whitespace-nowrap cursor-pointer select-none relative -mb-px border-t border-x border-b-2 transition-colors duration-150 ${
              activeTab === 'transactions'
                ? 'bg-white text-slate-900 border-t-stone-200/90 border-x-stone-200/90 border-b-[#4DA944] shadow-xs'
                : 'bg-transparent text-stone-500 hover:text-stone-800 hover:bg-stone-200/40 border-transparent'
            }`}
          >
            <Activity strokeWidth={2.25} className={`w-4 h-4 ${activeTab === 'transactions' ? 'text-[#4DA944]' : 'text-stone-400'}`} />
            <span className="font-bold text-xs tracking-tight">Charge Transactions</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 sm:p-8 flex-1 overflow-y-auto custom-scrollbar">
          {/* Charge Points List Filtered to this Station */}
          {activeTab === 'charge-points' && (
            <StationChargePointsTab stationId={station?.id || id} />
          )}

          {/* Realtime & Historical Charge Sessions Table */}
          {activeTab === 'transactions' && (
            <StationTransactionsTab station={station} />
          )}
        </div>
      </div>
    </div>
  );
}
