import { apiClient } from '../../../lib/apiClient';
import { downloadFileFromEndpoint } from '../../../utils/downloadUtils';

export const getFilterOptions = async () => {
  return await apiClient('/charging-stations/filters');
};

export const getChargingStations = async (page = 1, limit = 10, searchTerm = '', filters = {}) => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    search: searchTerm
  });

  if (filters && Object.keys(filters).length > 0) {
    params.append('filters', JSON.stringify(filters));
  }

  const url = `/charging-stations?${params.toString()}`;
  return await apiClient(url);
};

export const getChargingStationById = async (id) => {
  try {
    const data = await apiClient(`/charging-stations/${id}`);
    return data;
  } catch (error) {
    console.error("Failed to fetch charging station by ID:", error);
    throw error;
  }
};

export const createChargingStation = async (data) => {
  return await apiClient('/charging-stations', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const updateChargingStation = async (id, data) => {
  return await apiClient(`/charging-stations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

export const deleteChargingStation = async (id) => {
  return await apiClient(`/charging-stations/${id}`, {
    method: 'DELETE'
  });
};

export const exportStations = async (searchTerm = '') => {
  const params = new URLSearchParams();
  if (searchTerm && searchTerm.trim()) params.append('search', searchTerm.trim());

  const url = `/api/charging-stations/export?${params.toString()}`;
  await downloadFileFromEndpoint(url, `charging_stations_export_${new Date().toISOString().slice(0, 10)}.csv`);
};
