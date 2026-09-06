import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  CreditCard,
  Search,
  Filter,
  ArrowLeft,
  X,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Terminal
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import BackButton from '../../../components/ui/BackButton';
import SearchInput from '../../../components/ui/SearchInput';

const ALL_PAYMENT_LOGS = [];

export default function PaymentLogsView() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  const [inspectLog, setInspectLog] = useState(location.state?.highlightId ? ALL_PAYMENT_LOGS.find(l => l.id === location.state.highlightId) : null);
  const [copiedPayload, setCopiedPayload] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const filteredLogs = useMemo(() => {
    return ALL_PAYMENT_LOGS.filter(log => {
      const search = searchTerm.trim().toLowerCase();
      const matchesSearch = !search ||
        log.event.toLowerCase().includes(search) ||
        log.transactionId.toLowerCase().includes(search) ||
        log.sessionId.toLowerCase().includes(search) ||
        log.message.toLowerCase().includes(search);

      const matchesEvent = selectedEvent === 'All' || log.event === selectedEvent;
      const matchesStatus = selectedStatus === 'All' || log.status === selectedStatus;

      return matchesSearch && matchesEvent && matchesStatus;
    });
  }, [searchTerm, selectedEvent, selectedStatus]);

  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  const handleCopyJson = () => {
    if (!inspectLog) return;
    navigator.clipboard.writeText(JSON.stringify(inspectLog.rawPayload, null, 2));
    setCopiedPayload(true);
    toast.success('Raw payload copied to clipboard');
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1500px] w-full mx-auto pb-12">
      {/* Back Button & Top Header */}
      <div className="space-y-2 px-1">
        <div>
          <BackButton to="/payment-providers" label="Back to Payment Integration" />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2.5">
              <CreditCard className="w-6 h-6 text-cyan-600" />
              Payment Gateway Logs
            </h1>
            <p className="text-xs text-stone-500 font-medium mt-0.5">
              Audit trail of all payment gateway events, authorizations, captures, and refund webhooks.
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar: Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <SearchInput
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onClear={() => setSearchTerm('')}
          placeholder="Search by event, txn ID, session ID, message..."
          wrapperClassName="flex-1 max-w-md"
        />

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="payment-logs-event" className="text-xs font-bold text-stone-600">Event:</label>
            <select
              id="payment-logs-event"
              name="event"
              autoComplete="off"
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs font-bold text-stone-800 focus:outline-hidden focus:bg-white cursor-pointer"
            >
              <option value="All">All Events</option>
              <option value="payment.captured">payment.captured</option>
              <option value="payment.authorized">payment.authorized</option>
              <option value="payment.created">payment.created</option>
              <option value="refund.processed">refund.processed</option>
              <option value="payment.failed">payment.failed</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="payment-logs-status" className="text-xs font-bold text-stone-600">Status:</label>
            <select
              id="payment-logs-status"
              name="status"
              autoComplete="off"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs font-bold text-stone-800 focus:outline-hidden focus:bg-white cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Success">Success</option>
              <option value="Failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Layout: Table & Inspector Drawer */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className={`w-full transition-all duration-300 ${inspectLog ? 'lg:w-3/5' : 'w-full'}`}>
          <div className="bg-white border border-stone-200/90 rounded-2xl shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#F8FAFC] border-b border-stone-200 text-stone-700 font-bold text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 whitespace-nowrap">Time</th>
                    <th className="px-4 py-3 whitespace-nowrap">Event</th>
                    <th className="px-4 py-3 whitespace-nowrap">Status</th>
                    <th className="px-4 py-3 whitespace-nowrap">Txn ID</th>
                    <th className="px-4 py-3 whitespace-nowrap">Session</th>
                    <th className="px-4 py-3 whitespace-nowrap">Amount</th>
                    <th className="px-4 py-3 whitespace-nowrap text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-stone-200/70 text-xs font-medium">
                  {paginatedLogs.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-4 py-12 text-center text-stone-400 font-bold">
                        No payment logs match the active search criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedLogs.map((log) => {
                      const isSelected = inspectLog?.id === log.id;
                      return (
                        <tr
                          key={log.id}
                          onClick={() => setInspectLog(isSelected ? null : log)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? 'bg-sky-50/90 font-semibold' : 'hover:bg-[#F8FAFF]'
                          }`}
                        >
                          <td className="px-4 py-3 whitespace-nowrap text-stone-500 font-medium">{log.time}</td>
                          <td className="px-4 py-3 whitespace-nowrap font-mono text-sky-700 font-bold">{log.event}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {log.status === 'Success' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-cyan-50 text-cyan-700 border border-cyan-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                                Success
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                Failed
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap font-mono text-stone-800 font-bold">{log.transactionId}</td>
                          <td className="px-4 py-3 whitespace-nowrap font-mono text-sky-600 font-bold">{log.sessionId}</td>
                          <td className="px-4 py-3 whitespace-nowrap font-mono font-extrabold text-cyan-700">{log.amount}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setInspectLog(isSelected ? null : log);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold border transition cursor-pointer ${
                                isSelected
                                  ? 'bg-sky-600 text-white border-sky-700'
                                  : 'text-sky-700 bg-sky-50 hover:bg-sky-600 hover:text-white border-sky-200'
                              }`}
                            >
                              {isSelected ? 'Close' : 'Inspect JSON'}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="px-5 py-3 bg-[#F8FAFC] border-t border-stone-200 flex items-center justify-between gap-4 text-xs font-semibold text-stone-600">
                <span>
                  Page <strong className="text-stone-900">{currentPage}</strong> of <strong className="text-stone-900">{totalPages}</strong> ({filteredLogs.length} logs)
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="px-3 py-1 bg-white hover:bg-stone-50 border border-stone-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className="px-3 py-1 bg-white hover:bg-stone-50 border border-stone-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Payload Inspector Slide-Over Card */}
        {inspectLog && (
          <div className="w-full lg:w-[480px] bg-white border border-stone-200 rounded-2xl shadow-xl p-5 flex flex-col justify-between animate-in slide-in-from-right duration-200 shrink-0 sticky top-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-600" />
                  <h3 className="text-sm font-black text-stone-900 tracking-tight">
                    Webhook Payload Inspector
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setInspectLog(null)}
                  className="w-7 h-7 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                  {inspectLog.event}
                </span>

                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="px-3 py-1 bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-700 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5"
                >
                  {copiedPayload ? <Check className="w-3.5 h-3.5 text-cyan-600" /> : <Copy className="w-3.5 h-3.5 text-stone-500" />}
                  <span>{copiedPayload ? 'Copied' : 'Copy JSON'}</span>
                </button>
              </div>

              <div className="bg-[#0F172A] text-slate-100 p-4 rounded-xl max-h-[420px] overflow-y-auto font-mono text-xs leading-relaxed border border-slate-800 scrollbar-none shadow-inner">
                <pre>{JSON.stringify(inspectLog.rawPayload, null, 2)}</pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
