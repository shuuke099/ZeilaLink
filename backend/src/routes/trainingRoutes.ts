import { Router } from 'express';
import * as trainingController from '../controllers/trainingController';
import { authenticate, authorize, optionalAuthenticate } from '../middleware/auth';

const router = Router();

router.get('/', optionalAuthenticate, trainingController.getTrainings);
router.get('/:id', optionalAuthenticate, trainingController.getTrainingById);
router.post('/', authenticate, authorize('provider'), trainingController.createTraining);
router.put('/:id', authenticate, authorize('provider'), trainingController.updateTraining);
router.delete('/:id', authenticate, authorize('provider'), trainingController.deleteTraining);
// Allow any authenticated user to enroll (not just workers)
router.post('/:id/enroll', authenticate, trainingController.enrollInTraining);
router.post('/:id/complete', authenticate, trainingController.completeTraining);
router.get('/provider/enrollments', authenticate, authorize('provider'), trainingController.getProviderEnrollments);
router.post('/:id/issue-certificate', authenticate, authorize('provider'), trainingController.issueCertificate);

export default router;
