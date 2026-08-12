import * as chargePointService from './chargePoints.service.js';

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
        const filters = req.query.filters ? JSON.parse(req.query.filters) : {};

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

