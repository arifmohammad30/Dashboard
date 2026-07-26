import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Download,
  Filter,
  Plus,
  Edit,
  Trash2,
  Loader2,
  MoreVertical,
  Zap,
  Tag,
  Hash,
  MapPin,
  Factory,
  Activity,
  Settings2,
  QrCode,
  Shield,
  Navigation,
  Cpu,
  Plug,
  Repeat,
  BatteryCharging,
  IndianRupee,
  Gauge,
  Clock,
  Calendar,
  CheckCircle2
} from 'lucide-react';

import Pagination from '../../components/ui/Pagination';
import DeleteModal from '../../components/ui/DeleteModal';
import FilterSection from '../../components/ui/FilterSection';

import { getChargePoints, getFilterOptions, deleteChargePoint } from '../../services/chargePointService';
import { useTableData } from '../../hooks/useTableData';
import { useSocketEvents } from '../../hooks/useSocketEvents';

const renderConnectorBadges = (connectors) => {
  if (!connectors || !Array.isArray(connectors) || connectors.length === 0) {
    return <span className="text-stone-400 font-bold text-[12px]">-</span>;
  }
  return (
    <div className="flex flex-wrap items-center justify-start gap-1.5 min-w-[130px]">
      {connectors.map((c, index) => {
        const is15A = c.includes('15A');
        const isCCS2 = c.includes('CCS2');
        const isType2 = c.includes('Type2');

        let colorClasses = 'bg-slate-100/90 text-slate-700 border-slate-200';
        if (is15A) colorClasses = 'bg-amber-50/90 text-amber-700 border-amber-200/80';
        else if (isCCS2) colorClasses = 'bg-sky-50/90 text-sky-700 border-sky-200/80';
        else if (isType2) colorClasses = 'bg-purple-50/90 text-purple-700 border-purple-200/80';

        return (
          <span
            key={index}
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border shadow-xs whitespace-nowrap ${colorClasses}`}
          >
            {c}
          </span>
        );
      })}
    </div>
  );
};

const formatCreatedOn = (dateStr) => {
  if (!dateStr) return 'Jul 8, 2026 11:27 am';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Jul 8, 2026 11:27 am';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const day = d.getDate();
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${month} ${day}, ${year} ${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  } catch (e) {
    return 'Jul 8, 2026 11:27 am';
  }
};

export default function ChargePointsList() {
  const navigate = useNavigate();

  const [filters, setFilters] = useState({ location: [], manufacturer: [], status: [], type: [] });
  const [filterOptions, setFilterOptions] = useState({ locations: [], manufacturers: [], statuses: [], types: [] });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [chargePointToDelete, setChargePointToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load Filter Options Once
  useEffect(() => {
    getFilterOptions().then(setFilterOptions);
  }, []);

  // Data Fetching Hook
  const {
    data: chargePoints,
    setData: setChargePoints,
    loading,
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems,
    itemsPerPage,
  } = useTableData((page, limit, search) => getChargePoints(page, limit, search, filters), [filters]);

  // Socket Events Hook
  useSocketEvents({
    chargePointAdded: (newCp) => {
      setChargePoints(prev => prev.find(cp => cp.id === newCp.id) ? prev : [newCp, ...prev]);
    },
    chargePointUpdated: (updatedCp) => {
      setChargePoints(prev => prev.map(cp => cp.id === updatedCp.id ? updatedCp : cp));
    },
    chargePointDeleted: (deletedId) => {
      setChargePoints(prev => prev.filter(cp => cp.id !== deletedId));
    }
  });

  // Filter Outside Click Handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) setIsFilterOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFilterChange = (category, value) => {
    setFilters(prev => {
      const isSelected = prev[category].includes(value);
      const newCategoryList = isSelected
        ? prev[category].filter(item => item !== value)
        : [...prev[category], value];
      return { ...prev, [category]: newCategoryList };
    });
    setCurrentPage(1);
  };

  const handleDeleteClick = (e, cp) => {
    e.stopPropagation();
    setChargePointToDelete(cp);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!chargePointToDelete) return;
    setIsDeleting(true);
    try {
      await deleteChargePoint(chargePointToDelete.id);
      setDeleteModalOpen(false);
      setChargePointToDelete(null);
    } catch (error) {
      console.error('Failed to delete charge point:', error);
      alert('Failed to delete charge point.');
    } finally {
      setIsDeleting(false);
    }
  };

  const activeFiltersCount = filters.location.length + filters.manufacturer.length + filters.status.length + filters.type.length;

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleEditClick = (e, cp) => {
    e.stopPropagation();
    navigate(`/charge-points/edit/${cp.id}`, { state: { chargePoint: cp } });
  };

  return (
    <div className="flex flex-col gap-6 w-full mx-auto pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2 mt-1">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Charge Points
          </h1>
          <p className="text-sm text-slate-900 mt-1 font-medium ml-1">Manage and monitor your charging infrastructure.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white/60 hover:bg-white/80 border border-white/50 text-stone-700 font-bold rounded-2xl shadow-sm active:scale-95 transition-colors duration-200 text-sm">
            <Download className="w-4 h-4 text-emerald-500" />
            Export
          </button>

          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/60 hover:bg-white/80 border border-white/50 text-stone-700 font-bold rounded-2xl shadow-sm active:scale-95 transition-colors duration-200 text-sm">
              <Filter className="w-4 h-4 text-violet-500" />
              Filter
              {activeFiltersCount > 0 && (
                <span className="flex items-center justify-center w-5 h-5 bg-gradient-to-br from-orange-400 to-rose-500 text-white rounded-full text-[10px] ml-1 shadow-sm font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {isFilterOpen && (
              <div className="absolute right-0 mt-4 w-80 sm:w-96 bg-white/80 backdrop-blur-2xl border border-white/60 shadow-[0_10px_40px_rgba(0,0,0,0.1)] rounded-3xl z-50 p-6 max-h-[70vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/40">
                  <h3 className="font-extrabold text-stone-800 flex items-center gap-2">
                    <Filter className="w-4 h-4 text-violet-500" />
                    Refine Results
                  </h3>
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={() => setFilters({ location: [], manufacturer: [], status: [], type: [] })}
                      className="text-xs font-bold text-rose-500 hover:text-rose-600 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-lg transition-colors shadow-sm">
                      Clear All
                    </button>
                  )}
                </div>

                <div className="space-y-6">
                  <FilterSection title="Status" options={filterOptions.statuses} selected={filters.status} onChange={(val) => handleFilterChange('status', val)} />
                  <FilterSection title="Type" options={filterOptions.types} selected={filters.type} onChange={(val) => handleFilterChange('type', val)} />
                  <FilterSection title="Manufacturer" options={filterOptions.manufacturers} selected={filters.manufacturer} onChange={(val) => handleFilterChange('manufacturer', val)} />
                  <FilterSection title="Location" options={filterOptions.locations} selected={filters.location} onChange={(val) => handleFilterChange('location', val)} />
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => navigate('/charge-points/new')}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-orange-400 to-rose-500 hover:from-orange-500 hover:to-rose-600 text-white font-bold rounded-2xl shadow-md active:scale-95 transition-colors duration-200 text-sm border border-orange-400/50"
          >
            <Plus className="w-5 h-5" />
            Add Charge Point
          </button>
        </div>
      </div>

      {/* Main Glass Table Container */}
      <div className="bg-white/70 shadow-[0_8px_32px_rgba(0,0,0,0.04)] border border-white/60 rounded-[32px] overflow-hidden flex flex-col min-h-[500px]">
        <div className="px-6 pt-4 pb-2 flex flex-col sm:flex-row items-center justify-between gap-6 bg-white/20 border-b border-white/40">
          <div className="flex items-center gap-2 text-sm text-stone-600 font-medium px-4 py-2 rounded-lg bg-white border border-stone-200 shadow-sm">
            <span className="font-extrabold text-orange-600 text-base">{totalItems}</span> total charge points
          </div>

          <div className="relative w-full sm:w-[400px] group">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-stone-400 group-focus-within:text-orange-500 transition-colors z-10">
              <Search className="w-5 h-5" />
            </div>

            <input
              type="text"
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Search points by name, location..."
              className="w-full pl-14 pr-5 py-3.5 bg-white/50 border border-white/60 shadow-sm focus:shadow-[0_0_20px_rgba(251,146,60,0.15)] focus:border-orange-300 focus:bg-white/80 rounded-2xl text-sm focus:outline-none text-stone-800 placeholder:text-stone-400 transition-[background-color,border-color,box-shadow] duration-300"
            />
          </div>
        </div>

        {/* Table Section */}
        <div className="overflow-x-auto flex-1 px-1.5 sm:px-2 pb-6 pt-0">
          <table className="w-full text-left text-sm border-separate border-spacing-y-1">
            <thead>
              <tr className="bg-white/40 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                <th className="px-4 py-4 text-center font-black text-stone-600 text-[12px] uppercase tracking-wider rounded-l-2xl whitespace-nowrap">
                  <div className="flex items-center justify-center gap-2"><Settings2 strokeWidth={2.5} className="w-4 h-4 text-stone-400" /> Actions</div>
                </th>

                <th className="px-4 py-4 text-left font-black text-indigo-950/70 text-[12px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-2"><Tag strokeWidth={2.5} className="w-4 h-4 text-indigo-400" /> Name</div>
                </th>

                <th className="px-4 py-4 text-center font-black text-rose-950/70 text-[12px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center justify-center gap-2"><Hash strokeWidth={2.5} className="w-4 h-4 text-rose-400" /> Code</div>
                </th>

                <th className="px-4 py-4 text-left font-black text-emerald-950/70 text-[12px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-2"><MapPin strokeWidth={2.5} className="w-4 h-4 text-emerald-400" /> Location</div>
                </th>

                <th className="px-4 py-4 text-left font-black text-amber-950/70 text-[12px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center justify-start gap-2"><Activity strokeWidth={2.5} className="w-4 h-4 text-amber-400" /> Status</div>
                </th>

                <th className="px-4 py-4 text-center font-black text-stone-600 text-[12px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center justify-center gap-2"><Clock strokeWidth={2.5} className="w-4 h-4 text-stone-400" /> Last Active</div>
                </th>

                <th className="px-4 py-4 text-left font-black text-emerald-950/70 text-[12px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center justify-start gap-2"><CheckCircle2 strokeWidth={2.5} className="w-4 h-4 text-emerald-500" /> Stage</div>
                </th>

                <th className="px-4 py-4 text-left font-black text-purple-950/70 text-[12px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center justify-start gap-2"><Zap strokeWidth={2.5} className="w-4 h-4 text-purple-400" /> Type</div>
                </th>

                <th className="px-4 py-4 text-left font-black text-amber-950/70 text-[12px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center justify-start gap-2"><Plug strokeWidth={2.5} className="w-4 h-4 text-amber-500" /> Connector (Connector Id)</div>
                </th>

                <th className="px-4 py-4 text-center font-black text-rose-950/70 text-[12px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center justify-center gap-2"><Gauge strokeWidth={2.5} className="w-4 h-4 text-rose-500" /> Total Capacity</div>
                </th>

                <th className="px-4 py-4 text-left font-black text-slate-800 text-[12px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center justify-start gap-2"><Shield strokeWidth={2.5} className="w-4 h-4 text-slate-500" /> Mode</div>
                </th>

                <th className="px-4 py-4 text-center font-black text-blue-950/70 text-[12px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center justify-center gap-2"><Factory strokeWidth={2.5} className="w-4 h-4 text-blue-500" /> OEM</div>
                </th>

                <th className="px-4 py-4 text-center font-black text-indigo-950/70 text-[12px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center justify-center gap-2"><Cpu strokeWidth={2.5} className="w-4 h-4 text-indigo-500" /> Firmware Version</div>
                </th>

                <th className="px-4 py-4 text-center font-black text-orange-950/70 text-[12px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center justify-center gap-2"><Hash strokeWidth={2.5} className="w-4 h-4 text-orange-400" /> CP ID</div>
                </th>

                <th className="px-4 py-4 text-center font-black text-stone-700 text-[12px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center justify-center gap-2"><Hash strokeWidth={2.5} className="w-4 h-4 text-stone-400" /> Third Party CP ID</div>
                </th>

                <th className="px-4 py-4 text-center font-black text-purple-950/70 text-[12px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center justify-center gap-2"><QrCode strokeWidth={2.5} className="w-4 h-4 text-purple-400" /> QR Code ID</div>
                </th>

                <th className="px-4 py-4 text-center font-black text-sky-950/70 text-[12px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center justify-center gap-2"><Tag strokeWidth={2.5} className="w-4 h-4 text-sky-500" /> Tariff Profile</div>
                </th>

                <th className="px-4 py-4 text-center font-black text-emerald-950/70 text-[12px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center justify-center gap-2"><Repeat strokeWidth={2.5} className="w-4 h-4 text-emerald-500" /> Total Sessions</div>
                </th>

                <th className="px-4 py-4 text-center font-black text-blue-950/70 text-[12px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center justify-center gap-2"><BatteryCharging strokeWidth={2.5} className="w-4 h-4 text-blue-500" /> Energy Delivered</div>
                </th>

                <th className="px-4 py-4 text-center font-black text-emerald-950/70 text-[12px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center justify-center gap-2"><IndianRupee strokeWidth={2.5} className="w-4 h-4 text-emerald-600" /> Revenue Generated</div>
                </th>

                <th className="px-4 py-4 text-center font-black text-stone-700 text-[12px] uppercase tracking-wider rounded-r-2xl whitespace-nowrap">
                  <div className="flex items-center justify-center gap-2"><Calendar strokeWidth={2.5} className="w-4 h-4 text-sky-400" /> Created On</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="21" className="px-5 py-24 text-center">
                    <div className="flex flex-col items-center justify-center text-orange-400">
                      <Loader2 className="w-10 h-10 animate-spin mb-4" />
                      <p className="text-sm font-bold">Loading charge points...</p>
                    </div>
                  </td>
                </tr>
              ) : chargePoints.length === 0 ? (
                <tr>
                  <td colSpan="21" className="px-5 py-24 text-center">
                    <div className="text-stone-400 flex flex-col items-center">
                      <div className="w-20 h-20 bg-white/40 backdrop-blur-md rounded-3xl shadow-[inset_0_2px_10px_rgba(255,255,255,0.6)] border border-white/50 flex items-center justify-center mb-6">
                        <Search className="w-10 h-10 text-orange-300" />
                      </div>
                      <p className="text-sm font-bold text-stone-500">No charge points found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                chargePoints.map((row) => (
                  <tr key={row.id} onClick={() => navigate(`/charge-points/view/${row.id}`, { state: { chargePoint: row } })} className="group bg-white/40 hover:bg-white/70 border border-white/30 hover:border-white/80 transition duration-200 rounded-2xl cursor-pointer">
                    <td className="px-4 py-4 text-center rounded-l-2xl whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button onClick={(e) => handleEditClick(e, row)} className="p-1.5 text-orange-500 bg-white/70 border border-orange-100 hover:bg-orange-500 hover:text-white rounded-xl shadow-xs hover:shadow-md transition active:scale-95 duration-200" title="Edit">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={(e) => handleDeleteClick(e, row)} className="p-1.5 text-rose-500 bg-white/70 border border-rose-100 hover:bg-rose-500 hover:text-white rounded-xl shadow-xs hover:shadow-md transition active:scale-95 duration-200" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={(e) => e.stopPropagation()} className="p-1.5 text-stone-500 bg-white/70 border border-stone-200 hover:bg-stone-600 hover:text-white rounded-xl shadow-xs hover:shadow-md transition active:scale-95 duration-200">
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-left whitespace-nowrap" onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/charge-points/${row.id}`, { state: { chargePoint: row } });
                    }}>
                      <span className={`text-stone-800 font-bold text-[13px] hover:underline transition-colors duration-200 ${
                        (row.status === 'Online' || (row.status !== 'Offline' && row.stage === 'Active'))
                          ? 'group-hover:text-emerald-500'
                          : 'group-hover:text-rose-500'
                      }`}>
                        {row.name}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-center whitespace-nowrap">
                      <span className="text-rose-500 text-[13px] font-bold font-mono">{row.code}</span>
                    </td>

                    <td className="px-4 py-4 text-left whitespace-nowrap">
                      <div className="text-stone-700 text-[13px] font-medium max-w-[250px] truncate">{row.chargingStation}</div>
                    </td>

                    <td className="px-4 py-4 text-left whitespace-nowrap">
                      {(row.status === 'Online' || (row.status !== 'Offline' && row.stage === 'Active')) ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-xl text-[11px] font-bold bg-emerald-50/80 text-emerald-600 border border-emerald-100 shadow-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                          Online
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-xl text-[11px] font-bold bg-rose-50/80 text-rose-600 border border-rose-100 shadow-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5"></span>
                          Offline
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-4 text-center whitespace-nowrap">
                      <span className="text-stone-500 font-medium text-[12px]">{row.lastActive || '10 mins ago'}</span>
                    </td>

                    <td className="px-4 py-4 text-left whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-xl text-[11px] font-extrabold border shadow-xs ${
                        row.stage === 'Active' ? 'bg-emerald-50/80 text-emerald-600 border-emerald-100' :
                        row.stage === 'Inactive' ? 'bg-stone-100/90 text-stone-600 border-stone-200/80' :
                        'bg-amber-50/80 text-amber-700 border-amber-200/80'
                      }`}>
                        {row.stage || 'Active'}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-left whitespace-nowrap">
                      <span className={`font-bold text-[11px] px-3 py-1 rounded-xl border shadow-xs uppercase tracking-wider ${row.type === 'AC' ? 'bg-purple-50/80 text-purple-600 border-purple-100' :
                        row.type === 'DC' ? 'bg-blue-50/80 text-blue-600 border-blue-100' :
                          'bg-white/60 text-stone-500 border-white/80'
                        }`}>
                        {row.type || 'NA'}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-left whitespace-nowrap">
                      {renderConnectorBadges(row.connectors)}
                    </td>

                    <td className="px-4 py-4 text-center whitespace-nowrap">
                      <span className="text-stone-600 font-medium text-[13px]">{row.totalCapacity || '-'}</span>
                    </td>

                    <td className="px-4 py-4 text-left whitespace-nowrap">
                      <span className="text-stone-600 font-medium text-[13px]">{row.mode || 'Public'}</span>
                    </td>

                    <td className="px-4 py-4 text-center whitespace-nowrap">
                      <span className="text-stone-700 font-bold text-[13px]">{row.oem || row.manufacturer || 'EVRE'}</span>
                    </td>

                    <td className="px-4 py-4 text-center whitespace-nowrap">
                      <span className="text-stone-600 font-medium text-[13px] font-mono">{row.firmwareVersion || '2.0.2'}</span>
                    </td>

                    <td className="px-4 py-4 text-center whitespace-nowrap">
                      <span className="text-orange-500 text-[13px] font-bold font-mono">{row.cpId || row.code}</span>
                    </td>

                    <td className="px-4 py-4 text-center whitespace-nowrap">
                      <span className="text-stone-500 font-mono text-[13px]">{row.thirdPartyCpId || 'NA'}</span>
                    </td>

                    <td className="px-4 py-4 text-center whitespace-nowrap">
                      <span className="text-stone-600 text-[13px] font-medium font-mono">{row.qrCodeId || 'N/A'}</span>
                    </td>

                    <td className="px-4 py-4 text-center whitespace-nowrap">
                      <span className="text-sky-600 font-extrabold text-[13px] hover:text-sky-700 cursor-pointer">{row.tariffProfiles || 'Standard'}</span>
                    </td>

                    <td className="px-4 py-4 text-center whitespace-nowrap">
                      <span className="text-stone-700 font-semibold text-[13px]">{row.totalSessions !== undefined ? row.totalSessions : 0}</span>
                    </td>

                    <td className="px-4 py-4 text-center whitespace-nowrap">
                      <span className="text-stone-700 font-semibold text-[13px]">
                        {row.energyDelivered !== undefined ? `${row.energyDelivered} kWh` : '0 kWh'}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-center whitespace-nowrap">
                      <span className="text-stone-800 font-bold text-[13px]">
                        {row.revenueGenerated !== undefined ? `₹${row.revenueGenerated.toLocaleString()}` : '₹0'}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-center rounded-r-2xl whitespace-nowrap">
                      <span className="text-stone-600 font-medium text-[12px]">{formatCreatedOn(row.createdAt)}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {chargePoints.length > 0 && (
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
        itemName={chargePointToDelete?.name}
        isDeleting={isDeleting}
      />
    </div>
  );
}
