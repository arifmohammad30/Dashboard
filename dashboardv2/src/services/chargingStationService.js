import { apiClient } from '../lib/apiClient';
import { socket } from '../lib/socketClient';

export { socket };

export const getChargingStations = async (page = 1, limit = 20, searchTerm = '') => {
  try {
    const url = `/charging-stations?page=${page}&limit=${limit}&search=${encodeURIComponent(searchTerm)}`;
    const data = await apiClient(url);
    return data;
  } catch (error) {
    console.error("Failed to fetch charging stations:", error);
    return { data: [], total: 0, page, limit, totalPages: 1 };
  }
};

export const createChargingStation = async (payload) => {
  return apiClient('/charging-stations', {
    method: 'POST',
    body: payload,
  });
};

export const updateChargingStation = async (id, payload) => {
  return apiClient(`/charging-stations/${id}`, {
    method: 'PUT',
    body: payload,
  });
};

export const deleteChargingStation = async (id) => {
  return apiClient(`/charging-stations/${id}`, {
    method: 'DELETE',
  });
};
