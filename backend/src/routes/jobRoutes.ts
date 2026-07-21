import { NextFunction, Response, Router } from 'express';
import * as jobController from '../controllers/jobController';
import prisma from '../config/database';
import { AuthRequest, authenticate, authorize, optionalAuthenticate } from '../middleware/auth';

const router = Router();

const requireApprovedEmployer = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const employer = await prisma.employer.findUnique({
      where: { userId: req.user.id },
      select: {
        verified: true,
        user: { select: { isVerified: true } },
      },
    });

    if (!employer) {
      return res.status(403).json({ error: 'Employer profile required' });
    }
    if (!employer.user.isVerified) {
      return res.status(403).json({ error: 'Email verification required' });
    }
    if (!employer.verified) {
      return res.status(403).json({ error: 'Employer approval required' });
    }

    return next();
  } catch (error) {
    return next(error);
  }
};

router.get('/', optionalAuthenticate, jobController.getJobs);
router.get('/:id', optionalAuthenticate, jobController.getJobById);
router.post('/', authenticate, authorize('employer'), requireApprovedEmployer, jobController.createJob);
router.put('/:id', authenticate, authorize('employer'), requireApprovedEmployer, jobController.updateJob);
router.delete('/:id', authenticate, authorize('employer'), requireApprovedEmployer, jobController.deleteJob);
router.post('/:id/publish', authenticate, authorize('employer'), requireApprovedEmployer, jobController.publishJob);
router.get('/:id/applicants', authenticate, authorize('employer'), requireApprovedEmployer, jobController.getJobApplicants);

export default router;
