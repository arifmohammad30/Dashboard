import { apiClient } from '../lib/apiClient';
import { socket } from '../lib/socketClient';

export { socket };

export const INITIAL_CHARGING_STATIONS = [
  { id: 1, name: 'Location 1 Hub', code: 'HUB-001', chargePoints: 8, totalSessions: 1240, revenueGenerated: 48500, energyDelivered: 12400 },
  { id: 2, name: 'Location 2 Hub', code: 'HUB-002', chargePoints: 6, totalSessions: 980, revenueGenerated: 36200, energyDelivered: 9100 },
  { id: 3, name: 'Location 3 Hub', code: 'HUB-003', chargePoints: 12, totalSessions: 2100, revenueGenerated: 84000, energyDelivered: 21500 },
  { id: 4, name: 'Location 4 Hub', code: 'HUB-004', chargePoints: 4, totalSessions: 450, revenueGenerated: 18000, energyDelivered: 4500 },
  { id: 5, name: 'Location 5 Hub', code: 'HUB-005', chargePoints: 10, totalSessions: 1650, revenueGenerated: 62000, energyDelivered: 15800 },
  { id: 6, name: 'Location 6 Hub', code: 'HUB-006', chargePoints: 6, totalSessions: 890, revenueGenerated: 31000, energyDelivered: 8200 },
  { id: 7, name: 'Location 7 Hub', code: 'HUB-007', chargePoints: 14, totalSessions: 2400, revenueGenerated: 95000, energyDelivered: 24100 },
  { id: 8, name: 'Location 8 Hub', code: 'HUB-008', chargePoints: 5, totalSessions: 620, revenueGenerated: 23000, energyDelivered: 6000 },
  { id: 9, name: 'Location 9 Hub', code: 'HUB-009', chargePoints: 9, totalSessions: 1420, revenueGenerated: 54000, energyDelivered: 13900 },
  { id: 10, name: 'Location 10 Hub', code: 'HUB-010', chargePoints: 16, totalSessions: 2950, revenueGenerated: 112000, energyDelivered: 28900 },
  { id: 11, name: 'Location 11 Hub', code: 'HUB-011', chargePoints: 8, totalSessions: 1100, revenueGenerated: 42000, energyDelivered: 10800 },
  { id: 12, name: 'Location 12 Hub', code: 'HUB-012', chargePoints: 6, totalSessions: 780, revenueGenerated: 29000, energyDelivered: 7500 },
  { id: 13, name: 'Location 13 Hub', code: 'HUB-013', chargePoints: 10, totalSessions: 1750, revenueGenerated: 68000, energyDelivered: 17100 },
  { id: 14, name: 'Location 14 Hub', code: 'HUB-014', chargePoints: 7, totalSessions: 910, revenueGenerated: 34000, energyDelivered: 8900 },
  { id: 15, name: 'Location 15 Hub', code: 'HUB-015', chargePoints: 12, totalSessions: 2050, revenueGenerated: 81000, energyDelivered: 20200 },
  { id: 16, name: 'Location 16 Hub', code: 'HUB-016', chargePoints: 4, totalSessions: 390, revenueGenerated: 15500, energyDelivered: 3800 },
  { id: 17, name: 'Location 17 Hub', code: 'HUB-017', chargePoints: 8, totalSessions: 1280, revenueGenerated: 49000, energyDelivered: 12600 },
  { id: 18, name: 'Location 18 Hub', code: 'HUB-018', chargePoints: 15, totalSessions: 2700, revenueGenerated: 104000, energyDelivered: 26500 },
  { id: 19, name: 'Location 19 Hub', code: 'HUB-019', chargePoints: 6, totalSessions: 840, revenueGenerated: 32500, energyDelivered: 8300 },
  { id: 20, name: 'Location 20 Hub', code: 'HUB-020', chargePoints: 11, totalSessions: 1890, revenueGenerated: 73000, energyDelivered: 18400 },
];

let localStationsStore = [...INITIAL_CHARGING_STATIONS];

export const getChargingStations = async (page = 1, limit = 20, searchTerm = '') => {
  try {
    const url = `/charging-stations?page=${page}&limit=${limit}&search=${encodeURIComponent(searchTerm)}`;
    const data = await apiClient(url);
    if (data && Array.isArray(data.data) && data.data.length > 0) {
      return data;
    }
  } catch (error) {
    console.warn("Backend API unavailable, using local charging stations data:", error);
  }

  // Fallback to local 20 Location Hubs dataset
  let filtered = [...localStationsStore];
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(cs => cs.name.toLowerCase().includes(term) || cs.code.toLowerCase().includes(term));
  }

  const total = filtered.length;
  const startIndex = (page - 1) * limit;
  const paginatedData = filtered.slice(startIndex, startIndex + limit);

  return {
    data: paginatedData,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit))
  };
};

export const getChargingStationById = async (id) => {
  try {
    const data = await apiClient(`/charging-stations/${id}`);
    if (data) return data;
  } catch (error) {
    console.warn("Backend API unavailable, using local stations store:", error);
  }
  const item = localStationsStore.find(cs => String(cs.id) === String(id));
  if (item) return { ...item };
  throw new Error("Charging Station not found");
};

export const createChargingStation = async (payload) => {
  try {
    return await apiClient('/charging-stations', {
      method: 'POST',
      body: payload,
    });
  } catch (err) {
    const newStation = {
      id: Date.now(),
      name: payload.name || 'Location Hub',
      code: payload.code || `HUB-${Math.floor(100 + Math.random() * 900)}`,
      chargePoints: payload.chargePoints || 4,
      totalSessions: 0,
      revenueGenerated: 0,
      energyDelivered: 0
    };
    localStationsStore.unshift(newStation);
    return newStation;
  }
};

export const updateChargingStation = async (id, payload) => {
  try {
    return await apiClient(`/charging-stations/${id}`, {
      method: 'PUT',
      body: payload,
    });
  } catch (err) {
    const index = localStationsStore.findIndex(cs => String(cs.id) === String(id));
    if (index !== -1) {
      localStationsStore[index] = { ...localStationsStore[index], ...payload };
      return localStationsStore[index];
    }
  }
};

export const deleteChargingStation = async (id) => {
  try {
    return await apiClient(`/charging-stations/${id}`, {
      method: 'DELETE',
    });
  } catch (err) {
    localStationsStore = localStationsStore.filter(cs => String(cs.id) !== String(id));
    return { success: true };
  }
};
