import { Router } from 'express';
import {
  getFleets,
  getFleetById,
  createFleet,
  updateFleet,
  topUpFleetWallet,
  deleteFleet,
  exportFleets
} from './fleet.controller.js';

const router = Router();

router.get('/', getFleets);
router.get('/export', exportFleets);
router.get('/:id', getFleetById);
router.post('/', createFleet);
router.put('/:id', updateFleet);
router.post('/:id/topup', topUpFleetWallet);
router.delete('/:id', deleteFleet);

export default router;
