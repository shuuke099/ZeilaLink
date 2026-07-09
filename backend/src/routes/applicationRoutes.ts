import { Router } from 'express';
import * as applicationController from '../controllers/applicationController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.post('/jobs/:id/apply', authenticate, authorize('worker'), applicationController.applyToJob);
router.get('/users/:id/applications', authenticate, applicationController.getUserApplications);
router.get('/applications', authenticate, authorize('employer'), applicationController.getEmployerApplications);
router.put('/applications/:id/status', authenticate, authorize('employer', 'admin'), applicationController.updateApplicationStatus);

export default router;
