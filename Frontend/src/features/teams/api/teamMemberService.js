import { apiClient } from '../../../lib/apiClient';

export const getTeamFilterOptions = async () => {
  const res = await apiClient('/teams/filters');
  return res?.data || { userTypes: ['all'], statuses: ['all'] };
};

export const getTeamMembers = async (page = 1, limit = 10, searchTerm = '', filters = {}) => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    search: searchTerm || ''
  });

  if (filters.userType && filters.userType !== 'all') {
    params.append('userType', filters.userType);
  }
  if (filters.status && filters.status !== 'all') {
    params.append('status', filters.status);
  }

  return await apiClient(`/teams/members?${params.toString()}`);
};

export const getTeamMemberById = async (id) => {
  return await apiClient(`/teams/members/${id}`);
};

export const createTeamMember = async (data) => {
  return await apiClient('/teams/members', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const updateTeamMember = async (id, data) => {
  return await apiClient(`/teams/members/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

export const deleteTeamMember = async (id) => {
  return await apiClient(`/teams/members/${id}`, {
    method: 'DELETE'
  });
};
