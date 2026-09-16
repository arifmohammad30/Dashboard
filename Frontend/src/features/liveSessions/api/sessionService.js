import { apiClient } from '../../../lib/apiClient';
import { downloadFileFromEndpoint } from '../../../utils/downloadUtils';

// Fetch active ongoing live charging sessions
export async function getLiveSessions(page = 1, limit = 10, search = '') {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    search: search.trim()
  });
  return await apiClient(`/api/live-sessions?${params.toString()}`);
}

// Fetch historical session audit logs with multi-filters and pagination
export async function getSessionHistory(page = 1, limit = 10, search = '', status = 'All', filters = {}) {

  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    search: search.trim()
  });
  if (status && status !== 'All') params.append('status', status);
  if (filters && Object.keys(filters).length > 0) params.append('filters', JSON.stringify(filters));

  const data = await apiClient(`/api/live-sessions/history?${params.toString()}`);
  console.log(data);
  return data;
}

// Fetch single session details by authoritative session ID
export async function getSessionById(sessionId) {

  if (!sessionId) return null;
  const data2 = await apiClient(`/api/live-sessions/${sessionId}`);
  console.log(data2);
  return data2
}

// Fetch telemetry / OCPP logs for a specific session
export async function getSessionLogs(sessionId, { page = 1, limit = 15, search = '', commands = [], logTypes = [] } = {}) {
  if (!sessionId) return { data: [], total: 0, page: 1, limit: 15, totalPages: 1 };

  const params = new URLSearchParams();
  params.append('page', String(page));
  params.append('limit', String(limit));
  if (search && search.trim()) params.append('search', search.trim());
  if (commands && commands.length > 0) params.append('commands', commands.join(','));
  if (logTypes && logTypes.length > 0) params.append('logTypes', logTypes.join(','));

  const data = await apiClient(`/api/live-sessions/${sessionId}/logs?${params.toString()}`);
  console.log(data);
  return data;
}

// Export historical sessions as CSV
export async function exportSessions({ status = 'All', search = '', filters = {} } = {}) {
  const params = new URLSearchParams();
  if (status && status !== 'All') params.append('status', status);
  if (search && search.trim()) params.append('search', search.trim());
  if (filters && Object.keys(filters).length > 0) params.append('filters', JSON.stringify(filters));

  const url = `/api/live-sessions/export?${params.toString()}`;
  await downloadFileFromEndpoint(url, `session_history_export_${new Date().toISOString().slice(0, 10)}.csv`);
}

// Export telemetry logs as CSV
export async function exportLogs({ search = '', sessionId = '' } = {}) {
  const params = new URLSearchParams();
  if (search && search.trim()) params.append('search', search.trim());
  if (sessionId && sessionId.trim()) params.append('sessionId', sessionId.trim());

  const url = `/api/live-sessions/logs/export?${params.toString()}`;
  await downloadFileFromEndpoint(url, `telemetry_logs_export_${new Date().toISOString().slice(0, 10)}.csv`);
}
