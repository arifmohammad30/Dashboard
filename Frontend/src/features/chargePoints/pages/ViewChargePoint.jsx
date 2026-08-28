import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import BackButton from '../../../components/ui/BackButton';
import Select from '../../../components/ui/Select';
import ChargePointStatsTab from '../components/ChargePointStatsTab';
import ChargePointConnectorsTab from '../components/ChargePointConnectorsTab';
import ChargePointTransactionsTab from '../components/ChargePointTransactionsTab';
import ChargePointConfigTab from '../components/ChargePointConfigTab';
import ChargePointControlTab from '../components/ChargePointControlTab';
import ChargePointTariffsTab from '../components/ChargePointTariffsTab';
import {
  ArrowLeft,
  Edit,
  Download,
  Activity,
  Plug,
  ListFilter,
  Zap,
  Settings,
  Sliders,
  Tag,
  Eye,
  Loader2,
  ChevronRight,
  ChevronDown,
  Power,
  RefreshCw,
  RotateCcw,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Clock,
  DollarSign,
  QrCode,
  Play,
  Shield,
  Layers,
  MapPin,
  Factory,
  Calendar,
  Send,
  FileText,
  Database,
  UploadCloud,
  Cpu,
  KeyRound,
  Trash2,
  Sparkles
} from 'lucide-react';
import { getChargePointById, updateChargePoint } from '../api/chargePointService';
import { useToast } from '../../../context/ToastContext';
import { apiClient } from '../../../lib/apiClient';

