import * as tariffService from './tariffs.service.js';

export async function getTariffs(req, res) {
  try {
    const formatted = await tariffService.getTariffs();
    res.json(formatted);
  } catch (error) {
    console.error("Error fetching tariffs:", error);
    res.status(500).json({ error: "Failed to fetch tariffs" });
  }
}

export async function createTariff(req, res) {
  try {
    const newTariff = await tariffService.createTariff(req.body);
    res.status(201).json(newTariff);
  } catch (error) {
    console.error("Error creating tariff:", error);
    res.status(500).json({ error: "Failed to create tariff" });
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

