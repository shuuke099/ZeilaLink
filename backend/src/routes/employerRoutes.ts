import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getMyDashboard,
  getMyProfile,
  updateMyProfile,
} from '../controllers/employerController';

const router = Router();

router.get('/me/dashboard', authenticate, authorize('employer', 'admin'), getMyDashboard);
router.get('/me/profile', authenticate, authorize('employer', 'admin'), getMyProfile);
router.put('/me/profile', authenticate, authorize('employer'), updateMyProfile);

export default router;

