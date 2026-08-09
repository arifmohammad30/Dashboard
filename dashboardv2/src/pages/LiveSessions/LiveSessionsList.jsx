import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '../../hooks/useDebounce';
import {
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  User as UserIcon,
  MapPin,
  Zap,
  Plug,
  Activity,
  BatteryCharging,
  Loader2,
  FileText,
  ExternalLink,
  CreditCard,
  Layers,
  Hash,
  Settings2
} from 'lucide-react';
import Pagination from '../../components/ui/Pagination';
import { apiClient } from '../../lib/apiClient';
import { useSocketEvents } from '../../hooks/useSocketEvents';
import { useToast } from '../../context/ToastContext';
import { filterTableData } from '../../utils/searchUtils';

// Build name→id lookup maps and full entity stores from station & charge point APIs
function useLookupMaps() {
  const [stationMap, setStationMap] = useState({});
  const [cpMap, setCpMap] = useState({});
  const [rawStations, setRawStations] = useState([]);
  const [rawChargePoints, setRawChargePoints] = useState([]);

  useEffect(() => {
    apiClient('/api/charging-stations')
      .then(res => {
        const list = Array.isArray(res) ? res : (res?.data && Array.isArray(res.data) ? res.data : []);
        setRawStations(list);
        const map = {};
        list.forEach(s => {
          if (s.name) map[s.name.trim().toLowerCase()] = s.id;
          if (s.code) map[s.code.trim().toLowerCase()] = s.id;
        });
        setStationMap(map);
      })
      .catch(() => {});

    apiClient('/api/charge-points')
      .then(res => {
        const list = Array.isArray(res) ? res : (res?.data && Array.isArray(res.data) ? res.data : []);
        setRawChargePoints(list);
        const map = {};
        list.forEach(cp => {
          if (cp.name) map[cp.name.trim().toLowerCase()] = cp.id;
          if (cp.code) map[cp.code.trim().toLowerCase()] = cp.id;
        });
        setCpMap(map);
      })
      .catch(() => {});
  }, []);

  const resolveStation = (nameOrId) => {
    if (!nameOrId) return null;
    const clean = String(nameOrId).trim().toLowerCase();
    let found = rawStations.find(s => String(s.id) === String(nameOrId));
    if (found) return found;
    found = rawStations.find(s => s.name?.trim().toLowerCase() === clean);
    if (found) return found;
    found = rawStations.find(s => s.name?.trim().toLowerCase().includes(clean) || clean.includes(s.name?.trim().toLowerCase()));
    return found || null;
  };

  const resolveChargePoint = (nameOrId) => {
    if (!nameOrId) return null;
    const clean = String(nameOrId).trim().toLowerCase();
    let found = rawChargePoints.find(cp => String(cp.id) === String(nameOrId));
    if (found) return found;
    found = rawChargePoints.find(cp => cp.name?.trim().toLowerCase() === clean);
    if (found) return found;
    found = rawChargePoints.find(cp => cp.name?.trim().toLowerCase().includes(clean) || clean.includes(cp.name?.trim().toLowerCase()));
    return found || null;
  };

  return { stationMap, cpMap, resolveStation, resolveChargePoint };
}

