import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const applyToJob = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { coverLetter, resumeId } = req.body;

    const job = await prisma.job.findUnique({
      where: { id },
    });

    if (!job || !job.published) {
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

    const application = await prisma.application.create({
      data: {
        jobId: id,
        userId: req.user!.id,
        resumeId,
        coverLetter,
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

    res.status(201).json(application);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserApplications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.id || req.user!.id;

    if (userId !== req.user!.id && req.user!.role !== 'admin') {
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

    res.json(applications);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getEmployerApplications = async (req: AuthRequest, res: Response) => {
  try {
    // Get employer for current user
    const employer = await prisma.employer.findUnique({
      where: { userId: req.user!.id },
    });

    if (!employer) {
      return res.status(403).json({ error: 'Employer profile required' });
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

    res.json({ applications });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateApplicationStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

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
      return res.status(403).json({ error: 'Not authorized' });
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

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
