import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { recordAuditEvent, requestAuditMeta } from '../utils/audit';
import { invalidateCacheByPrefix } from '../utils/cache';

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

const safeOptionalUrl = (value: unknown): string | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  if (typeof value !== 'string' || value.length > 2048) return undefined;
  const trimmed = value.trim();
  if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.includes('\\')) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' ? parsed.toString() : undefined;
  } catch {
    return undefined;
  }
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
    res.status(500).json({ error: 'Failed to load employer dashboard' });
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
    res.status(500).json({ error: 'Failed to load employer profile' });
  }
};

export const updateMyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const employer = await ensureEmployerProfile(req.user!.id);
    const { name, logoUrl, bannerUrl, description, website, address } = req.body;

    const normalizedName = typeof name === 'string' ? name.trim() : undefined;
    if (name !== undefined && (!normalizedName || normalizedName.length > 200)) {
      return res.status(400).json({ error: 'Company name must contain 1 to 200 characters' });
    }
    for (const [label, value, maximum] of [
      ['description', description, 5000],
      ['address', address, 500],
    ] as const) {
      if (value !== undefined && value !== null && (typeof value !== 'string' || value.length > maximum)) {
        return res.status(400).json({ error: `Invalid ${label}` });
      }
    }
    const normalizedLogo = safeOptionalUrl(logoUrl);
    const normalizedBanner = safeOptionalUrl(bannerUrl);
    const normalizedWebsite = safeOptionalUrl(website);
    const normalizedDescription =
      typeof description === 'string' ? description.trim() || null : null;
    const normalizedAddress = typeof address === 'string' ? address.trim() || null : null;
    if (
      (logoUrl !== undefined && normalizedLogo === undefined) ||
      (bannerUrl !== undefined && normalizedBanner === undefined) ||
      (website !== undefined && normalizedWebsite === undefined)
    ) {
      return res.status(400).json({ error: 'URLs must be HTTPS or safe local paths' });
    }

    const changedIdentityFields = [
      ...(name !== undefined && employer.name !== normalizedName ? ['name'] : []),
      ...(logoUrl !== undefined && employer.logoUrl !== normalizedLogo ? ['logoUrl'] : []),
      ...(bannerUrl !== undefined && employer.bannerUrl !== normalizedBanner ? ['bannerUrl'] : []),
      ...(description !== undefined && employer.description !== normalizedDescription
        ? ['description']
        : []),
      ...(website !== undefined && employer.website !== normalizedWebsite ? ['website'] : []),
      ...(address !== undefined && employer.address !== normalizedAddress ? ['address'] : []),
    ];
    const verificationReset = employer.verified && changedIdentityFields.length > 0;

    const updated = await prisma.$transaction(async (transaction) => {
      const profile = await transaction.employer.update({
        where: { id: employer.id },
        data: {
          ...(name !== undefined && { name: normalizedName }),
          ...(logoUrl !== undefined && { logoUrl: normalizedLogo }),
          ...(bannerUrl !== undefined && { bannerUrl: normalizedBanner }),
          ...(description !== undefined && { description: normalizedDescription }),
          ...(website !== undefined && { website: normalizedWebsite }),
          ...(address !== undefined && { address: normalizedAddress }),
          ...(changedIdentityFields.length > 0 && { verified: false }),
        },
      });

      if (name !== undefined) {
        await transaction.user.update({
          where: { id: req.user!.id },
          data: { name: normalizedName! },
        });
      }

      return profile;
    });

    if (changedIdentityFields.length > 0) {
      await invalidateCacheByPrefix(['jobs:list', 'public:stats']);
    }

    if (verificationReset) {
      recordAuditEvent({
        userId: req.user!.id,
        action: 'employer.verification_reset',
        resourceType: 'employer',
        resourceId: updated.id,
        meta: {
          ...requestAuditMeta(req),
          result: 'success',
          reason: 'approved_identity_changed',
          changedFields: changedIdentityFields,
        },
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
    res.status(500).json({ error: 'Failed to update employer profile' });
  }
};
