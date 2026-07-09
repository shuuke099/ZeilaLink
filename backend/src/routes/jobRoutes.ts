import { Router } from 'express';
import * as jobController from '../controllers/jobController';
import { authenticate, authorize, optionalAuthenticate } from '../middleware/auth';

const router = Router();

router.get('/', optionalAuthenticate, jobController.getJobs);
router.get('/:id', optionalAuthenticate, jobController.getJobById);
router.post('/', authenticate, authorize('employer'), jobController.createJob);
router.put('/:id', authenticate, authorize('employer'), jobController.updateJob);
router.delete('/:id', authenticate, authorize('employer'), jobController.deleteJob);
router.post('/:id/publish', authenticate, authorize('employer'), jobController.publishJob);
router.get('/:id/applicants', authenticate, authorize('employer'), jobController.getJobApplicants);

export default router;
