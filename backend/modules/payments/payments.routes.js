import { Router } from 'express';
import * as paymentController from './payments.controller.js';

const router = Router();

// GET payment gateway configuration for active provider and environment (?environment=0|1)
router.get('/config', paymentController.getGatewayConfig);
router.get('/gateways/:providerId', paymentController.getGatewayConfig);

// PUT payment gateway configuration
router.put('/config', paymentController.updateGatewayConfig);
router.put('/gateways/:providerId', paymentController.updateGatewayConfig);

// POST live connection diagnostic test
router.post('/test-connection', paymentController.testConnection);
router.post('/gateways/:providerId/test-connection', paymentController.testConnection);

export default router;
