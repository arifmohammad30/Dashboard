import { Router } from 'express';
import * as discountController from './discounts.controller.js';

const router = Router();

router.get('/', discountController.getDiscounts);
router.get('/search-access/:category', discountController.searchAccessEntities);
router.get('/:id', discountController.getDiscountById);
router.post('/', discountController.createDiscount);
router.put('/:id', discountController.updateDiscount);
router.delete('/:id', discountController.deleteDiscount);

export default router;
