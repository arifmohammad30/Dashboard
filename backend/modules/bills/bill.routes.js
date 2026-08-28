import express from 'express';
import * as billController from './bill.controller.js';

const router = express.Router();

router.get('/export', billController.exportBillsCsv);
router.get('/:id', billController.getBillById);
router.get('/', billController.getBills);

export default router;
