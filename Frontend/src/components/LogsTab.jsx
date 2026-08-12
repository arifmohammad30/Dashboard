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
import ExportButton from './ui/ExportButton';
import { exportLogs } from '../features/liveSessions/api/sessionService';
import { apiClient } from '../lib/apiClient';

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

export default function LogsTab({ cp, sessionData }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [inspectorTab, setInspectorTab] = useState('json');

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedCommands, setSelectedCommands] = useState([]);
  const [selectedLogTypes, setSelectedLogTypes] = useState([]);
  const filterRef = useRef(null);

  const isOngoing = sessionData?.status === 'Ongoing';
  const [logsList, setLogsList] = useState([]);
  const [isLive, setIsLive] = useState(isOngoing);

  useEffect(() => {
    if (sessionData?.id) {
      apiClient(`/api/livesessions/${sessionData.id}/logs`)
        .then(data => {
          if (Array.isArray(data)) {
            const formatted = data.map(log => ({
              ...log,
              body: typeof log.body === 'string' ? (JSON.parse(log.body) || {}) : (log.body || {}),
              recordedOn: log.createdAt ? new Date(log.createdAt).toLocaleString() : 'Just now',
              fullTimestamp: log.createdAt ? new Date(log.createdAt).toLocaleString() : 'Just now'
            }));
            setLogsList(formatted);
          }
        })
        .catch(() => {});
    }
  }, [sessionData?.id]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const handleCopy = (text, idKey) => {
    navigator.clipboard.writeText(text);
    setCopiedId(idKey);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('Telemetry payload copied to clipboard', { title: 'Copied' });
  };

  const handleExport = async () => {
    try {
      await exportLogs({ search: searchTerm });
      toast.success("Telemetry logs CSV export downloaded from backend server", {
        title: 'Backend Export Complete',
        code: 200
      });
    } catch (err) {
      console.error("Export error:", err);
      toast.error(err.message || "Failed to export telemetry logs", {
        title: err.title || "Export Error",
        code: err.code || 500
      });
    }
  };

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
    <div className="bg-white border border-stone-200/90 shadow-2xs rounded-xl overflow-hidden flex flex-col w-full min-h-[500px] animate-in fade-in duration-200 relative">
      <div className="px-5 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border-b border-stone-200/80">
        <div className="flex items-center gap-2 text-xs">
          <div className={`w-2 h-2 rounded-full ${isOngoing ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></div>
          <span className="font-bold text-stone-900 tracking-tight">Telemetry Log Feed</span>
          <span className="bg-stone-100/90 text-stone-700 border border-stone-200/80 px-2 py-0.5 rounded-md font-mono text-[11px] font-bold ml-1">
            {filteredLogs.length} events
          </span>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
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

          <ExportButton
            onExport={handleExport}
            label="Export"
          />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-0 w-full items-start flex-1">
        <div className={`flex-1 w-full transition-all duration-300 ${selectedLog ? 'lg:w-3/5' : 'w-full'}`}>
          <div className="overflow-x-auto scrollbar-thin transform-gpu translate-z-0">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#F8FAFC] border-b border-stone-200">
                <tr className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                  <th className="px-4 py-3 text-center font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap w-24">
                    <div className="flex items-center justify-center gap-1.5">
                      <Settings2 className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Actions
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Command
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Message ID
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> ID Tag
                    </div>
                  </th>
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

                        <td className="py-3 px-4 whitespace-nowrap">
                          {getCommandBadge(log.command, log.direction)}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-mono text-sky-700 font-bold text-sm tracking-tight">
                            {log.messageId}
                          </span>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-mono font-bold text-stone-900 text-sm">
                            {log.idTag || '-'}
                          </span>
                        </td>

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

        {selectedLog && (
          <div className="w-full lg:w-[480px] bg-white border border-stone-200/90 rounded-xl shadow-lg p-5 flex flex-col justify-between animate-in slide-in-from-right duration-200 shrink-0 self-start sticky top-4">
            <div className="space-y-4">
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

              {inspectorTab === 'json' ? (
                <div className="bg-[#0F172A] p-4 rounded-xl max-h-[420px] overflow-y-auto border border-slate-800 shadow-inner scrollbar-none">
                  <JsonSyntaxHighlighter json={selectedLog.body} />
                </div>
              ) : (
                <div className="bg-[#0B0F17] text-amber-300 font-mono text-xs p-4 rounded-xl border border-slate-800 overflow-x-auto leading-relaxed max-h-[420px] scrollbar-none">
                  <code>
                    {`[2, "${selectedLog.messageId}", "${selectedLog.command}", ${JSON.stringify(selectedLog.body, null, 2)}]`}
                  </code>
                </div>
              )}

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
