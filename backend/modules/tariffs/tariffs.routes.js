import express from 'express';
import * as tariffController from './tariffs.controller.js';

const router = express.Router();

router.get('/export', tariffController.exportTariffsCsv);
router.get('/', tariffController.getTariffs);
router.post('/', tariffController.createTariff);
router.delete('/:id', tariffController.deleteTariff);

export default router;
