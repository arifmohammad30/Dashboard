import express from 'express';
import * as chargeStationController from './chargeStation.controller.js';

const router = express.Router();

router.get('/filters', chargeStationController.getFilters);
router.get('/export', chargeStationController.exportChargingStationsCsv);
router.get('/', chargeStationController.getChargingStations);
router.post('/', chargeStationController.createChargingStation);

router.get('/:id', chargeStationController.getChargingStationById);
router.put('/:id', chargeStationController.updateChargingStation);
router.delete('/:id', chargeStationController.deleteChargingStation);

export default router;
