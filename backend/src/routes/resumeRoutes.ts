import { Router } from 'express';
import * as resumeController from '../controllers/resumeController';
import { authenticate } from '../middleware/auth';
import { uploadToS3 } from '../config/aws';

const router = Router();

router.post('/upload', authenticate, uploadToS3.single('resume'), resumeController.uploadResume);
router.post('/presign', authenticate, resumeController.getPresignedUrl);
router.get('/users/:id', authenticate, resumeController.getUserResumes);
router.delete('/:id', authenticate, resumeController.deleteResume);

export default router;
