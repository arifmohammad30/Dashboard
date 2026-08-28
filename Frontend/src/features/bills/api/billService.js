import { apiClient } from '../../../lib/apiClient';
import { downloadFileFromEndpoint } from '../../../utils/downloadUtils';

export async function getBills(page = 1, limit = 10, search = '', filters = {}) {
  try {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      search: search || ''
    });

    if (filters?.timeRange && filters.timeRange !== 'All') {
      params.append('timeRange', filters.timeRange);
    }

    if (filters && Object.keys(filters).length > 0) {
      params.append('filters', JSON.stringify(filters));
    }

    return await apiClient(`/bills?${params.toString()}`);
  } catch (err) {
    console.error("Failed to fetch bills from API:", err);
    return { data: [], total: 0, page: 1, limit: 10, totalPages: 1 };
  }
}

export async function getBillById(billId) {
  try {
    return await apiClient(`/bills/${billId}`);
  } catch (err) {
    console.error(`Failed to fetch bill ${billId} from API:`, err);
    return null;
  }
}

export async function exportBillsCsv(search = '', filters = {}) {
  const params = new URLSearchParams();
  if (search && search.trim()) params.append('search', search.trim());
  if (filters && Object.keys(filters).length > 0) params.append('filters', JSON.stringify(filters));

  const url = `/api/bills/export?${params.toString()}`;
  await downloadFileFromEndpoint(url, `bills_export_${new Date().toISOString().slice(0, 10)}.csv`);
}
