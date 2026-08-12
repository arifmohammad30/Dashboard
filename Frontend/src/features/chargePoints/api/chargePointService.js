import { apiClient } from '../../../lib/apiClient';
import { downloadFileFromEndpoint } from '../../../utils/downloadUtils';

export const getFilterOptions = async () => {
  try {
    const data = await apiClient('/charge-points/filters');
    return data;
  } catch (error) {
    console.error("Failed to fetch filters, using fallback:", error);
    return null;
  }
};

export const getChargePoints = async (page = 1, limit = 10, searchTerm = '', filters = {}) => {
  try {
    const filterString = encodeURIComponent(JSON.stringify(filters));
    const url = `/charge-points?page=${page}&limit=${limit}&search=${encodeURIComponent(searchTerm)}&filters=${filterString}`;
    return await apiClient(url);
  } catch (error) {
    console.error("Failed to fetch charge points from API:", error);
    throw error;
  }
};

export const getChargePointById = async (id) => {
  return apiClient(`/charge-points/${id}`);
};

export const createChargePoint = async (data) => {
  return apiClient('/charge-points', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const updateChargePoint = async (id, data) => {
  return apiClient(`/charge-points/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

export const deleteChargePoint = async (id) => {
  return apiClient(`/charge-points/${id}`, {
    method: 'DELETE'
  });
};

export const exportChargePoints = async (searchTerm = '') => {
  const params = new URLSearchParams();
  if (searchTerm && searchTerm.trim()) params.append('search', searchTerm.trim());

  const url = `/api/charge-points/export?${params.toString()}`;
  await downloadFileFromEndpoint(url, `charge_points_export_${new Date().toISOString().slice(0, 10)}.csv`);
};
