import express from 'express';
import * as chargePointController from './chargePoints.controller.js';

const router = express.Router();

router.get('/filters', chargePointController.getFilters);
router.get('/export', chargePointController.exportChargePointsCsv);

router.get('/', chargePointController.getChargePoints);
router.post('/', chargePointController.createChargePoint);

router.get('/:id', chargePointController.getChargePointById);
router.put('/:id', chargePointController.updateChargePoint);
router.delete('/:id', chargePointController.deleteChargePoint);

export default router;
