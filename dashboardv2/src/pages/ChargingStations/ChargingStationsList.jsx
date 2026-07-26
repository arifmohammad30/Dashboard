import React, { useState } from 'react';
import {
  Search,
  Download,
  Filter,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  Activity,
  Tag,
  Hash,
  Settings2,
  BatteryCharging,
  DollarSign,
  Zap,
  Loader2
} from 'lucide-react';

import Pagination from '../../components/ui/Pagination';
import DeleteModal from '../../components/ui/DeleteModal';

import { getChargingStations, deleteChargingStation } from '../../services/chargingStationService';
import { useTableData } from '../../hooks/useTableData';
import { useSocketEvents } from '../../hooks/useSocketEvents';

export default function ChargingStationsList() {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [stationToDelete, setStationToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Data Fetching Hook
  const {
    data: stations,
    setData: setStations,
    loading,
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems,
    itemsPerPage,
  } = useTableData((page, limit, search) => getChargingStations(page, limit, search));

  // Socket Events Hook
  useSocketEvents({
    chargingStationAdded: (newCs) => {
      setStations(prev => prev.find(cs => cs.id === newCs.id) ? prev : [newCs, ...prev]);
    },
    chargingStationUpdated: (updatedCs) => {
      setStations(prev => prev.map(cs => cs.id === updatedCs.id ? updatedCs : cs));
    },
    chargingStationDeleted: (deletedId) => {
      setStations(prev => prev.filter(cs => cs.id !== deletedId));
    }
  });

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleDeleteClick = (e, cs) => {
    e.stopPropagation();
    setStationToDelete(cs);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!stationToDelete) return;
    setIsDeleting(true);
    try {
      await deleteChargingStation(stationToDelete.id);
      setDeleteModalOpen(false);
      setStationToDelete(null);
    } catch (error) {
      console.error('Failed to delete charging station:', error);
      alert('Failed to delete charging station.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditClick = (e, cs) => {
    e.stopPropagation();
    alert('Edit station functionality coming soon!');
  };

  return (
    <div className="flex flex-col gap-5 max-w-[1400px] w-full mx-auto pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2 mt-1">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Charging Stations
          </h1>
          <p className="text-sm text-slate-900 mt-1 font-medium ml-1">Manage and monitor all your physical station locations.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white/60 hover:bg-white/80 border border-white/50 text-stone-700 font-bold rounded-2xl shadow-sm active:scale-95 transition-colors duration-200 text-sm">
            <Download className="w-4 h-4 text-emerald-500" />
            Export
          </button>

          <button className="flex items-center gap-2 px-5 py-2.5 bg-white/60 hover:bg-white/80 border border-white/50 text-stone-700 font-bold rounded-2xl shadow-sm active:scale-95 transition-colors duration-200 text-sm">
            <Filter className="w-4 h-4 text-violet-500" />
            Filter
          </button>

          <button
            onClick={() => alert('Add Station coming soon')}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-orange-400 to-rose-500 hover:from-orange-500 hover:to-rose-600 text-white font-bold rounded-2xl shadow-md active:scale-95 transition-colors duration-200 text-sm border border-orange-400/50"
          >
            <Plus className="w-5 h-5" />
            Add Station
          </button>
        </div>
      </div>

      {/* Main Glass Table Container */}
      <div className="bg-white/70 shadow-[0_8px_32px_rgba(0,0,0,0.04)] border border-white/60 rounded-[32px] overflow-hidden flex flex-col min-h-[500px]">
        <div className="px-8 pt-4 pb-2 flex flex-col sm:flex-row items-center justify-between gap-6 bg-white/20 border-b border-white/40">
          <div className="flex items-center gap-2 text-sm text-stone-600 font-medium px-4 py-2 rounded-lg bg-white border border-stone-200 shadow-sm">
            <span className="font-extrabold text-orange-600 text-base">{totalItems}</span> total stations
          </div>

          <div className="relative w-full sm:w-[400px] group">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-stone-400 group-focus-within:text-orange-500 transition-colors z-10">
              <Search className="w-5 h-5" />
            </div>

            <input
              type="text"
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Search stations by name, location..."
              className="w-full pl-14 pr-5 py-3.5 bg-white/50 border border-white/60 shadow-sm focus:shadow-[0_0_20px_rgba(251,146,60,0.15)] focus:border-orange-300 focus:bg-white/80 rounded-2xl text-sm focus:outline-none text-stone-800 placeholder:text-stone-400 transition-[background-color,border-color,box-shadow] duration-300"
            />
          </div>
        </div>

        {/* Table Section */}
        <div className="overflow-x-auto flex-1 px-4 sm:px-8 pb-6 pt-0">
          <table className="w-full text-left text-sm border-separate border-spacing-y-1">
            <thead>
              <tr className="bg-white/40 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                <th className="px-4 py-4 font-black text-indigo-950/70 text-[12px] uppercase tracking-wider rounded-l-2xl">
                  <div className="flex items-center gap-2 whitespace-nowrap"><Tag strokeWidth={2.5} className="w-4 h-4 text-indigo-400" /> Name</div>
                </th>
                <th className="px-4 py-4 font-black text-rose-950/70 text-[12px] uppercase tracking-wider">
                  <div className="flex items-center gap-2 whitespace-nowrap"><Hash strokeWidth={2.5} className="w-4 h-4 text-rose-400" /> Code</div>
                </th>
                <th className="px-4 py-4 font-black text-emerald-950/70 text-[12px] uppercase tracking-wider">
                  <div className="flex items-center gap-2 whitespace-nowrap"><BatteryCharging strokeWidth={2.5} className="w-4 h-4 text-emerald-400" /> Charge Points</div>
                </th>
                <th className="px-4 py-4 font-black text-blue-950/70 text-[12px] uppercase tracking-wider">
                  <div className="flex items-center gap-2 whitespace-nowrap"><Activity strokeWidth={2.5} className="w-4 h-4 text-blue-400" /> Total Sessions</div>
                </th>
                <th className="px-4 py-4 font-black text-amber-950/70 text-[12px] uppercase tracking-wider">
                  <div className="flex items-center gap-2 whitespace-nowrap"><DollarSign strokeWidth={2.5} className="w-4 h-4 text-amber-400" /> Revenue Generated</div>
                </th>
                <th className="px-4 py-4 font-black text-purple-950/70 text-[12px] uppercase tracking-wider">
                  <div className="flex items-center gap-2 whitespace-nowrap"><Zap strokeWidth={2.5} className="w-4 h-4 text-purple-400" /> Energy Delivered</div>
                </th>
                <th className="px-4 py-4 font-black text-stone-500 text-[12px] uppercase tracking-wider text-right rounded-r-2xl">
                  <div className="flex items-center justify-end gap-2 whitespace-nowrap"><Settings2 strokeWidth={2.5} className="w-4 h-4 text-stone-400" /> Actions</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-5 py-24 text-center">
                    <div className="flex flex-col items-center justify-center text-rose-500">
                      <Loader2 className="w-10 h-10 animate-spin mb-4" />
                      <p className="text-sm font-medium">Loading charging stations data...</p>
                    </div>
                  </td>
                </tr>
              ) : stations.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-24 text-center">
                    <div className="text-stone-500 flex flex-col items-center">
                      <div className="w-20 h-20 bg-stone-50 rounded-3xl flex items-center justify-center mb-6">
                        <Search className="w-10 h-10 text-stone-400" />
                      </div>
                      <p className="text-sm font-bold">No charging stations found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                stations.map((row) => (
                  <tr key={row.id} onClick={() => {}} className="group bg-white/40 hover:bg-white/70 border border-white/30 hover:border-white/80 transition duration-200 rounded-2xl cursor-pointer">
                    <td className="px-4 py-4 rounded-l-2xl">
                      <span className="text-stone-800 font-bold text-[13px] truncate max-w-[200px] inline-block transition-colors duration-200 group-hover:text-rose-500">
                        {row.name}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-orange-500 text-[13px] font-bold">{row.code}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-emerald-600 font-bold pl-6 text-[13px]">{row.chargePoints}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-stone-600 font-medium pl-6 text-[13px]">{row.totalSessions.toLocaleString()}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-stone-600 font-semibold pl-6 text-[13px]">₹{row.revenueGenerated.toLocaleString()}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-stone-600 font-medium pl-6 text-[13px]">{row.energyDelivered.toLocaleString()} <span className="text-[10px] text-stone-400">kWh</span></div>
                    </td>
                    <td className="px-4 py-4 text-right pr-8 rounded-r-2xl">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button onClick={(e) => handleEditClick(e, row)} className="p-2 text-orange-500 bg-white/80 border border-orange-100 hover:bg-orange-500 hover:text-white rounded-xl shadow-sm transition active:scale-95 duration-200" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => handleDeleteClick(e, row)} className="p-2 text-rose-500 bg-white/80 border border-rose-100 hover:bg-rose-500 hover:text-white rounded-xl shadow-sm transition active:scale-95 duration-200" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => e.stopPropagation()} className="p-2 text-stone-500 bg-white/80 border border-stone-200 hover:bg-stone-600 hover:text-white rounded-xl shadow-sm transition active:scale-95 duration-200">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && stations.length > 0 && (
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

      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        itemName={stationToDelete?.name}
        isDeleting={isDeleting}
      />
    </div>
  );
}
