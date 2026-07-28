import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
  Check,
  ChevronDown,
  ChevronRight,
  Building2,
  Navigation,
  Calendar,
  Globe
} from 'lucide-react';

import Pagination from '../../components/ui/Pagination';
import DeleteModal from '../../components/ui/DeleteModal';
import TableActions from '../../components/ui/TableActions';

import { getChargingStations, deleteChargingStation } from '../../services/chargingStationService';
import { useTableData } from '../../hooks/useTableData';
import { useSocketEvents } from '../../hooks/useSocketEvents';
import { useToast } from '../../context/ToastContext';

const ChargePointsCell = ({ station, navigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = React.useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cpList = station.chargePointsList || [];
  const totalCount = cpList.length;

  if (totalCount === 0) {
    return (
      <span className="text-stone-400 font-normal text-[11px] italic">
        No charge points linked
      </span>
    );
  }

  const primaryCp = cpList[0];

  return (
    <div className="relative inline-block text-left" ref={popoverRef}>
      <div className="flex flex-col min-w-0">
        {/* Primary Charge Point Name */}
        <span
          onClick={(e) => {
            e.stopPropagation();
            if (primaryCp?.id) {
              navigate(`/charge-points/${primaryCp.id}`);
            } else if (primaryCp?.name) {
              navigate(`/charge-points?search=${encodeURIComponent(primaryCp.name)}`);
            }
          }}
          className="text-stone-900 font-semibold text-[12px] hover:text-emerald-600 transition-colors cursor-pointer truncate max-w-[170px]"
          title={primaryCp?.name ? `Go to ${primaryCp.name}` : ''}
        >
          {primaryCp?.name}
        </span>

        {/* Subtle, unadorned relationship link */}
        {totalCount > 1 ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            className="text-[11px] font-normal text-stone-500 hover:text-emerald-600 transition-colors flex items-center gap-0.5 cursor-pointer w-fit mt-0.5"
          >
            <span>{totalCount} linked charge points</span>
            <ChevronRight className={`w-3 h-3 transition-transform duration-150 ${isOpen ? 'rotate-90 text-emerald-600' : 'text-stone-400'}`} />
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (primaryCp?.id) {
                navigate(`/charge-points/${primaryCp.id}`);
              } else if (primaryCp?.name) {
                navigate(`/charge-points?search=${encodeURIComponent(primaryCp.name)}`);
              }
            }}
            className="text-[11px] font-normal text-stone-400 hover:text-emerald-600 transition-colors flex items-center gap-0.5 cursor-pointer w-fit mt-0.5"
          >
            <span>1 linked charge point</span>
            <ChevronRight className="w-3 h-3 text-stone-400" />
          </button>
        )}
      </div>

      {/* Enterprise Drawer Popover */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 z-30 w-64 bg-white/98 backdrop-blur-xl border border-stone-200/90 shadow-[0_12px_32px_rgba(0,0,0,0.12)] rounded-2xl p-3 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2 mb-2 px-1">
            <div>
              <span className="text-[11px] font-semibold text-stone-800 uppercase tracking-wider block">
                Linked Charge Points
              </span>
              <span className="text-[10px] text-stone-400 font-normal">
                {station.name} ({totalCount})
              </span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-stone-400 hover:text-stone-700 text-xs font-medium cursor-pointer">✕</button>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1 custom-scrollbar pr-0.5">
            {cpList.map((cp, i) => (
              <div
                key={cp.id || i}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  if (cp.id) {
                    navigate(`/charge-points/${cp.id}`);
                  } else {
                    navigate(`/charge-points?search=${encodeURIComponent(cp.name)}`);
                  }
                }}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-stone-50/80 hover:bg-emerald-50/80 border border-stone-100/80 hover:border-emerald-200 transition-colors cursor-pointer group/item text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                  <span className="font-semibold text-stone-800 group-hover/item:text-emerald-700 truncate text-[11px]">
                    {cp.name}
                  </span>
                </div>
                <span className="text-[9.5px] font-mono font-medium text-stone-400 group-hover/item:text-emerald-600 shrink-0 ml-1.5">
                  {cp.code || `CP-${i + 1}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default function ChargingStationsList() {
  const navigate = useNavigate();
  const toast = useToast();
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
      toast.success("Charging station deleted successfully", { code: 200 });
    } catch (error) {
      console.error('Failed to delete charging station:', error);
      toast.error("Failed to delete charging station", { code: 500 });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditClick = (e, cs) => {
    e.stopPropagation();
    navigate(`/charging-stations/edit/${cs.id}`, { state: { station: cs } });
  };

  return (
    <div className="flex flex-col gap-3 max-w-[1400px] w-full mx-auto pb-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-1 mt-0">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Charging Stations
          </h1>
          <p className="text-xs text-stone-500 mt-0.5 font-medium ml-0.5">Manage and monitor all your physical station locations.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => toast.success("Charging stations report exported successfully", { code: 200 })}
            className="flex items-center gap-2 px-4.5 py-2 bg-white/60 hover:bg-white/80 border border-white/50 text-stone-700 font-bold rounded-xl shadow-xs active:scale-95 transition-colors duration-200 text-xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-500" />
            Export
          </button>

          <button className="flex items-center gap-2 px-4.5 py-2 bg-white/60 hover:bg-white/80 border border-white/50 text-stone-700 font-bold rounded-xl shadow-xs active:scale-95 transition-colors duration-200 text-xs cursor-pointer">
            <Filter className="w-4 h-4 text-violet-500" />
            Filter
          </button>

          <button
            onClick={() => navigate('/charging-stations/new')}
            className="flex items-center gap-2 px-4.5 py-2 bg-gradient-to-r from-orange-400 to-rose-500 hover:from-orange-500 hover:to-rose-600 text-white font-bold rounded-xl shadow-sm active:scale-95 transition-colors duration-200 text-xs border border-orange-400/50 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Station
          </button>
        </div>
      </div>

      {/* Main Enterprise Table Container */}
      <div className="bg-[#F6F8FB] border border-stone-200/90 shadow-2xs rounded-2xl overflow-hidden flex flex-col min-h-[500px]">
        {/* Toolbar (#FFFFFF) */}
        <div className="px-5 py-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border-b border-stone-200/80">
          <div className="flex items-center gap-2 text-xs text-stone-600 font-bold px-3 py-1 rounded-lg bg-[#F8FAFC] border border-stone-200/80 shadow-2xs">
            <span className="font-extrabold text-stone-900 text-xs">{totalItems}</span> total stations
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
                <th className="px-4 py-2.5 text-center font-bold text-stone-600 text-[11px] uppercase tracking-wider rounded-l-xl whitespace-nowrap">
                  Actions
                </th>
                <th className="px-4 py-2.5 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Name</div>
                </th>
                <th className="px-4 py-2.5 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Hash className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Code</div>
                </th>
                <th className="px-4 py-2.5 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><BatteryCharging className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Charge Points</div>
                </th>
                <th className="px-4 py-2.5 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Total Capacity</div>
                </th>
                <th className="px-4 py-2.5 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Station Type</div>
                </th>
                <th className="px-4 py-2.5 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Navigation className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Mobility Type</div>
                </th>
                <th className="px-4 py-2.5 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Created On <span className="text-stone-400 font-bold ml-0.5">↓</span></div>
                </th>
                <th className="px-4 py-2.5 font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Latitude</div>
                </th>
                <th className="px-4 py-2.5 font-bold text-stone-700 text-[11px] uppercase tracking-wider rounded-r-xl whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Longitude</div>
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" className="px-5 py-24 text-center">
                    <div className="text-orange-400 flex flex-col items-center">
                      <Loader2 className="w-10 h-10 animate-spin mb-4" />
                      <p className="text-sm font-bold text-stone-500">Loading charging stations...</p>
                    </div>
                  </td>
                </tr>
              ) : stations.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-5 py-24 text-center">
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
                      navigate(`/charging-stations/${row.id}`, { state: { station: row } });
                    }}
                    className="group bg-white hover:bg-[#F9FBFF] border border-stone-200/80 hover:border-slate-300 shadow-2xs transition-colors duration-150 rounded-xl cursor-pointer text-xs"
                  >
                    <td className="px-4 py-3 text-center rounded-l-xl whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <TableActions
                        onEdit={(e) => handleEditClick(e, row)}
                        onDelete={(e) => handleDeleteClick(e, row)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-stone-900 font-bold text-[13px] cursor-pointer truncate max-w-[200px] inline-block transition-colors duration-200 group-hover:text-emerald-600">
                        {row.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-rose-500 text-[12px] font-bold font-mono">{row.code}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <ChargePointsCell station={row} navigate={navigate} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-stone-700">
                      {row.totalCapacity || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-stone-600">
                      {row.stationType || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-stone-600">
                      {row.mobilityType || 'Stationary'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-stone-500 font-mono text-[11px]">
                      {row.createdOn || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-stone-600 text-[11px]">
                      {row.latitude || '-'}
                    </td>
                    <td className="px-4 py-3 rounded-r-xl whitespace-nowrap font-mono text-stone-600 text-[11px]">
                      {row.longitude || '-'}
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
              <div className="p-3.5 bg-stone-50/80 rounded-2xl border border-stone-100 col-span-2">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">Associated Charge Point</span>
                <button
                  onClick={() => {
                    setViewModalOpen(false);
                    if (stationToView.chargePointId) {
                      navigate(`/charge-points/${stationToView.chargePointId}`);
                    } else {
                      navigate(`/charge-points?search=${encodeURIComponent(stationToView.chargePointName || stationToView.name)}`);
                    }
                  }}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200/80 rounded-xl font-bold text-xs transition-colors duration-200 cursor-pointer group mt-1"
                >
                  <Zap className="w-4 h-4 text-emerald-500 group-hover:text-white transition-colors" />
                  <span>{stationToView.chargePointName || `${stationToView.code}-CP1`}</span>
                </button>
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
