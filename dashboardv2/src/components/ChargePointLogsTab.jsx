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
  Filter
} from 'lucide-react';
import FilterSection from './ui/FilterSection';

export default function ChargePointLogsTab({ cp }) {
  const [isLive, setIsLive] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [copied, setCopied] = useState(false);

  // Filter Popover State matching standard dashboard components
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedCommands, setSelectedCommands] = useState([]);
  const [selectedLogTypes, setSelectedLogTypes] = useState([]);
  const filterRef = useRef(null);

  // Initial reference mock OCPP log records matching Pulse console
  const initialLogs = useMemo(() => [
    {
      id: 'log_01',
      command: 'MeterValuesResponse',
      messageId: '3499',
      logType: 'OCPP 1.6J',
      idTag: '-',
      recordedOn: 'Today, 08:17:37 pm',
      fullTimestamp: 'Aug 08, 2026 08:17:37 PM',
      body: {
        connectorId: 1,
        transactionId: 3499,
        status: 'Accepted',
        meterValue: [
          {
            timestamp: '2026-08-08T08:17:37Z',
            sampledValue: [
              { value: '14.23', context: 'Sample.Periodic', format: 'Raw', measurand: 'Energy.Active.Import.Register', unit: 'kWh' },
              { value: '7.4', context: 'Sample.Periodic', format: 'Raw', measurand: 'Power.Active.Import', unit: 'kW' }
            ]
          }
        ]
      }
    },
    {
      id: 'log_02',
      command: 'MeterValuesRequest',
      messageId: '3499',
      logType: 'OCPP 1.6J',
      idTag: '-',
      recordedOn: 'Today, 08:17:37 pm',
      fullTimestamp: 'Aug 08, 2026 08:17:37 PM',
      body: {
        connectorId: 1,
        transactionId: 3499,
        meterValue: [
          {
            timestamp: '2026-08-08T08:17:37Z',
            sampledValue: [{ value: '14.23', unit: 'kWh' }]
          }
        ]
      }
    },
    {
      id: 'log_03',
      command: 'MeterValuesResponse',
      messageId: '3497',
      logType: 'OCPP 1.6J',
      idTag: '-',
      recordedOn: 'Today, 08:07:07 pm',
      fullTimestamp: 'Aug 08, 2026 08:07:07 PM',
      body: { connectorId: 1, transactionId: 3497, status: 'Accepted' }
    },
    {
      id: 'log_04',
      command: 'MeterValuesRequest',
      messageId: '3497',
      logType: 'OCPP 1.6J',
      idTag: '-',
      recordedOn: 'Today, 08:07:07 pm',
      fullTimestamp: 'Aug 08, 2026 08:07:07 PM',
      body: { connectorId: 1, transactionId: 3497 }
    },
    {
      id: 'log_05',
      command: 'ConnectionClosed',
      messageId: 'CP2FF2476W-ODL9QQH',
      logType: 'WebSocket',
      idTag: '-',
      recordedOn: 'Today, 06:19:46 pm',
      fullTimestamp: 'Aug 08, 2026 06:19:46 PM',
      body: { reason: 'RemoteStopRequested', activeDuration: '1480s' }
    },
    {
      id: 'log_06',
      command: 'StatusNotificationResponse',
      messageId: '1001',
      logType: 'OCPP 1.6J',
      idTag: '-',
      recordedOn: 'Today, 01:14:37 pm',
      fullTimestamp: 'Aug 08, 2026 01:14:37 PM',
      body: { status: 'Accepted', errorCode: 'NoError' }
    },
    {
      id: 'log_07',
      command: 'BootNotificationResponse',
      messageId: '1000',
      logType: 'OCPP 1.6J',
      idTag: '-',
      recordedOn: 'Today, 01:14:37 pm',
      fullTimestamp: 'Aug 08, 2026 01:14:37 PM',
      body: { currentTime: '2026-08-08T13:14:37Z', interval: 300, status: 'Accepted' }
    },
    {
      id: 'log_08',
      command: 'StatusNotificationRequest',
      messageId: '1001',
      logType: 'OCPP 1.6J',
      idTag: '-',
      recordedOn: 'Today, 01:14:37 pm',
      fullTimestamp: 'Aug 08, 2026 01:14:37 PM',
      body: { connectorId: 1, errorCode: 'NoError', status: 'Available' }
    },
    {
      id: 'log_09',
      command: 'BootNotificationRequest',
      messageId: '1000',
      logType: 'OCPP 1.6J',
      idTag: '-',
      recordedOn: 'Today, 01:14:37 pm',
      fullTimestamp: 'Aug 08, 2026 01:14:37 PM',
      body: { chargePointVendor: 'Siemens', chargePointModel: 'VersiCharge', firmwareVersion: '2.0.2' }
    },
    {
      id: 'log_10',
      command: 'ConnectionOpened',
      messageId: 'CP2FF2476W-ODL9QQH',
      logType: 'WebSocket',
      idTag: '-',
      recordedOn: 'Today, 01:14:36 pm',
      fullTimestamp: 'Aug 08, 2026 01:14:36 PM',
      body: { ipAddress: '192.168.1.104', protocol: 'ocpp1.6j' }
    }
  ], []);

  const [logsList, setLogsList] = useState(initialLogs);

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

  // Live streaming simulation
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      const commands = ['Heartbeat', 'MeterValuesRequest', 'StatusNotificationRequest'];
      const cmd = commands[Math.floor(Math.random() * commands.length)];
      const msgId = String(Math.floor(1000 + Math.random() * 9000));
      const now = new Date();
      const timeStr = `Today, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;

      const newEntry = {
        id: `log_live_${Date.now()}`,
        command: cmd,
        messageId: msgId,
        logType: 'OCPP 1.6J',
        idTag: '-',
        recordedOn: timeStr,
        fullTimestamp: now.toLocaleString(),
        body: { connectorId: 1, timestamp: now.toISOString(), status: 'Accepted' }
      };

      setLogsList(prev => [newEntry, ...prev.slice(0, 49)]);
    }, 8000);

    return () => clearInterval(interval);
  }, [isLive]);

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

  // Filter logs by search term, command filters, and type filters
  const filteredLogs = useMemo(() => {
    return logsList.filter(log => {
      const matchesCmd = selectedCommands.length === 0 || selectedCommands.some(cmd => log.command.toLowerCase().includes(cmd.toLowerCase()));
      const matchesType = selectedLogTypes.length === 0 || selectedLogTypes.includes(log.logType);
      const matchesSearch = !searchTerm ||
        log.command.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.messageId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.idTag && log.idTag.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesCmd && matchesType && matchesSearch;
    });
  }, [logsList, selectedCommands, selectedLogTypes, searchTerm]);

  // Copy JSON handler
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Export logs handler
  const handleExport = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(filteredLogs, null, 2))}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `ocpp_logs_${cp?.code || 'cp'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="flex gap-6 w-full animate-in fade-in duration-200 relative">
      {/* Main Table Container */}
      <div className={`flex-1 flex flex-col gap-4 transition-all duration-300 ${selectedLog ? 'lg:w-2/3' : 'w-full'}`}>
        {/* Top Control Toolbar with Standard Filter Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-stone-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold text-stone-500">Last heartbeat:</span>
            <span className="text-sm font-extrabold text-stone-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              Today, 08:17:37 pm
            </span>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3.5 py-2 bg-stone-50 border border-stone-200 text-stone-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-stone-400 w-36 sm:w-48 transition-colors"
              />
            </div>

            {/* Live Streaming Toggle Button */}
            <button
              onClick={() => setIsLive(!isLive)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer border ${
                isLive
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-2xs'
                  : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
              }`}
            >
              {isLive ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Live</span>
                  <span className="text-emerald-400">|</span>
                  <span className="text-xs font-bold">Disable Live Logs</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Enable Live Logs</span>
                </>
              )}
            </button>

            {/* Standard Dashboard Filter Button & Popover */}
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 font-bold rounded-xl shadow-2xs text-xs cursor-pointer transition-colors"
              >
                <Filter className="w-3.5 h-3.5 text-violet-500" />
                <span>Filter</span>
                {activeFiltersCount > 0 && (
                  <span className="flex items-center justify-center w-4 h-4 bg-orange-500 text-white rounded-full text-[10px] font-bold">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {/* Filter Popover Dropdown */}
              {isFilterOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white border border-stone-200 shadow-xl rounded-2xl z-50 p-5 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
                    <h3 className="font-extrabold text-stone-800 text-xs flex items-center gap-2">
                      <Filter className="w-3.5 h-3.5 text-violet-500" />
                      Filter Logs
                    </h3>
                    {activeFiltersCount > 0 && (
                      <button
                        onClick={() => {
                          setSelectedCommands([]);
                          setSelectedLogTypes([]);
                        }}
                        className="text-[11px] font-bold text-rose-500 hover:text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <FilterSection
                      title="Command Family"
                      options={['MeterValues', 'StatusNotification', 'BootNotification', 'Connection', 'Heartbeat']}
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

            {/* Export Button */}
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 font-bold rounded-xl text-xs shadow-2xs transition-colors cursor-pointer flex items-center gap-2"
            >
              <Download className="w-3.5 h-3.5 text-stone-500" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Professional Table with Enhanced Text Visibility */}
        <div className="bg-white border border-stone-200/90 rounded-2xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left border-separate border-spacing-y-1">
              <thead className="bg-[#F8FAFC] border-b border-stone-200/90 shadow-2xs">
                <tr className="bg-[#F8FAFC] border-b border-stone-200/90">
                  <th className="px-4 py-3 text-left font-extrabold text-stone-700 text-xs uppercase tracking-wider whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Terminal className="w-4 h-4 text-stone-400 stroke-[1.75]" /> Command
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left font-extrabold text-stone-700 text-xs uppercase tracking-wider whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Hash className="w-4 h-4 text-stone-400 stroke-[1.75]" /> Message Id
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left font-extrabold text-stone-700 text-xs uppercase tracking-wider whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-stone-400 stroke-[1.75]" /> Log Type
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left font-extrabold text-stone-700 text-xs uppercase tracking-wider whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <FileCode className="w-4 h-4 text-stone-400 stroke-[1.75]" /> Log Body
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left font-extrabold text-stone-700 text-xs uppercase tracking-wider whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Tag className="w-4 h-4 text-stone-400 stroke-[1.75]" /> Id Tag
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left font-extrabold text-stone-700 text-xs uppercase tracking-wider whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-stone-400 stroke-[1.75]" /> Recorded on
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-sm">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-10 text-center text-stone-400 font-extrabold text-sm">
                      No logs matching selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const isSelected = selectedLog?.id === log.id;
                    return (
                      <tr
                        key={log.id}
                        onClick={() => setSelectedLog(isSelected ? null : log)}
                        className={`transition-colors duration-150 cursor-pointer ${
                          isSelected ? 'bg-sky-50/80 font-bold' : 'hover:bg-stone-50/80'
                        }`}
                      >
                        {/* Command */}
                        <td className="py-3.5 px-4">
                          <span className="font-extrabold text-stone-900 text-sm tracking-tight">
                            {log.command}
                          </span>
                        </td>

                        {/* Message Id - High visibility uniform text */}
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-sky-600 font-extrabold text-xs">
                            {log.messageId}
                          </span>
                        </td>

                        {/* Log Type */}
                        <td className="py-3.5 px-4 text-stone-700 font-semibold text-xs">{log.logType}</td>

                        {/* Log Body Action Button */}
                        <td className="py-3.5 px-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLog(isSelected ? null : log);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer border ${
                              isSelected
                                ? 'bg-sky-500 text-white border-sky-600'
                                : 'text-sky-700 bg-sky-50 hover:bg-sky-500 hover:text-white border-sky-200/80'
                            }`}
                          >
                            {isSelected ? (
                              <>
                                <EyeOff className="w-3.5 h-3.5" />
                                <span>Hide Log Body</span>
                              </>
                            ) : (
                              <>
                                <Eye className="w-3.5 h-3.5" />
                                <span>View Log Body</span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* Id Tag */}
                        <td className="py-3.5 px-4 text-stone-700 font-mono font-semibold text-xs">{log.idTag}</td>

                        {/* Recorded on */}
                        <td className="py-3.5 px-4 text-stone-600 font-semibold text-xs whitespace-nowrap">{log.recordedOn}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right Drawer Inspector Panel matching Reference Image 2 */}
      {selectedLog && (
        <div className="w-full lg:w-[400px] bg-white border border-stone-200/90 rounded-2xl shadow-xl p-5 flex flex-col justify-between animate-in slide-in-from-right duration-200 shrink-0 self-start sticky top-4">
          <div className="space-y-4">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-stone-200/80">
              <div className="flex items-center gap-2">
                <Terminal className="w-4.5 h-4.5 text-sky-600" />
                <h3 className="text-base font-black text-slate-900 tracking-tight">OCPP Log Detail</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Metadata Fields with Increased Text Visibility */}
            <div className="space-y-3.5 text-xs">
              <div>
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-1">Charge Point</span>
                <span className="font-extrabold text-sky-600 text-sm">{cp?.name || 'Sobha City AC11'}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-1">Command</span>
                  <span className="font-extrabold text-stone-900 text-sm">{selectedLog.command}</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-1">Message Id</span>
                  <span className="font-mono font-extrabold text-sky-600 text-sm block">
                    {selectedLog.messageId}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-1">Log Type</span>
                  <span className="font-bold text-stone-800 text-xs">{selectedLog.logType}</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-1">Id Tag</span>
                  <span className="font-mono font-bold text-stone-800 text-xs">{selectedLog.idTag}</span>
                </div>
              </div>

              {/* Log Body Dark Code Block */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Log Body</span>
                  <button
                    onClick={() => handleCopy(JSON.stringify(selectedLog.body, null, 2))}
                    className="text-xs font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1 cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-600">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy JSON</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-[#0F172A] text-slate-200 font-mono text-xs p-4 rounded-xl overflow-x-auto max-h-[240px] shadow-inner leading-relaxed border border-slate-800">
                  <pre>{JSON.stringify(selectedLog.body, null, 2)}</pre>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-1">Recorded on</span>
                <span className="font-bold text-stone-700 text-xs">{selectedLog.fullTimestamp}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-stone-100">
            <button
              onClick={() => setSelectedLog(null)}
              className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Close Inspector
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
