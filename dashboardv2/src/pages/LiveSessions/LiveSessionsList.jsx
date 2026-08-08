import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '../../hooks/useDebounce';
import {
  Search,
  Filter,
  ChevronDown,
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

// Build name→id lookup maps from station & charge point lists
function useLookupMaps() {
  const [stationMap, setStationMap] = useState({});
  const [cpMap, setCpMap] = useState({});

  useEffect(() => {
    apiClient('/api/charging-stations')
      .then(data => {
        const map = {};
        (data || []).forEach(s => { if (s.name) map[s.name.trim().toLowerCase()] = s.id; });
        setStationMap(map);
      })
      .catch(() => {});

    apiClient('/api/charge-points')
      .then(data => {
        const map = {};
        (data || []).forEach(cp => { if (cp.name) map[cp.name.trim().toLowerCase()] = cp.id; });
        setCpMap(map);
      })
      .catch(() => {});
  }, []);

  return { stationMap, cpMap };
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
  const { stationMap, cpMap } = useLookupMaps();
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
    if (!conn) return '15A (1) · Charging';
    const cStr = typeof conn === 'object' ? (conn.type || conn.name || 'Type2') : String(conn);
    return `${cStr} · Charging`;
  };

  const getTxId = (id) => 10715700 + (id * 31);
  const getBillCode = (id) => `OLSB14I${(10 + id * 3).toString(36).toUpperCase()}YY`;

  const filteredSessions = useMemo(() => {
    const tabFiltered = sessions.filter(session => session.status === activeTab);
    
    return filterTableData(tabFiltered, debouncedSearchTerm, [
      'userName',
      'userInitials',
      'station',
      'chargePoint',
      (r) => (typeof r.connector === 'object' ? (r.connector?.type || r.connector?.name || '') : String(r.connector || '')),
      'status',
      (r) => getTxId(r.id),
      (r) => getBillCode(r.id)
    ]);
  }, [sessions, activeTab, debouncedSearchTerm]);

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
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Live Charging Sessions
          </h1>
          <p className="text-xs text-stone-500 mt-0.5 font-medium ml-0.5">Monitor real-time ongoing, stopped, and failed sessions.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button className="flex items-center gap-2 px-4.5 py-2 bg-white/60 hover:bg-white/80 border border-white/50 text-stone-700 font-bold rounded-xl shadow-xs active:scale-95 transition-colors duration-200 text-xs cursor-pointer">
            Today
            <ChevronDown className="w-4 h-4 text-blue-500" />
          </button>

          <button className="flex items-center gap-2 px-4.5 py-2 bg-white/60 hover:bg-white/80 border border-white/50 text-stone-700 font-bold rounded-xl shadow-xs active:scale-95 transition-colors duration-200 text-xs cursor-pointer">
            <Filter className="w-4 h-4 text-violet-500" />
            Filter
          </button>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white/70 backdrop-blur-2xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-[32px] overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-b border-stone-200/80 bg-[#F8FAFC]">
          {/* Reverted Original Tabs Styling */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#F8FAFC] border border-stone-200/80 shadow-2xs">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setActiveTab(tab);
                  setCurrentPage(1);
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition-colors duration-150 cursor-pointer ${
                  activeTab === tab
                    ? tab === 'Ongoing'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 shadow-2xs'
                      : tab === 'Failed'
                        ? 'bg-rose-50 text-rose-700 border-rose-200/80 shadow-2xs'
                        : 'bg-amber-50 text-amber-700 border-amber-200/80 shadow-2xs'
                    : 'bg-transparent text-stone-600 border-transparent hover:bg-stone-100/70 hover:text-stone-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-[400px] group">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-stone-400 group-focus-within:text-stone-900 transition-colors z-10">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Search sessions..."
              className="w-full pl-14 pr-5 py-2.5 bg-white border border-stone-200/90 shadow-2xs focus:border-stone-900 focus:ring-1 focus:ring-stone-900/10 rounded-2xl text-xs font-medium focus:outline-none text-stone-800 placeholder:text-stone-400 transition-colors duration-150"
            />
          </div>
        </div>

        {/* Scrollable Table Container */}
        <div className="overflow-x-auto flex-1 px-1.5 sm:px-2 pb-6 pt-0 transform-gpu translate-z-0">
          <table className="w-full text-left text-sm border-separate border-spacing-y-1">
            <thead className="bg-[#F8FAFC] border-b border-stone-200/90 shadow-2xs">
              <tr className="bg-[#F8FAFC] border-b border-stone-200/90">
                <th className="px-4 py-2.5 font-bold text-stone-700 text-[11px] uppercase tracking-wider rounded-l-xl text-center whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1.5"><Settings2 className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Actions</div>
                </th>
                <th className="px-4 py-2.5 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><UserIcon className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> User</div>
                </th>
                <th className="px-4 py-2.5 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Charging Station</div>
                </th>
                <th className="px-4 py-2.5 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Charge Point</div>
                </th>
                <th className="px-4 py-2.5 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Plug className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Connector</div>
                </th>
                <th className="px-4 py-2.5 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Charge Transaction Status</div>
                </th>
                <th className="px-4 py-2.5 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><BatteryCharging className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> SoC</div>
                </th>
                <th className="px-4 py-2.5 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Meter Values</div>
                </th>
                <th className="px-4 py-2.5 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Hash className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Charge Transaction</div>
                </th>
                <th className="px-4 py-2.5 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Bill</div>
                </th>
                <th className="px-4 py-2.5 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Fleet</div>
                </th>
                <th className="px-4 py-2.5 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Bill Status</div>
                </th>
                <th className="px-4 py-2.5 font-bold text-stone-700 text-[11px] uppercase tracking-wider rounded-r-xl whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Payment Mode</div>
                </th>
              </tr>
            </thead>

            <tbody>
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
                    <tr key={row.id} className="group bg-white hover:bg-[#F9FBFF] border border-stone-200/80 hover:border-slate-300 shadow-2xs transition-colors duration-150 rounded-xl text-xs">
                      {/* Actions Column (First Column, View Logs on Row Hover) */}
                      <td className="px-4 py-3 text-center rounded-l-xl whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/live-sessions/${row.id}/logs`, { state: { session: row } });
                            }}
                            className="px-2.5 py-1 text-sky-600 bg-sky-50 border border-sky-200/80 hover:bg-sky-500 hover:text-white rounded-lg shadow-2xs text-[11px] font-bold transition-all active:scale-95 duration-150 cursor-pointer flex items-center gap-1.5"
                            title="View OCPP Logs"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>View Logs</span>
                          </button>
                        </div>
                      </td>

                      {/* Clean User Profile Cell */}
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

                      {/* Charging Station → /charging-stations/:id */}
                      <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => {
                        e.stopPropagation();
                        if (!row.station) return;
                        const sid = stationMap[row.station.trim().toLowerCase()];
                        if (sid) {
                          navigate(`/charging-stations/${sid}`);
                        } else {
                          navigate(`/charging-stations?search=${encodeURIComponent(row.station)}`);
                        }
                      }}>
                        <span className="text-sky-600 font-bold text-[12px] hover:text-sky-800 transition-colors cursor-pointer max-w-[220px] truncate inline-block">
                          {row.station}
                        </span>
                      </td>

                      {/* Charge Point → /charge-points/:id */}
                      <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => {
                        e.stopPropagation();
                        if (!row.chargePoint) return;
                        const cpid = cpMap[row.chargePoint.trim().toLowerCase()];
                        if (cpid) {
                          navigate(`/charge-points/${cpid}`);
                        } else {
                          navigate(`/charge-points?search=${encodeURIComponent(row.chargePoint)}`);
                        }
                      }}>
                        <span className="text-sky-600 font-bold text-[12px] hover:text-sky-800 transition-colors cursor-pointer max-w-[200px] truncate inline-block">
                          {row.chargePoint}
                        </span>
                      </td>

                      {/* Connector */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-sky-50 text-sky-700 border border-sky-200/80 whitespace-nowrap">
                          {getConnectorLabel(row.connector)}
                        </span>
                      </td>

                      {/* Charge Transaction Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {row.status === 'Ongoing' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                            Ongoing
                          </span>
                        )}
                        {row.status === 'Failed' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200/60 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
                            Failed
                          </span>
                        )}
                        {row.status === 'Stopped' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-stone-100 text-stone-600 border border-stone-200/80 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-stone-400 shrink-0"></span>
                            Stopped
                          </span>
                        )}
                      </td>

                      {/* SoC (Matching Charge Transactions Tab Popover) */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <SocPopoverCell initialSoc="-" currentSoc="-" />
                      </td>

                      {/* Meter Values (Matching Charge Transactions Tab Popover) */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <MeterValuesPopoverCell row={row} />
                      </td>

                      {/* Charge Transaction */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sky-600 font-bold font-mono text-xs hover:underline cursor-pointer">
                          {getTxId(row.id)}
                        </span>
                      </td>

                      {/* Bill */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sky-600 font-bold font-mono text-xs hover:underline cursor-pointer">
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
