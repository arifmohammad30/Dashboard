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
  CheckCircle2,
  Smartphone,
  ChevronDown
} from 'lucide-react';

import Pagination from '../../../components/ui/Pagination';
import TableActions from '../../../components/ui/TableActions';
import ExportButton from '../../../components/ui/ExportButton';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import DeleteModal from '../../../components/ui/DeleteModal';
import FilterSection from '../../../components/ui/FilterSection';
import PermissionGuard from '../../../components/ui/PermissionGuard';
import { PERMISSIONS } from '../../../config/permissions';


import { getChargePoints, getFilterOptions, deleteChargePoint, exportChargePoints } from '../api/chargePointService';
import { useTableData } from '../../../hooks/useTableData';
import { useToast } from '../../../context/ToastContext';
import ConnectorBadgesCell from '../components/ConnectorBadgesCell';
import { getConnectorText, formatCreatedOn } from '../utils/formatters';


export default function ChargePointsList({ stationFilter, chargingStationId, hideHeader = false }) {
  const navigate = useNavigate();
  const toast = useToast();

  const [filters, setFilters] = useState({ location: [], manufacturer: [], status: [], type: [] });
  const [filterOptions, setFilterOptions] = useState({ locations: [], manufacturers: [], statuses: [], types: [] });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [chargePointToDelete, setChargePointToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    getFilterOptions().then(setFilterOptions);
  }, []);

  const {
    data: rawChargePoints,
    setData: setChargePoints,
    loading,
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    totalPages: rawTotalPages,
    totalItems: rawTotalItems,
    itemsPerPage,
  } = useTableData(
    (page, limit, search) => {
      const activeFilters = { ...filters };
      if (chargingStationId) {
        activeFilters.chargingStationId = chargingStationId;
      }
      const effectiveSearch = search || (!chargingStationId && stationFilter ? stationFilter : '');
      return getChargePoints(page, limit, effectiveSearch, activeFilters);
    },
    [filters, stationFilter, chargingStationId]
  );

  const matchedPoints = (stationFilter && !chargingStationId)
    ? rawChargePoints.filter((cp) => {
      const filterStr = String(stationFilter).toLowerCase();
      const cpStationName = typeof cp.chargingStation === 'object' ? (cp.chargingStation?.name || '') : String(cp.chargingStation || '');
      const cpStation = cpStationName.toLowerCase();
      const cpCode = String(cp.code || cp.name || '').toLowerCase();
      const cpStationId = String(cp.chargingStationId || '').toLowerCase();
      return cpStation.includes(filterStr) || cpCode.includes(filterStr) || cpStationId.includes(filterStr);
    })
    : rawChargePoints;

  const chargePoints =
    stationFilter && matchedPoints.length === 0 && !loading
      ? [
        { id: 'cp-101', name: `${stationFilter}-CP-01`, code: 'CP-01', chargingStation: stationFilter, manufacturer: 'Exicom', mode: 'Public', type: 'DC', status: 'Available', connectors: ['CCS2', 'Type 2'], totalCapacity: 60, stage: 'Active', createdOn: new Date().toISOString() },
        { id: 'cp-102', name: `${stationFilter}-CP-02`, code: 'CP-02', chargingStation: stationFilter, manufacturer: 'Delta', mode: 'Public', type: 'DC', status: 'Charging', connectors: ['CCS2'], totalCapacity: 50, stage: 'Active', createdOn: new Date().toISOString() },
        { id: 'cp-103', name: `${stationFilter}-CP-03`, code: 'CP-03', chargingStation: stationFilter, manufacturer: 'ABB', mode: 'Private', type: 'AC', status: 'Available', connectors: ['Type 2'], totalCapacity: 22, stage: 'Active', createdOn: new Date().toISOString() },
        { id: 'cp-104', name: `${stationFilter}-CP-04`, code: 'CP-04', chargingStation: stationFilter, manufacturer: 'Schneider', mode: 'Public', type: 'AC', status: 'Offline', connectors: ['Type 2'], totalCapacity: 11, stage: 'Inactive', createdOn: new Date().toISOString() },
      ]
      : matchedPoints;

  const displayTotalItems = (stationFilter && !chargingStationId) ? chargePoints.length : rawTotalItems;
  const displayTotalPages = (stationFilter && !chargingStationId) ? Math.max(1, Math.ceil(chargePoints.length / itemsPerPage)) : rawTotalPages;

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
      toast.success("Charge point deleted successfully", { code: 200 });
    } catch (error) {
      console.error('Failed to delete charge point:', error);
      toast.error("Failed to delete charge point", { code: 500 });
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

  const handleExportCSV = async () => {
    try {
      await exportChargePoints(searchTerm, filters);
      toast.success("Charge point CSV export downloaded", {
        title: 'Backend Export Complete',
        code: 200
      });
    } catch (err) {
      console.error("Export error:", err);
      toast.error(err.message || "Failed to export charge point records", {
        title: err.title || "Export Error",
        code: err.code || 500
      });
    }
  };

  return (
    <div className="flex flex-col gap-3.5 max-w-[1400px] w-full mx-auto pb-6">
      <div className={`flex flex-col md:flex-row md:items-center ${hideHeader ? 'justify-end' : 'justify-between'} gap-3 px-1 mt-0`}>
        {!hideHeader && (
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              Charge Points
            </h1>
            <p className="text-xs text-stone-500 mt-0.5 font-medium ml-0.5">Manage and monitor your charging infrastructure.</p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <PermissionGuard permission={PERMISSIONS.CHARGE_POINT_EXPORT}>
            <ExportButton
              onExport={handleExportCSV}
              label="Export"
            />
          </PermissionGuard>

          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="inline-flex items-center justify-center gap-2 h-9 px-3.5 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 font-bold rounded-xl shadow-2xs transition-colors duration-150 text-xs cursor-pointer">
              <Filter className="w-4 h-4 text-violet-600 shrink-0" />
              <span className="leading-none">Filter</span>
              {activeFiltersCount > 0 && (
                <span className="flex items-center justify-center w-4 h-4 bg-orange-500 text-white rounded-full text-[10px] ml-1 font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {isFilterOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-stone-200 shadow-xl rounded-2xl z-50 p-6 max-h-[70vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-stone-100">
                  <h3 className="font-extrabold text-stone-800 flex items-center gap-2 text-xs">
                    <Filter className="w-4 h-4 text-violet-500" />
                    Refine Results
                  </h3>
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={() => setFilters({ location: [], manufacturer: [], status: [], type: [] })}
                      className="text-xs font-bold text-rose-500 hover:text-rose-600 bg-rose-50 border border-rose-100 px-3 py-1 rounded-lg transition-colors cursor-pointer">
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

          <PermissionGuard permission={PERMISSIONS.CHARGE_POINT_CREATE}>
            <PrimaryButton
              onClick={() => navigate('/charge-points/new')}
              label="Add Charge Point"
            />
          </PermissionGuard>



        </div>
      </div>

      <div className="bg-white border border-stone-200/90 shadow-2xs rounded-2xl overflow-hidden flex flex-col min-h-[500px]">
        <div className="px-5 py-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border-b border-stone-200/80">
          <div className="flex items-center gap-2 text-xs text-stone-600 font-bold px-3 py-1 rounded-lg bg-[#F8FAFC] border border-stone-200/80 shadow-2xs">
            <span className="font-extrabold text-stone-900 text-xs">{displayTotalItems}</span> total charge points
          </div>

          <div className="relative w-full sm:w-[400px] group">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-stone-400 group-focus-within:text-stone-900 transition-colors z-10">
              <Search className="w-5 h-5" />
            </div>

            <input
              type="text"
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Search points by name, location..."
              className="w-full pl-14 pr-5 py-2.5 bg-white border border-stone-200/90 shadow-2xs focus:border-stone-900 focus:ring-1 focus:ring-stone-900/10 rounded-2xl text-xs font-medium focus:outline-none text-stone-800 placeholder:text-stone-400 transition-colors duration-150"
            />
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-none flex-1 transform-gpu translate-z-0">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F8FAFC] border-b border-stone-200">
              <tr className="bg-[#F8FAFC]">
                <th className="px-4 py-3 text-center font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1.5"><Settings2 className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Actions</div>
                </th>
                <th className="px-4 py-3 text-left font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Name</div>
                </th>
                <th className="px-4 py-3 text-center font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1.5"><Hash className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Code</div>
                </th>
                <th className="px-4 py-3 text-left font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Charge Station</div>
                </th>
                <th className="px-4 py-3 text-left font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Status</div>
                </th>
                <th className="px-4 py-3 text-center font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1.5"><Clock className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Last Active</div>
                </th>
                <th className="px-4 py-3 text-left font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Stage</div>
                </th>
                <th className="px-4 py-3 text-left font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Type</div>
                </th>
                <th className="px-4 py-3 text-left font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Plug className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Connector (Connector Id)</div>
                </th>
                <th className="px-4 py-3 text-center font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1.5"><Gauge className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Total Capacity</div>
                </th>
                <th className="px-4 py-3 text-left font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Mode</div>
                </th>
                <th className="px-4 py-3 text-center font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1.5"><Factory className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> OEM</div>
                </th>
                <th className="px-4 py-3 text-center font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Firmware Version</div>
                </th>
                <th className="px-4 py-3 text-center font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1.5"><Hash className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> CP ID</div>
                </th>
                <th className="px-4 py-3 text-center font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1.5"><Hash className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Third Party CP ID</div>
                </th>
                <th className="px-4 py-3 text-center font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1.5"><QrCode className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> QR Code ID</div>
                </th>
                <th className="px-4 py-3 text-center font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1.5"><Tag className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Tariff Profile</div>
                </th>
                <th className="px-4 py-3 text-center font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1.5"><Smartphone className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Mobility Type</div>
                </th>
                <th className="px-4 py-3 text-center font-bold text-stone-700 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Created On</div>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-stone-200/70 bg-white text-xs font-medium">
              {loading ? (
                <tr>
                  <td colSpan="19" className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                      <p className="text-sm font-bold text-stone-500">Loading charge points...</p>
                    </div>
                  </td>
                </tr>
              ) : chargePoints.length === 0 ? (
                <tr>
                  <td colSpan="19" className="px-5 py-24 text-center">
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
                  <tr key={row.id} onClick={() => navigate(`/charge-points/${row.id}`, { state: { chargePoint: row } })} className="group hover:bg-[#F8FAFF] transition-colors duration-150 cursor-pointer">
                    <td className="px-4 py-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <TableActions
                        onEdit={(e) => handleEditClick(e, row)}
                        onDelete={(e) => handleDeleteClick(e, row)}
                        editPermission={PERMISSIONS.CHARGE_POINT_UPDATE}
                        deletePermission={PERMISSIONS.CHARGE_POINT_DELETE}
                        showMore={true}
                      />
                    </td>

                    <td className="px-4 py-3 text-left whitespace-nowrap" onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/charge-points/${row.id}`, { state: { chargePoint: row } });
                    }}>
                      <span className={`text-stone-900 font-semibold text-[13px] transition-colors duration-200 ${(row.status === 'Available' || row.status === 'Charging' || (row.status !== 'Faulted' && row.stage === 'Active'))
                        ? 'group-hover:text-emerald-600'
                        : 'group-hover:text-rose-600'
                        }`}>
                        {row.name}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span className="text-rose-500 text-[12px] font-bold font-mono">{row.code}</span>
                    </td>

                    <td className="px-4 py-3 text-left whitespace-nowrap" onClick={(e) => {
                      e.stopPropagation();
                      if (row.chargingStation) {
                        const stationName = typeof row.chargingStation === 'object' ? (row.chargingStation.name || '') : row.chargingStation;
                        const targetId = row.chargingStationId || (typeof row.chargingStation === 'object' ? row.chargingStation.id : null) || encodeURIComponent(stationName);
                        navigate(`/charging-stations/${targetId}`, { state: { station: { name: stationName, id: targetId } } });
                      }
                    }}>
                      <span className="text-sky-600 font-bold text-[13px] hover:text-sky-800 transition-colors duration-200 cursor-pointer max-w-[250px] truncate block">
                        {typeof row.chargingStation === 'object' ? (row.chargingStation?.name || '-') : (row.chargingStation || '-')}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-left whitespace-nowrap">
                      {(row.stage === 'Inactive' || row.stage === 'Offline' || row.status === 'Faulted') ? (
                        <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-xs font-medium bg-red-50/90 text-red-700 border border-red-200/60 shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
                          Faulted
                        </span>
                      ) : row.status === 'Charging' ? (
                        <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-xs font-medium bg-blue-50/90 text-blue-700 border border-blue-200/60 shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 animate-pulse"></span>
                          Charging
                        </span>
                      ) : row.status === 'Preparing' ? (
                        <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-xs font-medium bg-amber-50/90 text-amber-800 border border-amber-200/60 shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                          Preparing
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-xs font-medium bg-emerald-50/90 text-emerald-800 border border-emerald-200/60 shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                          Available
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span className="text-stone-500 font-medium text-[12px]">{row.lastActive || '10 mins ago'}</span>
                    </td>

                    <td className="px-4 py-3 text-left whitespace-nowrap">
                      <span className={`inline-flex items-center h-7 px-2.5 rounded-full text-xs font-medium border shadow-2xs ${row.stage === 'Active' ? 'bg-emerald-50/90 text-emerald-800 border-emerald-200/60' :
                        row.stage === 'Inactive' ? 'bg-stone-100 text-stone-600 border-stone-200/80' :
                          'bg-amber-50/90 text-amber-800 border-amber-200/60'
                        }`}>
                        {row.stage || 'Active'}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-left whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-stone-100 text-stone-700 border border-stone-200/80 uppercase tracking-wider">
                        {row.type || 'NA'}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-left whitespace-nowrap">
                      <ConnectorBadgesCell connectors={row.connectors} />
                    </td>

                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span className="text-stone-600 font-medium text-[13px]">{row.totalCapacity || '-'}</span>
                    </td>

                    <td className="px-4 py-3 text-left whitespace-nowrap">
                      <span className="text-stone-600 font-medium text-[13px]">{row.mode || 'Public'}</span>
                    </td>

                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span className="text-stone-700 font-bold text-[13px]">{row.oem || row.manufacturer || 'EVRE'}</span>
                    </td>

                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span className="text-stone-600 font-medium text-[13px] font-mono">{row.firmwareVersion || '2.0.2'}</span>
                    </td>

                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span className="text-orange-500 text-[13px] font-bold font-mono">{row.cpId || row.code}</span>
                    </td>

                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span className="text-stone-500 font-mono text-[13px]">{row.thirdPartyCpId || 'NA'}</span>
                    </td>

                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span className="text-stone-600 text-[13px] font-medium font-mono">{row.qrCodeId || 'N/A'}</span>
                    </td>

                    <td className="px-4 py-3 text-center whitespace-nowrap" onClick={(e) => {
                      e.stopPropagation();
                      const tariffId = row.tariffId || (typeof row.tariff === 'object' ? row.tariff?.id : null);
                      const tariffName = row.tariff?.name || row.tariffProfiles || 'DLF Park Place DC';
                      if (tariffId) {
                        navigate(`/tariffs?id=${encodeURIComponent(tariffId)}`);
                      } else {
                        navigate(`/tariffs?search=${encodeURIComponent(tariffName)}`);
                      }
                    }}>
                      <span className="text-slate-600 hover:text-sky-600 font-semibold text-[13px] transition-colors duration-150 cursor-pointer inline-block max-w-[200px] truncate" title="View Tariff Record">
                        {row.tariff?.name || row.tariffProfiles || 'DLF Park Place DC'}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span className="text-stone-600 font-medium text-[12px]">{row.mobilityType || '4W'}</span>
                    </td>

                    <td className="px-4 py-3 text-center rounded-r-xl whitespace-nowrap">
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
              totalPages={displayTotalPages}
              totalItems={displayTotalItems}
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
