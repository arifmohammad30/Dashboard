import * as billService from './bill.service.js';

export async function getBills(req, res) {
  try {
    const result = await billService.getBillsFromDb(req.query);
    return res.json(result);
  } catch (error) {
    console.error("Failed to fetch bills:", error);
    return res.status(500).json({ error: "Failed to fetch bills", details: error.message });
  }
}

export async function getBillById(req, res) {
  try {
    const { id } = req.params;
    const bill = await billService.getBillByIdFromDb(id);
    if (!bill) {
      return res.status(404).json({ error: "Bill not found" });
    }
    return res.json(bill);
  } catch (error) {
    console.error("Failed to fetch bill by ID:", error);
    return res.status(500).json({ error: "Failed to fetch bill", details: error.message });
  }
}

export async function exportBillsCsv(req, res) {
  try {
    await billService.streamBillsCsv(res, req.query);
  } catch (error) {
    console.error("Failed to export bills CSV:", error);
    if (!res.headersSent) {
      return res.status(500).json({ error: "Failed to export bills CSV" });
    }
  }
}
