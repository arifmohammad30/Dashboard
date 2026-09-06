import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import BackButton from '../../../components/ui/BackButton';
import {
  ArrowLeft,
  Search,
  Download,
  Zap,
  BatteryCharging,
  Battery,
  Activity,
  Loader2,
  MapPin,
  Edit,
  Info,
  Eye,
  X,
  Calendar,
  ChevronDown,
  ChevronRight,
  Hash,
  Plug,
  CheckCircle2,
  IndianRupee,
  FileText,
  Clock,
  AlertCircle,
  Gauge,
  User as UserIcon,
  Tag,
  Layers,
  Shield,
  CreditCard,
  Cpu
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
    setSearchParams({ tab: tabId }, { replace: true });
  };


  // 3. Component State

  // Station metadata entity
  const [station, setStation] = useState(initialStation);
  // Loading indicator state: active if initialStation was not passed via state and ID exists
  const [loading, setLoading] = useState(!initialStation && Boolean(id));
  // Toggle for full station specification modal dialog
  const [showDetailsModal, setShowDetailsModal] = useState(false);


  // 4. Lifecycle: Fetch Authoritative Station Details by ID

  useEffect(() => {
    if (id) {
      setLoading(true);
      // Fetch authoritative station record directly by ID (no search fallbacks)
      getChargingStationById(id)
        .then((data) => {
          if (data && (data.name || data.code)) {
            setStation(data);
          } else {
            setStation(null);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch charging station by ID:", err);
          setStation(null);
        })
        .finally(() => setLoading(false));
    }
  }, [id]);


  // 5. Loading State Render

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-[#1EB8D4]">
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

      {/* Header: Back Button, Station Title, Code Badge, Action Buttons */}

      <div className="shrink-0 space-y-2">
        <div>
          <BackButton to="/charging-stations" label="Back to Charging Stations" />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-0.5">
          {/* Station Title & Code Badge */}
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-stone-900 tracking-tight">{stationName}</h1>
            <span className="px-2.5 py-0.5 rounded-md bg-[#1EB8D4]/10 text-[#148296] border border-[#1EB8D4]/20 font-mono font-bold text-xs">
              {stationCode}
            </span>
          </div>

          {/* Quick Action Buttons: Show Specifications Modal & Edit Station */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Show Details Modal Button */}
            <button
              onClick={() => setShowDetailsModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 font-semibold rounded-xl text-xs shadow-2xs transition-colors cursor-pointer"
            >
              <Eye className="w-4 h-4 text-sky-500 stroke-[2]" />
              <span>Show Details</span>
            </button>

            {/* Edit Station Navigation Button */}
            <button
              onClick={() => navigate(`/charging-stations/edit/${station?.id || id}`, { state: { station } })}
              className="flex items-center gap-2 px-4 py-2 bg-[#1EB8D4] hover:bg-[#19A5C0] text-slate-950 font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Edit className="w-4 h-4" />
              <span>Edit Details</span>
            </button>
          </div>
        </div>
      </div>


      {/* Main Tabbed Container: Charge Points & Live Transactions       */}

      <div className="bg-white/70 backdrop-blur-2xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-[32px] overflow-hidden flex flex-col flex-1 min-h-0">
        {/* Tab Navigation Header */}
        <div className="shrink-0 px-6 pt-3 pb-0 bg-[#F8FAFC] border-b border-stone-200/80 overflow-x-auto md:overflow-x-visible flex items-center gap-2.5 z-10 scrollbar-none">
          {/* Charge Points Sub-Tab */}
          <button
            onClick={() => setActiveTab('charge-points')}
            className={`flex items-center gap-2.5 px-4.5 py-3 text-xs font-bold tracking-tight transition-all duration-200 border-b-2 rounded-t-xl whitespace-nowrap cursor-pointer select-none relative ${activeTab === 'charge-points'
              ? 'border-b-2 border-b-[#1EB8D4] text-slate-900 bg-white border-t border-x border-stone-200/90 shadow-xs font-extrabold'
              : 'border-transparent text-stone-500 hover:text-stone-800 hover:bg-stone-100/60 font-medium'
              }`}
          >
            <BatteryCharging strokeWidth={2.25} className={`w-4 h-4 transition-transform ${activeTab === 'charge-points' ? 'text-[#1EB8D4] scale-105' : 'text-stone-400'
              }`} />
            <span className="font-bold text-xs tracking-tight">Charge Points</span>
          </button>

          {/* Charge Transactions Sub-Tab */}
          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex items-center gap-2.5 px-4.5 py-3 text-xs font-bold tracking-tight transition-all duration-200 border-b-2 rounded-t-xl whitespace-nowrap cursor-pointer select-none relative ${activeTab === 'transactions'
              ? 'border-b-2 border-b-[#1EB8D4] text-slate-900 bg-white border-t border-x border-stone-200/90 shadow-xs font-extrabold'
              : 'border-transparent text-stone-500 hover:text-stone-800 hover:bg-stone-100/60 font-medium'
              }`}
          >
            <Activity strokeWidth={2.25} className={`w-4 h-4 transition-transform ${activeTab === 'transactions' ? 'text-[#1EB8D4] scale-105' : 'text-stone-400'
              }`} />
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


      {/* Station Technical Specification & Geolocation Modal            */}

      {showDetailsModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-2xl w-full p-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#1EB8D4]/10 border border-[#1EB8D4]/20 flex items-center justify-center text-[#148296] font-bold">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-stone-900">{stationName}</h2>
                  <span className="text-xs font-bold text-[#148296] font-mono">{stationCode}</span>
                </div>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-1.5 text-stone-400 hover:text-stone-600 rounded-xl hover:bg-stone-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Specifications Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-2 text-xs">
              {/* Brand */}
              <div className="p-3 bg-stone-50/80 rounded-2xl border border-stone-100">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Brand</span>
                <span className="font-bold text-stone-800 mt-0.5 block">{station?.brand || '-'}</span>
              </div>

              {/* Mobility Type */}
              <div className="p-3 bg-stone-50/80 rounded-2xl border border-stone-100">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Mobility Type</span>
                <span className="font-bold text-stone-800 mt-0.5 block">{station?.mobilityType || '-'}</span>
              </div>

              {/* Category */}
              <div className="p-3 bg-stone-50/80 rounded-2xl border border-stone-100">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Category</span>
                <span className="font-bold text-stone-800 mt-0.5 block">{station?.category || '-'}</span>
              </div>

              {/* Street Address */}
              <div className="p-3 bg-stone-50/80 rounded-2xl border border-stone-100 col-span-2">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Address</span>
                <span className="font-bold text-stone-800 mt-0.5 block truncate">{station?.address || '-'}</span>
              </div>

              {/* State & Country */}
              <div className="p-3 bg-stone-50/80 rounded-2xl border border-stone-100">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">State / Country</span>
                <span className="font-bold text-stone-800 mt-0.5 block">{station?.state && station?.country ? `${station.state}, ${station.country}` : (station?.state || station?.country || '-')}</span>
              </div>

              {/* Geolocation Coordinates */}
              <div className="p-3 bg-stone-50/80 rounded-2xl border border-stone-100">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Geolocation</span>
                <span className="font-mono font-bold text-stone-800 mt-0.5 block">{station?.latitude && station?.longitude ? `${station.latitude}, ${station.longitude}` : '-'}</span>
              </div>

              {/* Grid Power Capacity */}
              <div className="p-3 bg-stone-50/80 rounded-2xl border border-stone-100">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Grid Power</span>
                <span className="font-bold text-stone-800 mt-0.5 block">{station?.gridPowerCapacity ? `${station.gridPowerCapacity} kW` : '-'}</span>
              </div>

              {/* Operating Hours / 24x7 Status */}
              <div className="p-3 bg-stone-50/80 rounded-2xl border border-stone-100">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Availability</span>
                <span className="font-bold text-stone-800 mt-0.5 block">{station?.open247 ? 'Open 24×7' : (station?.opensAt && station?.closesAt ? `${station.opensAt} - ${station.closesAt}` : '-')}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end pt-4 mt-3 border-t border-stone-100">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs shadow-xs transition cursor-pointer"
              >
                Close Station Specification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
