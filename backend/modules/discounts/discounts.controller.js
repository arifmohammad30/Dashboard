import * as discountService from './discounts.service.js';

export async function getDiscounts(req, res) {
  try {
    const { search, page, limit, filters } = req.query;
    const result = await discountService.getAllDiscountsFromDb(search, page, limit, filters);
    res.json(result);
  } catch (err) {
    console.error('Error fetching discounts:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch discounts' });
  }
}

export async function getDiscountById(req, res) {
  try {
    const { id } = req.params;
    const discount = await discountService.getDiscountByIdFromDb(id);
    res.json(discount);
  } catch (err) {
    console.error('Error fetching discount by ID:', err);
    res.status(404).json({ error: err.message || 'Discount not found' });
  }
}

export async function createDiscount(req, res) {
  try {
    const newDiscount = await discountService.createDiscountInDb(req.body);
    res.status(201).json(newDiscount);
  } catch (err) {
    console.error('Error creating discount:', err);
    res.status(400).json({ error: err.message || 'Failed to create discount' });
  }
}

export async function updateDiscount(req, res) {
  try {
    const { id } = req.params;
    const updated = await discountService.updateDiscountInDb(id, req.body);
    res.json(updated);
  } catch (err) {
    console.error('Error updating discount:', err);
    res.status(400).json({ error: err.message || 'Failed to update discount' });
  }
}

export async function deleteDiscount(req, res) {
  try {
    const { id } = req.params;
    await discountService.deleteDiscountFromDb(id);
    res.json({ message: 'Discount deleted successfully' });
  } catch (err) {
    console.error('Error deleting discount:', err);
    res.status(400).json({ error: err.message || 'Failed to delete discount' });
  }
}

export async function searchAccessEntities(req, res) {
  try {
    const { category } = req.params;
    const { query } = req.query;
    const results = await discountService.searchAccessEntitiesInDb(category, query);
    res.json(results);
  } catch (err) {
    console.error('Error searching access entities:', err);
    res.status(500).json({ error: err.message || 'Failed to search access entities' });
  }
}
