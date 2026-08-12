import { exportSessions } from '../api/sessionService';

export async function exportSessionsToCsv(toast, { status = 'All', search = '' } = {}) {
  try {
    await exportSessions({ status, search });
    toast.success("Streaming CSV export downloaded successfully from backend server", {
      title: 'Backend Export Complete',
      code: 200
    });
  } catch (err) {
    console.error("Backend CSV export error:", err);
    toast.error(err.message || "Failed to download CSV export from backend", {
      title: err.title || "Export Failed",
      code: err.code || 500
    });
  }
}

