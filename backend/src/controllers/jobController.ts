import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { recordAuditEvent, requestAuditMeta } from '../utils/audit';
import { cacheGetOrSet, invalidateCacheByPrefix, makeCacheKey } from '../utils/cache';
import { presentResume } from '../utils/resume';

const toBoolean = (value: any): boolean =>
  value === true || value === 'true' || value === '1';

const boundedPositiveInteger = (value: unknown, fallback: number, maximum: number) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0
    ? Math.min(parsed, maximum)
    : fallback;
};

const JOB_WRITE_FIELDS = new Set([
  'title',
  'description',
  'requirements',
  'benefits',
  'location',
  'salaryMin',
  'salaryMax',
  'employmentType',
  'jobType',
  'remote',
  'tags',
  'applicationDeadline',
  'published',
]);

const hasOwn = (value: Record<string, unknown>, key: string) =>
  Object.prototype.hasOwnProperty.call(value, key);

const parseBooleanInput = (value: unknown): boolean | undefined => {
  if (value === true || value === 'true' || value === '1') return true;
  if (value === false || value === 'false' || value === '0') return false;
  return undefined;
};

const parseNullableInteger = (value: unknown): number | null | undefined => {
  if (value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
};

const parseNullableDate = (value: unknown): Date | null | undefined => {
  if (value === null || value === '') return null;
  if (typeof value !== 'string') return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const parseTags = (value: unknown): string[] | undefined => {
  const values = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : null;

  if (!values || values.some((tag) => typeof tag !== 'string')) return undefined;
  return values.map((tag) => tag.trim()).filter(Boolean);
};

const getWritePayload = (body: unknown): Record<string, unknown> | null => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  return body as Record<string, unknown>;
};

const recordJobEvent = (
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
    resourceType: 'job',
    resourceId: resourceId ? resourceId.slice(0, 128) : null,
    meta: { ...requestAuditMeta(req), ...meta, result },
  });
};

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

    const pageNumber = boundedPositiveInteger(page, 1, 1_000_000);
    const pageSize = boundedPositiveInteger(limit, 20, 100);
    const skip = (pageNumber - 1) * pageSize;

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
          recordJobEvent(req, 'job.list', null, 'denied', {
            reason: 'employer_profile_required',
          });
          return res.status(403).json({ error: 'Employer profile not found' });
        }
      } else {
        // Public job listing - only show published jobs
        where.published = true;
        where.employer = { verified: true, user: { isVerified: true } };
      }
    } else {
      // For non-employers, only show published jobs
      where.published = true;
      where.employer = { verified: true, user: { isVerified: true } };
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

    const loadJobs = async () => {
      const [jobs, total] = await Promise.all([
        prisma.job.findMany({
          where,
          include: {
            employer: {
              include: {
                user: {
                  select: {
                    isVerified: true,
                  },
                },
              },
            },
            _count: {
              select: { applications: true },
            },
          },
          skip,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.job.count({ where }),
      ]);

      const transformedJobs = jobs.map((job) => ({
        ...job,
        employer: {
          name: job.employer.name,
          logoUrl: job.employer.logoUrl,
          avatarUrl: null,
        },
      }));

      return {
        jobs: transformedJobs,
        pagination: {
          total,
          page: pageNumber,
          limit: pageSize,
          pages: Math.ceil(total / pageSize),
        },
      };
    };

    const publicCacheable = !toBoolean(mine) && !employerId;
    const cacheKey = makeCacheKey('jobs:list', req.query as Record<string, unknown>);
    const result = publicCacheable
      ? await cacheGetOrSet(cacheKey, 30, loadJobs)
      : { value: await loadJobs(), hit: false };

    res.set('Cache-Control', publicCacheable ? 'public, max-age=15, stale-while-revalidate=60' : 'private, no-store');
    res.set('X-Cache', publicCacheable ? (result.hit ? 'HIT' : 'MISS') : 'BYPASS');
    res.json(result.value);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to load jobs' });
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
                isVerified: true,
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

    const publiclyVisible =
      job.published && job.employer.verified && job.employer.user.isVerified;
    if (!publiclyVisible) {
      const canViewDraft =
        req.user?.role === 'admin' ||
        (req.user?.role === 'employer' && job.employer.userId === req.user.id);

      if (!canViewDraft) {
        recordJobEvent(req, 'job.read', id, 'denied', {
          reason: 'published_approved_employer_or_ownership_required',
        });
        return res.status(404).json({ error: 'Job not found' });
      }

      res.set('Cache-Control', 'private, no-store');
    }

    // Increment view count
    if (publiclyVisible) {
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
        avatarUrl: null,
      },
    };

    res.json(transformedJob);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to load job' });
  }
};

