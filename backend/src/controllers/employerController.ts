import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';

const ensureEmployerProfile = async (userId: string) => {
  let employer = await prisma.employer.findUnique({
    where: { userId },
  });

  if (!employer) {
    const userRecord = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });

    employer = await prisma.employer.create({
      data: {
        userId,
        name: userRecord?.name?.trim() || userRecord?.email || 'My company',
        verified: false,
      },
    });
  }

  return employer;
};

export const getMyDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const employer = await ensureEmployerProfile(req.user!.id);

    const [jobs, applications] = await Promise.all([
      prisma.job.findMany({
        where: { employerId: employer.id },
        include: {
          _count: { select: { applications: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
      prisma.application.findMany({
        where: {
          job: { employerId: employer.id },
        },
        select: { status: true },
      }),
    ]);

    const activeJobs = jobs.filter((job) => job.published).length;
    const totalApplicants = applications.length;
    const interviewsScheduled = applications.filter(
      (application) => application.status === 'reviewed',
    ).length;

    const recentJobs = jobs.map((job) => ({
      id: job.id,
      title: job.title,
      published: job.published,
      applicants: job._count.applications,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    }));

    res.json({
      activeJobs,
      totalApplicants,
      interviewsScheduled,
      recentJobs,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getMyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const employer = await ensureEmployerProfile(req.user!.id);

    res.json({
      id: employer.id,
      name: employer.name,
      logoUrl: employer.logoUrl,
      bannerUrl: employer.bannerUrl,
      description: employer.description,
      website: employer.website,
      address: employer.address,
      verified: employer.verified,
      createdAt: employer.createdAt,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateMyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const employer = await ensureEmployerProfile(req.user!.id);
    const { name, logoUrl, bannerUrl, description, website, address } = req.body;

    const updated = await prisma.employer.update({
      where: { id: employer.id },
      data: {
        ...(name !== undefined && { name }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(bannerUrl !== undefined && { bannerUrl }),
        ...(description !== undefined && { description }),
        ...(website !== undefined && { website }),
        ...(address !== undefined && { address }),
      },
    });

    if (name !== undefined) {
      await prisma.user.update({
        where: { id: req.user!.id },
        data: { name },
      });
    }

    res.json({
      message: 'Employer profile updated successfully.',
      profile: {
        id: updated.id,
        name: updated.name,
        logoUrl: updated.logoUrl,
        bannerUrl: updated.bannerUrl,
        description: updated.description,
        website: updated.website,
        address: updated.address,
        verified: updated.verified,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
