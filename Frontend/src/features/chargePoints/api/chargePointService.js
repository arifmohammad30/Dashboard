import { apiClient } from '../../../lib/apiClient';
import { downloadFileFromEndpoint } from '../../../utils/downloadUtils';

// 1. Charge Points List & Filter APIs

// Fetch available filter options (e.g., statuses, connector types, models)
export const getFilterOptions = async () => {
  return await apiClient('/charge-points/filters');
};

// Fetch paginated charge points with search, filters, and optional station ID
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
    const response = await apiClient(url);
    console.log('%c [Charge Points List Data]:', 'color: #4DA944; font-weight: bold; font-size: 13px;', response);
    return response;
  } catch (error) {
    console.error("Failed to fetch charge points from API:", error);
    throw error;
  }
};

// 2. Charge Point CRUD APIs

// Fetch single charge point details by ID
export const getChargePointById = async (id) => {
  try {
    const response = await apiClient(`/charge-points/${id}`);
    console.log('%c⚡ [Charge Point Details / Edit Data]:', 'color: #38BDF8; font-weight: bold; font-size: 13px;', response);
    return response;
  } catch (error) {
    console.error(`Failed to fetch charge point details for ID ${id}:`, error);
    throw error;
  }
};

// Create a new charge point
export const createChargePoint = async (data) => {
  console.log('%c [Create Charge Point Payload Sent]:', 'color: #A855F7; font-weight: bold; font-size: 13px;', data);
  const response = await apiClient('/charge-points', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  console.log('%c [Create Charge Point Response Received]:', 'color: #4DA944; font-weight: bold; font-size: 13px;', response);
  return response;
};

// Update an existing charge point by ID
export const updateChargePoint = async (id, data) => {
  console.log('%c [Update Charge Point Payload Sent]:', 'color: #A855F7; font-weight: bold; font-size: 13px;', data);
  const response = await apiClient(`/charge-points/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
  console.log('%c⚡ [Update Charge Point Response Received]:', 'color: #F59E0B; font-weight: bold; font-size: 13px;', response);
  return response;
};

// Delete a charge point by ID
export const deleteChargePoint = async (id) => {
  return apiClient(`/charge-points/${id}`, {
    method: 'DELETE'
  });
};

// 3. Export API

// Export filtered or searched charge points as a CSV file download
export const exportChargePoints = async (searchTerm = '', filters = {}) => {
  const params = new URLSearchParams();
  if (searchTerm && searchTerm.trim()) params.append('search', searchTerm.trim());
  if (filters && Object.keys(filters).length > 0) params.append('filters', JSON.stringify(filters));

  const url = `/api/charge-points/export?${params.toString()}`;
  await downloadFileFromEndpoint(url, `charge_points_export_${new Date().toISOString().slice(0, 10)}.csv`);
};

// 4. Statistics API

// Fetch performance stats (energy, revenue, sessions) for a time range (Today, Week, Month, etc.)
export const getChargePointStats = async (id, timeRange = 'Today') => {
  return apiClient(`/charge-points/${id}/stats?timeRange=${encodeURIComponent(timeRange)}`);
};

// 5. Connector Management APIs

// Add a new connector to a charge point
export const addChargePointConnector = async (id, data = {}) => {
  return apiClient(`/charge-points/${id}/connectors`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

// Update an existing connector on a charge point
export const updateChargePointConnector = async (id, connectorId, data) => {
  return apiClient(`/charge-points/${id}/connectors/${connectorId}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

// Get current live status of a connector
export const getConnectorStatus = async (id, connectorId) => {
  return apiClient(`/charge-points/${id}/connectors/${connectorId}/status`);
};

// Remotely start charging on a connector
export const startConnectorCharging = async (id, connectorId) => {
  return apiClient(`/charge-points/${id}/connectors/${connectorId}/start`, {
    method: 'POST'
  });
};

// Remotely stop charging on a connector
export const stopConnectorCharging = async (id, connectorId) => {
  return apiClient(`/charge-points/${id}/connectors/${connectorId}/stop`, {
    method: 'POST'
  });
};

// 6. Tariff Assignment API

// Assign a pricing tariff to a charge point
export const assignChargePointTariff = async (id, tariffId) => {
  return apiClient(`/charge-points/${id}/tariff`, {
    method: 'PUT',
    body: JSON.stringify({ tariffId })
  });
};

// 7. OCPP Configurations APIs

// Fetch all OCPP configuration keys and values
export const getChargePointConfigurations = async (id) => {
  return apiClient(`/charge-points/${id}/configurations`);
};

// Update a specific OCPP configuration key
export const updateChargePointConfiguration = async (id, key, value) => {
  return apiClient(`/charge-points/${id}/configurations`, {
    method: 'PUT',
    body: JSON.stringify({ key, value })
  });
};

// Reset OCPP configurations back to default values
export const resetChargePointConfigurations = async (id) => {
  return apiClient(`/charge-points/${id}/configurations/reset`, {
    method: 'POST'
  });
};

// 8. Remote Control Commands APIs

// Send remote reboot command (Soft or Hard reset)
export const sendChargePointReset = async (id, resetType = 'Soft') => {
  return apiClient(`/charge-points/${id}/control/reset`, {
    method: 'POST',
    body: JSON.stringify({ resetType })
  });
};

// Trigger remote firmware update
export const sendChargePointFirmwareUpdate = async (id, data) => {
  return apiClient(`/charge-points/${id}/control/firmware-update`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

// Send RFID / Local ID authorization tag list
export const updateChargePointLocalIdTags = async (id, data) => {
  return apiClient(`/charge-points/${id}/control/local-id-tags`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

// Request charger to send a specific OCPP message (e.g., Heartbeat, MeterValues)
export const sendChargePointTriggerMessage = async (id, data) => {
  return apiClient(`/charge-points/${id}/control/trigger-message`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

// Request diagnostic log files from the charge point
export const getChargePointDiagnostics = async (id, data) => {
  return apiClient(`/charge-points/${id}/control/get-diagnostics`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

// Send custom data transfer message
export const sendChargePointDataTransfer = async (id, data) => {
  return apiClient(`/charge-points/${id}/control/data-transfer`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

// Clear local authorization cache on the charge point
export const sendChargePointClearCache = async (id) => {
  return apiClient(`/charge-points/${id}/control/clear-cache`, {
    method: 'POST'
  });
};
