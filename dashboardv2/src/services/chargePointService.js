import { apiClient } from '../lib/apiClient';
import { socket } from '../lib/socketClient';

export { socket };

export const getFilterOptions = async () => {
  try {
    const data = await apiClient('/chargepoints/filters');
    return data;
  } catch (error) {
    console.error("Failed to fetch filter options:", error);
    return { locations: [], manufacturers: [], statuses: [], types: [] };
  }
};

export const getChargePoints = async (page = 1, limit = 20, searchTerm = '', filters = {}) => {
  try {
    const filterString = encodeURIComponent(JSON.stringify(filters));
    const url = `/chargepoints?page=${page}&limit=${limit}&search=${encodeURIComponent(searchTerm)}&filters=${filterString}`;
    
    const data = await apiClient(url);
    return data;
  } catch (error) {
    console.error("Failed to fetch charge points:", error);
    return { data: [], total: 0, page, limit, totalPages: 1 };
  }
};

export const getChargePointById = async (id) => {
  return apiClient(`/chargepoints/${id}`);
};

export const createChargePoint = async (payload) => {
  return apiClient('/chargepoints', {
    method: 'POST',
    body: payload,
  });
};

export const updateChargePoint = async (id, payload) => {
  return apiClient(`/chargepoints/${id}`, {
    method: 'PUT',
    body: payload,
  });
};

export const deleteChargePoint = async (id) => {
  return apiClient(`/chargepoints/${id}`, {
    method: 'DELETE',
  });
};
