import express from 'express';
import {
  getFilters,
  getTeamMembers,
  getTeamMemberById,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember
} from './team.controller.js';

const router = express.Router();

router.get('/filters', getFilters);
router.get(['/', '/members'], getTeamMembers);
router.post(['/', '/members'], createTeamMember);
router.get(['/:id', '/members/:id'], getTeamMemberById);
router.put(['/:id', '/members/:id'], updateTeamMember);
router.delete(['/:id', '/members/:id'], deleteTeamMember);

export default router;
