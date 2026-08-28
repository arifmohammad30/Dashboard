import * as chargeStationService from './chargeStations.service.js';

export async function getChargingStations(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const searchTerm = req.query.search || '';

    let filters = {};
    if (req.query.filters) {
      try {
        const raw = typeof req.query.filters === 'string' && req.query.filters.startsWith('%')
          ? decodeURIComponent(req.query.filters)
          : req.query.filters;
        filters = typeof raw === 'string' ? JSON.parse(raw) : raw;
      } catch (err) {
        console.warn("Failed to parse filters JSON:", err);
      }
    }

    const result = await chargeStationService.getChargingStations({ page, limit, searchTerm, filters });
    res.json(result);
  } catch (error) {
    console.error("Error fetching charging stations:", error);
    res.status(500).json({ error: "Failed to fetch charging stations" });
  }
}

export async function getChargingStationById(req, res) {
  try {
    const { id } = req.params;
    const cs = await chargeStationService.getChargingStationById(id);
    if (!cs) {
      return res.status(404).json({ error: "Charging station not found" });
    }
    res.json(cs);
  } catch (error) {
    console.error("Error fetching charging station by ID:", error);
    res.status(500).json({ error: "Failed to fetch charging station" });
  }
}

export async function createChargingStation(req, res) {
  try {
    const newCs = await chargeStationService.createChargingStation(req.body);
    if (req.io) {
      req.io.emit('chargingStationAdded', newCs);
    }
    res.status(201).json(newCs);
  } catch (error) {
    console.error("Error creating charging station:", error);
    res.status(500).json({ error: "Failed to create charging station" });
  }
}

export async function updateChargingStation(req, res) {
  try {
    const { id } = req.params;
    const updatedCs = await chargeStationService.updateChargingStation(id, req.body);
    if (req.io) {
      req.io.emit('chargingStationUpdated', updatedCs);
    }
    res.json(updatedCs);
  } catch (error) {
    console.error("Error updating charging station:", error);
    res.status(500).json({ error: "Failed to update charging station" });
  }
}

export async function deleteChargingStation(req, res) {
  try {
    const { id } = req.params;
    await chargeStationService.deleteChargingStation(id);
    if (req.io) {
      req.io.emit('chargingStationDeleted', id);
    }
    res.json({ success: true, message: "Charging station deleted" });
  } catch (error) {
    console.error("Error deleting charging station:", error);
    res.status(500).json({ error: "Failed to delete charging station" });
  }
}

export async function exportChargingStationsCsv(req, res) {
  try {
    await chargeStationService.streamChargingStationsCsv(res, req.query);
  } catch (error) {
    console.error("Error exporting charging stations CSV:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to export charging stations CSV" });
    }
  }
}

