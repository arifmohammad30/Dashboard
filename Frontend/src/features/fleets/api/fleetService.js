import { apiClient } from '../../../lib/apiClient';
import { downloadFileFromEndpoint } from '../../../utils/downloadUtils';

export const getFleets = async (page = 1, limit = 10, searchTerm = '', filters = {}) => {
  try {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      search: searchTerm
    });

    if (filters && Object.keys(filters).length > 0) {
      params.append('filters', JSON.stringify(filters));
    }

    const url = `/fleets?${params.toString()}`;
    return await apiClient(url);
  } catch (error) {
    console.error("Failed to fetch fleets from API:", error);
    return { data: [], total: 0, page: 1, limit: 10, totalPages: 1 };
  }
};

export const getFleetById = async (id) => {
  return await apiClient(`/fleets/${id}`);
};

export const createFleet = async (data) => {
  return await apiClient('/fleets', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const updateFleet = async (id, data) => {
  return await apiClient(`/fleets/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

export const topUpFleetWallet = async (id, amount) => {
  return await apiClient(`/fleets/${id}/topup`, {
    method: 'POST',
    body: JSON.stringify({ amount })
  });
};

export const deleteFleet = async (id) => {
  return await apiClient(`/fleets/${id}`, {
    method: 'DELETE'
  });
};

export const exportFleets = async (searchTerm = '', filters = {}) => {
  const params = new URLSearchParams();
  if (searchTerm && searchTerm.trim()) params.append('search', searchTerm.trim());
  if (filters && Object.keys(filters).length > 0) params.append('filters', JSON.stringify(filters));

  const url = `/api/fleets/export?${params.toString()}`;
  await downloadFileFromEndpoint(url, `fleets_export_${new Date().toISOString().slice(0, 10)}.csv`);
};
