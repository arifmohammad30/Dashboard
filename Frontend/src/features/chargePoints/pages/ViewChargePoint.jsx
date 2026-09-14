import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import BackButton from '../../../components/ui/BackButton';
import ChargePointStatsTab from '../components/ChargePointStatsTab';
import ChargePointConnectorsTab from '../components/ChargePointConnectorsTab';
import ChargePointTransactionsTab from '../components/ChargePointTransactionsTab';
import ChargePointConfigTab from '../components/ChargePointConfigTab';
import ChargePointControlTab from '../components/ChargePointControlTab';
import ChargePointTariffsTab from '../components/ChargePointTariffsTab';
import {
  Edit,
  Activity,
  Plug,
  Zap,
  Settings,
  Sliders,
  Tag,
  Loader2,
  Info,
  QrCode
} from 'lucide-react';
import { getChargePointById } from '../api/chargePointService';
import { useToast } from '../../../context/ToastContext';

// Charge Point Details & Multi-Tab Monitoring Page
export default function ViewChargePoint({ defaultTab }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialData = location.state?.chargePoint;

  // 1. Tab Management & URL Synchronization
  const validTabs = ['stats', 'connectors', 'transactions', 'config', 'control', 'tariffs'];
  const tabFromUrl = searchParams.get('tab') || defaultTab;
  const activeTab = validTabs.includes(tabFromUrl) ? tabFromUrl : 'stats';

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId }, { replace: true });
  };

  // 2. Component State
  const [chargePoint, setChargePoint] = useState(initialData);
  const [loading, setLoading] = useState(!initialData && Boolean(id));

  // 3. Extract Connectors for Options & Count
  const cpObj = chargePoint || initialData || {};
  let rawConnArray = [];
  if (Array.isArray(cpObj.connectors)) {
    rawConnArray = cpObj.connectors;
  } else if (typeof cpObj.connectors === 'string' && cpObj.connectors.trim() !== '') {
    try {
      const parsed = JSON.parse(cpObj.connectors);
      rawConnArray = Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      rawConnArray = [];
    }
  } else {
    rawConnArray = [];
  }

  // Generate Connector ID options for Control Tab
  const connectorIdOptions = useMemo(() => {
    const opts = [{ value: 'All', label: 'All' }];
    rawConnArray.forEach((_, idx) => {
      const connId = String(idx + 1);
      opts.push({ value: connId, label: connId });
    });
    return opts;
  }, [rawConnArray.length]);

  // Toast feedback helper for control tab actions
  const handleControlAction = (msg) => {
    toast.success(msg, { code: 200 });
  };

  // 4. Lifecycle: Fetch Authoritative Charge Point Data by ID
  useEffect(() => {
    if (!initialData && id) {
      setLoading(true);
      getChargePointById(id)
        .then(data => setChargePoint(data))
        .catch((err) => {
          console.error("Failed to load charge point by ID:", err);
          setChargePoint(null);
        })
        .finally(() => setLoading(false));
    }
  }, [id, initialData]);

  // 5. Loading State
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-[#4DA944]">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="text-sm font-bold text-stone-600">Loading charge point details...</p>
      </div>
    );
  }

  // 6. Missing Entity Error State
  if (!chargePoint) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="w-12 h-12 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-400">
          <Info className="w-6 h-6" />
        </div>
        <p className="text-sm font-bold text-stone-700">Charge point record not found in database.</p>
        <BackButton to="/charge-points" label="Back to Charge Points" />
      </div>
    );
  }

  const cp = chargePoint;

  // Sub-tabs configuration
  const tabs = [
    { id: 'stats', label: 'Stats', icon: Activity },
    { id: 'connectors', label: 'Connectors', icon: Plug, count: rawConnArray.length },
    { id: 'transactions', label: 'Charge Transactions', icon: Zap },
    { id: 'config', label: 'Configuration', icon: Settings },
    { id: 'control', label: 'Control', icon: Sliders },
    { id: 'tariffs', label: 'Tariffs', icon: Tag },
  ];

  // Download QR Code Action
  const handleDownloadQR = () => {
    toast.success(`QR Code bundle downloaded for ${cp.name}`, { code: 200 });
  };

  return (
    <div className="flex flex-col gap-3 max-w-[1500px] w-full mx-auto h-[calc(100vh-115px)] overflow-hidden">
      {/* Top Header Bar: Back Button, Title, Live Status Badge, Actions */}
      <div className="shrink-0 space-y-2 px-1">
        <div>
          <BackButton to="/charge-points" label="Back to Charge Points" />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-0.5">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-stone-900 tracking-tight">
              {cp.name}
            </h1>

            {/* Status Badge */}
            <span className={`inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-xs font-medium border shadow-2xs ${cp.status === 'Available' ? 'bg-emerald-50/90 text-emerald-800 border-emerald-200/60' :
              cp.status === 'Charging' ? 'bg-blue-50/90 text-blue-700 border-blue-200/60' :
                cp.status === 'Preparing' ? 'bg-amber-50/90 text-amber-800 border-amber-200/60' :
                  'bg-red-50/90 text-red-700 border-red-200/60'
              }`}>
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cp.status === 'Available' ? 'bg-emerald-500' :
                cp.status === 'Charging' ? 'bg-blue-500 animate-pulse' :
                  cp.status === 'Preparing' ? 'bg-amber-500' :
                    'bg-red-500'
                }`} />
              {cp.status || 'Available'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Download QR Code Button */}
            <button
              onClick={handleDownloadQR}
              className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 font-semibold rounded-xl text-xs shadow-2xs transition-colors cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-purple-500" />
              <span>Download QR Code</span>
            </button>

            {/* Edit Charge Point Button */}
            <button
              onClick={() => navigate(`/charge-points/edit/${cp.id || id}`)}
              className="flex items-center gap-2 px-4 py-2 bg-[#4DA944] hover:bg-[#43953b] text-slate-950 font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Edit className="w-4 h-4" />
              <span>Edit Details</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Tabbed Container */}
      <div className="bg-white/80 backdrop-blur-2xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-2xl overflow-hidden flex flex-col flex-1 min-h-0">
        {/* Tab Navigation Header */}
        <div className="shrink-0 px-5 pt-2 pb-0 bg-[#F8FAFC] border-b border-stone-200/80 overflow-x-auto md:overflow-x-visible flex items-end gap-1.5 z-10 scrollbar-none">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => handleTabChange(t.id)}
                className={`flex items-center gap-2 px-4.5 py-3 text-xs font-bold tracking-tight rounded-t-xl whitespace-nowrap cursor-pointer select-none relative -mb-px border-t border-x border-b-2 transition-colors duration-150 ${
                  isActive
                    ? 'bg-white text-slate-900 border-t-stone-200/90 border-x-stone-200/90 border-b-[#4DA944] shadow-xs'
                    : 'bg-transparent text-stone-500 hover:text-stone-800 hover:bg-stone-200/40 border-transparent'
                }`}
              >
                <Icon strokeWidth={2.25} className={`w-4 h-4 ${isActive ? 'text-[#4DA944]' : 'text-stone-400'}`} />
                <span>{t.label}</span>
                {t.count !== undefined && (
                  <span className={`px-2 py-0.5 text-[11px] font-mono font-bold rounded transition-colors ${
                    isActive ? 'bg-[#4DA944]/10 text-[#30702a] border border-[#4DA944]/20' : 'bg-stone-100 text-stone-600 border border-stone-200/60'
                  }`}>
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="p-6 sm:p-8 flex-1 overflow-y-auto custom-scrollbar">
          {activeTab === 'stats' && (
            <ChargePointStatsTab cp={cp} />
          )}

          {activeTab === 'connectors' && (
            <ChargePointConnectorsTab
              cp={cp}
              id={id}
              onUpdate={(updatedCp) => setChargePoint(prev => ({ ...prev, ...updatedCp }))}
              handleControlAction={handleControlAction}
            />
          )}

          {activeTab === 'transactions' && (
            <ChargePointTransactionsTab cp={cp} />
          )}

          {activeTab === 'config' && (
            <ChargePointConfigTab cp={cp} id={id} handleControlAction={handleControlAction} />
          )}

          {activeTab === 'control' && (
            <ChargePointControlTab
              cp={cp}
              id={id}
              setChargePoint={setChargePoint}
              connectorIdOptions={connectorIdOptions}
              handleControlAction={handleControlAction}
            />
          )}

          {activeTab === 'tariffs' && (
            <ChargePointTariffsTab
              cp={cp}
              onUpdate={(updatedCp) => setChargePoint(prev => ({ ...prev, ...updatedCp }))}
            />
          )}
        </div>
      </div>
    </div>
  );
}
