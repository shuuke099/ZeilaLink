import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';

const toBoolean = (value: any): boolean =>
  value === true || value === 'true' || value === '1';

export const getJobs = async (req: AuthRequest, res: Response) => {
  try {
    const {
      search,
      location,
      employmentType,
      remote,
      minSalary,
      maxSalary,
      tags,
      page = 1,
      limit = 20,
      employerId,
      mine,
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    
    // If employer requests their own jobs (mine=true or employerId matches)
    if (req.user?.role === 'employer') {
      const mineFlag = toBoolean(mine);
      if (mineFlag || employerId) {
        const employer = await prisma.employer.findUnique({
          where: { userId: req.user.id },
        });
        if (employer) {
          where.employerId = employer.id;
          // Show both published and unpublished for own jobs
          // Don't filter by published
        } else {
          return res.status(403).json({ error: 'Employer profile not found' });
        }
      } else {
        // Public job listing - only show published jobs
        where.published = true;
      }
    } else {
      // For non-employers, only show published jobs
      where.published = true;
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (location) {
      where.location = { contains: location as string, mode: 'insensitive' };
    }

    if (employmentType) {
      where.employmentType = employmentType;
    }

    if (remote !== undefined) {
      where.remote = toBoolean(remote);
    }

    if (minSalary) {
      where.salaryMax = { gte: Number(minSalary) };
    }

    if (maxSalary) {
      where.salaryMin = { lte: Number(maxSalary) };
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      where.tags = { hasSome: tagArray };
    }

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: {
          employer: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                  avatarUrl: true,
                },
              },
            },
          },
          _count: {
            select: { applications: true },
          },
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.job.count({ where }),
    ]);

    // Transform jobs to match frontend expectations
    const transformedJobs = jobs.map((job) => ({
      ...job,
      employer: {
        name: job.employer.name,
        logoUrl: job.employer.logoUrl,
        avatarUrl: job.employer.user?.avatarUrl,
      },
    }));

    res.json({
      jobs: transformedJobs,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getJobById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        employer: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        _count: {
          select: { applications: true },
        },
      },
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Increment view count
    if (job.published) {
      await prisma.job.update({
        where: { id },
        data: { viewsCount: { increment: 1 } },
      });
      job.viewsCount += 1;
    }

    // Transform job to match frontend expectations
    const transformedJob = {
      ...job,
      employer: {
        name: job.employer.name,
        logoUrl: job.employer.logoUrl,
        avatarUrl: job.employer.user?.avatarUrl,
      },
    };

    res.json(transformedJob);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createJob = async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      description,
      requirements,
      benefits,
      location,
      salaryMin,
      salaryMax,
      employmentType,
      jobType,
      remote,
      tags,
      applicationDeadline,
      published,
    } = req.body;

    // Get employer
    let employer = await prisma.employer.findUnique({
      where: { userId: req.user!.id },
    });

    if (!employer) {
      const userRecord = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { name: true, email: true },
      });

      employer = await prisma.employer.create({
        data: {
          userId: req.user!.id,
          name: userRecord?.name?.trim() || userRecord?.email || req.user!.email,
          verified: false,
        },
      });

      console.log(
        `[createJob] Auto-created employer profile ${employer.id} for user ${req.user!.id} (${userRecord?.email})`,
      );
    }

    const employmentTypeValue =
      employmentType || jobType || 'Full-time';
    const remoteFlag =
      remote === true || remote === 'true';
    const tagsArray = Array.isArray(tags)
      ? tags
      : typeof tags === 'string'
      ? [tags]
      : [];
    const publishFlag = toBoolean(published);

    const job = await prisma.job.create({
      data: {
        title,
        description,
        requirements,
        benefits,
        employerId: employer.id,
        location,
        salaryMin: salaryMin ? Number(salaryMin) : null,
        salaryMax: salaryMax ? Number(salaryMax) : null,
        employmentType: employmentTypeValue,
        remote: remoteFlag,
        tags: tagsArray,
        published: publishFlag,
        applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : null,
      },
      include: {
        employer: true,
      },
    });

    res.status(201).json(job);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateJob = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check ownership
    const job = await prisma.job.findUnique({
      where: { id },
      include: { employer: true },
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.employer.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updated = await prisma.job.update({
      where: { id },
      data: updateData,
    });

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteJob = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const job = await prisma.job.findUnique({
      where: { id },
      include: { employer: true },
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.employer.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await prisma.job.delete({ where: { id } });

    res.json({ message: 'Job deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const publishJob = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const job = await prisma.job.findUnique({
      where: { id },
      include: { employer: true },
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.employer.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Ensure employer is verified before publishing
    const employerRecord = await prisma.employer.findUnique({ where: { id: job.employerId } });
    if (!employerRecord?.verified) {
      return res.status(403).json({ error: 'Employer must be verified to publish jobs' });
    }

    const updated = await prisma.job.update({
      where: { id },
      data: { published: true },
    });

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getJobApplicants = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const job = await prisma.job.findUnique({
      where: { id },
      include: { employer: true },
    });

    if (!job || job.employer.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const applications = await prisma.application.findMany({
      where: { jobId: id },
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
        resume: true,
      },
      orderBy: { appliedAt: 'desc' },
    });

    res.json(applications);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
