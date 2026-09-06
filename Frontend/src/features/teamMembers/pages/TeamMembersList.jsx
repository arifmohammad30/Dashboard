import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  UserCheck,
  Mail,
  Shield,
  Calendar,
  Loader2,
  Users,
  Clock,
  Sparkles,
  Settings2
} from 'lucide-react';
import Pagination from '../../../components/ui/Pagination';
import ExportButton from '../../../components/ui/ExportButton';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import DeleteModal from '../../../components/ui/DeleteModal';
import FilterSection from '../../../components/ui/FilterSection';
import TableActions from '../../../components/ui/TableActions';
import SearchInput from '../../../components/ui/SearchInput';
import PermissionGuard from '../../../components/ui/PermissionGuard';
import { PERMISSIONS } from '../../../config/permissions';
import { getTeamMembers, getTeamFilterOptions, deleteTeamMember } from '../api/teamMemberService';
import { useToast } from '../../../context/ToastContext';

export default function TeamMembersList() {
  const navigate = useNavigate();
  const toast = useToast();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filters State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef(null);
  const [filters, setFilters] = useState({
    userType: 'all'
  });
  const [userTypeOptions, setUserTypeOptions] = useState([
    { value: 'all', label: 'All User Types' }
  ]);

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    getTeamFilterOptions()
      .then((data) => {
        if (data?.userTypes && Array.isArray(data.userTypes)) {
          const opts = data.userTypes.map((ut) => ({
            value: ut,
            label: ut === 'all' ? 'All User Types' : ut
          }));
          setUserTypeOptions(opts);
        }
      })
      .catch((err) => console.error('Failed to load user types:', err));
  }, []);

  // Close filter dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.userType && filters.userType !== 'all') count++;
    return count;
  }, [filters]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await getTeamMembers(currentPage, pageSize, searchTerm, filters);
      if (res?.data) {
        setMembers(res.data);
        setTotalRecords(res.pagination?.total || res.data.length);
        setTotalPages(res.pagination?.totalPages || 1);
      } else {
        setMembers([]);
        setTotalRecords(0);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('Failed to load team members:', err);
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [currentPage, pageSize, searchTerm, filters]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setFilters({ userType: 'all' });
    setCurrentPage(1);
  };

  const handleDeleteClick = (member) => {
    setMemberToDelete(member);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!memberToDelete) return;
    try {
      setIsDeleting(true);
      await deleteTeamMember(memberToDelete.id);
      toast.success(`Team member ${memberToDelete.name} has been removed.`);
      setDeleteModalOpen(false);
      setMemberToDelete(null);
      fetchMembers();
    } catch (err) {
      console.error('Error deleting team member:', err);
      toast.error(err.message || 'Failed to remove team member');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportCSV = () => {
    if (members.length === 0) {
      toast.error('No team member records available to export');
      return;
    }
    const headers = ['ID', 'Name', 'Email', 'User Type', 'Joined Date'];
    const rows = members.map((m) => [
      `"${m.id}"`,
      `"${m.name || ''}"`,
      `"${m.email || ''}"`,
      `"${m.userType || ''}"`,
      `"${m.joinedAt || ''}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `team_members_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Team members exported successfully');
  };

  const getUserTypeBadge = (type) => {
    switch (type) {
      case 'Admin':
        return 'bg-purple-50 text-purple-700 border-purple-200/80';
      case 'Operations Team':
        return 'bg-sky-50 text-sky-700 border-sky-200/80';
      case 'Service Team':
        return 'bg-amber-50 text-amber-700 border-amber-200/80';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'Pending Invite':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Inactive':
        return 'bg-slate-100 text-slate-500 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const getInitials = (name) => {
    if (!name) return 'TM';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const formatJoinedDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="flex flex-col gap-3.5 max-w-[1700px] w-full mx-auto pb-6">
      {/* Page Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-1 mt-0">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Team Members
          </h1>
          <p className="text-xs text-stone-500 mt-0.5 font-medium ml-0.5">
            Manage organization members, assign roles, and control administrative access.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ExportButton onExport={handleExportCSV} label="Export" />

          {/* Filter Dropdown Toggle */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="inline-flex items-center justify-center gap-2 h-9 px-3.5 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 font-bold rounded-xl shadow-2xs transition-colors duration-150 text-xs cursor-pointer"
            >
              <Filter className="w-4 h-4 text-violet-600 shrink-0" />
              <span className="leading-none">Filter</span>
              {activeFiltersCount > 0 && (
                <span className="flex items-center justify-center w-4 h-4 bg-[#1EB8D4] text-slate-950 rounded-full text-[10px] ml-1 font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {isFilterOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-stone-200 p-4 z-50 space-y-4 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                    Filter Members
                  </h3>
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={handleResetFilters}
                      className="text-[11px] font-bold text-rose-500 hover:text-rose-700 cursor-pointer"
                    >
                      Reset All
                    </button>
                  )}
                </div>

                <FilterSection
                  title="User Type"
                  options={userTypeOptions}
                  selectedValue={filters.userType}
                  onChange={(val) => handleFilterChange('userType', val)}
                />
              </div>
            )}
          </div>

          <PermissionGuard permission={PERMISSIONS.TEAM_CREATE}>
            <PrimaryButton
              onClick={() => navigate('/team-members/new')}
              label="Add Team Member"
            />
          </PermissionGuard>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-stone-200/90 shadow-2xs rounded-2xl overflow-hidden flex flex-col min-h-[500px]">
        {/* Table Search & Controls Bar */}
        <div className="px-5 py-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border-b border-stone-200/80">
          <div className="flex items-center gap-2 text-xs text-stone-600 font-bold px-3 py-1 rounded-lg bg-[#F8FAFC] border border-stone-200/80 shadow-2xs">
            <span className="font-extrabold text-stone-900 text-xs">{totalRecords}</span> total team members
          </div>

          <SearchInput
            placeholder="Search team members by name, email..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            onClear={() => {
              setSearchTerm('');
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F8FAFC] border-b border-stone-200 text-stone-700 font-bold uppercase text-[11px] tracking-wider select-none">
              <tr>
                <th className="px-4 py-3.5 text-center whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1.5"><Settings2 className="w-3.5 h-3.5 text-stone-400 stroke-[1.75]" /> Actions</div>
                </th>
                <th className="px-5 py-3.5">Team Member</th>
                <th className="px-5 py-3.5">Email Address</th>
                <th className="px-5 py-3.5">User Type</th>
                <th className="px-5 py-3.5">Joined Date</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-stone-200/70 bg-white text-slate-800 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-24 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-stone-400">
                      <Loader2 className="w-8 h-8 animate-spin text-[#1EB8D4]" />
                      <p className="text-xs font-bold text-stone-500">Loading team members...</p>
                    </div>
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-400 mb-1">
                        <Users className="w-6 h-6 text-[#1EB8D4]" />
                      </div>
                      <p className="text-sm font-bold text-stone-700">No team members found</p>
                      <p className="text-xs text-stone-400 font-medium">
                        {searchTerm || activeFiltersCount > 0
                          ? 'Try adjusting your search criteria or filters.'
                          : 'Get started by adding your first team member.'}
                      </p>
                      {!searchTerm && activeFiltersCount === 0 && (
                        <PermissionGuard permission={PERMISSIONS.TEAM_CREATE}>
                          <PrimaryButton
                            onClick={() => navigate('/team-members/new')}
                            label="Add First Team Member"
                            className="mt-2"
                          />
                        </PermissionGuard>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                members.map((member) => {
                  return (
                    <tr
                      key={member.id}
                      className="hover:bg-stone-50/80 transition-colors duration-150 group"
                    >
                      {/* 1. Actions */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <TableActions
                          onView={() => navigate(`/team-members/view/${member.id}`)}
                          onEdit={() => navigate(`/team-members/edit/${member.id}`)}
                          onDelete={() => handleDeleteClick(member)}
                        />
                      </td>

                      {/* 2. Member Name + Avatar */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1EB8D4]/20 to-[#1EB8D4]/10 border border-[#1EB8D4]/30 text-[#148296] font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                            {getInitials(member.name)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block group-hover:text-[#1EB8D4] transition-colors">
                              {member.name}
                            </span>
                            <span className="text-[11px] text-stone-400 font-mono block">
                              ID: {member.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 3. Email Address */}
                      <td className="px-5 py-4 font-mono text-slate-600 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span>{member.email}</span>
                        </div>
                      </td>

                      {/* 4. User Type */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border shadow-2xs ${getUserTypeBadge(
                            member.userType
                          )}`}
                        >
                          <Shield className="w-3 h-3 opacity-70" />
                          <span>{member.userType}</span>
                        </span>
                      </td>

                      {/* 5. Joined Date */}
                      <td className="px-5 py-4 text-stone-600 text-xs whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span>{formatJoinedDate(member.joinedAt)}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!loading && (
          <div className="border-t border-stone-200/80 bg-[#F8FAFC]/50 py-1">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              pageSize={pageSize}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              totalRecords={totalRecords}
            />
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setMemberToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Remove Team Member"
        message={`Are you sure you want to remove team member "${memberToDelete?.name}" (${memberToDelete?.email})? This action cannot be undone.`}
        isDeleting={isDeleting}
      />
    </div>
  );
}
