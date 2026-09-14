import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveSessions } from '../hooks/useLiveSessions';
import LiveSessionsToolbar from '../components/LiveSessionsToolbar';
import LiveSessionsTable from '../components/LiveSessionsTable';

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

      <LiveSessionsTable
        sessions={paginatedSessions}
        loading={loading}
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
