import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
import { getChargePointById } from '../../services/chargePointService';

export default function ViewChargePoint() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const initialData = location.state?.chargePoint;

  const [chargePoint, setChargePoint] = useState(initialData);
  const [loading, setLoading] = useState(!initialData && Boolean(id));
  const [activeTab, setActiveTab] = useState('control'); // 'control' active view
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Control Tab Form States
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

  const handleControlAction = (msg) => {
    setActionFeedback(msg);
    setTimeout(() => {
      setActionFeedback(null);
    }, 4000);
  };

  // Fetch charge point if loaded directly or refreshed
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

  // Build connector table rows dynamically based on cp.connectors
  const rawConnectors = Array.isArray(cp.connectors) && cp.connectors.length > 0 
    ? cp.connectors 
    : ['15A (1)', '15A (2)', '15A (3)'];

  const connectorRows = rawConnectors.map((c, index) => {
    const connId = index + 1;
    const typeStr = c.includes('CCS2') ? 'CCS2' : c.includes('Type2') ? 'Type2' : '15A';
    const qrStr = `CQ${(cp.code || 'XYZ').replace(/[^A-Z0-9]/gi, '')}${connId}1GYMY`.slice(0, 10).toUpperCase();
    return {
      id: connId,
      type: typeStr,
      qrCode: qrStr,
      availability: 'Operative',
      status: 'Faulted',
      error: 'OtherError',
      vendorError: 'EmergencyPressed'
    };
  });

  const tabs = [
    { 
      id: 'stats', 
      label: 'Stats', 
      icon: Activity, 
      activeBorder: 'border-emerald-500', 
      activeText: 'text-emerald-600', 
      activeIcon: 'text-emerald-500',
      badgeActive: 'bg-emerald-500 text-white'
    },
    { 
      id: 'connectors', 
      label: 'Connectors', 
      icon: Plug, 
      count: connectorRows.length,
      activeBorder: 'border-sky-500', 
      activeText: 'text-sky-600', 
      activeIcon: 'text-sky-500',
      badgeActive: 'bg-sky-500 text-white'
    },
    { 
      id: 'logs', 
      label: 'Logs', 
      icon: ListFilter,
      activeBorder: 'border-purple-500', 
      activeText: 'text-purple-600', 
      activeIcon: 'text-purple-500',
      badgeActive: 'bg-purple-500 text-white'
    },
    { 
      id: 'transactions', 
      label: 'Charge Transactions', 
      icon: Zap,
      activeBorder: 'border-amber-500', 
      activeText: 'text-amber-600', 
      activeIcon: 'text-amber-500',
      badgeActive: 'bg-amber-500 text-white'
    },
    { 
      id: 'config', 
      label: 'Configuration', 
      icon: Settings,
      activeBorder: 'border-indigo-500', 
      activeText: 'text-indigo-600', 
      activeIcon: 'text-indigo-500',
      badgeActive: 'bg-indigo-500 text-white'
    },
    { 
      id: 'control', 
      label: 'Control', 
      icon: Sliders,
      activeBorder: 'border-orange-500', 
      activeText: 'text-orange-600', 
      activeIcon: 'text-orange-500',
      badgeActive: 'bg-orange-500 text-white'
    },
    { 
      id: 'tariffs', 
      label: 'Tariffs', 
      icon: Tag,
      activeBorder: 'border-teal-500', 
      activeText: 'text-teal-600', 
      activeIcon: 'text-teal-500',
      badgeActive: 'bg-teal-500 text-white'
    },
  ];

  const handleDownloadQR = () => {
    alert(`Downloading QR Code bundle for ${cp.name}...`);
  };

  return (
    <div className="flex flex-col gap-3 max-w-[1500px] w-full mx-auto h-[calc(100vh-115px)] overflow-hidden">
      {/* Top Back Button & Main Header (Fixed / Static at top) */}
      <div className="shrink-0 space-y-3">
        <div>
          <button
            onClick={() => navigate('/charge-points')}
            className="inline-flex items-center gap-2 text-sm font-bold text-stone-600 hover:text-orange-600 transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to list
          </button>
        </div>

        {/* Main Page Title & Actions Card */}
        <div className="bg-white/70 backdrop-blur-2xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-[28px] p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {cp.name}
            </h1>
            <span className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-extrabold border shadow-xs ${
              isOffline ? 'bg-rose-50/90 text-rose-600 border-rose-200/80 shadow-[0_0_12px_rgba(244,63,94,0.15)]' : 'bg-emerald-50/90 text-emerald-600 border-emerald-200/80 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
            }`}>
              <span className={`w-2 h-2 rounded-full mr-2 ${isOffline ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`} />
              {isOffline ? 'Offline' : 'Online'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowDetailsModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/70 hover:bg-white border border-stone-200/80 text-stone-700 font-bold rounded-xl text-xs shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 active:scale-95 cursor-pointer"
            >
              <Eye className="w-4 h-4 text-blue-500" />
              Show Details
            </button>

            <button
              onClick={handleDownloadQR}
              className="flex items-center gap-2 px-4 py-2 bg-white/70 hover:bg-white border border-stone-200/80 text-stone-700 font-bold rounded-xl text-xs shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 active:scale-95 cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-purple-500" />
              Download QR Code
            </button>

            <button
              onClick={() => navigate(`/charge-points/edit/${cp.id || id}`, { state: { chargePoint: cp } })}
              className="flex items-center gap-2 px-4 py-2 bg-white/70 hover:bg-white border border-stone-200/80 text-stone-700 font-bold rounded-xl text-xs shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 active:scale-95 cursor-pointer"
            >
              <Edit className="w-4 h-4 text-orange-500" />
              Edit Details
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation & Content Glass Card Container */}
      <div className="bg-white/70 backdrop-blur-2xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-[32px] overflow-hidden flex flex-col flex-1 min-h-0">
        {/* Tab Header Bar (Static & Fixed at top of Tab container) */}
        <div className="shrink-0 px-6 pt-3 pb-0 bg-white/60 backdrop-blur-xl border-b border-white/60 overflow-x-auto flex items-center gap-2 z-10">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2.5 px-5 py-3.5 text-sm font-black transition-all duration-300 border-b-2 whitespace-nowrap cursor-pointer rounded-t-2xl relative ${
                  isActive
                    ? `${t.activeBorder} ${t.activeText} bg-white/95 shadow-[0_-4px_12px_rgba(0,0,0,0.02)]`
                    : 'border-transparent text-stone-500 hover:text-stone-800 hover:bg-white/40'
                }`}
              >
                <Icon className={`w-4 h-4 transition-transform duration-300 ${
                  isActive ? `${t.activeIcon} scale-110` : 'text-stone-400 group-hover:text-stone-600'
                }`} />
                <span>{t.label}</span>
                {t.count !== undefined && (
                  <span className={`px-2 py-0.5 text-[11px] rounded-full font-bold transition-colors ${
                    isActive ? t.badgeActive : 'bg-stone-200/70 text-stone-600'
                  }`}>
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content Body (Independently Scrollable Container!) */}
        <div className="p-6 sm:p-8 flex-1 overflow-y-auto custom-scrollbar">
          {/* TAB 1: CONNECTORS */}
          {activeTab === 'connectors' && (
            <div className="overflow-x-auto">
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
                      Error
                    </th>
                    <th className="px-4 py-4 font-black text-stone-700 text-[12px] uppercase tracking-wider rounded-r-2xl whitespace-nowrap">
                      Vendor Error
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {connectorRows.map((conn) => (
                    <tr
                      key={conn.id}
                      className="group bg-white/40 hover:bg-white/80 border border-white/30 transition duration-200 rounded-2xl"
                    >
                      {/* Actions Column */}
                      <td className="px-4 py-4 rounded-l-2xl whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-white/80 transition">
                            <ChevronDown className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 text-stone-400 hover:text-orange-500 rounded-lg hover:bg-white/80 transition" title="Edit Connector">
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button className="p-1.5 text-stone-400 hover:text-purple-500 rounded-lg hover:bg-white/80 transition" title="QR View">
                            <QrCode className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Connector ID */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="font-bold text-stone-800 text-[13px]">{conn.id}</span>
                      </td>

                      {/* Connector Type */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold border ${
                          conn.type === 'CCS2' ? 'bg-sky-50/90 text-sky-700 border-sky-200/80' :
                          conn.type === 'Type2' ? 'bg-purple-50/90 text-purple-700 border-purple-200/80' :
                          'bg-amber-50/90 text-amber-700 border-amber-200/80'
                        }`}>
                          {conn.type}
                        </span>
                      </td>

                      {/* QR Code */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="font-mono text-stone-600 text-[13px] font-medium">{conn.qrCode}</span>
                      </td>

                      {/* Availability */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                          {conn.availability}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                          {conn.status}
                        </span>
                      </td>

                      {/* Error */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-stone-100 text-stone-500 border border-stone-200">
                          {conn.error}
                        </span>
                      </td>

                      {/* Vendor Error */}
                      <td className="px-4 py-4 rounded-r-2xl whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-stone-100 text-stone-500 border border-stone-200">
                          {conn.vendorError}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: STATS */}
          {activeTab === 'stats' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/50 border border-white/70 p-6 rounded-2xl shadow-xs">
                <div className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Total Energy Delivered</div>
                <div className="text-3xl font-extrabold text-slate-900">{cp.energyDelivered || 42.44} <span className="text-sm text-stone-500">kWh</span></div>
              </div>
              <div className="bg-white/50 border border-white/70 p-6 rounded-2xl shadow-xs">
                <div className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Revenue Generated</div>
                <div className="text-3xl font-extrabold text-emerald-600">₹{(cp.revenueGenerated || 579.95).toLocaleString()}</div>
              </div>
              <div className="bg-white/50 border border-white/70 p-6 rounded-2xl shadow-xs">
                <div className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Total Charging Sessions</div>
                <div className="text-3xl font-extrabold text-indigo-600">{cp.totalSessions || 2}</div>
              </div>
            </div>
          )}

          {/* TAB 3: LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-stone-200/50">
                <h3 className="font-extrabold text-stone-800 text-sm">Real-time OCPP Logs</h3>
                <span className="text-xs text-stone-500 font-medium">Live Event Stream</span>
              </div>
              <div className="bg-stone-900 text-emerald-400 font-mono text-xs p-5 rounded-2xl space-y-2 overflow-x-auto shadow-inner">
                <div>[2026-07-26 09:40:12] OCPP Heartbeat received from {cp.code}</div>
                <div>[2026-07-26 09:35:00] StatusNotification: Connector 1 -&gt; Faulted (EmergencyPressed)</div>
                <div>[2026-07-26 09:20:44] MeterValues received: 42.44 kWh</div>
              </div>
            </div>
          )}

          {/* TAB 4: CHARGE TRANSACTIONS */}
          {activeTab === 'transactions' && (
            <div className="text-stone-500 text-center py-12">
              <Zap className="w-10 h-10 text-stone-300 mx-auto mb-3" />
              <p className="font-bold text-sm">No active charge transactions for this point.</p>
            </div>
          )}

          {/* TAB 5: CONFIGURATION */}
          {activeTab === 'config' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white/50 border border-white/70 p-5 rounded-2xl space-y-2">
                <label className="text-xs font-bold text-stone-500 uppercase">Heartbeat Interval</label>
                <input type="text" defaultValue="300 seconds" className="w-full bg-white/80 border border-stone-200 p-2.5 rounded-xl text-sm font-bold" />
              </div>
              <div className="bg-white/50 border border-white/70 p-5 rounded-2xl space-y-2">
                <label className="text-xs font-bold text-stone-500 uppercase">Meter Value Sample Interval</label>
                <input type="text" defaultValue="60 seconds" className="w-full bg-white/80 border border-stone-200 p-2.5 rounded-xl text-sm font-bold" />
              </div>
            </div>
          )}

          {/* TAB 6: CONTROL (Refined 7 Form Cards) */}
          {activeTab === 'control' && (
            <div className="space-y-6">
              {actionFeedback && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 rounded-2xl flex items-center justify-between shadow-xs animate-in fade-in duration-300">
                  <div className="flex items-center gap-2.5 text-xs font-extrabold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>{actionFeedback}</span>
                  </div>
                  <button onClick={() => setActionFeedback(null)} className="text-emerald-600 hover:text-emerald-800 text-xs font-bold cursor-pointer">✕</button>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Reset Charge Point */}
                <div className="bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-[24px] p-6 flex flex-col justify-between hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300">
                  <div>
                    <h3 className="text-base font-extrabold text-stone-800 mb-5 flex items-center gap-2.5">
                      <RefreshCw className="w-4 h-4 text-orange-500" /> Reset Charge Point
                    </h3>
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => handleControlAction('Soft Reset command sent to charge point.')}
                        className="px-4 py-2.5 bg-white/90 hover:bg-sky-50 text-sky-600 border border-sky-200/80 hover:border-sky-300 font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-sky-500" /> Soft Reset
                      </button>
                      <button
                        onClick={() => handleControlAction('Hard Reset command sent to charge point.')}
                        className="px-4 py-2.5 bg-white/90 hover:bg-sky-50 text-sky-600 border border-sky-200/80 hover:border-sky-300 font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-sky-500" /> Hard Reset
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Update Charge Point firmware */}
                <div className="bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-[24px] p-6 flex flex-col justify-between hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300">
                  <div className="space-y-4">
                    <h3 className="text-base font-extrabold text-stone-800 flex items-center gap-2.5">
                      <Cpu className="w-4 h-4 text-sky-500" /> Update Charge Point firmware
                    </h3>
                    <div>
                      <label className="text-xs font-bold text-stone-600 mb-1.5 block">
                        Firmware URL <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Paste firmware URL"
                        value={firmwareUrl}
                        onChange={(e) => setFirmwareUrl(e.target.value)}
                        className="w-full px-4 py-3 bg-white/80 border border-stone-200/80 rounded-xl text-sm font-medium text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:bg-white transition-all shadow-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-stone-600 mb-1.5 block">Scheduled date of firmware update</label>
                      <input
                        type="date"
                        value={firmwareDate}
                        onChange={(e) => setFirmwareDate(e.target.value)}
                        className="w-full px-4 py-3 bg-white/80 border border-stone-200/80 rounded-xl text-sm font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:bg-white transition-all shadow-xs"
                      />
                    </div>
                  </div>
                  <div className="mt-6">
                    <button
                      onClick={() => handleControlAction('Firmware update scheduled successfully.')}
                      className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl text-xs shadow-md shadow-sky-500/20 active:scale-95 transition-all duration-200 cursor-pointer flex items-center gap-2"
                    >
                      <Send className="w-3.5 h-3.5" /> Update
                    </button>
                  </div>
                </div>

                {/* 3. Charge Point local ID Tag list management */}
                <div className="bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-[24px] p-6 flex flex-col justify-between hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300">
                  <div className="space-y-4">
                    <h3 className="text-base font-extrabold text-stone-800 flex items-center gap-2.5">
                      <KeyRound className="w-4 h-4 text-purple-500" /> Charge Point local ID Tag list management
                    </h3>
                    <div>
                      <label className="text-xs font-bold text-stone-600 mb-1.5 block">
                        Update type <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={localTagUpdateType}
                        onChange={(e) => setLocalTagUpdateType(e.target.value)}
                        className="w-full px-4 py-3 bg-white/80 border border-stone-200/80 rounded-xl text-sm font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:bg-white transition-all shadow-xs"
                      >
                        <option value="">Select an Update Type</option>
                        <option value="Differential">Differential</option>
                        <option value="Full">Full</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-stone-600 mb-1.5 block">ID Tags</label>
                      <select
                        value={localTagIdTags}
                        onChange={(e) => setLocalTagIdTags(e.target.value)}
                        className="w-full px-4 py-3 bg-white/80 border border-stone-200/80 rounded-xl text-sm font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:bg-white transition-all shadow-xs"
                      >
                        <option value="">Select ID Tags</option>
                        <option value="TAG-001">TAG-001 (VIP Access)</option>
                        <option value="TAG-002">TAG-002 (Fleet Access)</option>
                        <option value="TAG-003">TAG-003 (Operator Key)</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-6">
                    <button
                      onClick={() => handleControlAction('Local ID Tag list update message sent.')}
                      className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl text-xs shadow-md shadow-sky-500/20 active:scale-95 transition-all duration-200 cursor-pointer flex items-center gap-2"
                    >
                      <Send className="w-3.5 h-3.5" /> Update
                    </button>
                  </div>
                </div>

                {/* 4. Send trigger message to Charge Point */}
                <div className="bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-[24px] p-6 flex flex-col justify-between hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300">
                  <div className="space-y-4">
                    <h3 className="text-base font-extrabold text-stone-800 flex items-center gap-2.5">
                      <Zap className="w-4 h-4 text-amber-500" /> Send trigger message to Charge Point
                    </h3>
                    <div>
                      <label className="text-xs font-bold text-stone-600 mb-1.5 block">
                        Trigger message <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={triggerMessage}
                        onChange={(e) => setTriggerMessage(e.target.value)}
                        className="w-full px-4 py-3 bg-white/80 border border-stone-200/80 rounded-xl text-sm font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:bg-white transition-all shadow-xs"
                      >
                        <option value="">Select a trigger message</option>
                        <option value="BootNotification">BootNotification</option>
                        <option value="DiagnosticsStatusNotification">DiagnosticsStatusNotification</option>
                        <option value="FirmwareStatusNotification">FirmwareStatusNotification</option>
                        <option value="Heartbeat">Heartbeat</option>
                        <option value="MeterValues">MeterValues</option>
                        <option value="StatusNotification">StatusNotification</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-stone-600 mb-1.5 block">
                        Connector Id <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={triggerConnectorId}
                        onChange={(e) => setTriggerConnectorId(e.target.value)}
                        className="w-full px-4 py-3 bg-white/80 border border-stone-200/80 rounded-xl text-sm font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:bg-white transition-all shadow-xs"
                      >
                        <option value="All">All</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-6">
                    <button
                      onClick={() => handleControlAction('Trigger message sent successfully.')}
                      className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl text-xs shadow-md shadow-sky-500/20 active:scale-95 transition-all duration-200 cursor-pointer flex items-center gap-2"
                    >
                      <Send className="w-3.5 h-3.5" /> Send
                    </button>
                  </div>
                </div>

                {/* 5. Get Diagnostics Report */}
                <div className="bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-[24px] p-6 flex flex-col justify-between hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300">
                  <div className="space-y-4">
                    <h3 className="text-base font-extrabold text-stone-800 flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-emerald-500" /> Get Diagnostics Report
                    </h3>
                    <div>
                      <label className="text-xs font-bold text-stone-600 mb-1.5 block">URL to upload the charge Point file</label>
                      <input
                        type="text"
                        placeholder="Enter URL"
                        value={diagUrl}
                        onChange={(e) => setDiagUrl(e.target.value)}
                        className="w-full px-4 py-3 bg-white/80 border border-stone-200/80 rounded-xl text-sm font-medium text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:bg-white transition-all shadow-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-stone-600 mb-1.5 block">Number of retries</label>
                      <input
                        type="number"
                        placeholder="Number of retries"
                        value={diagRetries}
                        onChange={(e) => setDiagRetries(e.target.value)}
                        className="w-full px-4 py-3 bg-white/80 border border-stone-200/80 rounded-xl text-sm font-medium text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:bg-white transition-all shadow-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-stone-600 mb-1.5 block">Retry interval (seconds)</label>
                      <input
                        type="number"
                        placeholder="Enter retry interval"
                        value={diagInterval}
                        onChange={(e) => setDiagInterval(e.target.value)}
                        className="w-full px-4 py-3 bg-white/80 border border-stone-200/80 rounded-xl text-sm font-medium text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:bg-white transition-all shadow-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-stone-600 mb-1.5 block">Start date of diagnostics logs</label>
                      <input
                        type="date"
                        value={diagStartDate}
                        onChange={(e) => setDiagStartDate(e.target.value)}
                        className="w-full px-4 py-3 bg-white/80 border border-stone-200/80 rounded-xl text-sm font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:bg-white transition-all shadow-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-stone-600 mb-1.5 block">End date of diagnostics logs</label>
                      <input
                        type="date"
                        value={diagEndDate}
                        onChange={(e) => setDiagEndDate(e.target.value)}
                        className="w-full px-4 py-3 bg-white/80 border border-stone-200/80 rounded-xl text-sm font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:bg-white transition-all shadow-xs"
                      />
                    </div>
                  </div>
                  <div className="mt-6">
                    <button
                      onClick={() => handleControlAction('Diagnostics report request initiated.')}
                      className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl text-xs shadow-md shadow-sky-500/20 active:scale-95 transition-all duration-200 cursor-pointer flex items-center gap-2"
                    >
                      <Send className="w-3.5 h-3.5" /> Send
                    </button>
                  </div>
                </div>

                {/* 6. Send data transfer message to Charge Point */}
                <div className="bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-[24px] p-6 flex flex-col justify-between hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300">
                  <div className="space-y-4">
                    <h3 className="text-base font-extrabold text-stone-800 flex items-center gap-2.5">
                      <Database className="w-4 h-4 text-indigo-500" /> Send data transfer message to Charge Point
                    </h3>
                    <div>
                      <label className="text-xs font-bold text-stone-600 mb-1.5 block">
                        Vendor ID <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Enter Vendor ID"
                        value={dataVendorId}
                        onChange={(e) => setDataVendorId(e.target.value)}
                        className="w-full px-4 py-3 bg-white/80 border border-stone-200/80 rounded-xl text-sm font-medium text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:bg-white transition-all shadow-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-stone-600 mb-1.5 block">Message ID</label>
                      <input
                        type="text"
                        placeholder="Enter Message ID"
                        value={dataMessageId}
                        onChange={(e) => setDataMessageId(e.target.value)}
                        className="w-full px-4 py-3 bg-white/80 border border-stone-200/80 rounded-xl text-sm font-medium text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:bg-white transition-all shadow-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-stone-600 mb-1.5 block">Data</label>
                      <textarea
                        rows={3}
                        placeholder="Enter Data"
                        value={dataPayload}
                        onChange={(e) => setDataPayload(e.target.value)}
                        className="w-full px-4 py-3 bg-white/80 border border-stone-200/80 rounded-xl text-sm font-medium text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:bg-white transition-all shadow-xs"
                      />
                    </div>
                  </div>
                  <div className="mt-6">
                    <button
                      onClick={() => handleControlAction('Data transfer message sent.')}
                      className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl text-xs shadow-md shadow-sky-500/20 active:scale-95 transition-all duration-200 cursor-pointer flex items-center gap-2"
                    >
                      <Send className="w-3.5 h-3.5" /> Send
                    </button>
                  </div>
                </div>

                {/* 7. Send clear cache message to Charge Point */}
                <div className="bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-[24px] p-6 flex flex-col justify-between col-span-1 lg:col-span-2 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300">
                  <div>
                    <h3 className="text-base font-extrabold text-stone-800 mb-4 flex items-center gap-2.5">
                      <Trash2 className="w-4 h-4 text-rose-500" /> Send clear cache message to Charge Point
                    </h3>
                    <div>
                      <button
                        onClick={() => handleControlAction('Clear cache message sent to charge point.')}
                        className="px-5 py-2.5 bg-white/90 hover:bg-rose-50 text-sky-600 border border-sky-200/80 hover:border-sky-300 font-bold rounded-xl text-xs shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-sky-500" /> Clear Cache
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: TARIFFS */}
          {activeTab === 'tariffs' && (
            <div className="bg-white/50 border border-white/70 p-6 rounded-2xl space-y-3">
              <h4 className="font-extrabold text-stone-800 text-sm">Assigned Tariff Profile</h4>
              <p className="text-xs text-stone-500 font-bold">Profile: {cp.tariffProfiles || 'Standard Rate'}</p>
              <div className="text-2xl font-extrabold text-orange-600">₹15.00 / kWh</div>
            </div>
          )}
        </div>
      </div>

      {/* Show Details Modal */}
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
              <div><span className="text-stone-400 font-bold text-xs uppercase block">Charging Station</span><span className="font-bold text-stone-800">{cp.chargingStation}</span></div>
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
