import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  Loader2,
  MapPin,
  X,
  Info,
  Check
} from 'lucide-react';

import Pagination from '../../components/ui/Pagination';
import DeleteModal from '../../components/ui/DeleteModal';

import { getChargingStations, deleteChargingStation } from '../../services/chargingStationService';
import { useTableData } from '../../hooks/useTableData';
import { useSocketEvents } from '../../hooks/useSocketEvents';

export default function ChargingStationsList() {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [stationToDelete, setStationToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // View Station Modal
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [stationToView, setStationToView] = useState(null);

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

  useEffect(() => {
    const query = searchParams.get('search');
    if (query) {
      setSearchTerm(query);
    }
  }, [searchParams, setSearchTerm]);

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
          <p className="text-sm text-stone-500 mt-1 font-medium ml-1">Manage and monitor all your physical station locations.</p>
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

      {/* Main Enterprise Table Container */}
      <div className="bg-[#F6F8FB] border border-stone-200/90 shadow-2xs rounded-2xl overflow-hidden flex flex-col min-h-[500px]">
        {/* Toolbar (#FFFFFF) */}
        <div className="px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border-b border-stone-200/80">
          <div className="flex items-center gap-2 text-xs text-stone-600 font-bold px-3 py-1.5 rounded-lg bg-[#F8FAFC] border border-stone-200/80 shadow-2xs">
            <span className="font-extrabold text-stone-900 text-sm">{totalItems}</span> total stations
          </div>

          <div className="relative w-full sm:w-[400px] group">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-stone-400 group-focus-within:text-stone-900 transition-colors z-10">
              <Search className="w-5 h-5" />
            </div>

            <input
              type="text"
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Search stations by name, location..."
              className="w-full pl-14 pr-5 py-2.5 bg-white border border-stone-200/90 shadow-2xs focus:border-stone-900 focus:ring-1 focus:ring-stone-900/10 rounded-2xl text-xs font-medium focus:outline-none text-stone-800 placeholder:text-stone-400 transition-colors duration-150"
            />
          </div>
        </div>

        {/* Table Section */}
        <div className="overflow-x-auto flex-1 px-1.5 sm:px-2 pb-6 pt-0">
          <table className="w-full text-left text-sm border-separate border-spacing-y-1">
            <thead className="sticky top-0 z-20 shadow-2xs">
              <tr className="bg-[#F8FAFC] border-b border-stone-200/90">
                <th className="px-4 py-2.5 font-bold text-stone-700 text-[11px] uppercase tracking-wider rounded-l-xl whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Name</div>
                </th>
                <th className="px-4 py-2.5 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Hash className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Code</div>
                </th>
                <th className="px-4 py-2.5 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><BatteryCharging className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Charge Points</div>
                </th>
                <th className="px-4 py-2.5 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Total Sessions</div>
                </th>
                <th className="px-4 py-2.5 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Revenue Generated</div>
                </th>
                <th className="px-4 py-2.5 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Energy Delivered</div>
                </th>
                <th className="px-4 py-2.5 font-bold text-stone-600 text-[11px] uppercase tracking-wider text-right pr-8 rounded-r-xl whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5"><Settings2 className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Actions</div>
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-5 py-24 text-center">
                    <div className="text-orange-400 flex flex-col items-center">
                      <Loader2 className="w-10 h-10 animate-spin mb-4" />
                      <p className="text-sm font-bold text-stone-500">Loading charging stations...</p>
                    </div>
                  </td>
                </tr>
              ) : stations.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-24 text-center">
                    <div className="text-stone-500 flex flex-col items-center">
                      <div className="w-20 h-20 bg-white/40 border border-white/50 flex items-center justify-center mb-6">
                        <Search className="w-10 h-10 text-stone-400" />
                      </div>
                      <p className="text-sm font-bold">No charging stations found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                stations.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => {
                      setStationToView(row);
                      setViewModalOpen(true);
                    }}
                    className="group bg-white hover:bg-[#F9FBFF] border border-stone-200/80 hover:border-slate-300 shadow-2xs transition-colors duration-150 rounded-xl cursor-pointer"
                  >
                    <td className="px-4 py-3 rounded-l-xl">
                      <span className="text-stone-900 font-bold text-[13px] group-hover:underline cursor-pointer truncate max-w-[200px] inline-block transition-colors duration-200">
                        {row.name}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-rose-500 text-[12px] font-bold font-mono">{row.code}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-emerald-600 font-bold pl-6 text-[13px]">{row.chargePoints}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-stone-600 font-medium pl-6 text-[13px]">{row.totalSessions.toLocaleString()}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-stone-600 font-semibold pl-6 text-[13px]">₹{row.revenueGenerated.toLocaleString()}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-stone-600 font-medium pl-6 text-[13px]">{row.energyDelivered.toLocaleString()} <span className="text-[10px] text-stone-400">kWh</span></div>
                    </td>
                    <td className="px-4 py-3 text-right pr-6 rounded-r-xl">
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

      {/* Station Detail View Modal */}
      {viewModalOpen && stationToView && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-xl w-full p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-stone-800">{stationToView.name}</h2>
                  <span className="text-xs font-bold text-orange-500 font-mono">{stationToView.code}</span>
                </div>
              </div>
              <button
                onClick={() => setViewModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-600 rounded-xl hover:bg-stone-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="p-3.5 bg-stone-50/80 rounded-2xl border border-stone-100">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">Total Charge Points</span>
                <span className="text-base font-black text-emerald-600">{stationToView.chargePoints}</span>
              </div>

              <div className="p-3.5 bg-stone-50/80 rounded-2xl border border-stone-100">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">Total Sessions</span>
                <span className="text-base font-black text-stone-800">{stationToView.totalSessions?.toLocaleString()}</span>
              </div>

              <div className="p-3.5 bg-stone-50/80 rounded-2xl border border-stone-100">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">Revenue Generated</span>
                <span className="text-base font-black text-stone-800">₹{stationToView.revenueGenerated?.toLocaleString()}</span>
              </div>

              <div className="p-3.5 bg-stone-50/80 rounded-2xl border border-stone-100">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">Energy Delivered</span>
                <span className="text-base font-black text-stone-800">{stationToView.energyDelivered?.toLocaleString()} kWh</span>
              </div>
            </div>

            <div className="flex items-center justify-end pt-4 mt-2 border-t border-stone-100">
              <button
                onClick={() => setViewModalOpen(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs shadow-md transition cursor-pointer"
              >
                Close Station Details
              </button>
            </div>
          </div>
        </div>
      )}

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
