import { Router } from 'express';
import { authenticate, authorize, requireApprovedOrganization } from '../middleware/auth';
import {
  getMyDashboard,
  getMyProfile,
  updateMyProfile,
} from '../controllers/employerController';

const router = Router();

router.get('/me/dashboard', authenticate, authorize('employer'), requireApprovedOrganization, getMyDashboard);
router.get('/me/profile', authenticate, authorize('employer'), requireApprovedOrganization, getMyProfile);
router.put('/me/profile', authenticate, authorize('employer'), requireApprovedOrganization, updateMyProfile);

export default router;

