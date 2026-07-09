import { Router } from 'express';
import * as providerController from '../controllers/providerController';
import * as trainingController from '../controllers/trainingController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, providerController.getProviders);
router.get('/me/profile', authenticate, authorize('provider'), providerController.getMyProvider);
router.get('/me/metrics', authenticate, authorize('provider'), providerController.getMyMetrics);
router.get('/me/enrollments', authenticate, authorize('provider'), trainingController.getProviderEnrollments);
router.post('/', authenticate, authorize('provider'), providerController.createProvider);
router.get('/:id/courses', authenticate, providerController.getProviderCourses);
router.get('/:id', authenticate, providerController.getProviderById);

export default router;
