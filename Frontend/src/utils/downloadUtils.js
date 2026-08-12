import { getApiUrl } from '../lib/apiClient';

/**
 * Shared Browser Download Helper
 * Downloads a Blob or response stream as a file in the user's browser
 */
export async function downloadFileFromEndpoint(endpoint, defaultFilename = 'export.csv') {
  const url = getApiUrl(endpoint);

  let response;
  try {
    response = await fetch(url);
  } catch (netErr) {
    const error = new Error(`Cannot connect to backend server at ${url}. Please ensure the backend server (port 5000) is running.`);
    error.title = 'Backend Server Unreachable';
    error.code = 503;
    error.isNetworkError = true;
    throw error;
  }

  if (!response.ok) {
    let errorMessage = `Server responded with HTTP ${response.status} ${response.statusText}`;
    try {
      const errJson = await response.json();
      if (errJson && (errJson.error || errJson.message)) {
        errorMessage = errJson.error || errJson.message;
      }
    } catch (e) {
      // Body not JSON
    }
    const error = new Error(errorMessage);
    error.title = `Backend Server Error (${response.status})`;
    error.code = response.status;
    throw error;
  }

  // Content-Type validation: ensure response is genuine CSV (not fallback HTML or error JSON)
  const contentType = response.headers.get('Content-Type') || '';
  if (
    !contentType.includes('csv') &&
    !contentType.includes('text/plain') &&
    !contentType.includes('application/octet-stream')
  ) {
    const error = new Error(
      `Received non-CSV content type (${contentType}) from backend. Expected CSV file stream.`
    );
    error.title = 'Invalid Server Response';
    error.code = 422;
    throw error;
  }

  let filename = defaultFilename;
  const disposition = response.headers.get('Content-Disposition');
  if (disposition && disposition.includes('filename=')) {
    const match = disposition.match(/filename="?([^";]+)"?/);
    if (match && match[1]) {
      filename = match[1];
    }
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
}
