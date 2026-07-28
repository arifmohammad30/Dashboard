import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
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

export default function ViewChargePoint() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialData = location.state?.chargePoint;

  const validTabs = ['stats', 'connectors', 'logs', 'transactions', 'config', 'control', 'tariffs'];
  const tabFromUrl = searchParams.get('tab');
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
        .catch(err => {
          console.error("Failed to load charge point:", err);
          alert("Charge point not found.");
          navigate('/charge-points');
        })
        .finally(() => setLoading(false));
    }
  }, [id, initialData, navigate]);

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
    const typeStr = c.includes('CCS2') ? 'CCS2' : c.includes('Type2') ? 'Type2' : '15A';
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
      <div className="shrink-0 space-y-2">
        <div>
          <button
            onClick={() => navigate('/charge-points')}
            className="inline-flex items-center gap-2.5 text-sm sm:text-base font-bold text-stone-800 hover:text-orange-600 transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-4.5 h-4.5 group-hover:-translate-x-1 transition-transform stroke-[2.25]" />
            <span>Back to list</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-0.5">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-stone-900 tracking-tight">
              {cp.name}
            </h1>

            <span className={`inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-xs font-medium border shadow-2xs ${
              cp.status === 'Available' ? 'bg-emerald-50/90 text-emerald-800 border-emerald-200/60' :
              cp.status === 'Charging' ? 'bg-blue-50/90 text-blue-700 border-blue-200/60' :
              cp.status === 'Preparing' ? 'bg-amber-50/90 text-amber-800 border-amber-200/60' :
              'bg-red-50/90 text-red-700 border-red-200/60'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                cp.status === 'Available' ? 'bg-emerald-500' :
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
        <div className="shrink-0 px-5 pt-2 pb-0 bg-[#F8FAFC] border-b border-stone-200/80 overflow-x-auto flex items-center gap-1.5 z-10">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => handleTabChange(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold tracking-tight transition-all duration-150 border-b-2 rounded-t-xl whitespace-nowrap cursor-pointer select-none relative -mb-[1px] ${
                  isActive
                    ? 'border-orange-500 text-slate-900 bg-white border-t border-x border-stone-200/90 shadow-2xs font-bold'
                    : 'border-transparent text-stone-500 hover:text-stone-900 hover:bg-stone-100/60 font-medium'
                }`}
              >
                <Icon strokeWidth={2.25} className={`w-4 h-4 transition-transform ${
                  isActive ? 'text-orange-500 scale-105' : 'text-stone-400'
                }`} />
                <span>{t.label}</span>
                {t.count !== undefined && (
                  <span className={`px-2 py-0.5 text-[11px] font-mono font-bold rounded transition-colors ${
                    isActive ? 'bg-orange-100/80 text-orange-700 border border-orange-200/60' : 'bg-stone-100 text-stone-600 border border-stone-200/60'
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
              <table className="w-full text-left text-sm border-separate border-spacing-y-1">
                <thead>
                  <tr className="bg-white/40 shadow-xs">
                    <th className="px-4 py-4 font-black text-stone-600 text-[12px] uppercase tracking-wider rounded-l-2xl whitespace-nowrap">
                      Actions
                    </th>
                    <th className="px-4 py-4 font-black text-stone-700 text-[12px] uppercase tracking-wider whitespace-nowrap">
                      Connector ID
                    </th>
                    <th className="px-4 py-4 font-black text-stone-700 text-[12px] uppercase tracking-wider whitespace-nowrap">
                      Connector Type
                    </th>
                    <th className="px-4 py-4 font-black text-stone-700 text-[12px] uppercase tracking-wider whitespace-nowrap">
                      QR Code
                    </th>
                    <th className="px-4 py-4 font-black text-stone-700 text-[12px] uppercase tracking-wider whitespace-nowrap">
                      Availability
                    </th>
                    <th className="px-4 py-4 font-black text-stone-700 text-[12px] uppercase tracking-wider whitespace-nowrap">
                      Status
                    </th>
                    <th className="px-4 py-4 font-black text-stone-700 text-[12px] uppercase tracking-wider whitespace-nowrap">
                      Error Code
                    </th>
                    <th className="px-4 py-4 font-black text-stone-700 text-[12px] uppercase tracking-wider rounded-r-2xl whitespace-nowrap">
                      Vendor Error Code
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {connectorRows.map((conn) => {
                    const isExpanded = Boolean(openDropdownIds[conn.id]);
                    return (
                      <React.Fragment key={conn.id}>
                        <tr className={`group border transition-all duration-200 rounded-2xl ${
                          isExpanded 
                            ? 'bg-sky-50/40 border-sky-200/80 shadow-xs' 
                            : 'bg-white/40 hover:bg-white/80 border-white/30'
                        }`}>
                          <td className="px-4 py-4 rounded-l-2xl whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleRowDropdown(conn.id);
                                }}
                                className={`p-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
                                  isExpanded
                                    ? 'bg-sky-500 text-white shadow-xs'
                                    : 'text-stone-600 hover:text-slate-900 hover:bg-white/80'
                                }`}
                                title="Connector Actions"
                              >
                                <ChevronDown strokeWidth={2.5} className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                              </button>

                              <button className="p-1.5 text-stone-600 hover:text-orange-500 rounded-lg hover:bg-white/80 transition cursor-pointer" title="Edit Connector">
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
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold border ${
                              conn.type === 'CCS2' ? 'bg-sky-50/90 text-sky-700 border-sky-200/80' :
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
                            <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-xs font-medium border shadow-2xs ${
                              conn.availability === 'Inoperative'
                                ? 'bg-red-50/90 text-red-700 border-red-200/60'
                                : 'bg-emerald-50/90 text-emerald-800 border-emerald-200/60'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                conn.availability === 'Inoperative' ? 'bg-red-500' : 'bg-emerald-500'
                              }`} />
                              {conn.availability}
                            </span>
                          </td>

                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-xs font-medium border shadow-2xs ${
                              conn.status === 'Available' ? 'bg-emerald-50/90 text-emerald-800 border-emerald-200/60' :
                              conn.status === 'Charging' ? 'bg-blue-50/90 text-blue-700 border-blue-200/60' :
                              conn.status === 'Preparing' ? 'bg-amber-50/90 text-amber-800 border-amber-200/60' :
                              'bg-red-50/90 text-red-700 border-red-200/60'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                conn.status === 'Available' ? 'bg-emerald-500' :
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
                                  className={`px-4 py-2 rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer flex items-center gap-2 active:scale-95 border ${
                                    (conn.availability === 'Inoperative' || conn.status === 'Faulted')
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/50 border border-white/70 p-6 rounded-2xl shadow-xs">
                <div className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Total Energy Delivered</div>
                <div className="text-3xl font-extrabold text-emerald-600">{cp.energyDelivered || 42.44} kWh</div>
              </div>
              <div className="bg-white/50 border border-white/70 p-6 rounded-2xl shadow-xs">
                <div className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Total Revenue Generated</div>
                <div className="text-3xl font-extrabold text-amber-600">₹{cp.revenueGenerated || 579.95}</div>
              </div>
              <div className="bg-white/50 border border-white/70 p-6 rounded-2xl shadow-xs">
                <div className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Total Charging Sessions</div>
                <div className="text-3xl font-extrabold text-indigo-600">{cp.totalSessions || 2}</div>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-stone-200/50">
                <h3 className="font-extrabold text-stone-800 text-sm">Real-time OCPP Logs</h3>
                <span className="text-xs text-stone-500 font-medium">Live Event Stream</span>
              </div>
              <div className="bg-stone-900 text-emerald-400 font-mono text-xs p-5 rounded-2xl min-h-[100px] shadow-inner flex items-center justify-center text-stone-500">
                <p className="font-bold text-stone-400">No active log entries recorded.</p>
              </div>
            </div>
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
              <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs hover:border-stone-300 transition-all flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 mb-4 flex items-center gap-2">
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

              <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs hover:border-stone-300 transition-all flex flex-col justify-between">
                <div className="space-y-3">
                  <h3 className="text-sm font-extrabold text-slate-900 mb-4 flex items-center gap-2">
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
                    onClick={() => handleControlAction('Firmware update scheduled successfully.')}
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-2xs transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" /> Update
                  </button>
                </div>
              </div>

              <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs hover:border-stone-300 transition-all flex flex-col justify-between">
                <div className="space-y-3">
                  <h3 className="text-sm font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-purple-500" /> Charge Point local ID Tag list management
                  </h3>
                  <div>
                    <label className="text-xs font-bold text-stone-600 mb-1.5 block">Update type <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <select
                        value={localTagUpdateType}
                        onChange={(e) => setLocalTagUpdateType(e.target.value)}
                        className="w-full px-3.5 pr-8 py-2 bg-stone-50 border border-stone-200 text-stone-900 rounded-xl text-xs font-bold focus:bg-white focus:border-slate-800 focus:outline-none appearance-none transition-all cursor-pointer"
                      >
                        <option value="">Select an Update Type</option>
                        <option value="Differential">Differential</option>
                        <option value="Full">Full</option>
                      </select>
                      <ChevronDown strokeWidth={2.5} className="w-3.5 h-3.5 text-stone-500 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-600 mb-1.5 block">ID Tags</label>
                    <div className="relative">
                      <select
                        value={localTagIdTags}
                        onChange={(e) => setLocalTagIdTags(e.target.value)}
                        className="w-full px-3.5 pr-8 py-2 bg-stone-50 border border-stone-200 text-stone-900 rounded-xl text-xs font-bold focus:bg-white focus:border-slate-800 focus:outline-none appearance-none transition-all cursor-pointer"
                      >
                        <option value="">Select ID Tags</option>
                        <option value="TAG-001">TAG-001 (VIP Access)</option>
                        <option value="TAG-002">TAG-002 (Fleet Access)</option>
                        <option value="TAG-003">TAG-003 (Operator Key)</option>
                      </select>
                      <ChevronDown strokeWidth={2.5} className="w-3.5 h-3.5 text-stone-500 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                    </div>
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

              <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs hover:border-stone-300 transition-all flex flex-col justify-between">
                <div className="space-y-3">
                  <h3 className="text-sm font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" /> Send trigger message to Charge Point
                  </h3>
                  <div>
                    <label className="text-xs font-bold text-stone-600 mb-1.5 block">Trigger message <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <select
                        value={triggerMessage}
                        onChange={(e) => setTriggerMessage(e.target.value)}
                        className="w-full px-3.5 pr-8 py-2 bg-stone-50 border border-stone-200 text-stone-900 rounded-xl text-xs font-bold focus:bg-white focus:border-slate-800 focus:outline-none appearance-none transition-all cursor-pointer"
                      >
                        <option value="">Select a trigger message</option>
                        <option value="BootNotification">BootNotification</option>
                        <option value="DiagnosticsStatusNotification">DiagnosticsStatusNotification</option>
                        <option value="FirmwareStatusNotification">FirmwareStatusNotification</option>
                        <option value="Heartbeat">Heartbeat</option>
                        <option value="MeterValues">MeterValues</option>
                        <option value="StatusNotification">StatusNotification</option>
                      </select>
                      <ChevronDown strokeWidth={2.5} className="w-3.5 h-3.5 text-stone-500 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-600 mb-1.5 block">Connector Id <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <select
                        value={triggerConnectorId}
                        onChange={(e) => setTriggerConnectorId(e.target.value)}
                        className="w-full px-3.5 pr-8 py-2 bg-stone-50 border border-stone-200 text-stone-900 rounded-xl text-xs font-bold focus:bg-white focus:border-slate-800 focus:outline-none appearance-none transition-all cursor-pointer"
                      >
                        <option value="All">All</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                      </select>
                      <ChevronDown strokeWidth={2.5} className="w-3.5 h-3.5 text-stone-500 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                    </div>
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

              <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs hover:border-stone-300 transition-all flex flex-col justify-between">
                <div className="space-y-3">
                  <h3 className="text-sm font-extrabold text-slate-900 mb-4 flex items-center gap-2">
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

              <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs hover:border-stone-300 transition-all flex flex-col justify-between">
                <div className="space-y-3">
                  <h3 className="text-sm font-extrabold text-slate-900 mb-4 flex items-center gap-2">
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

              <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs hover:border-stone-300 transition-all flex flex-col justify-between col-span-1 lg:col-span-2">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 mb-4 flex items-center gap-2">
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
            <div className="bg-white/50 border border-white/70 p-6 rounded-2xl space-y-3">
              <h4 className="font-extrabold text-stone-800 text-sm">Assigned Tariff Profile</h4>
              <p className="text-xs text-stone-500 font-bold">Profile: {cp.tariffProfiles || 'Standard Rate'}</p>
              <div className="text-2xl font-extrabold text-orange-600">₹15.00 / kWh</div>
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
