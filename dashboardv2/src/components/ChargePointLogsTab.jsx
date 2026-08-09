import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Terminal,
  Hash,
  Layers,
  FileCode,
  Tag,
  Clock,
  Play,
  Download,
  Eye,
  EyeOff,
  Copy,
  Check,
  X,
  Search,
  Filter,
  ArrowDownRight,
  ArrowUpRight,
  Code,
  Table,
  ChevronRight,
  Sparkles,
  Braces,
  Settings2
} from 'lucide-react';
import FilterSection from './ui/FilterSection';
import { useToast } from '../context/ToastContext';

// Syntax Highlighted JSON Component focused 100% on Log Body
const JsonSyntaxHighlighter = ({ json }) => {
  const formatted = useMemo(() => {
    try {
      return JSON.stringify(json, null, 2);
    } catch {
      return String(json);
    }
  }, [json]);

  const renderHighlighted = (jsonStr) => {
    const lines = jsonStr.split('\n');
    return lines.map((line, idx) => {
      const lineParts = line.match(/^(\s*)("[^"]+":)?\s*(.*)$/);
      if (!lineParts) {
        return <div key={idx} className="leading-relaxed">{line}</div>;
      }

      const [, indent, keyPart, valuePart] = lineParts;

      let renderedValue = valuePart;
      if (valuePart) {
        if (/^"[^"]*",?$/.test(valuePart)) {
          renderedValue = <span className="text-emerald-400 font-medium">{valuePart}</span>;
        } else if (/^-?\d+(\.\d+)?,?$/.test(valuePart)) {
          renderedValue = <span className="text-amber-300 font-mono font-semibold">{valuePart}</span>;
        } else if (/^(true|false),?$/.test(valuePart)) {
          renderedValue = <span className="text-purple-400 font-semibold">{valuePart}</span>;
        } else if (/^null,?$/.test(valuePart)) {
          renderedValue = <span className="text-rose-400 italic">{valuePart}</span>;
        }
      }

      return (
        <div key={idx} className="leading-relaxed whitespace-pre font-mono text-xs">
          <span>{indent}</span>
          {keyPart && <span className="text-sky-300 font-semibold">{keyPart} </span>}
          {renderedValue}
        </div>
      );
    });
  };

  return (
    <div className="font-mono text-xs text-slate-200 selection:bg-sky-500 selection:text-white">
      {renderHighlighted(formatted)}
    </div>
  );
};

