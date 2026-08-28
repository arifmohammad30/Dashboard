import * as chargePointService from './chargePoints.service.js';
import { safeIoEmit } from '../../socket.js';

export async function getFilters(req, res) {
    try {
        const filters = await chargePointService.getFilterOptions();
        res.json(filters);
    } catch (error) {
        console.error("Failed to fetch filter options:", error);
        res.status(500).json({ error: "Failed to fetch filter options" });
    }
}

export async function getChargePoints(req, res) {
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
                console.warn("Failed to parse filters in chargePoints:", err);
            }
        }

        const result = await chargePointService.getChargePoints({ page, limit, searchTerm, filters });
        res.json(result);
    } catch (error) {
        console.error("Failed to fetch charge points:", error);
        res.status(500).json({ error: "Failed to fetch charge points", details: error.message });
    }
}

export async function getChargePointById(req, res) {
    try {
        const { id } = req.params;
        const cp = await chargePointService.getChargePointById(id);
        if (!cp) {
            return res.status(404).json({ error: "Charge point not found" });
        }
        res.json(cp);
    } catch (error) {
        console.error("Failed to fetch charge point:", error);
        res.status(500).json({ error: "Failed to fetch charge point", details: error.message });
    }
}

export async function createChargePoint(req, res) {
    try {
        const formattedCp = await chargePointService.createChargePoint(req.body);
        if (req.io) {
            req.io.emit('chargePointAdded', formattedCp);
        }
        res.status(201).json(formattedCp);
    } catch (error) {
        console.error("Failed to create charge point:", error);
        res.status(500).json({ error: "Failed to create charge point", details: error.message });
    }
}

export async function updateChargePoint(req, res) {
    try {
        const { id } = req.params;
        const formattedCp = await chargePointService.updateChargePoint(id, req.body);
        if (req.io) {
            req.io.emit('chargePointUpdated', formattedCp);
        }
        res.json(formattedCp);
    } catch (error) {
        console.error("Failed to update charge point:", error);
        res.status(500).json({ error: "Failed to update charge point", details: error.message });
    }
}

export async function deleteChargePoint(req, res) {
    try {
        const { id } = req.params;
        await chargePointService.deleteChargePoint(id);
        if (req.io) {
            req.io.emit('chargePointDeleted', id);
        }
        res.json({ success: true, message: "Charge point deleted" });
    } catch (error) {
        console.error("Failed to delete charge point:", error);
        res.status(500).json({ error: "Failed to delete charge point", details: error.message });
    }
}

export async function exportChargePointsCsv(req, res) {
    try {
        await chargePointService.streamChargePointsCsv(res, req.query);
    } catch (error) {
        console.error("Failed to export charge points CSV:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: "Failed to export charge points CSV" });
        }
    }
}

export async function getChargePointStats(req, res) {
  try {
    const { id } = req.params;
    const timeRange = req.query.timeRange || 'Today';
    const stats = await chargePointService.getChargePointStatsFromDb(id, timeRange);
    res.json(stats);
  } catch (error) {
    console.error("Failed to fetch charge point stats:", error);
    res.status(500).json({ error: "Failed to fetch charge point stats", details: error.message });
  }
}
export async function updateChargePointConnector(req, res) {
  try {
    const { id, connectorId } = req.params;
    const result = await chargePointService.updateChargePointConnectorInDb(id, connectorId, req.body);
    if (req.io) {
      safeIoEmit(req.io, 'chargePointUpdated', result.chargePoint);
    }
    res.json(result);
  } catch (error) {
    console.error("Failed to update connector:", error);
    res.status(500).json({ error: "Failed to update connector", details: error.message });
  }
}

export async function addConnector(req, res) {
  try {
    const { id } = req.params;
    const result = await chargePointService.addConnectorToDb(id, req.body);
    if (req.io) {
      safeIoEmit(req.io, 'chargePointUpdated', result.chargePoint);
    }
    res.status(201).json(result);
  } catch (error) {
    console.error("Failed to add connector:", error);
    res.status(500).json({ error: "Failed to add connector", details: error.message });
  }
}


export async function assignChargePointTariff(req, res) {
  try {
    const { id } = req.params;
    const { tariffId } = req.body;
    const updatedCp = await chargePointService.assignChargePointTariffInDb(id, tariffId);
    if (req.io) {
      safeIoEmit(req.io, 'chargePointUpdated', updatedCp);
    }
    res.json(updatedCp);
  } catch (error) {
    console.error("Failed to assign tariff:", error);
    res.status(500).json({ error: "Failed to assign tariff", details: error.message });
  }
}

export async function remoteStartConnector(req, res) {
  try {
    const { id, connectorId } = req.params;
    const result = await chargePointService.remoteStartConnectorTransaction(id, connectorId || req.body.connectorId, req.io);
    res.json(result);
  } catch (error) {
    console.error("Failed to remote start transaction:", error);
    res.status(500).json({ error: "Failed to remote start transaction", details: error.message });
  }
}

export async function getConnectorStatus(req, res) {
  try {
    const { id, connectorId } = req.params;
    const statusInfo = await chargePointService.getConnectorStatusFromDb(id, connectorId);
    res.json(statusInfo);
  } catch (error) {
    console.error("Failed to fetch connector status:", error);
    res.status(500).json({ error: "Failed to fetch connector status", details: error.message });
  }
}

export async function remoteStopConnector(req, res) {
  try {
    const { id, connectorId } = req.params;
    const result = await chargePointService.remoteStopConnectorTransaction(id, connectorId || req.body.connectorId, req.io);
    res.json(result);
  } catch (error) {
    console.error("Failed to remote stop transaction:", error);
    res.status(500).json({ error: "Failed to remote stop transaction", details: error.message });
  }
}

