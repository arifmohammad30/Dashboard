import { apiClient } from '../../../lib/apiClient';
import { downloadFileFromEndpoint } from '../../../utils/downloadUtils';

export const getFilterOptions = async () => {
  return await apiClient('/charge-points/filters');
};

export const getChargePoints = async (page = 1, limit = 10, searchTerm = '', filters = {}) => {
  try {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      search: searchTerm
    });

    if (filters?.chargingStationId) {
      params.append('chargingStationId', filters.chargingStationId);
    }

    if (filters && Object.keys(filters).length > 0) {
      params.append('filters', JSON.stringify(filters));
    }

    const url = `/charge-points?${params.toString()}`;
    return await apiClient(url);
  } catch (error) {
    console.error("Failed to fetch charge points from API:", error);
    throw error;
  }
};

export const getChargePointById = async (id) => {
  return apiClient(`/charge-points/${id}`);
};

export const createChargePoint = async (data) => {
  return apiClient('/charge-points', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const updateChargePoint = async (id, data) => {
  return apiClient(`/charge-points/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

export const deleteChargePoint = async (id) => {
  return apiClient(`/charge-points/${id}`, {
    method: 'DELETE'
  });
};

export const exportChargePoints = async (searchTerm = '', filters = {}) => {
  const params = new URLSearchParams();
  if (searchTerm && searchTerm.trim()) params.append('search', searchTerm.trim());
  if (filters && Object.keys(filters).length > 0) params.append('filters', JSON.stringify(filters));

  const url = `/api/charge-points/export?${params.toString()}`;
  await downloadFileFromEndpoint(url, `charge_points_export_${new Date().toISOString().slice(0, 10)}.csv`);
};

export const getChargePointStats = async (id, timeRange = 'Today') => {
  return apiClient(`/charge-points/${id}/stats?timeRange=${encodeURIComponent(timeRange)}`);
};

export const updateChargePointConnector = async (id, connectorId, data) => {
  return apiClient(`/charge-points/${id}/connectors/${connectorId}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

export const addChargePointConnector = async (id, data = {}) => {
  return apiClient(`/charge-points/${id}/connectors`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
};


export const assignChargePointTariff = async (id, tariffId) => {
  return apiClient(`/charge-points/${id}/tariff`, {
    method: 'PUT',
    body: JSON.stringify({ tariffId })
  });
};

export const startConnectorCharging = async (id, connectorId) => {
  return apiClient(`/charge-points/${id}/connectors/${connectorId}/start`, {
    method: 'POST'
  });
};

export const stopConnectorCharging = async (id, connectorId) => {
  return apiClient(`/charge-points/${id}/connectors/${connectorId}/stop`, {
    method: 'POST'
  });
};

export const getConnectorStatus = async (id, connectorId) => {
  return apiClient(`/charge-points/${id}/connectors/${connectorId}/status`);
};



export const getChargePointConfigurations = async (id) => {
  return apiClient(`/charge-points/${id}/configurations`);
};

export const updateChargePointConfiguration = async (id, key, value) => {
  return apiClient(`/charge-points/${id}/configurations`, {
    method: 'PUT',
    body: JSON.stringify({ key, value })
  });
};

export const resetChargePointConfigurations = async (id) => {
  return apiClient(`/charge-points/${id}/configurations/reset`, {
    method: 'POST'
  });
};

// ==========================================
// CONTROL TAB API ENDPOINTS (REMOTE COMMANDS)
// ==========================================

export const sendChargePointReset = async (id, resetType = 'Soft') => {
  return apiClient(`/charge-points/${id}/control/reset`, {
    method: 'POST',
    body: JSON.stringify({ resetType })
  });
};

export const sendChargePointFirmwareUpdate = async (id, data) => {
  return apiClient(`/charge-points/${id}/control/firmware-update`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const updateChargePointLocalIdTags = async (id, data) => {
  return apiClient(`/charge-points/${id}/control/local-id-tags`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const sendChargePointTriggerMessage = async (id, data) => {
  return apiClient(`/charge-points/${id}/control/trigger-message`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const getChargePointDiagnostics = async (id, data) => {
  return apiClient(`/charge-points/${id}/control/get-diagnostics`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const sendChargePointDataTransfer = async (id, data) => {
  return apiClient(`/charge-points/${id}/control/data-transfer`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const sendChargePointClearCache = async (id) => {
  return apiClient(`/charge-points/${id}/control/clear-cache`, {
    method: 'POST'
  });
};
