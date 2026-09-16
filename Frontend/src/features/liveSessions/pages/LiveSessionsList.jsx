import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveSessions } from '../hooks/useLiveSessions';
import LiveSessionsToolbar from '../components/LiveSessionsToolbar';
import LiveSessionsTable from '../components/LiveSessionsTable';

import { AlertCircle, RefreshCw } from 'lucide-react';

/**
 * LiveSessionsList Page
 * Displays active ongoing charging sessions streaming real-time telemetry from charge points.
 */
export default function LiveSessionsList() {
  const navigate = useNavigate();

  // Custom hook for live sessions data, socket updates, and search state
  const {
    searchTerm,
    currentPage,
    loading,
    error,
    isError,
    reload,
    totalItems,
    totalPages,
    paginatedSessions,
    handleSearch,
    setCurrentPage
  } = useLiveSessions();

  // Navigation handlers for stations, charge points, and telemetry logs
  const handleNavigateStation = (stationObj) => {
    if (stationObj?.id) {
      navigate(`/charging-stations/${stationObj.id}`, { state: { station: stationObj } });
    }
  };

  const handleNavigateChargePoint = (cpObj) => {
    if (cpObj?.id) {
      navigate(`/charge-points/${cpObj.id}`, { state: { chargePoint: cpObj } });
    }
  };

  const handleNavigateLogs = (session) => {
    if (session?.id) {
      navigate(`/session-logs/${session.id}`, { state: { session } });
    }
  };

  return (
    <div className="flex flex-col gap-3.5 max-w-[1400px] w-full mx-auto pb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-1 mt-0">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Active Live Sessions
          </h1>
          <p className="text-xs text-stone-500 mt-0.5 font-medium ml-0.5">
            Real-time active charging sessions currently streaming telemetry from charge points.
          </p>
        </div>
      </div>

      <LiveSessionsToolbar
        searchTerm={searchTerm}
        onSearchChange={handleSearch}
        onNavigateHistory={() => navigate('/session-history')}
      />

      {isError && (
        <div className="flex items-center justify-between p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-medium shadow-2xs animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <div>
              <h4 className="font-bold text-rose-900 text-sm">Failed to Load Live Sessions</h4>
              <p className="text-rose-700 mt-0.5">{error?.message || 'A network error occurred while connecting to the server.'}</p>
            </div>
          </div>
          <button
            onClick={() => reload()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-rose-200 hover:bg-rose-100 text-rose-800 font-bold rounded-xl transition cursor-pointer shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      <LiveSessionsTable
        sessions={paginatedSessions}
        loading={loading}
        searchTerm={searchTerm}
        onResetSearch={() => handleSearch({ target: { value: '' } })}
        onNavigateStation={handleNavigateStation}
        onNavigateChargePoint={handleNavigateChargePoint}
        onNavigateLogs={handleNavigateLogs}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={10}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
