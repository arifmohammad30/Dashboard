export const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Resolves full backend API URL given a relative or full endpoint path
 */
export function getApiUrl(endpoint) {
  let cleanEndpoint = endpoint;
  if (!cleanEndpoint.startsWith('http')) {
    if (cleanEndpoint.startsWith('/api/')) {
      cleanEndpoint = cleanEndpoint.replace(/^\/api/, '');
    } else if (cleanEndpoint.startsWith('api/')) {
      cleanEndpoint = cleanEndpoint.replace(/^api/, '');
    }
    if (!cleanEndpoint.startsWith('/')) {
      cleanEndpoint = `/${cleanEndpoint}`;
    }
  }
  return endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${cleanEndpoint}`;
}

/**
 * A lightweight, pragmatic wrapper around native fetch to handle 
 * common boilerplate (JSON parsing, real error extraction, base URL).
 */
export async function apiClient(endpoint, options = {}) {
  const url = getApiUrl(endpoint);

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  if (config.body && typeof config.body !== 'string') {
    config.body = JSON.stringify(config.body);
  }

  let response;
  try {
    response = await fetch(url, config);
  } catch (netErr) {
    const error = new Error(`Cannot connect to backend server at ${url}. Please ensure the backend server (port 5000) is running.`);
    error.title = 'Backend Server Unreachable';
    error.code = 503;
    error.isNetworkError = true;
    throw error;
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const message = errorData?.error || errorData?.message || `API Error: ${response.status} ${response.statusText}`;
    const error = new Error(message);
    error.title = `Backend Error (${response.status})`;
    error.code = response.status;
    throw error;
  }

  // Handle empty responses (e.g. 204 No Content)
  if (response.status === 204) {
    return null;
  }

  return response.json();
}
