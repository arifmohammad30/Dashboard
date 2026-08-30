import express from 'express';
import * as tariffController from './tariffs.controller.js';

const router = express.Router();

router.get('/filters', tariffController.getFilters);
router.get('/export', tariffController.exportTariffsCsv);
router.get('/', tariffController.getTariffs);
router.get('/:id', tariffController.getTariffById);
router.post('/', tariffController.createTariff);
router.put('/:id', tariffController.updateTariff);
router.delete('/:id', tariffController.deleteTariff);

export default router;