export const createJob = async (req: AuthRequest, res: Response) => {
  try {
    const payload = getWritePayload(req.body);
    if (!payload) {
      return res.status(400).json({ error: 'Invalid job payload' });
    }

    const unsupportedFields = Object.keys(payload).filter((field) => !JOB_WRITE_FIELDS.has(field));
    if (unsupportedFields.length > 0) {
      return res.status(400).json({ error: 'Unsupported job fields', fields: unsupportedFields });
    }

    const title = typeof payload.title === 'string' ? payload.title.trim() : '';
    const description = typeof payload.description === 'string' ? payload.description.trim() : '';
    const requirements = typeof payload.requirements === 'string' ? payload.requirements.trim() : '';
    const location = typeof payload.location === 'string' ? payload.location.trim() : '';
    const employmentTypeRaw = payload.employmentType ?? payload.jobType ?? 'Full-time';
    const employmentType = typeof employmentTypeRaw === 'string' ? employmentTypeRaw.trim() : '';

    if (!title || !description || !requirements || !location || !employmentType) {
      return res.status(400).json({
        error: 'title, description, requirements, location and employmentType are required',
      });
    }

    if (
      hasOwn(payload, 'benefits') &&
      payload.benefits !== null &&
      typeof payload.benefits !== 'string'
    ) {
      return res.status(400).json({ error: 'benefits must be a string or null' });
    }

    const salaryMin = parseNullableInteger(payload.salaryMin ?? null);
    const salaryMax = parseNullableInteger(payload.salaryMax ?? null);
    if (salaryMin === undefined || salaryMax === undefined) {
      return res.status(400).json({ error: 'Salary values must be non-negative integers' });
    }
    if (salaryMin !== null && salaryMax !== null && salaryMin > salaryMax) {
      return res.status(400).json({ error: 'salaryMin cannot be greater than salaryMax' });
    }

    const remoteFlag = hasOwn(payload, 'remote') ? parseBooleanInput(payload.remote) : false;
    const publishFlag = hasOwn(payload, 'published') ? parseBooleanInput(payload.published) : false;
    if (remoteFlag === undefined || publishFlag === undefined) {
      return res.status(400).json({ error: 'remote and published must be boolean values' });
    }

    const tags = hasOwn(payload, 'tags') ? parseTags(payload.tags) : [];
    if (!tags) {
      return res.status(400).json({ error: 'tags must be a string or an array of strings' });
    }

    const applicationDeadline = hasOwn(payload, 'applicationDeadline')
      ? parseNullableDate(payload.applicationDeadline)
      : null;
    if (applicationDeadline === undefined) {
      return res.status(400).json({ error: 'applicationDeadline must be a valid date' });
    }

    const employer = await prisma.employer.findUnique({
      where: { userId: req.user!.id },
      select: {
        id: true,
        verified: true,
        user: { select: { isVerified: true } },
      },
    });

    if (!employer) {
      recordJobEvent(req, 'job.create', null, 'denied', {
        reason: 'employer_profile_required',
      });
      return res.status(403).json({ error: 'Employer profile required' });
    }
    if (!employer.user.isVerified || !employer.verified) {
      recordJobEvent(req, 'job.create', null, 'denied', {
        reason: 'verified_approved_employer_required',
      });
      return res.status(403).json({ error: 'Verified and approved employer account required' });
    }

    const job = await prisma.job.create({
      data: {
        title,
        description,
        requirements,
        benefits: typeof payload.benefits === 'string' ? payload.benefits.trim() || null : null,
        employerId: employer.id,
        location,
        salaryMin,
        salaryMax,
        employmentType,
        remote: remoteFlag,
        tags,
        published: publishFlag,
        applicationDeadline,
      },
      include: {
        employer: true,
      },
    });

    void invalidateCacheByPrefix(['jobs:list', 'public:stats']);
    recordJobEvent(req, 'job.create', job.id, 'success', {
      published: job.published,
    });
    if (job.published) {
      recordJobEvent(req, 'job.publish', job.id, 'success', { source: 'create' });
    }
    res.status(201).json(job);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create job' });
  }
};

