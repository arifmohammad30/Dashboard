import express from 'express';
import * as sessionController from './session.controller.js';

const router = express.Router();

router.get('/history', sessionController.getSessionHistory);
router.get('/export', sessionController.exportSessionHistoryCsv);
router.get('/logs/export', sessionController.exportLogsCsv);
router.get('/:id/logs', sessionController.getSessionLogs);
router.get('/:id', sessionController.getSessionById);
router.get('/', sessionController.getLiveSessions);

export default router;