export default function ViewChargePoint({ defaultTab }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialData = location.state?.chargePoint;

  const validTabs = ['stats', 'connectors', 'transactions', 'config', 'control', 'tariffs'];
  const tabFromUrl = searchParams.get('tab') || defaultTab;
  const activeTab = validTabs.includes(tabFromUrl) ? tabFromUrl : 'stats';

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId }, { replace: true });
  };

  const [chargePoint, setChargePoint] = useState(initialData);
  const [loading, setLoading] = useState(!initialData && Boolean(id));
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const [openDropdownIds, setOpenDropdownIds] = useState({});
  const [connectorStatusMap, setConnectorStatusMap] = useState({});

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


  const connectorIdOptions = useMemo(() => {
    const opts = [{ value: 'All', label: 'All' }];
    rawConnArray.forEach((_, idx) => {
      const connId = String(idx + 1);
      opts.push({ value: connId, label: connId });
    });
    return opts;
  }, [rawConnArray.length]);

  const toggleRowDropdown = (id) => {
    setOpenDropdownIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleControlAction = (msg) => {
    toast.success(msg, { code: 200 });
  };

  useEffect(() => {
    if (!initialData && id) {
      setLoading(true);
      getChargePointById(id)
        .then(data => setChargePoint(data))
        .catch(async (err) => {
          console.warn("Could not load charge point by ID directly, attempting name search lookup:", err);
          try {
            const decoded = decodeURIComponent(id);
            const res = await apiClient(`/charge-points?search=${encodeURIComponent(decoded)}`);
            const list = Array.isArray(res) ? res : (res?.data && Array.isArray(res.data) ? res.data : []);
            if (list.length > 0) {
              setChargePoint(list[0]);
              return;
            }
          } catch { }
          setChargePoint(null);
        })
        .finally(() => setLoading(false));
    }
  }, [id, initialData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-orange-500">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="text-sm font-bold text-stone-600">Loading station details...</p>
      </div>
    );
  }

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


  const isOffline = cp.stage === 'Inactive' || cp.stage === 'Offline';

  let rawConnectors = [];
  if (Array.isArray(cp.connectors)) {
    rawConnectors = cp.connectors;
  } else if (typeof cp.connectors === 'string' && cp.connectors.trim() !== '') {
    try {
      const parsed = JSON.parse(cp.connectors);
      rawConnectors = Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      rawConnectors = [];
    }
  } else {
    rawConnectors = [];
  }


  const connectorRows = rawConnectors.map((c, index) => {
    const connId = index + 1;
    const cStr = typeof c === 'string' ? c : (c?.type || c?.name || String(c || ''));
    const typeStr = cStr.includes('CCS2') ? 'CCS2' : cStr.includes('Type2') ? 'Type2' : (c?.type || '15A');
    const qrStr = `CQ${(cp.code || 'XYZ').replace(/[^A-Z0-9]/gi, '')}${connId}1GYMY`.slice(0, 10).toUpperCase();

    const currentOverride = connectorStatusMap[connId];
    const isInoperative = currentOverride === 'Faulted' || (currentOverride === undefined && (cp.status === 'Faulted' || isOffline));

    let currentAvailability = isInoperative ? 'Inoperative' : 'Operative';
    let currentStatus = isInoperative ? 'Faulted' : (currentOverride || cp.status || 'Available');

    return {
      id: connId,
      type: typeStr,
      qrCode: qrStr,
      availability: currentAvailability,
      status: currentStatus,
      error: currentStatus === 'Faulted' ? 'OtherError' : 'NoError',
      vendorError: currentStatus === 'Faulted' ? 'EmergencyPressed' : 'None'
    };
  });

  const tabs = [
    { id: 'stats', label: 'Stats', icon: Activity },
    { id: 'connectors', label: 'Connectors', icon: Plug, count: connectorRows.length },
    { id: 'transactions', label: 'Charge Transactions', icon: Zap },
    { id: 'config', label: 'Configuration', icon: Settings },
    { id: 'control', label: 'Control', icon: Sliders },
    { id: 'tariffs', label: 'Tariffs', icon: Tag },
  ];

  const handleDownloadQR = () => {
    toast.success(`QR Code bundle downloaded for ${cp.name}`, { code: 200 });
  };

  return (
    <div className="flex flex-col gap-3 max-w-[1500px] w-full mx-auto h-[calc(100vh-115px)] overflow-hidden">
      <div className="shrink-0 space-y-2 px-1">
        <div>
          <BackButton to="/charge-points" label="Back to Charge Points" />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-0.5">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-stone-900 tracking-tight">
              {cp.name}
            </h1>

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


            <button
              onClick={handleDownloadQR}
              className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 font-semibold rounded-xl text-xs shadow-2xs transition-colors cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-purple-500" />
              <span>Download QR Code</span>
            </button>

            <button
              onClick={() => navigate(`/charge-points/edit/${cp.id || id}`, { state: { chargePoint: cp } })}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Edit className="w-4 h-4" />
              <span>Edit Details</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-2xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-2xl overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="shrink-0 px-5 pt-2 pb-0 bg-[#F8FAFC] border-b border-stone-200/80 overflow-x-auto md:overflow-x-visible flex items-center gap-1.5 z-10 scrollbar-none">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => handleTabChange(t.id)}
                className={`flex items-center gap-2 px-4.5 py-3 text-xs font-bold tracking-tight transition-all duration-150 border-b-2 rounded-t-xl whitespace-nowrap cursor-pointer select-none relative ${isActive
                  ? 'border-b-2 border-b-orange-500 text-slate-900 bg-white border-t border-x border-stone-200/90 shadow-2xs font-extrabold'
                  : 'border-transparent text-stone-500 hover:text-stone-900 hover:bg-stone-100/60 font-medium'
                  }`}
              >
                <Icon strokeWidth={2.25} className={`w-4 h-4 transition-transform ${isActive ? 'text-orange-500 scale-105' : 'text-stone-400'
                  }`} />
                <span>{t.label}</span>
                {t.count !== undefined && (
                  <span className={`px-2 py-0.5 text-[11px] font-mono font-bold rounded transition-colors ${isActive ? 'bg-orange-100/80 text-orange-700 border border-orange-200/60' : 'bg-stone-100 text-stone-600 border border-stone-200/60'
                    }`}>
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="p-6 sm:p-8 flex-1 overflow-y-auto custom-scrollbar">
          {activeTab === 'connectors' && (
            <ChargePointConnectorsTab
              cp={cp}
              id={id}
              onUpdate={(updatedCp) => setChargePoint(prev => ({ ...prev, ...updatedCp }))}
              handleControlAction={handleControlAction}
            />
          )}

          {activeTab === 'stats' && (
            <ChargePointStatsTab cp={cp} />
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