export const updateJob = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const payload = getWritePayload(req.body);
    if (!payload) {
      return res.status(400).json({ error: 'Invalid job payload' });
    }

    const unsupportedFields = Object.keys(payload).filter((field) => !JOB_WRITE_FIELDS.has(field));
    if (unsupportedFields.length > 0) {
      return res.status(400).json({ error: 'Unsupported job fields', fields: unsupportedFields });
    }

    // Check ownership
    const job = await prisma.job.findUnique({
      where: { id },
      include: { employer: true },
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.employer.userId !== req.user!.id) {
      recordJobEvent(req, 'job.update', id, 'denied', {
        reason: 'job_ownership_required',
      });
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (!job.employer.verified) {
      recordJobEvent(req, 'job.update', id, 'denied', {
        reason: 'employer_approval_required',
      });
      return res.status(403).json({ error: 'Employer approval required' });
    }

    const updateData: Record<string, unknown> = {};
    for (const field of ['title', 'description', 'requirements', 'location', 'employmentType'] as const) {
      if (!hasOwn(payload, field)) continue;
      const value = typeof payload[field] === 'string' ? payload[field].trim() : '';
      if (!value) {
        return res.status(400).json({ error: `${field} must be a non-empty string` });
      }
      updateData[field] = value;
    }

    if (hasOwn(payload, 'jobType') && !hasOwn(payload, 'employmentType')) {
      const value = typeof payload.jobType === 'string' ? payload.jobType.trim() : '';
      if (!value) return res.status(400).json({ error: 'jobType must be a non-empty string' });
      updateData.employmentType = value;
    }

    if (hasOwn(payload, 'benefits')) {
      if (payload.benefits !== null && typeof payload.benefits !== 'string') {
        return res.status(400).json({ error: 'benefits must be a string or null' });
      }
      updateData.benefits = typeof payload.benefits === 'string' ? payload.benefits.trim() || null : null;
    }

    for (const field of ['salaryMin', 'salaryMax'] as const) {
      if (!hasOwn(payload, field)) continue;
      const parsed = parseNullableInteger(payload[field]);
      if (parsed === undefined) {
        return res.status(400).json({ error: `${field} must be a non-negative integer or null` });
      }
      updateData[field] = parsed;
    }

    const nextSalaryMin = hasOwn(updateData, 'salaryMin') ? updateData.salaryMin : job.salaryMin;
    const nextSalaryMax = hasOwn(updateData, 'salaryMax') ? updateData.salaryMax : job.salaryMax;
    if (
      typeof nextSalaryMin === 'number' &&
      typeof nextSalaryMax === 'number' &&
      nextSalaryMin > nextSalaryMax
    ) {
      return res.status(400).json({ error: 'salaryMin cannot be greater than salaryMax' });
    }

    for (const field of ['remote', 'published'] as const) {
      if (!hasOwn(payload, field)) continue;
      const parsed = parseBooleanInput(payload[field]);
      if (parsed === undefined) {
        return res.status(400).json({ error: `${field} must be a boolean value` });
      }
      updateData[field] = parsed;
    }

    if (hasOwn(payload, 'tags')) {
      const parsed = parseTags(payload.tags);
      if (!parsed) return res.status(400).json({ error: 'tags must be a string or an array of strings' });
      updateData.tags = parsed;
    }

    if (hasOwn(payload, 'applicationDeadline')) {
      const parsed = parseNullableDate(payload.applicationDeadline);
      if (parsed === undefined) {
        return res.status(400).json({ error: 'applicationDeadline must be a valid date or null' });
      }
      updateData.applicationDeadline = parsed;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No supported job fields supplied' });
    }

    const updated = await prisma.job.update({
      where: { id },
      data: updateData,
    });

    void invalidateCacheByPrefix(['jobs:list', 'public:stats']);
    recordJobEvent(req, 'job.update', updated.id, 'success', {
      fields: Object.keys(updateData),
    });
    if (!job.published && updated.published) {
      recordJobEvent(req, 'job.publish', updated.id, 'success', { source: 'update' });
    } else if (job.published && !updated.published) {
      recordJobEvent(req, 'job.unpublish', updated.id, 'success', { source: 'update' });
    }
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update job' });
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
      recordJobEvent(req, 'job.delete', id, 'denied', {
        reason: 'job_ownership_required',
      });
      return res.status(403).json({ error: 'Not authorized' });
    }

    await prisma.job.delete({ where: { id } });

    void invalidateCacheByPrefix(['jobs:list', 'public:stats']);
    recordJobEvent(req, 'job.delete', id, 'success');
    res.json({ message: 'Job deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete job' });
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
      recordJobEvent(req, 'job.publish', id, 'denied', {
        reason: 'job_ownership_required',
      });
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Ensure employer is verified before publishing
    const employerRecord = await prisma.employer.findUnique({ where: { id: job.employerId } });
    if (!employerRecord?.verified) {
      recordJobEvent(req, 'job.publish', id, 'denied', {
        reason: 'employer_approval_required',
      });
      return res.status(403).json({ error: 'Employer must be verified to publish jobs' });
    }

    const updated = await prisma.job.update({
      where: { id },
      data: { published: true },
    });

    void invalidateCacheByPrefix(['jobs:list', 'public:stats']);
    recordJobEvent(req, 'job.publish', updated.id, 'success', { source: 'publish_endpoint' });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to change job publication' });
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
      recordJobEvent(req, 'job.applicants.read', id, 'denied', {
        reason: 'job_ownership_required',
      });
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

    res.json(
      applications.map((application) => ({
        ...application,
        resume: application.resume ? presentResume(application.resume) : null,
      })),
    );
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to load job applicants' });
  }
};
