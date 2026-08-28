import {
  getFleetsFromDb,
  getFleetByIdFromDb,
  createFleetInDb,
  updateFleetInDb,
  topUpFleetWalletInDb,
  deleteFleetFromDb
} from './fleet.service.js';

export async function getFleets(req, res) {
  try {
    const { page, limit, search, filters } = req.query;
    let parsedFilters = {};
    if (filters) {
      try {
        parsedFilters = typeof filters === 'string' ? JSON.parse(filters) : filters;
      } catch (e) {
        parsedFilters = {};
      }
    }
    const result = await getFleetsFromDb({ page, limit, search, filters: parsedFilters });
    return res.json(result);
  } catch (error) {
    console.error('Error fetching fleets:', error);
    return res.status(500).json({ message: 'Failed to fetch fleets' });
  }
}

export async function getFleetById(req, res) {
  try {
    const fleet = await getFleetByIdFromDb(req.params.id);
    if (!fleet) return res.status(404).json({ message: 'Fleet not found' });
    return res.json(fleet);
  } catch (error) {
    console.error('Error fetching fleet by ID:', error);
    return res.status(500).json({ message: 'Failed to fetch fleet' });
  }
}

export async function createFleet(req, res) {
  try {
    const newFleet = await createFleetInDb(req.body);
    return res.status(201).json(newFleet);
  } catch (error) {
    console.error('Error creating fleet:', error);
    return res.status(500).json({ message: error.message || 'Failed to create fleet' });
  }
}

export async function updateFleet(req, res) {
  try {
    const updated = await updateFleetInDb(req.params.id, req.body);
    return res.json(updated);
  } catch (error) {
    console.error('Error updating fleet:', error);
    return res.status(500).json({ message: error.message || 'Failed to update fleet' });
  }
}

export async function topUpFleetWallet(req, res) {
  try {
    const { amount } = req.body;
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ message: 'Valid top-up amount is required' });
    }
    const updated = await topUpFleetWalletInDb(req.params.id, amount);
    return res.json(updated);
  } catch (error) {
    console.error('Error topping up fleet wallet:', error);
    return res.status(500).json({ message: error.message || 'Failed to top up wallet' });
  }
}

export async function deleteFleet(req, res) {
  try {
    await deleteFleetFromDb(req.params.id);
    return res.json({ success: true, message: 'Fleet deleted successfully' });
  } catch (error) {
    console.error('Error deleting fleet:', error);
    return res.status(500).json({ message: 'Failed to delete fleet' });
  }
}

export async function exportFleets(req, res) {
  try {
    const { search, filters } = req.query;
    let parsedFilters = {};
    if (filters) {
      try {
        parsedFilters = typeof filters === 'string' ? JSON.parse(filters) : filters;
      } catch (e) {
        parsedFilters = {};
      }
    }
    const { data } = await getFleetsFromDb({ page: 1, limit: 10000, search, filters: parsedFilters });

    let csv = 'Fleet Name,Operator Code,No. of Drivers,Available Wallet Balance,Status,Created On\n';
    data.forEach(f => {
      const name = `"${(f.name || '').replace(/"/g, '""')}"`;
      const code = f.operatorCode || '-';
      const drivers = f.driverCount || 0;
      const bal = (f.availableWalletBalance || 0).toFixed(2);
      const status = f.status || 'Active';
      const created = f.createdAt ? new Date(f.createdAt).toISOString() : '';
      csv += `${name},${code},${drivers},${bal},${status},${created}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=fleets_export_${new Date().toISOString().slice(0, 10)}.csv`);
    return res.status(200).send(csv);
  } catch (error) {
    console.error('Error exporting fleets:', error);
    return res.status(500).json({ message: 'Failed to export fleets' });
  }
}
