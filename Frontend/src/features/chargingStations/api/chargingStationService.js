import { apiClient } from '../../../lib/apiClient';
import { downloadFileFromEndpoint } from '../../../utils/downloadUtils';

// Charging Station API Client Services

// 1. Fetch Dynamic Filter Options (e.g. Brands, Mobility Types, States)
export const getFilterOptions = async () => {
  return await apiClient('/charging-stations/filters');
};

// 2. Fetch Paginated Charging Stations List with Search and Filters
export const getChargingStations = async (page = 1, limit = 10, searchTerm = '', filters = {}) => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    search: searchTerm
  });

  // Attach structured multi-criteria filters if present
  if (filters && Object.keys(filters).length > 0) {
    params.append('filters', JSON.stringify(filters));
  }

  const url = `/charging-stations?${params.toString()}`;
  const response = await apiClient(url);
  console.log('%c⚡ [Charging Stations List Data]:', 'color: #4DA944; font-weight: bold; font-size: 13px;', response);
  return response;
};

// 3. Fetch Single Charging Station Specification by Primary ID
export const getChargingStationById = async (id) => {
  try {
    const data = await apiClient(`/charging-stations/${id}`);
    console.log('%c🔍 [Charging Station Details Data]:', 'color: #38BDF8; font-weight: bold; font-size: 13px;', data);
    return data;
  } catch (error) {
    console.error("Failed to fetch charging station by ID:", error);
    throw error;
  }
};

// 4. Create New Charging Station Record (POST /charging-stations)
export const createChargingStation = async (data) => {
  return await apiClient('/charging-stations', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

// 5. Update Existing Charging Station by Primary ID (PUT /charging-stations/:id)
export const updateChargingStation = async (id, data) => {
  return await apiClient(`/charging-stations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

// 6. Delete Charging Station Record by Primary ID (DELETE /charging-stations/:id)
export const deleteChargingStation = async (id) => {
  return await apiClient(`/charging-stations/${id}`, {
    method: 'DELETE'
  });
};

// 7. Export Filtered/Searched Charging Stations to CSV File
export const exportStations = async (searchTerm = '') => {
  const params = new URLSearchParams();
  if (searchTerm && searchTerm.trim()) params.append('search', searchTerm.trim());

  const url = `/api/charging-stations/export?${params.toString()}`;
  await downloadFileFromEndpoint(url, `charging_stations_export_${new Date().toISOString().slice(0, 10)}.csv`);
};