// Compact Popover Component for SoC Breakdown (matching Charge Transactions tab)
const SocPopoverCell = ({ initialSoc, currentSoc }) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-stone-100/90 hover:bg-stone-200/80 text-stone-700 border border-stone-200/80 cursor-pointer shadow-2xs transition-all duration-150"
        title="Click to view State of Charge details"
      >
        <span>View SoC</span>
        <ChevronDown className={`w-3 h-3 text-stone-400 transition-transform duration-150 ${isOpen ? 'rotate-180 text-stone-800' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 z-40 bg-white border border-stone-200 shadow-xl rounded-xl p-2.5 min-w-[160px] text-xs animate-in fade-in zoom-in-95 duration-150 font-sans">
          <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1.5 pb-1 border-b border-stone-100">State of Charge</div>
          <div className="flex flex-col gap-1 text-[11px]">
            <div className="flex justify-between"><span className="text-stone-500">Initial SoC:</span> <strong className="font-mono text-stone-800">{initialSoc || '-'}</strong></div>
            <div className="flex justify-between"><span className="text-stone-500">Current SoC:</span> <strong className="font-mono text-stone-800">{currentSoc || '-'}</strong></div>
          </div>
        </div>
      )}
    </div>
  );
};

// Compact Popover Component for Meter Values matching Charge Transactions tab
const MeterValuesPopoverCell = ({ row }) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const energyVal = `${(0.161 + (row.id * 0.124)).toFixed(3)} kWh`;
  const powerVal = `${(2.50 + (row.id * 0.42)).toFixed(2)} kW`;
  const voltageVal = `${(235.00 + (row.id % 15)).toFixed(2)} V`;
  const currentVal = `${(12.50 + (row.id % 18)).toFixed(2)} A`;

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-stone-100/90 hover:bg-stone-200/80 text-stone-700 border border-stone-200/80 cursor-pointer shadow-2xs transition-all duration-150"
        title="Click to view Telemetry details"
      >
        <span>View Meter</span>
        <ChevronDown className={`w-3 h-3 text-stone-400 transition-transform duration-150 ${isOpen ? 'rotate-180 text-stone-800' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 z-40 bg-white border border-stone-200 shadow-xl rounded-xl p-2.5 min-w-[170px] text-xs animate-in fade-in zoom-in-95 duration-150 font-sans">
          <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1.5 pb-1 border-b border-stone-100">Meter Telemetry</div>
          <div className="flex flex-col gap-1 text-[11px] font-mono">
            <div className="flex justify-between"><span className="text-stone-500 font-sans">Energy:</span> <strong className="text-stone-800">{energyVal}</strong></div>
            <div className="flex justify-between"><span className="text-stone-500 font-sans">Power:</span> <strong className="text-stone-800">{powerVal}</strong></div>
            <div className="flex justify-between"><span className="text-stone-500 font-sans">Voltage:</span> <strong className="text-stone-800">{voltageVal}</strong></div>
            <div className="flex justify-between"><span className="text-stone-500 font-sans">Current:</span> <strong className="text-stone-800">{currentVal}</strong></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function LiveSessionsList() {
  const navigate = useNavigate();
  const toast = useToast();
  const { stationMap, cpMap, resolveStation, resolveChargePoint } = useLookupMaps();
  const [activeTab, setActiveTab] = useState('Ongoing');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 10;

  const tabs = ['Ongoing', 'Failed', 'Stopped'];

  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    setLoading(true);
    apiClient('/livesessions')
      .then(data => setSessions(data || []))
      .catch(err => console.error("Failed to fetch initial sessions:", err))
      .finally(() => setLoading(false));
  }, []);

  useSocketEvents({
    sessionUpdated: (updatedSession) => {
      setSessions(prev => prev.map(session => 
        session.id === updatedSession.id ? updatedSession : session
      ));
    }
  });

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const getConnectorLabel = (conn) => {
    if (!conn) return '15A (1)';
    const cStr = typeof conn === 'object' ? (conn.type || conn.name || 'Type2') : String(conn);
    return cStr;
  };

  const getTxId = (id) => 10715700 + (id * 31);
  const getBillCode = (id) => `OLSB14I${(10 + id * 3).toString(36).toUpperCase()}YY`;

  const filteredSessions = useMemo(() => {
    // Only show active Ongoing sessions in Live Sessions page
    const ongoingOnly = sessions.filter(session => session.status === 'Ongoing');
    
    return filterTableData(ongoingOnly, debouncedSearchTerm, [
      'userName',
      'userInitials',
      'station',
      'chargePoint',
      (r) => (typeof r.connector === 'object' ? (r.connector?.type || r.connector?.name || '') : String(r.connector || '')),
      'status',
      (r) => getTxId(r.id),
      (r) => getBillCode(r.id)
    ]);
  }, [sessions, debouncedSearchTerm]);

  const totalItems = filteredSessions.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedSessions = filteredSessions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSearch = useCallback((e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  }, []);

  return (
    <div className="flex flex-col gap-3.5 max-w-[1400px] w-full mx-auto pb-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-1 mt-0">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Active Live Sessions
          </h1>
          <p className="text-xs text-stone-500 mt-0.5 font-medium ml-0.5">
            Real-time active charging sessions currently streaming telemetry from charge points.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigate('/session-history')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold border border-stone-200 shadow-2xs rounded-xl text-xs cursor-pointer transition-all duration-150 active:scale-95 group"
          >
            <span>Session History</span>
            <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
          </button>
        </div>
      </div>

      {/* Main Enterprise Table Container */}
      <div className="bg-white border border-stone-200/90 shadow-2xs rounded-2xl overflow-hidden flex flex-col flex-1 min-h-[500px]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-b border-stone-200/80 bg-[#F8FAFC]">
          {/* Active Live Status Pill with Radar Pinging Pulse */}
          <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs text-xs font-extrabold w-fit">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span>Live Stream Monitoring</span>
            <span className="bg-emerald-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full ml-1">{filteredSessions.length} Active</span>
          </div>

          {/* Search Box matching Charge Points and Charging Stations list page */}
          <div className="relative w-full sm:w-[400px] group">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-stone-400 group-focus-within:text-stone-900 transition-colors z-10">
              <Search className="w-5 h-5" />
            </div>

            <input
              type="text"
              placeholder="Search user, station, CP..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-14 pr-5 py-2.5 bg-white border border-stone-200/90 shadow-2xs focus:border-stone-900 focus:ring-1 focus:ring-stone-900/10 rounded-2xl text-xs font-medium focus:outline-none text-stone-800 placeholder:text-stone-400 transition-colors duration-150"
            />
          </div>
        </div>

        {/* Scrollable Table Container */}
        <div className="overflow-x-auto flex-1 transform-gpu translate-z-0">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F8FAFC] border-b border-stone-200">
              <tr className="bg-[#F8FAFC]">
                <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider text-center whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1.5"><Settings2 className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Actions</div>
                </th>
                <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><UserIcon className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> User</div>
                </th>
                <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Charging Station</div>
                </th>
                <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Charge Point</div>
                </th>
                <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Plug className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Connector</div>
                </th>
                <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Charge Transaction Status</div>
                </th>
                <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><BatteryCharging className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> SoC</div>
                </th>
                <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Meter Values</div>
                </th>
                <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Hash className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Charge Transaction</div>
                </th>
                <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Bill</div>
                </th>
                <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Fleet</div>
                </th>
                <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Bill Status</div>
                </th>
                <th className="px-4 py-3 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Payment Mode</div>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-stone-200/70 bg-white text-xs font-medium">
              {loading ? (
                <tr>
                  <td colSpan="13" className="px-5 py-24 text-center">
                    <div className="text-orange-400 flex flex-col items-center">
                      <Loader2 className="w-10 h-10 animate-spin mb-4" />
                      <p className="text-sm font-bold text-stone-500">Loading live sessions...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedSessions.length === 0 ? (
                <tr>
                  <td colSpan="13" className="px-5 py-24 text-center">
                    <div className="text-stone-400 flex flex-col items-center">
                      <div className="w-20 h-20 bg-white/40 border border-white/50 flex items-center justify-center mb-6">
                        <Search className="w-10 h-10 text-stone-400" />
                      </div>
                      <p className="text-sm font-bold text-stone-500">No {activeTab.toLowerCase()} sessions found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedSessions.map((row) => {
                  return (
                    <tr key={row.id} className="group hover:bg-[#F8FAFF] transition-colors duration-150 text-xs">
                      <td className="px-4 py-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/live-sessions/${row.id}/logs`, { state: { session: row } });
                            }}
                            className="px-2.5 py-1 text-sky-600 bg-sky-50 border border-sky-200/80 hover:bg-sky-500 hover:text-white rounded-lg shadow-2xs text-[11px] font-bold transition-all active:scale-95 duration-150 cursor-pointer flex items-center gap-1.5"
                            title="Inspect Live Telemetry Logs"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>View Logs</span>
                          </button>
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-extrabold bg-[#F8FAFC] text-purple-700 border border-stone-200/80 shrink-0">
                            {row.userInitials || 'U'}
                          </div>
                          <span className="text-stone-900 font-bold text-sm tracking-tight truncate">
                            {row.userName}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!row.station) return;
                            const targetStation = resolveStation(row.station);
                            const targetId = targetStation?.id || stationMap[row.station.trim().toLowerCase()] || encodeURIComponent(row.station);
                            const stationObj = targetStation || { name: row.station, id: targetId };
                            navigate(`/charging-stations/${targetId}`, { state: { station: stationObj } });
                          }}
                          className="text-slate-500 font-bold text-[13px] group-hover:text-slate-950 transition-colors duration-150 cursor-pointer max-w-[220px] truncate inline-block"
                        >
                          {row.station}
                        </span>
                      </td>

                      {/* Charge Point Link (text-[13px] matching list page, color-only hover transition) */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!row.chargePoint) return;
                            const targetCP = resolveChargePoint(row.chargePoint);
                            const targetId = targetCP?.id || cpMap[row.chargePoint.trim().toLowerCase()] || encodeURIComponent(row.chargePoint);
                            const cpObj = targetCP || { name: row.chargePoint, id: targetId };
                            navigate(`/charge-points/${targetId}`, { state: { chargePoint: cpObj } });
                          }}
                          className="text-slate-500 font-bold text-[13px] group-hover:text-sky-700 transition-colors duration-150 cursor-pointer max-w-[200px] truncate inline-block"
                        >
                          {row.chargePoint}
                        </span>
                      </td>

                      {/* Connector (Neutral reduced radius badge) */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-stone-100/90 text-stone-700 border border-stone-200/80 whitespace-nowrap">
                          {getConnectorLabel(row.connector)}
                        </span>
                      </td>

                      {/* Charge Transaction Status (Definitive Enterprise Badge System) */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {row.status === 'Ongoing' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-emerald-50/80 text-emerald-800 border border-emerald-200/80 shadow-2xs">
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                            </span>
                            <span>Ongoing</span>
                          </span>
                        )}
                        {row.status === 'Failed' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-rose-50/80 text-rose-800 border border-rose-200/80 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                            <span>Failed</span>
                          </span>
                        )}
                        {(row.status === 'Stopped' || row.status === 'Completed') && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                            <span>Completed</span>
                          </span>
                        )}
                      </td>

                      {/* SoC */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <SocPopoverCell initialSoc={row.initialSoc} currentSoc={row.currentSoc} />
                      </td>

                      {/* Meter Values */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <MeterValuesPopoverCell row={row} />
                      </td>

                      {/* Charge Transaction */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sky-700 font-bold font-mono text-xs hover:text-sky-900 transition-colors cursor-pointer">
                          {getTxId(row.id)}
                        </span>
                      </td>

                      {/* Bill */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sky-700 font-bold font-mono text-xs hover:text-sky-900 transition-colors cursor-pointer">
                          {getBillCode(row.id)}
                        </span>
                      </td>

                      {/* Fleet */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-stone-700 font-bold text-xs">EVRE</span>
                      </td>

                      {/* Bill Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-stone-100 text-stone-500 border border-stone-200/80 whitespace-nowrap">
                          Not Generated
                        </span>
                      </td>

                      {/* Payment Mode (Last Column) */}
                      <td className="px-4 py-3 rounded-r-xl whitespace-nowrap">
                        <span className="text-stone-700 font-medium text-xs">User Wallet</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalItems > 0 && (
          <div className="border-t border-white/40 bg-white/20 pt-2 pb-4 rounded-b-[32px]">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