export default function ChargePointLogsTab({ cp, sessionData }) {
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'terminal'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [inspectorTab, setInspectorTab] = useState('json'); // 'json' | 'raw'

  // Filter Popover State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedCommands, setSelectedCommands] = useState([]);
  const [selectedLogTypes, setSelectedLogTypes] = useState([]);
  const filterRef = useRef(null);
  const terminalEndRef = useRef(null);

  // Initial Mock Data matching OCPP 1.6J live sessions
  const isOngoing = sessionData?.status === 'Ongoing';
  const isFailedSession = sessionData?.status === 'Failed';

  const initialLogs = useMemo(() => {
    if (isFailedSession) {
      return [
        {
          id: 'log_fail_01',
          command: 'StatusNotification',
          direction: 'INBOUND',
          messageId: '9841',
          logType: 'OCPP 1.6J',
          idTag: 'TAG-84920412',
          recordedOn: 'Earlier, 08:45:00 pm',
          fullTimestamp: 'Aug 09, 2026 08:45:00 PM',
          summary: 'Charge Point Faulted: Connector Lock Failure',
          body: { connectorId: 1, errorCode: 'ConnectorLockFailure', status: 'Faulted', info: 'Failed to lock EV connector on initiation' }
        },
        {
          id: 'log_fail_02',
          command: 'StopTransactionRequest',
          direction: 'INBOUND',
          messageId: '9840',
          logType: 'OCPP 1.6J',
          idTag: 'TAG-84920412',
          recordedOn: 'Earlier, 08:44:58 pm',
          fullTimestamp: 'Aug 09, 2026 08:44:58 PM',
          summary: 'Aborted transaction #3499 due to EVSE error',
          body: { transactionId: 3499, reason: 'EVSEError', meterStop: 0, timestamp: '2026-08-09T20:44:58Z' }
        },
        {
          id: 'log_fail_03',
          command: 'StartTransactionResponse',
          direction: 'OUTBOUND',
          messageId: '9838',
          logType: 'OCPP 1.6J',
          idTag: 'TAG-84920412',
          recordedOn: 'Earlier, 08:44:55 pm',
          fullTimestamp: 'Aug 09, 2026 08:44:55 PM',
          summary: 'Start transaction authorization rejected',
          body: { transactionId: 0, idTagInfo: { status: 'Blocked', expiryDate: '2026-08-09T20:44:55Z' } }
        },
        {
          id: 'log_fail_04',
          command: 'AuthorizeRequest',
          direction: 'INBOUND',
          messageId: '9835',
          logType: 'OCPP 1.6J',
          idTag: 'TAG-INVALID-88',
          recordedOn: 'Earlier, 08:44:50 pm',
          fullTimestamp: 'Aug 09, 2026 08:44:50 PM',
          summary: 'Authorization request for RFID tag',
          body: { idTag: 'TAG-INVALID-88' }
        }
      ];
    }

    if (!isOngoing) {
      return [
        {
          id: 'log_hist_01',
          command: 'StopTransactionRequest',
          direction: 'INBOUND',
          messageId: '8842',
          logType: 'OCPP 1.6J',
          idTag: 'TAG-84920412',
          recordedOn: 'Completed, 10:30:00 am',
          fullTimestamp: 'Aug 09, 2026 10:30:00 AM',
          summary: 'Transaction #3499 completed & stopped normally',
          body: { transactionId: 3499, reason: 'Local', meterStop: 24500, timestamp: '2026-08-09T10:30:00Z' }
        },
        {
          id: 'log_hist_02',
          command: 'StopTransactionResponse',
          direction: 'OUTBOUND',
          messageId: '8842',
          logType: 'OCPP 1.6J',
          idTag: 'TAG-84920412',
          recordedOn: 'Completed, 10:30:01 am',
          fullTimestamp: 'Aug 09, 2026 10:30:01 AM',
          summary: 'CSMS acknowledged transaction termination',
          body: { idTagInfo: { status: 'Accepted' } }
        },
        {
          id: 'log_hist_03',
          command: 'MeterValuesRequest',
          direction: 'INBOUND',
          messageId: '8839',
          logType: 'OCPP 1.6J',
          idTag: 'TAG-84920412',
          recordedOn: 'Completed, 10:25:00 am',
          fullTimestamp: 'Aug 09, 2026 10:25:00 AM',
          summary: 'Final energy sample: 24.50 kWh @ 7.40 kW',
          body: { connectorId: 1, transactionId: 3499, meterValue: [{ sampledValue: [{ value: '24.50', unit: 'kWh' }] }] }
        },
        {
          id: 'log_hist_04',
          command: 'StartTransactionResponse',
          direction: 'OUTBOUND',
          messageId: '8820',
          logType: 'OCPP 1.6J',
          idTag: 'TAG-84920412',
          recordedOn: 'Completed, 09:45:00 am',
          fullTimestamp: 'Aug 09, 2026 09:45:00 AM',
          summary: 'Transaction #3499 authorized & started',
          body: { transactionId: 3499, idTagInfo: { status: 'Accepted' } }
        }
      ];
    }

    return [
      {
        id: 'log_01',
        command: 'MeterValuesRequest',
        direction: 'INBOUND',
        messageId: '3502',
        logType: 'OCPP 1.6J',
        idTag: 'TAG-84920412',
        recordedOn: 'Just now, 08:05:22 pm',
        fullTimestamp: 'Aug 09, 2026 08:05:22 PM',
        summary: 'Sample Periodic: 14.23 kWh @ 7.38 kW',
        body: {
          connectorId: 1,
          transactionId: 3499,
          meterValue: [
            {
              timestamp: '2026-08-09T20:05:22Z',
              sampledValue: [
                { value: '14.23', context: 'Sample.Periodic', format: 'Raw', measurand: 'Energy.Active.Import.Register', location: 'Outlet', unit: 'kWh' },
                { value: '7.38', context: 'Sample.Periodic', format: 'Raw', measurand: 'Power.Active.Import', location: 'Outlet', unit: 'kW' },
                { value: '230.4', context: 'Sample.Periodic', format: 'Raw', measurand: 'Voltage', location: 'Outlet', unit: 'V' }
              ]
            }
          ]
        }
      },
      {
        id: 'log_02',
        command: 'MeterValuesResponse',
        direction: 'OUTBOUND',
        messageId: '3502',
        logType: 'OCPP 1.6J',
        idTag: '-',
        recordedOn: 'Just now, 08:05:22 pm',
        fullTimestamp: 'Aug 09, 2026 08:05:22 PM',
        summary: 'CSMS Acknowledged Meter Sample',
        body: {}
      },
      {
        id: 'log_03',
        command: 'StatusNotification',
        direction: 'INBOUND',
        messageId: '3500',
        logType: 'OCPP 1.6J',
        idTag: '-',
        recordedOn: 'Today, 08:02:10 pm',
        fullTimestamp: 'Aug 09, 2026 08:02:10 PM',
        summary: 'Connector 1 status set to Charging',
        body: { connectorId: 1, errorCode: 'NoError', status: 'Charging', timestamp: '2026-08-09T20:02:10Z' }
      },
      {
        id: 'log_04',
        command: 'StartTransactionRequest',
        direction: 'INBOUND',
        messageId: '3495',
        logType: 'OCPP 1.6J',
        idTag: 'TAG-84920412',
        recordedOn: 'Today, 08:00:00 pm',
        fullTimestamp: 'Aug 09, 2026 08:00:00 PM',
        summary: 'Start transaction request on Connector 1',
        body: { connectorId: 1, idTag: 'TAG-84920412', meterStart: 0, timestamp: '2026-08-09T20:00:00Z' }
      }
    ];
  }, [isOngoing, isFailedSession]);

  const [logsList, setLogsList] = useState(initialLogs);
  const [isLive, setIsLive] = useState(isOngoing);

  // Close filter popover on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live streaming simulation (Only active for Ongoing live sessions)
  useEffect(() => {
    if (!isLive || !isOngoing) return;
    const interval = setInterval(() => {
      const liveEvents = [
        {
          command: 'MeterValuesRequest',
          direction: 'INBOUND',
          logType: 'OCPP 1.6J',
          idTag: 'TAG-84920412',
          summary: 'Sample Periodic: 14.35 kWh @ 7.38 kW',
          body: {
            connectorId: 1,
            transactionId: 3499,
            meterValue: [
              {
                timestamp: new Date().toISOString(),
                sampledValue: [
                  { value: (14.23 + Math.random() * 0.2).toFixed(2), unit: 'kWh', measurand: 'Energy.Active.Import.Register' },
                  { value: (7.38 + (Math.random() * 0.1 - 0.05)).toFixed(2), unit: 'kW', measurand: 'Power.Active.Import' }
                ]
              }
            ]
          }
        },
        {
          command: 'HeartbeatRequest',
          direction: 'INBOUND',
          logType: 'OCPP 1.6J',
          idTag: '-',
          summary: 'Keepalive ping received',
          body: {}
        }
      ];

      const selectedEvent = liveEvents[Math.floor(Math.random() * liveEvents.length)];
      const msgId = String(Math.floor(4000 + Math.random() * 5000));
      const now = new Date();
      const timeStr = `Today, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;

      const newEntry = {
        id: `log_live_${Date.now()}`,
        ...selectedEvent,
        messageId: msgId,
        recordedOn: timeStr,
        fullTimestamp: now.toLocaleString()
      };

      setLogsList(prev => [newEntry, ...prev.slice(0, 79)]);
    }, 7000);

    return () => clearInterval(interval);
  }, [isLive, isOngoing]);

  // Filter handlers
  const handleCommandFilterChange = (val) => {
    setSelectedCommands(prev =>
      prev.includes(val) ? prev.filter(c => c !== val) : [...prev, val]
    );
  };

  const handleTypeFilterChange = (val) => {
    setSelectedLogTypes(prev =>
      prev.includes(val) ? prev.filter(t => t !== val) : [...prev, val]
    );
  };

  const activeFiltersCount = selectedCommands.length + selectedLogTypes.length;

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logsList.filter(log => {
      const search = searchTerm.trim().toLowerCase();
      const matchesSearch = !search ||
        log.command.toLowerCase().includes(search) ||
        log.messageId.toLowerCase().includes(search) ||
        (log.idTag && log.idTag.toLowerCase().includes(search)) ||
        (log.summary && log.summary.toLowerCase().includes(search)) ||
        JSON.stringify(log.body).toLowerCase().includes(search);

      const matchesCmd = selectedCommands.length === 0 || selectedCommands.some(cmd => log.command.toLowerCase().includes(cmd.toLowerCase()));
      const matchesType = selectedLogTypes.length === 0 || selectedLogTypes.includes(log.logType);

      return matchesSearch && matchesCmd && matchesType;
    });
  }, [logsList, searchTerm, selectedCommands, selectedLogTypes]);

  const toast = useToast();

  // Copy JSON handler with toast feedback
  const handleCopy = (text, idKey) => {
    navigator.clipboard.writeText(text);
    setCopiedId(idKey);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('Telemetry payload copied to clipboard', { title: 'Copied' });
  };

  // Export logs handler with CSV format and toast notification
  const handleExport = () => {
    try {
      if (!filteredLogs || filteredLogs.length === 0) {
        toast.warning("No telemetry log records to export", { title: "Export Warning", code: 400 });
        return;
      }

      const headers = ["Message ID", "Command", "Direction", "ID Tag", "Protocol", "Timestamp", "Summary"];
      const rows = filteredLogs.map(l => [
        `"${l.messageId || ''}"`,
        `"${l.command || ''}"`,
        `"${l.direction || ''}"`,
        `"${l.idTag || '-'}"`,
        `"${l.logType || 'OCPP 1.6J'}"`,
        `"${l.recordedOn || ''}"`,
        `"${(l.summary || '').replace(/"/g, '""')}"`
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `telemetry_logs_${cp?.code || 'ocpp'}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Successfully exported ${filteredLogs.length} telemetry log records to CSV`, {
        title: 'Backend Export Complete',
        code: 200
      });
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to export telemetry logs", { title: "Export Error", code: 500 });
    }
  };

  // Command Badge styling with Direction Icon
  const getCommandBadge = (command, direction) => {
    const isIp = direction === 'INBOUND';
    let colorStyle = 'bg-stone-100 text-stone-700 border-stone-200';
    
    if (command.includes('MeterValues')) colorStyle = 'bg-purple-50 text-purple-700 border-purple-200/80';
    if (command.includes('StatusNotification')) colorStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
    if (command.includes('BootNotification')) colorStyle = 'bg-amber-50 text-amber-700 border-amber-200/80';
    if (command.includes('StartTransaction') || command.includes('StopTransaction')) colorStyle = 'bg-sky-50 text-sky-700 border-sky-200/80';

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold border ${colorStyle}`}>
        {isIp ? (
          <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600 shrink-0" title="Inbound from CP" />
        ) : (
          <ArrowUpRight className="w-3.5 h-3.5 text-sky-600 shrink-0" title="Outbound from CSMS" />
        )}
        <span>{command}</span>
      </span>
    );
  };

  return (
    <div className="bg-white border border-stone-200/90 shadow-2xs rounded-2xl overflow-hidden flex flex-col w-full min-h-[500px] animate-in fade-in duration-200 relative">

      {/* Top Control Bar Header inside the single card container (matching ChargePointsList.jsx) */}
      <div className="px-5 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border-b border-stone-200/80">
        
        {/* Telemetry Log Feed Counter */}
        <div className="flex items-center gap-2 text-xs">
          <div className={`w-2 h-2 rounded-full ${isOngoing ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></div>
          <span className="font-bold text-stone-900 tracking-tight">Telemetry Log Feed</span>
          <span className="bg-stone-100/90 text-stone-700 border border-stone-200/80 px-2 py-0.5 rounded-md font-mono text-[11px] font-bold ml-1">
            {filteredLogs.length} events
          </span>
        </div>

        {/* Right Section: Search & Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          
          {/* Search Box */}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search command, ID, payload..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-7 py-1.5 bg-stone-50 border border-stone-200 text-stone-900 rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500 focus:bg-white w-full sm:w-56 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Live Stream Toggle */}
          <button
            onClick={() => setIsLive(!isLive)}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer border ${
              isLive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-2xs hover:bg-emerald-100/70'
                : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
            }`}
          >
            {isLive ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Live Stream</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current text-stone-500" />
                <span>Paused</span>
              </>
            )}
          </button>

          {/* Popover Filter Button */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 font-bold rounded-xl shadow-2xs text-xs cursor-pointer transition-colors"
            >
              <Filter className="w-3.5 h-3.5 text-violet-500" />
              <span>Filter</span>
              {activeFiltersCount > 0 && (
                <span className="flex items-center justify-center w-4 h-4 bg-orange-500 text-white rounded-full text-[10px] font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Filter Popover */}
            {isFilterOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-stone-200 shadow-xl rounded-2xl z-50 p-5 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
                  <h3 className="font-extrabold text-stone-800 text-xs flex items-center gap-2">
                    <Filter className="w-3.5 h-3.5 text-violet-500" />
                    Filter Telemetry Logs
                  </h3>
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={() => {
                        setSelectedCommands([]);
                        setSelectedLogTypes([]);
                      }}
                      className="text-[11px] font-bold text-rose-500 hover:text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <FilterSection
                    title="Command Family"
                    options={['MeterValues', 'StatusNotification', 'BootNotification', 'StartTransaction', 'Heartbeat']}
                    selected={selectedCommands}
                    onChange={handleCommandFilterChange}
                  />
                  <FilterSection
                    title="Log Protocol"
                    options={['OCPP 1.6J', 'WebSocket']}
                    selected={selectedLogTypes}
                    onChange={handleTypeFilterChange}
                  />
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleExport}
            className="px-3 py-1.5 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 font-bold rounded-xl text-xs shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
            title="Download logs as CSV"
          >
            <Download className="w-3.5 h-3.5 text-stone-500" />
            <span>Export</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-0 w-full items-start flex-1">
        <div className={`flex-1 w-full transition-all duration-300 ${selectedLog ? 'lg:w-3/5' : 'w-full'}`}>
          <div className="overflow-x-auto scrollbar-thin transform-gpu translate-z-0">
            <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#F8FAFC] border-b border-stone-200">
                  <tr className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                    {/* Column 1: Actions */}
                    <th className="px-4 py-3 text-center font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap w-24">
                      <div className="flex items-center justify-center gap-1.5">
                        <Settings2 className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Actions
                      </div>
                    </th>

                    {/* Column 2: Command Action */}
                    <th className="px-4 py-3 text-left font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Command
                      </div>
                    </th>

                    {/* Column 3: Message ID */}
                    <th className="px-4 py-3 text-left font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Hash className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Message ID
                      </div>
                    </th>

                    {/* Column 4: ID Tag */}
                    <th className="px-4 py-3 text-left font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> ID Tag
                      </div>
                    </th>

                    {/* Column 5: Recorded On */}
                    <th className="px-4 py-3 text-left font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Recorded On
                      </div>
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-stone-200/70 bg-white text-xs font-medium">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-16 text-center text-stone-400 font-extrabold text-xs">
                        No OCPP telemetry logs found matching active criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => {
                      const isSelected = selectedLog?.id === log.id;
                      return (
                        <tr
                          key={log.id}
                          onClick={() => setSelectedLog(isSelected ? null : log)}
                          className={`group transition-all duration-150 cursor-pointer ${
                            isSelected
                              ? 'bg-sky-50/90 font-semibold'
                              : 'hover:bg-[#F8FAFF]'
                          }`}
                        >
                          {/* Column 1: Action Button (Visible on row hover or when selected) */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedLog(isSelected ? null : log);
                                }}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all duration-150 cursor-pointer border ${
                                  isSelected
                                    ? 'bg-sky-600 text-white border-sky-700 opacity-100 shadow-2xs'
                                    : 'text-sky-700 bg-sky-50 hover:bg-sky-600 hover:text-white border-sky-200/80 opacity-0 group-hover:opacity-100'
                                }`}
                              >
                                {isSelected ? 'Close' : 'View Body'}
                              </button>
                            </div>
                          </td>

                          {/* Column 2: Command Action with Direction Indicator */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            {getCommandBadge(log.command, log.direction)}
                          </td>

                          {/* Column 3: Message ID */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-mono text-sky-700 font-bold text-sm tracking-tight">
                              {log.messageId}
                            </span>
                          </td>

                          {/* Column 4: ID Tag */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-mono font-bold text-stone-900 text-sm">
                              {log.idTag || '-'}
                            </span>
                          </td>

                          {/* Column 5: Recorded On */}
                          <td className="py-3 px-4 text-stone-500 font-medium text-xs whitespace-nowrap">
                            {log.recordedOn}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        {/* FOCUSED LOG BODY DRAWER (NON-REPETITIVE, 100% FOCUS ON LOG BODY) */}
        {selectedLog && (
          <div className="w-full lg:w-[480px] bg-white border border-stone-200/90 rounded-2xl shadow-xl p-5 flex flex-col justify-between animate-in slide-in-from-right duration-200 shrink-0 self-start sticky top-4">
            
            <div className="space-y-4">
              
              {/* Drawer Header: Command + Message ID */}
              <div className="flex items-center justify-between pb-3 border-b border-stone-200/80">
                <div className="flex items-center gap-2">
                  <Braces className="w-4 h-4 text-sky-600" />
                  <h3 className="text-sm font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
                    <span>{selectedLog.command}</span>
                    <span className="font-mono text-sky-600 text-xs font-bold bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                      ID: {selectedLog.messageId}
                    </span>
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Inspector Sub-Tabs: Formatted JSON vs Raw Frame */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl text-xs font-extrabold flex-1">
                  <button
                    onClick={() => setInspectorTab('json')}
                    className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                      inspectorTab === 'json' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Log Body (JSON)
                  </button>
                  <button
                    onClick={() => setInspectorTab('raw')}
                    className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                      inspectorTab === 'raw' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Raw Frame
                  </button>
                </div>

                {/* 1-Click Copy Button */}
                <button
                  onClick={() => handleCopy(
                    inspectorTab === 'json'
                      ? JSON.stringify(selectedLog.body, null, 2)
                      : `[2, "${selectedLog.messageId}", "${selectedLog.command}", ${JSON.stringify(selectedLog.body)}]`,
                    'inspector_copy'
                  )}
                  className="px-3 py-1.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-700 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  {copiedId === 'inspector_copy' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-stone-500" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Main Log Body Display Box */}
              {inspectorTab === 'json' ? (
                <div className="bg-[#0F172A] p-4 rounded-xl max-h-[420px] overflow-y-auto border border-slate-800 shadow-inner scrollbar-thin">
                  <JsonSyntaxHighlighter json={selectedLog.body} />
                </div>
              ) : (
                <div className="bg-[#0B0F17] text-amber-300 font-mono text-xs p-4 rounded-xl border border-slate-800 overflow-x-auto leading-relaxed max-h-[420px]">
                  <code>
                    {`[2, "${selectedLog.messageId}", "${selectedLog.command}", ${JSON.stringify(selectedLog.body, null, 2)}]`}
                  </code>
                </div>
              )}

              {/* Minimal Timestamp Footer */}
              <div className="flex items-center justify-between text-xs text-stone-500 pt-1">
                <span>Recorded: <strong className="text-stone-700 font-medium">{selectedLog.fullTimestamp}</strong></span>
                <span className="font-mono text-[11px] text-stone-400">Protocol: {selectedLog.logType}</span>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
