import { apiClient } from '../../../lib/apiClient';
import { downloadFileFromEndpoint } from '../../../utils/downloadUtils';

export async function getLiveSessions() {
  try {
    const res = await apiClient('/api/live-sessions');
    return Array.isArray(res) ? res : (res?.data && Array.isArray(res.data) ? res.data : []);
  } catch (err) {
    console.error('Failed to fetch live sessions:', err);
    return [];
  }
}

export async function exportSessions({ status = 'All', search = '' } = {}) {
  const params = new URLSearchParams();
  if (status && status !== 'All') params.append('status', status);
  if (search && search.trim()) params.append('search', search.trim());

  const url = `/api/live-sessions/export?${params.toString()}`;
  await downloadFileFromEndpoint(url, `session_history_export_${new Date().toISOString().slice(0, 10)}.csv`);
}

export async function exportLogs({ search = '' } = {}) {
  const params = new URLSearchParams();
  if (search && search.trim()) params.append('search', search.trim());

  const url = `/api/live-sessions/logs/export?${params.toString()}`;
  await downloadFileFromEndpoint(url, `telemetry_logs_export_${new Date().toISOString().slice(0, 10)}.csv`);
}
