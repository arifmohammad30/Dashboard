import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Loader2 } from 'lucide-react';
import { useStationTransactions } from '../hooks/useStationTransactions';
import SessionHistoryTable from '../../liveSessions/components/SessionHistoryTable';


// Displays the paginated and real-time charging session transactions
// scoped specifically to this charging station.
export default function StationTransactionsTab({ station }) {
  const navigate = useNavigate();


  // 1. Data Fetching & Realtime Synchronization Hook

  // Custom hook managing server-side pagination and WebSocket updates
  const {
    sessions,
    loading,
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems,
    itemsPerPage
  } = useStationTransactions(station);


  // 2. Navigation Handlers (ID-based routing)

  // Navigate to Charging Station details view
  const handleNavigateStation = (st) => {
    if (st?.id && st.id !== '-') {
      navigate(`/charging-stations/${st.id}`, { state: { station: st } });
    }
  };

  // Navigate to Charge Point details view
  const handleNavigateChargePoint = (cpObj) => {
    if (cpObj?.id && cpObj.id !== '-') {
      navigate(`/charge-points/${cpObj.id}`, { state: { chargePoint: cpObj } });
    }
  };

  // Navigate to Session Logs audit view
  const handleNavigateLogs = (session) => {
    if (session?.id) {
      navigate(`/session-logs/${session.id}`, { state: { session } });
    }
  };


  // 3. Loading State Render

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-stone-400 gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-[#4DA944]" />
        <span className="text-xs font-semibold">Loading station transactions...</span>
      </div>
    );
  }


  // 4. Empty State Render

  if (!sessions || sessions.length === 0) {
    return (
      <div className="text-stone-500 text-center py-16 bg-white border border-stone-200/80 rounded-2xl shadow-2xs">
        <Zap className="w-10 h-10 text-stone-300 mx-auto mb-3" />
        <p className="font-bold text-sm text-stone-700">No charge transactions found for {station?.name || 'this station'}.</p>
        <p className="text-xs text-stone-400 mt-1">Sessions performed exclusively at this Charging Station will appear here.</p>
      </div>
    );
  }


  // 5. Paginated Session History Table Render

  return (
    <div className="flex flex-col gap-4">
      <SessionHistoryTable
        sessions={sessions}
        loading={loading}
        onNavigateStation={handleNavigateStation}
        onNavigateChargePoint={handleNavigateChargePoint}
        onNavigateLogs={handleNavigateLogs}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}

