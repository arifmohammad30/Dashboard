import { apiClient } from '../../../lib/apiClient';
import { downloadFileFromEndpoint } from '../../../utils/downloadUtils';

/**
 * 1. Tariff Filter Options API
 * Fetch distinct filter values (e.g. types, GST tax rates) for tariff list filters.
 */
export const getFilterOptions = async () => {
  return await apiClient('/tariffs/filters');
};

/**
 * 2. Paginated Tariffs List API
 * Fetch paginated tariff catalog records with search and multi-select filtering.
 */
export const getTariffs = async (page = 1, limit = 10, searchTerm = '', filters = {}) => {

  try {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      search: searchTerm
    });

    if (filters && Object.keys(filters).length > 0) {
      params.append('filters', JSON.stringify(filters));
    }

    const url = `/tariffs?${params.toString()}`;
    const data = await apiClient(url);
    console.log("tariffs data : ", data);
    return data;
  } catch (error) {
    console.error('Failed to fetch tariffs:', error);
    throw error;
  }
};

/**
 * 3. Tariff Details API
 * Fetch full configuration for a single tariff by ID.
 */
export const getTariffById = async (id) => {
  try {
    const data = await apiClient(`/tariffs/${id}`);
    console.log("tariff details data : ", data);
    return data;

  } catch (error) {
    console.error(`Failed to fetch tariff by ID (${id}):`, error);
    throw error;
  }
};

/**
 * 4. Create Tariff API
 * Post a new tariff plan with nested pricing configuration.
 */
export const createTariff = async (data) => {
  return await apiClient('/tariffs', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

/**
 * 5. Update Tariff API
 * Update an existing tariff plan configuration by ID.
 */
export const updateTariff = async (id, data) => {
  return await apiClient(`/tariffs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

/**
 * 6. Delete Tariff API
 * Permanently remove a tariff record by ID.
 */
export const deleteTariff = async (id) => {
  return await apiClient(`/tariffs/${id}`, {
    method: 'DELETE'
  });
};

/**
 * 7. Export Tariffs to CSV API
 * Download tariff records as a formatted CSV file.
 */
export const exportTariffs = async (searchTerm = '', filters = {}) => {
  const params = new URLSearchParams();
  if (searchTerm && searchTerm.trim()) params.append('search', searchTerm.trim());
  if (filters && Object.keys(filters).length > 0) params.append('filters', JSON.stringify(filters));

  const url = `/api/tariffs/export?${params.toString()}`;
  await downloadFileFromEndpoint(url, `tariffs_export_${new Date().toISOString().slice(0, 10)}.csv`);
};

