import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import BackButton from '../../components/ui/BackButton';
import Select from '../../components/ui/Select';
import ChargePointStatsTab from '../../components/ChargePointStatsTab';
import ChargePointLogsTab from '../../components/ChargePointLogsTab';
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
import { getChargePointById, updateChargePoint } from '../../services/chargePointService';
import { useSocketEvents } from '../../hooks/useSocketEvents';
import { useToast } from '../../context/ToastContext';

export default function ViewChargePoint({ defaultTab }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialData = location.state?.chargePoint;

  const validTabs = ['stats', 'connectors', 'logs', 'transactions', 'config', 'control', 'tariffs'];
  const tabFromUrl = searchParams.get('tab') || (location.pathname.endsWith('/logs') ? 'logs' : defaultTab);
  const activeTab = validTabs.includes(tabFromUrl) ? tabFromUrl : 'stats';

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId }, { replace: true });
  };

  const [chargePoint, setChargePoint] = useState(initialData);
  const [loading, setLoading] = useState(!initialData && Boolean(id));
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const [firmwareUrl, setFirmwareUrl] = useState('');
  const [firmwareDate, setFirmwareDate] = useState('');

  const [localTagUpdateType, setLocalTagUpdateType] = useState('');
  const [localTagIdTags, setLocalTagIdTags] = useState('');

  const [triggerMessage, setTriggerMessage] = useState('');
  const [triggerConnectorId, setTriggerConnectorId] = useState('All');

  const [diagUrl, setDiagUrl] = useState('');
  const [diagRetries, setDiagRetries] = useState('');
  const [diagInterval, setDiagInterval] = useState('');
  const [diagStartDate, setDiagStartDate] = useState('');
  const [diagEndDate, setDiagEndDate] = useState('');

  const [dataVendorId, setDataVendorId] = useState('');
  const [dataMessageId, setDataMessageId] = useState('');
  const [dataPayload, setDataPayload] = useState('');

  const [actionFeedback, setActionFeedback] = useState(null);
  const [openDropdownIds, setOpenDropdownIds] = useState({});
  const [connectorStatusMap, setConnectorStatusMap] = useState({});

  const cpObj = chargePoint || initialData || {};
  let rawConnArray = [];
  if (Array.isArray(cpObj.connectors) && cpObj.connectors.length > 0) {
    rawConnArray = cpObj.connectors;
  } else if (typeof cpObj.connectors === 'string' && cpObj.connectors.trim() !== '') {
    try {
      const parsed = JSON.parse(cpObj.connectors);
      rawConnArray = Array.isArray(parsed) && parsed.length > 0 ? parsed : [cpObj.connectors];
    } catch (e) {
      rawConnArray = [cpObj.connectors];
    }
  } else {
    rawConnArray = ['15A (1)', '15A (2)', '15A (3)'];
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

  useSocketEvents({
    chargePointUpdated: (updatedCp) => {
      if (updatedCp && (updatedCp.id === id || updatedCp.id === chargePoint?.id)) {
        setChargePoint(prev => ({ ...prev, ...updatedCp }));
      }
    }
  });

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
          } catch {}
          setChargePoint(prev => prev || { name: decodeURIComponent(id), code: 'CP-001' });
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

  const cp = chargePoint || {
    name: 'Techops Testing',
    stage: 'Inactive',
    code: 'CP-1001',
    cpId: 'CP25R63RV8',
    chargingStation: 'Sobha Chrysanthemum, Bengaluru',
    manufacturer: 'Siemens',
    type: 'AC',
    mode: 'Public',
    accessibility: 'Public',
    exclusive: 'Exclusive',
    gracePeriod: 10,
    tariffProfiles: 'Standard Rate',
    settlementProfile: 'Monthly',
    connectors: ['15A (1)', '15A (2)', '15A (3)'],
    totalSessions: 2,
    energyDelivered: 42.44,
    revenueGenerated: 579.95,
    firmwareVersion: '2.0.2 & 1.2.6',
    totalCapacity: '9.9 kW',
    lastActive: '10 mins ago'
  };

  const isOffline = cp.stage === 'Inactive' || cp.stage === 'Offline';

  let rawConnectors = [];
  if (Array.isArray(cp.connectors) && cp.connectors.length > 0) {
    rawConnectors = cp.connectors;
  } else if (typeof cp.connectors === 'string' && cp.connectors.trim() !== '') {
    try {
      const parsed = JSON.parse(cp.connectors);
      rawConnectors = Array.isArray(parsed) && parsed.length > 0 ? parsed : [cp.connectors];
    } catch (e) {
      rawConnectors = [cp.connectors];
    }
  } else {
    rawConnectors = ['15A (1)', '15A (2)', '15A (3)'];
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
    { id: 'logs', label: 'Logs', icon: ListFilter },
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
              onClick={() => setShowDetailsModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 font-semibold rounded-xl text-xs shadow-2xs transition-colors cursor-pointer"
            >
              <Eye className="w-4 h-4 text-sky-500" />
              <span>Show Details</span>
            </button>

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
            <div className="overflow-x-auto pb-36 transform-gpu translate-z-0">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#F8FAFC] border-b border-stone-200">
                  <tr className="bg-[#F8FAFC]">
                    <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                      Actions
                    </th>
                    <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                      Connector ID
                    </th>
                    <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                      Connector Type
                    </th>
                    <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                      QR Code
                    </th>
                    <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                      Availability
                    </th>
                    <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                      Status
                    </th>
                    <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                      Error Code
                    </th>
                    <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                      Vendor Error Code
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200/70 bg-white text-xs font-medium">
                  {connectorRows.map((conn) => {
                    const isExpanded = Boolean(openDropdownIds[conn.id]);
                    return (
                      <React.Fragment key={conn.id}>
                        <tr className={`group transition-all duration-150 ${isExpanded
                            ? 'bg-sky-50/70 font-semibold'
                            : 'hover:bg-[#F8FAFF]'
                          }`}>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleRowDropdown(conn.id);
                                }}
                                className={`p-1.5 rounded-lg transition-all duration-200 cursor-pointer ${isExpanded
                                    ? 'bg-sky-500 text-white shadow-xs'
                                    : 'text-stone-600 hover:text-slate-900 hover:bg-white/80'
                                  }`}
                                title="Connector Actions"
                              >
                                <ChevronDown strokeWidth={2.5} className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/charge-points/${cp?.id || id}/connectors/${conn.id}/edit`, {
                                    state: { conn, cpData: cp }
                                  });
                                }}
                                className="p-1.5 text-stone-600 hover:text-orange-500 rounded-lg hover:bg-white/80 transition cursor-pointer"
                                title="Edit Connector"
                              >
                                <Edit strokeWidth={2.5} className="w-3.5 h-3.5" />
                              </button>
                              <button className="p-1.5 text-stone-600 hover:text-purple-500 rounded-lg hover:bg-white/80 transition cursor-pointer" title="QR View">
                                <QrCode strokeWidth={2.5} className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>

                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="font-bold text-stone-800 text-[13px]">{conn.id}</span>
                          </td>

                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold border ${conn.type === 'CCS2' ? 'bg-sky-50/90 text-sky-700 border-sky-200/80' :
                                conn.type === 'Type2' ? 'bg-purple-50/90 text-purple-700 border-purple-200/80' :
                                  'bg-amber-50/90 text-amber-700 border-amber-200/80'
                              }`}>
                              {conn.type}
                            </span>
                          </td>

                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="font-mono text-stone-600 text-[13px] font-medium">{conn.qrCode}</span>
                          </td>

                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-xs font-medium border shadow-2xs ${conn.availability === 'Inoperative'
                                ? 'bg-red-50/90 text-red-700 border-red-200/60'
                                : 'bg-emerald-50/90 text-emerald-800 border-emerald-200/60'
                              }`}>
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${conn.availability === 'Inoperative' ? 'bg-red-500' : 'bg-emerald-500'
                                }`} />
                              {conn.availability}
                            </span>
                          </td>

                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-xs font-medium border shadow-2xs ${conn.status === 'Available' ? 'bg-emerald-50/90 text-emerald-800 border-emerald-200/60' :
                                conn.status === 'Charging' ? 'bg-blue-50/90 text-blue-700 border-blue-200/60' :
                                  conn.status === 'Preparing' ? 'bg-amber-50/90 text-amber-800 border-amber-200/60' :
                                    'bg-red-50/90 text-red-700 border-red-200/60'
                              }`}>
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${conn.status === 'Available' ? 'bg-emerald-500' :
                                  conn.status === 'Charging' ? 'bg-blue-500 animate-pulse' :
                                    conn.status === 'Preparing' ? 'bg-amber-500' :
                                      'bg-red-500'
                                }`} />
                              {conn.status}
                            </span>
                          </td>

                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-stone-100 text-stone-500 border border-stone-200">
                              {conn.error}
                            </span>
                          </td>

                          <td className="px-4 py-4 rounded-r-2xl whitespace-nowrap">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-stone-100 text-stone-500 border border-stone-200">
                              {conn.vendorError}
                            </span>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="animate-in fade-in slide-in-from-top-1 duration-150">
                            <td colSpan="8" className="px-4 pt-1 pb-3">
                              <div className="flex items-center gap-3 pl-1">
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    const isCurrentlyInoperative = conn.availability === 'Inoperative' || conn.status === 'Faulted';
                                    const newStatus = isCurrentlyInoperative ? 'Available' : 'Faulted';
                                    const isStageDisabled = cp.stage === 'Inactive' || cp.stage === 'Maintenance';
                                    const newStage = isStageDisabled && isCurrentlyInoperative ? 'Active' : (cp.stage || 'Active');

                                    setConnectorStatusMap(prev => ({ ...prev, [conn.id]: newStatus }));

                                    const targetId = cp.id || id;
                                    if (targetId) {
                                      try {
                                        const updated = await updateChargePoint(targetId, { status: newStatus, stage: newStage });
                                        if (updated) {
                                          setChargePoint(prev => ({ ...prev, ...updated }));
                                        }
                                      } catch (err) {
                                        console.error('Failed to update DB:', err);
                                      }
                                    }

                                    handleControlAction(`Connector #${conn.id} availability updated to ${newStatus === 'Available' ? 'Operative' : 'Inoperative'}.`);
                                  }}
                                  className={`px-4 py-2 rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer flex items-center gap-2 active:scale-95 border ${(conn.availability === 'Inoperative' || conn.status === 'Faulted')
                                      ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200/90 shadow-emerald-500/10'
                                      : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200/90 shadow-rose-500/10'
                                    }`}
                                >
                                  <Power strokeWidth={2.5} className="w-3.5 h-3.5" />
                                  <span>{(conn.availability === 'Inoperative' || conn.status === 'Faulted') ? 'Change to Operative' : 'Change to Inoperative'}</span>
                                </button>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleControlAction(`Connector ${conn.id} status requested successfully.`);
                                  }}
                                  className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-black rounded-xl text-xs shadow-md shadow-sky-500/20 transition-all cursor-pointer flex items-center gap-2 active:scale-95"
                                >
                                  <Activity strokeWidth={2.5} className="w-3.5 h-3.5" />
                                  <span>Get Connector Status</span>
                                </button>

                                {conn.availability !== 'Inoperative' && conn.status !== 'Faulted' && conn.status !== 'Offline' && conn.status !== 'Unavailable' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleControlAction(`Remote Start Charging initiated for Connector #${conn.id}.`);
                                    }}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-2 active:scale-95"
                                  >
                                    <Play strokeWidth={2.5} className="w-3.5 h-3.5 fill-current" />
                                    <span>Start Charging</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'stats' && (
            <ChargePointStatsTab cp={cp} />
          )}

          {activeTab === 'logs' && (
            <ChargePointLogsTab cp={cp} />
          )}

          {activeTab === 'transactions' && (
            <div className="text-stone-500 text-center py-12">
              <Zap className="w-10 h-10 text-stone-300 mx-auto mb-3" />
              <p className="font-bold text-sm">No active charge transactions for this point.</p>
            </div>
          )}

          {activeTab === 'config' && (
            <div>
              <button
                onClick={() => handleControlAction('Charger configuration fetched successfully.')}
                className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-extrabold rounded-xl text-xs shadow-md shadow-indigo-500/20 active:scale-95 transition-all duration-200 cursor-pointer flex items-center gap-2"
              >
                <RefreshCw strokeWidth={2.5} className="w-4 h-4 text-white" /> Fetch charger configuration
              </button>
            </div>
          )}

          {activeTab === 'control' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 pb-3 mb-4 border-b border-stone-200/80 flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-orange-500" /> Reset Charge Point
                  </h3>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => handleControlAction('Soft Reset command sent to charge point.')}
                      className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 font-bold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-stone-600" /> Soft Reset
                    </button>
                    <button
                      onClick={() => handleControlAction('Hard Reset command sent to charge point.')}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Hard Reset
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
                <div className="space-y-3">
                  <h3 className="text-sm font-extrabold text-slate-900 pb-3 mb-4 border-b border-stone-200/80 flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-sky-500" /> Update Charge Point firmware
                  </h3>
                  <div>
                    <label className="text-xs font-bold text-stone-600 mb-1.5 block">Firmware URL <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      placeholder="Paste firmware URL"
                      value={firmwareUrl}
                      onChange={(e) => setFirmwareUrl(e.target.value)}
                      className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 text-stone-900 rounded-xl text-xs font-medium focus:bg-white focus:border-slate-800 focus:outline-none transition-all shadow-2xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-600 mb-1.5 block">Scheduled date of firmware update</label>
                    <input
                      type="date"
                      value={firmwareDate}
                      onChange={(e) => setFirmwareDate(e.target.value)}
                      className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 text-stone-900 rounded-xl text-xs font-medium focus:bg-white focus:border-slate-800 focus:outline-none transition-all shadow-2xs"
                    />
                  </div>
                </div>
                <div className="pt-4">
                  <button
                    onClick={async () => {
                      const newVersion = firmwareUrl.trim() || 'v2.1.0';
                      setChargePoint(prev => ({ ...prev, firmwareVersion: newVersion }));

                      const targetId = cp.id || id;
                      if (targetId) {
                        try {
                          await updateChargePoint(targetId, { firmwareVersion: newVersion });
                        } catch (err) {
                          console.error("Failed to update firmware version in DB:", err);
                        }
                      }

                      toast.success(`Firmware URL updated to "${newVersion}" for Charge Point #${targetId}`, { code: 200 });
                      handleControlAction(`Firmware version updated to ${newVersion}. Notification sent.`);
                    }}
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-2xs transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" /> Update
                  </button>
                </div>
              </div>

              <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
                <div className="space-y-3">
                  <h3 className="text-sm font-extrabold text-slate-900 pb-3 mb-4 border-b border-stone-200/80 flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-purple-500" /> Charge Point local ID Tag list management
                  </h3>
                  <div>
                    <label className="text-xs font-bold text-stone-600 mb-1.5 block">Update type <span className="text-rose-500">*</span></label>
                    <Select
                      options={[
                        { value: 'Differential', label: 'Differential' },
                        { value: 'Full', label: 'Full' }
                      ]}
                      value={localTagUpdateType}
                      onChange={(e) => setLocalTagUpdateType(e.target.value)}
                      placeholder="Select an Update Type"
                      buttonClassName="py-2 px-3.5 text-xs bg-stone-50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-600 mb-1.5 block">ID Tags</label>
                    <Select
                      options={[
                        { value: 'TAG-001', label: 'TAG-001 (VIP Access)' },
                        { value: 'TAG-002', label: 'TAG-002 (Fleet Access)' },
                        { value: 'TAG-003', label: 'TAG-003 (Operator Key)' }
                      ]}
                      value={localTagIdTags}
                      onChange={(e) => setLocalTagIdTags(e.target.value)}
                      placeholder="Select ID Tags"
                      buttonClassName="py-2 px-3.5 text-xs bg-stone-50"
                    />
                  </div>
                </div>
                <div className="pt-4">
                  <button
                    onClick={() => handleControlAction('Local ID Tag list update message sent.')}
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-2xs transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" /> Update
                  </button>
                </div>
              </div>

              <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
                <div className="space-y-3">
                  <h3 className="text-sm font-extrabold text-slate-900 pb-3 mb-4 border-b border-stone-200/80 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" /> Send trigger message to Charge Point
                  </h3>
                  <div>
                    <label className="text-xs font-bold text-stone-600 mb-1.5 block">Trigger message <span className="text-rose-500">*</span></label>
                    <Select
                      options={[
                        { value: 'BootNotification', label: 'BootNotification' },
                        { value: 'DiagnosticsStatusNotification', label: 'DiagnosticsStatusNotification' },
                        { value: 'FirmwareStatusNotification', label: 'FirmwareStatusNotification' },
                        { value: 'Heartbeat', label: 'Heartbeat' },
                        { value: 'MeterValues', label: 'MeterValues' },
                        { value: 'StatusNotification', label: 'StatusNotification' }
                      ]}
                      value={triggerMessage}
                      onChange={(e) => setTriggerMessage(e.target.value)}
                      placeholder="Select a trigger message"
                      buttonClassName="py-2 px-3.5 text-xs bg-stone-50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-600 mb-1.5 block">Connector Id <span className="text-rose-500">*</span></label>
                    <Select
                      options={connectorIdOptions}
                      value={triggerConnectorId}
                      onChange={(e) => setTriggerConnectorId(e.target.value)}
                      placeholder="Select Connector Id"
                      buttonClassName="py-2 px-3.5 text-xs bg-stone-50"
                    />
                  </div>
                </div>
                <div className="pt-4">
                  <button
                    onClick={() => handleControlAction('Trigger message sent successfully.')}
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-2xs transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" /> Send
                  </button>
                </div>
              </div>

              <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
                <div className="space-y-3">
                  <h3 className="text-sm font-extrabold text-slate-900 pb-3 mb-4 border-b border-stone-200/80 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-500" /> Get Diagnostics Report
                  </h3>
                  <div>
                    <label className="text-xs font-bold text-stone-600 mb-1.5 block">URL to upload the charge Point file</label>
                    <input
                      type="text"
                      placeholder="Enter URL"
                      value={diagUrl}
                      onChange={(e) => setDiagUrl(e.target.value)}
                      className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 text-stone-900 rounded-xl text-xs font-medium focus:bg-white focus:border-slate-800 focus:outline-none transition-all shadow-2xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-stone-600 mb-1.5 block">Number of retries</label>
                      <input
                        type="number"
                        placeholder="Number of retries"
                        value={diagRetries}
                        onChange={(e) => setDiagRetries(e.target.value)}
                        className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 text-stone-900 rounded-xl text-xs font-medium focus:bg-white focus:border-slate-800 focus:outline-none transition-all shadow-2xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-stone-600 mb-1.5 block">Retry interval (seconds)</label>
                      <input
                        type="number"
                        placeholder="Enter retry interval"
                        value={diagInterval}
                        onChange={(e) => setDiagInterval(e.target.value)}
                        className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 text-stone-900 rounded-xl text-xs font-medium focus:bg-white focus:border-slate-800 focus:outline-none transition-all shadow-2xs"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-stone-600 mb-1.5 block">Start date of diagnostics logs</label>
                      <input
                        type="date"
                        value={diagStartDate}
                        onChange={(e) => setDiagStartDate(e.target.value)}
                        className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 text-stone-900 rounded-xl text-xs font-medium focus:bg-white focus:border-slate-800 focus:outline-none transition-all shadow-2xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-stone-600 mb-1.5 block">End date of diagnostics logs</label>
                      <input
                        type="date"
                        value={diagEndDate}
                        onChange={(e) => setDiagEndDate(e.target.value)}
                        className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 text-stone-900 rounded-xl text-xs font-medium focus:bg-white focus:border-slate-800 focus:outline-none transition-all shadow-2xs"
                      />
                    </div>
                  </div>
                </div>
                <div className="pt-4">
                  <button
                    onClick={() => handleControlAction('Diagnostics report request initiated.')}
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-2xs transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" /> Send
                  </button>
                </div>
              </div>

              <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
                <div className="space-y-3">
                  <h3 className="text-sm font-extrabold text-slate-900 pb-3 mb-4 border-b border-stone-200/80 flex items-center gap-2">
                    <Database className="w-4 h-4 text-indigo-500" /> Send data transfer message to Charge Point
                  </h3>
                  <div>
                    <label className="text-xs font-bold text-stone-600 mb-1.5 block">Vendor ID <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      placeholder="Enter Vendor ID"
                      value={dataVendorId}
                      onChange={(e) => setDataVendorId(e.target.value)}
                      className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 text-stone-900 rounded-xl text-xs font-medium focus:bg-white focus:border-slate-800 focus:outline-none transition-all shadow-2xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-600 mb-1.5 block">Message ID</label>
                    <input
                      type="text"
                      placeholder="Enter Message ID"
                      value={dataMessageId}
                      onChange={(e) => setDataMessageId(e.target.value)}
                      className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 text-stone-900 rounded-xl text-xs font-medium focus:bg-white focus:border-slate-800 focus:outline-none transition-all shadow-2xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-600 mb-1.5 block">Data</label>
                    <textarea
                      rows={2}
                      placeholder="Enter Data"
                      value={dataPayload}
                      onChange={(e) => setDataPayload(e.target.value)}
                      className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 text-stone-900 rounded-xl text-xs font-medium focus:bg-white focus:border-slate-800 focus:outline-none transition-all shadow-2xs"
                    />
                  </div>
                </div>
                <div className="pt-4">
                  <button
                    onClick={() => handleControlAction('Data transfer message sent.')}
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-2xs transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" /> Send
                  </button>
                </div>
              </div>

              <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs flex flex-col justify-between col-span-1 lg:col-span-2">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 pb-3 mb-4 border-b border-stone-200/80 flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-rose-500" /> Send clear cache message to Charge Point
                  </h3>
                  <div>
                    <button
                      onClick={() => handleControlAction('Clear cache message sent to charge point.')}
                      className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs shadow-2xs transition-all cursor-pointer flex items-center gap-2"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Clear Cache
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tariffs' && (
            <div className="bg-white/70 backdrop-blur-2xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-[28px] p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-200/80 pb-3 mb-2">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-orange-500" />
                  <h4 className="font-extrabold text-stone-800 text-sm uppercase tracking-wider">Assigned Tariff Profile</h4>
                </div>
                <span className="px-2.5 py-0.5 text-xs font-mono font-bold bg-orange-50 text-orange-700 border border-orange-200/60 rounded-full">
                  Active Profile
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-stone-50/80 hover:bg-orange-50/50 border border-stone-200/80 hover:border-orange-300 rounded-2xl transition-all duration-200 group/tariff">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">Tariff Name</span>
                  <button
                    onClick={() => {
                      const tariffName = cp.tariffProfiles || 'Standard Rate';
                      navigate(`/tariffs?search=${encodeURIComponent(tariffName)}`);
                    }}
                    className="text-base font-extrabold text-stone-900 group-hover/tariff:text-orange-600 transition-colors cursor-pointer flex items-center gap-2 text-left"
                    title="Click to view full tariff details in Tariffs list"
                  >
                    <span>{cp.tariffProfiles || 'Standard Rate'}</span>
                    <ChevronRight className="w-4 h-4 text-stone-400 group-hover/tariff:text-orange-500 group-hover/tariff:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-md">
          <div className="bg-white/80 backdrop-blur-2xl border border-white/70 shadow-2xl rounded-3xl w-full max-w-lg p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-stone-200/50 pb-4">
              <h3 className="text-xl font-extrabold text-stone-800">Station Specifications</h3>
              <button onClick={() => setShowDetailsModal(false)} className="text-stone-400 hover:text-stone-700 font-bold cursor-pointer">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-stone-400 font-bold text-xs uppercase block">Name</span><span className="font-bold text-stone-800">{cp.name}</span></div>
              <div><span className="text-stone-400 font-bold text-xs uppercase block">Code</span><span className="font-mono font-bold text-rose-500">{cp.code}</span></div>
              <div><span className="text-stone-400 font-bold text-xs uppercase block">CP ID</span><span className="font-mono font-bold text-orange-500">{cp.cpId}</span></div>
              <div><span className="text-stone-400 font-bold text-xs uppercase block">Manufacturer</span><span className="font-bold text-stone-800">{cp.manufacturer}</span></div>
              <div>
                <span className="text-stone-400 font-bold text-xs uppercase block">Charging Station</span>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    navigate(`/charging-stations/${cp.chargingStationId || encodeURIComponent(cp.chargingStation)}`, { state: { station: { name: cp.chargingStation, id: cp.chargingStationId } } });
                  }}
                  className="font-bold text-sky-600 hover:text-sky-800 transition-colors duration-200 cursor-pointer text-left block"
                >
                  {cp.chargingStation}
                </button>
              </div>
              <div><span className="text-stone-400 font-bold text-xs uppercase block">Mode</span><span className="font-bold text-stone-800">{cp.mode}</span></div>
              <div><span className="text-stone-400 font-bold text-xs uppercase block">Stage</span><span className="font-bold text-stone-800">{cp.stage}</span></div>
              <div><span className="text-stone-400 font-bold text-xs uppercase block">Firmware</span><span className="font-mono font-bold text-stone-800">{cp.firmwareVersion}</span></div>
            </div>
            <button onClick={() => setShowDetailsModal(false)} className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl shadow-md cursor-pointer">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
