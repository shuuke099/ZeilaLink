import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { recordAuditEvent, requestAuditMeta } from '../utils/audit';
import { presentResume } from '../utils/resume';

const APPLICATION_STATUSES = ['applied', 'reviewed', 'accepted', 'rejected'] as const;
type ApplicationStatusValue = (typeof APPLICATION_STATUSES)[number];

const recordApplicationEvent = (
  req: AuthRequest,
  action: string,
  resourceId: string | null,
  result: 'success' | 'denied',
  meta: Record<string, unknown> = {},
) => {
  if (result === 'denied') req.authorizationDenialAudited = true;
  recordAuditEvent({
    userId: req.user?.id || null,
    action,
    resourceType: 'application',
    resourceId: resourceId ? resourceId.slice(0, 128) : null,
    meta: { ...requestAuditMeta(req), ...meta, result },
  });
};

export const applyToJob = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { coverLetter, resumeId } = req.body;

    if (coverLetter !== undefined && coverLetter !== null && typeof coverLetter !== 'string') {
      return res.status(400).json({ error: 'coverLetter must be a string' });
    }
    if (typeof coverLetter === 'string' && coverLetter.length > 10000) {
      return res.status(400).json({ error: 'coverLetter is too long' });
    }

    const job = await prisma.job.findFirst({
      where: {
        id,
        published: true,
        employer: { verified: true, user: { isVerified: true } },
      },
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if already applied
    const existing = await prisma.application.findUnique({
      where: {
        jobId_userId: {
          jobId: id,
          userId: req.user!.id,
        },
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'Already applied to this job' });
    }

    let ownedResumeId: string | null = null;
    if (resumeId !== undefined && resumeId !== null) {
      if (typeof resumeId !== 'string' || !resumeId.trim()) {
        return res.status(400).json({ error: 'resumeId must be a non-empty string' });
      }

      const ownedResume = await prisma.resume.findFirst({
        where: {
          id: resumeId.trim(),
          userId: req.user!.id,
        },
        select: { id: true },
      });

      if (!ownedResume) {
        recordApplicationEvent(req, 'application.create', null, 'denied', {
          reason: 'resume_ownership_required',
          jobId: id,
        });
        return res.status(400).json({ error: 'Selected resume is not available' });
      }
      ownedResumeId = ownedResume.id;
    }

    const application = await prisma.application.create({
      data: {
        jobId: id,
        userId: req.user!.id,
        resumeId: ownedResumeId,
        coverLetter: typeof coverLetter === 'string' ? coverLetter.trim() || null : null,
        statusHistory: [
          {
            status: 'applied',
            timestamp: new Date(),
          },
        ],
      },
      include: {
        job: {
          select: {
            title: true,
            employer: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    recordApplicationEvent(req, 'application.create', application.id, 'success', {
      jobId: id,
      resumeAttached: Boolean(ownedResumeId),
    });
    res.status(201).json(application);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to submit application' });
  }
};

export const getUserApplications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.id || req.user!.id;

    if (userId !== req.user!.id && req.user!.role !== 'admin') {
      recordApplicationEvent(req, 'application.list', null, 'denied', {
        reason: 'user_ownership_required',
        targetUserId: userId.slice(0, 128),
      });
      return res.status(403).json({ error: 'Not authorized' });
    }

    const applications = await prisma.application.findMany({
      where: { userId },
      include: {
        job: {
          include: {
            employer: {
              select: {
                name: true,
                logoUrl: true,
              },
            },
          },
        },
        resume: true,
      },
      orderBy: { appliedAt: 'desc' },
    });

    res.json(
      applications.map((application) => ({
        ...application,
        resume: application.resume ? presentResume(application.resume) : null,
      })),
    );
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to load applications' });
  }
};

export const getEmployerApplications = async (req: AuthRequest, res: Response) => {
  try {
    // Get employer for current user
    const employer = await prisma.employer.findUnique({
      where: { userId: req.user!.id },
    });

    if (!employer) {
      recordApplicationEvent(req, 'application.list', null, 'denied', {
        reason: 'employer_profile_required',
      });
      return res.status(403).json({ error: 'Employer profile required' });
    }

    if (!employer.verified) {
      recordApplicationEvent(req, 'application.list', null, 'denied', {
        reason: 'employer_approval_required',
      });
      return res.status(403).json({ error: 'Employer approval required' });
    }

    // Get all jobs for this employer
    const employerJobs = await prisma.job.findMany({
      where: { employerId: employer.id },
      select: { id: true },
    });

    const jobIds = employerJobs.map((job) => job.id);

    // Get all applications for employer's jobs
    const applications = await prisma.application.findMany({
      where: {
        jobId: { in: jobIds },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            location: true,
            avatarUrl: true,
          },
        },
        job: {
          select: {
            id: true,
            title: true,
            employer: {
              select: {
                name: true,
                logoUrl: true,
              },
            },
          },
        },
        resume: true,
      },
      orderBy: { appliedAt: 'desc' },
    });

    res.json({
      applications: applications.map((application) => ({
        ...application,
        resume: application.resume ? presentResume(application.resume) : null,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to load employer applications' });
  }
};

export const updateApplicationStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const rawStatus = typeof req.body?.status === 'string'
      ? req.body.status.trim().toLowerCase()
      : '';

    if (!APPLICATION_STATUSES.includes(rawStatus as ApplicationStatusValue)) {
      return res.status(400).json({
        error: `status must be one of: ${APPLICATION_STATUSES.join(', ')}`,
      });
    }
    const status = rawStatus as ApplicationStatusValue;

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        job: {
          include: { employer: true },
        },
      },
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Only employer or admin can update status
    if (
      application.job.employer.userId !== req.user!.id &&
      req.user!.role !== 'admin'
    ) {
      recordApplicationEvent(req, 'application.status.update', id, 'denied', {
        reason: 'employer_ownership_required',
      });
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (req.user!.role !== 'admin' && !application.job.employer.verified) {
      recordApplicationEvent(req, 'application.status.update', id, 'denied', {
        reason: 'employer_approval_required',
      });
      return res.status(403).json({ error: 'Employer approval required' });
    }

    const statusHistory: any = Array.isArray(application.statusHistory)
      ? application.statusHistory
      : [];

    statusHistory.push({
      status,
      timestamp: new Date(),
    });

    const updated = await prisma.application.update({
      where: { id },
      data: {
        status,
        statusHistory,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        job: {
          select: {
            title: true,
          },
        },
      },
    });

    recordApplicationEvent(req, 'application.status.update', updated.id, 'success', {
      previousStatus: application.status,
      newStatus: updated.status,
    });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update application status' });
  }
};
