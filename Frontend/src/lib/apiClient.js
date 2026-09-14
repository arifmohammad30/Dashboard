export const API_BASE_URL = 'http://localhost:5000/api';

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

export async function apiClient(endpoint, options = {}) {
  const url = getApiUrl(endpoint);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
    if (netErr.name === 'AbortError' || netErr.name === 'CanceledError') {
      throw netErr;
    }
    const error = new Error('Server connection error. Please check if the server is connected.');
    error.title = 'Server Disconnected';
    error.code = 503;
    error.isNetworkError = true;
    throw error;
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const message =
      errorData?.error ||
      errorData?.message ||
      `API Error: ${response.status} ${response.statusText}`;

    const error = new Error(message);
    error.title = `Backend Error (${response.status})`;
    error.code = response.status;

    // Global Authorization & Authentication Failure Handling (Instruction 10)
    if (response.status === 401) {
      error.isAuthError = true;
      // Dispatch global unauthorized event for AuthContext & Router
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:unauthorized', { detail: { error } }));
      }
    } else if (response.status === 403) {
      error.isForbidden = true;
      // Dispatch global forbidden event for UI notifications
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:forbidden', { detail: { error } }));
      }
    }

    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}
