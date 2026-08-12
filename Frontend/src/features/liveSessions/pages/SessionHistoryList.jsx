import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import Pagination from '../../../components/ui/Pagination';
import { useToast } from '../../../context/ToastContext';
import { useSessionHistory } from '../hooks/useSessionHistory';
import { useLookupMaps } from '../hooks/useLookupMaps';
import { exportSessionsToCsv } from '../utils/exportSessionsCsv';
import SessionHistoryToolbar from '../components/SessionHistoryToolbar';
import SessionHistoryTable from '../components/SessionHistoryTable';

export default function SessionHistoryList() {
  const navigate = useNavigate();
  const toast = useToast();

  const {
    activeTab,
    searchTerm,
    currentPage,
    loading,
    totalItems,
    totalPages,
    filteredSessions,
    paginatedSessions,
    handleSearch,
    handleTabChange,
    setCurrentPage
  } = useSessionHistory();

  const { resolveStation, resolveChargePoint } = useLookupMaps();

  const handleExportCsv = () => {
    exportSessionsToCsv(toast, { status: activeTab, search: searchTerm });
  };

  const handleNavigateStation = (stationObj) => {
    navigate(`/charging-stations/${stationObj.id}`, { state: { station: stationObj } });
  };

  const handleNavigateChargePoint = (cpObj) => {
    navigate(`/charge-points/${cpObj.id}`, { state: { chargePoint: cpObj } });
  };

  const handleNavigateLogs = (session) => {
    navigate(`/session-logs/${session.id}`, { state: { session } });
  };

  return (
    <div className="flex flex-col gap-3.5 max-w-[1400px] w-full mx-auto pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 mt-0">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Session History Audit Log
          </h1>
          <p className="text-xs text-stone-500 mt-0.5 font-medium ml-0.5">
            Complete historical record of completed and failed charging sessions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigate('/live-sessions')}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold border border-stone-200 shadow-2xs rounded-xl text-xs cursor-pointer transition-all duration-150 active:scale-95 group"
          >
            <span>Active Live Sessions</span>
            <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
          </button>
        </div>
      </div>

      <SessionHistoryToolbar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        searchTerm={searchTerm}
        onSearchChange={handleSearch}
        onExportCsv={handleExportCsv}
        onNavigateActiveSessions={() => navigate('/live-sessions')}
      />

      <SessionHistoryTable
        sessions={paginatedSessions}
        loading={loading}
        resolveStation={resolveStation}
        resolveChargePoint={resolveChargePoint}
        onNavigateStation={handleNavigateStation}
        onNavigateChargePoint={handleNavigateChargePoint}
        onNavigateLogs={handleNavigateLogs}
      />

      {!loading && totalItems > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={10}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}
