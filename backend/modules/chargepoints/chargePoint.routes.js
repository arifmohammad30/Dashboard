import express from 'express';
import * as chargePointController from './chargePoints.controller.js';

const router = express.Router();

router.get('/filters', chargePointController.getFilters);
router.get('/export', chargePointController.exportChargePointsCsv);

router.get('/', chargePointController.getChargePoints);
router.post('/', chargePointController.createChargePoint);

router.get('/:id/stats', chargePointController.getChargePointStats);
router.post('/:id/connectors', chargePointController.addConnector);
router.put('/:id/connectors/:connectorId', chargePointController.updateChargePointConnector);

router.post('/:id/connectors/:connectorId/start', chargePointController.remoteStartConnector);
router.post('/:id/connectors/:connectorId/stop', chargePointController.remoteStopConnector);
router.get('/:id/connectors/:connectorId/status', chargePointController.getConnectorStatus);
router.put('/:id/tariff', chargePointController.assignChargePointTariff);

router.get('/:id', chargePointController.getChargePointById);
router.put('/:id', chargePointController.updateChargePoint);
router.delete('/:id', chargePointController.deleteChargePoint);

export default router;
