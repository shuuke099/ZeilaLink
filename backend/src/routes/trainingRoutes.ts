import { NextFunction, Response, Router } from 'express';
import * as trainingController from '../controllers/trainingController';
import prisma from '../config/database';
import { AuthRequest, authenticate, authorize, optionalAuthenticate } from '../middleware/auth';

const router = Router();

const requireApprovedProvider = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const provider = await prisma.provider.findUnique({
      where: { contactUserId: req.user.id },
      select: {
        verified: true,
        user: { select: { isVerified: true } },
      },
    });

    if (!provider) {
      return res.status(403).json({ error: 'Provider profile required' });
    }
    if (!provider.user.isVerified) {
      return res.status(403).json({ error: 'Email verification required' });
    }
    if (!provider.verified) {
      return res.status(403).json({ error: 'Provider approval required' });
    }

    return next();
  } catch (error) {
    return next(error);
  }
};

router.get('/', optionalAuthenticate, trainingController.getTrainings);
router.get('/provider/enrollments', authenticate, authorize('provider'), requireApprovedProvider, trainingController.getProviderEnrollments);
router.get('/:id', optionalAuthenticate, trainingController.getTrainingById);
router.post('/', authenticate, authorize('provider'), requireApprovedProvider, trainingController.createTraining);
router.put('/:id', authenticate, authorize('provider'), requireApprovedProvider, trainingController.updateTraining);
router.delete('/:id', authenticate, authorize('provider'), requireApprovedProvider, trainingController.deleteTraining);
router.post('/:id/enroll', authenticate, authorize('worker'), trainingController.enrollInTraining);
router.post('/:id/issue-certificate', authenticate, authorize('provider'), requireApprovedProvider, trainingController.issueCertificate);

export default router;
