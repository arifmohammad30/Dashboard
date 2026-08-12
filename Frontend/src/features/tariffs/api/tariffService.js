import { apiClient } from '../../../lib/apiClient';
import { downloadFileFromEndpoint } from '../../../utils/downloadUtils';

export const getTariffs = async (page = 1, limit = 20, searchTerm = '') => {
  try {
    const url = `/tariffs?page=${page}&limit=${limit}&search=${encodeURIComponent(searchTerm)}`;
    return await apiClient(url);
  } catch (error) {
    console.error("Failed to fetch tariffs:", error);
    return null;
  }
};

export const getTariffById = async (id) => {
  try {
    return await apiClient(`/tariffs/${id}`);
  } catch (error) {
    console.error("Failed to fetch tariff by ID:", error);
    throw error;
  }
};

export const createTariff = async (data) => {
  return await apiClient('/tariffs', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const updateTariff = async (id, data) => {
  return await apiClient(`/tariffs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

export const deleteTariff = async (id) => {
  return await apiClient(`/tariffs/${id}`, {
    method: 'DELETE'
  });
};

export const exportTariffs = async (searchTerm = '') => {
  const params = new URLSearchParams();
  if (searchTerm && searchTerm.trim()) params.append('search', searchTerm.trim());

  const url = `/api/tariffs/export?${params.toString()}`;
  await downloadFileFromEndpoint(url, `tariffs_export_${new Date().toISOString().slice(0, 10)}.csv`);
};
