import React from 'react';
import { Zap, Loader2 } from 'lucide-react';
import { useStationTransactions } from '../hooks/useStationTransactions';
import SessionHistoryTable from '../../liveSessions/components/SessionHistoryTable';

export default function StationTransactionsTab({ station, transactions: propTransactions }) {
  const {
    sessions,
    loading,
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems,
    itemsPerPage
  } = useStationTransactions(station, propTransactions);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-stone-400 gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
        <span className="text-xs font-semibold">Loading station transactions...</span>
      </div>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div className="text-stone-500 text-center py-16 bg-white border border-stone-200/80 rounded-2xl shadow-2xs">
        <Zap className="w-10 h-10 text-stone-300 mx-auto mb-3" />
        <p className="font-bold text-sm text-stone-700">No charge transactions found for {station?.name || 'this station'}.</p>
        <p className="text-xs text-stone-400 mt-1">Sessions performed exclusively at this Charging Station will appear here.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <SessionHistoryTable
        sessions={sessions}
        loading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
