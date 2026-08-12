import express from 'express';
import * as sessionController from './session.controller.js';

const router = express.Router();

router.get('/export', sessionController.exportSessionHistoryCsv);
router.get('/logs/export', sessionController.exportLogsCsv);
router.get('/', sessionController.getLiveSessions);

export default router;
