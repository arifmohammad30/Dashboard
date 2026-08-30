import * as tariffService from './tariffs.service.js';

export async function getFilters(req, res) {
  try {
    const filters = await tariffService.getFilterOptions();
    res.json(filters);
  } catch (error) {
    console.error("Error fetching tariff filter options:", error);
    res.status(500).json({ error: "Failed to fetch tariff filter options" });
  }
}

export async function getTariffs(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const searchTerm = req.query.search || '';
    const filters = req.query.filters ? JSON.parse(req.query.filters) : {};

    const result = await tariffService.getTariffs({ page, limit, searchTerm, filters });
    res.json(result);
  } catch (error) {
    console.error("Error fetching tariffs:", error);
    res.status(500).json({ error: "Failed to fetch tariffs" });
  }
}

export async function getTariffById(req, res) {
  try {
    const { id } = req.params;
    const tariff = await tariffService.getTariffById(id);
    if (!tariff) {
      return res.status(404).json({ error: "Tariff not found" });
    }
    res.json(tariff);
  } catch (error) {
    console.error("Error fetching tariff by ID:", error);
    res.status(500).json({ error: "Failed to fetch tariff" });
  }
}

export async function createTariff(req, res) {
  try {
    const newTariff = await tariffService.createTariff(req.body);
    res.status(201).json(newTariff);
  } catch (error) {
    console.error("Error creating tariff:", error);
    const status = error.statusCode || 500;
    res.status(status).json({ error: error.message || "Failed to create tariff" });
  }
}

export async function updateTariff(req, res) {
  try {
    const { id } = req.params;
    const updated = await tariffService.updateTariff(id, req.body);
    res.json(updated);
  } catch (error) {
    console.error("Error updating tariff:", error);
    const status = error.statusCode || 500;
    res.status(status).json({ error: error.message || "Failed to update tariff" });
  }
}

export async function deleteTariff(req, res) {
  try {
    const { id } = req.params;
    await tariffService.deleteTariff(id);
    res.json({ success: true, message: "Tariff deleted" });
  } catch (error) {
    console.error("Error deleting tariff:", error);
    res.status(500).json({ error: "Failed to delete tariff" });
  }
}

export async function exportTariffsCsv(req, res) {
  try {
    await tariffService.streamTariffsCsv(res, req.query);
  } catch (error) {
    console.error("Error exporting tariffs CSV:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to export tariffs CSV" });
    }
  }
}

