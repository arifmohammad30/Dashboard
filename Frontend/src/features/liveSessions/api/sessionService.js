import { apiClient } from '../../../lib/apiClient';
import { downloadFileFromEndpoint } from '../../../utils/downloadUtils';

export async function getLiveSessions(page = 1, limit = 10, search = '') {
  try {
    const params = new URLSearchParams({
      page,
      limit,
      search: search.trim()
    });
    return await apiClient(`/api/live-sessions?${params.toString()}`);
  } catch (err) {
    console.error('Failed to fetch live sessions:', err);
    return { data: [], total: 0, page: 1, limit: 10, totalPages: 1 };
  }
}

export async function getSessionHistory(page = 1, limit = 10, search = '', status = 'All', filters = {}) {
  try {
    const params = new URLSearchParams({
      page,
      limit,
      search: search.trim()
    });
    if (status && status !== 'All') params.append('status', status);
    if (filters && Object.keys(filters).length > 0) params.append('filters', JSON.stringify(filters));

    return await apiClient(`/api/live-sessions/history?${params.toString()}`);
  } catch (err) {
    console.error('Failed to fetch session history:', err);
    return { data: [], total: 0, page: 1, limit: 10, totalPages: 1 };
  }
}

export async function exportSessions({ status = 'All', search = '', filters = {} } = {}) {
  const params = new URLSearchParams();
  if (status && status !== 'All') params.append('status', status);
  if (search && search.trim()) params.append('search', search.trim());
  if (filters && Object.keys(filters).length > 0) params.append('filters', JSON.stringify(filters));

  const url = `/api/live-sessions/export?${params.toString()}`;
  await downloadFileFromEndpoint(url, `session_history_export_${new Date().toISOString().slice(0, 10)}.csv`);
}

export async function exportLogs({ search = '' } = {}) {
  const params = new URLSearchParams();
  if (search && search.trim()) params.append('search', search.trim());

  const url = `/api/live-sessions/logs/export?${params.toString()}`;
  await downloadFileFromEndpoint(url, `telemetry_logs_export_${new Date().toISOString().slice(0, 10)}.csv`);
}
