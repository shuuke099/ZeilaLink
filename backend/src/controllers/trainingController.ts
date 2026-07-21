import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { recordAuditEvent, requestAuditMeta } from '../utils/audit';
import { cacheGetOrSet, invalidateCacheByPrefix, makeCacheKey } from '../utils/cache';
import { normalizeCertificateUrl, presentEnrollment } from '../utils/certificate';

const TRAINING_WRITE_FIELDS = new Set([
  'name',
  'category', // Accepted for backwards compatibility; Training currently has no category column.
  'skillId',
  'duration',
  'cost',
  'description',
  'certificateUrl',
  'imageUrl',
  'providesCertificate',
  'published',
]);

const hasOwn = (value: Record<string, unknown>, key: string) =>
  Object.prototype.hasOwnProperty.call(value, key);

const parseBooleanInput = (value: unknown): boolean | undefined => {
  if (value === true || value === 'true' || value === '1') return true;
  if (value === false || value === 'false' || value === '0') return false;
  return undefined;
};

const getWritePayload = (body: unknown): Record<string, unknown> | null => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  return body as Record<string, unknown>;
};

const boundedPositiveInteger = (value: unknown, fallback: number, maximum: number) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0
    ? Math.min(parsed, maximum)
    : fallback;
};

const recordTrainingEvent = (
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
    resourceType: 'training',
    resourceId: resourceId ? resourceId.slice(0, 128) : null,
    meta: { ...requestAuditMeta(req), ...meta, result },
  });
};

export const getTrainings = async (req: AuthRequest, res: Response) => {
  try {
    const { search, skillId, page = 1, limit = 20, all, mine } = req.query as any;
    // Do NOT destructure providerId so we can resolve it dynamically

    const pageNumber = boundedPositiveInteger(page, 1, 1_000_000);
    const pageSize = boundedPositiveInteger(limit, 20, 100);
    const skip = (pageNumber - 1) * pageSize;

    const where: any = {};
    let requirePublished = true;

    const wantsMine = mine === 'true' || mine === true;
    const wantsAll = all === 'true' || all === true;
    const requestedProviderId =
      typeof (req.query as any).providerId === 'string'
        ? String((req.query as any).providerId).trim() || undefined
        : undefined;
    let effectiveProviderId = requestedProviderId;

    // Providers may see drafts only for the provider identity derived from their token.
    // A caller-supplied providerId must never select another provider's drafts.
    if (req.user?.role === 'provider' && (wantsMine || wantsAll)) {
      const prov = await prisma.provider.findUnique({ where: { contactUserId: req.user.id } });
      if (prov) {
        effectiveProviderId = prov.id;
        requirePublished = false; // Show both published and unpublished for own trainings
      } else {
        // Return empty array if provider profile doesn't exist
        return res.json({
          trainings: [],
          pagination: {
            total: 0,
            page: pageNumber,
            limit: pageSize,
            pages: 0,
          },
        });
      }
    } else if (wantsMine && (!req.user || req.user.role !== 'provider')) {
      // If mine=true but user is not authenticated or not a provider, return empty
      return res.json({
        trainings: [],
        pagination: {
          total: 0,
          page: pageNumber,
          limit: pageSize,
          pages: 0,
        },
      });
    }
    
    // Allow admins to view all trainings (published and unpublished) when all=true
    if (req.user?.role === 'admin' && wantsAll) {
      requirePublished = false;
    }
    
    // For public access (no user), always show only published trainings
    if (requirePublished) {
      where.published = true;
      where.provider = { verified: true, user: { isVerified: true } };
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    // Filter by provider ID if specified (for providers viewing their own trainings)
    if (effectiveProviderId) {
      where.providerId = effectiveProviderId;
    }

    if (skillId) {
      where.skillId = skillId;
    }

    const loadTrainings = async () => {
      const [trainings, total] = await Promise.all([
        prisma.training.findMany({
          where,
          include: {
            provider: {
              include: {
                user: {
                  select: {
                    isVerified: true,
                  },
                },
              },
            },
            skill: true,
            _count: {
              select: { userCertifications: true },
            },
          },
          skip,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.training.count({ where }),
      ]);

      const transformedTrainings = trainings.map((training) => ({
        ...training,
        provider: {
          id: training.provider.id,
          name: training.provider.name,
          logoUrl: training.provider.logoUrl,
          description: training.provider.description,
          rating: training.provider.rating,
          verified: training.provider.verified,
        },
      }));

      return {
        trainings: transformedTrainings,
        pagination: {
          total,
          page: pageNumber,
          limit: pageSize,
          pages: Math.ceil(total / pageSize),
        },
      };
    };

    const publicCacheable = requirePublished && !mine && !all;
    const cacheKey = makeCacheKey('trainings:list', req.query as Record<string, unknown>);
    const result = publicCacheable
      ? await cacheGetOrSet(cacheKey, 30, loadTrainings)
      : { value: await loadTrainings(), hit: false };

    res.set('Cache-Control', publicCacheable ? 'public, max-age=15, stale-while-revalidate=60' : 'private, no-store');
    res.set('X-Cache', publicCacheable ? (result.hit ? 'HIT' : 'MISS') : 'BYPASS');
    res.json(result.value);
  } catch (error: any) {
    console.error('[Trainings] List failed', {
      errorType: typeof error?.name === 'string' ? error.name : 'Error',
      code: typeof error?.code === 'string' ? error.code : undefined,
    });
    res.status(500).json({ error: 'Failed to load trainings' });
  }
};

export const getTrainingById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const training = await prisma.training.findUnique({
      where: { id },
      include: {
        provider: {
          include: {
            user: {
              select: {
                isVerified: true,
              },
            },
          },
        },
        skill: true,
        _count: {
          select: { userCertifications: true },
        },
      },
    });

    if (!training) {
      return res.status(404).json({ error: 'Training not found' });
    }

    const publiclyVisible =
      training.published && training.provider.verified && training.provider.user.isVerified;
    if (!publiclyVisible) {
      const canViewDraft =
        req.user?.role === 'admin' ||
        (req.user?.role === 'provider' && training.provider.contactUserId === req.user.id);

      if (!canViewDraft) {
        recordTrainingEvent(req, 'training.read', id, 'denied', {
          reason: 'published_approved_provider_or_ownership_required',
        });
        return res.status(404).json({ error: 'Training not found' });
      }
      res.set('Cache-Control', 'private, no-store');
    }

    let isEnrolled = false;
    if (req.user) {
      const existing = await prisma.userCertification.findFirst({
        where: {
          userId: req.user.id,
          trainingId: id,
        },
        select: { id: true },
      });
      isEnrolled = Boolean(existing);
    }

    // Transform training to match frontend expectations
    const transformedTraining = {
      ...training,
      provider: {
        id: training.provider.id,
        name: training.provider.name,
        logoUrl: training.provider.logoUrl,
        description: training.provider.description,
        rating: training.provider.rating,
        verified: training.provider.verified,
      },
      isEnrolled,
    };

    res.json({ training: transformedTraining });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to load training' });
  }
};

export const createTraining = async (req: AuthRequest, res: Response) => {
  try {
    const payload = getWritePayload(req.body);
    if (!payload) {
      return res.status(400).json({ error: 'Invalid training payload' });
    }

    const unsupportedFields = Object.keys(payload).filter((field) => !TRAINING_WRITE_FIELDS.has(field));
    if (unsupportedFields.length > 0) {
      return res.status(400).json({ error: 'Unsupported training fields', fields: unsupportedFields });
    }

    const name = typeof payload.name === 'string' ? payload.name.trim() : '';
    const duration = typeof payload.duration === 'string' ? payload.duration.trim() : '';
    const description = typeof payload.description === 'string' ? payload.description.trim() : '';
    if (!name || !duration || !description) {
      return res.status(400).json({ error: 'name, duration and description are required' });
    }

    const cost = hasOwn(payload, 'cost') ? Number(payload.cost) : 0;
    if (!Number.isFinite(cost) || cost < 0) {
      return res.status(400).json({ error: 'cost must be a non-negative number' });
    }

    const providesCertificateFlag = hasOwn(payload, 'providesCertificate')
      ? parseBooleanInput(payload.providesCertificate)
      : false;
    const publishFlag = hasOwn(payload, 'published')
      ? parseBooleanInput(payload.published)
      : false;
    if (providesCertificateFlag === undefined || publishFlag === undefined) {
      return res.status(400).json({ error: 'providesCertificate and published must be boolean values' });
    }

    for (const field of ['skillId', 'certificateUrl', 'imageUrl'] as const) {
      if (
        hasOwn(payload, field) &&
        payload[field] !== null &&
        typeof payload[field] !== 'string'
      ) {
        return res.status(400).json({ error: `${field} must be a string or null` });
      }
    }

    const provider = await prisma.provider.findUnique({
      where: { contactUserId: req.user!.id },
      select: {
        id: true,
        verified: true,
        user: { select: { isVerified: true } },
      },
    });
    if (!provider) {
      recordTrainingEvent(req, 'training.create', null, 'denied', {
        reason: 'provider_profile_required',
      });
      return res.status(403).json({ error: 'Provider profile required' });
    }
    if (!provider.user.isVerified || !provider.verified) {
      recordTrainingEvent(req, 'training.create', null, 'denied', {
        reason: 'verified_approved_provider_required',
      });
      return res.status(403).json({ error: 'Verified and approved provider account required' });
    }

    const training = await prisma.training.create({
      data: {
        name,
        providerId: provider.id,
        skillId: typeof payload.skillId === 'string' ? payload.skillId.trim() || null : null,
        duration,
        cost,
        description,
        certificateUrl: typeof payload.certificateUrl === 'string' ? payload.certificateUrl.trim() || null : null,
        imageUrl: typeof payload.imageUrl === 'string' ? payload.imageUrl.trim() || null : null,
        providesCertificate: providesCertificateFlag,
        published: publishFlag,
      },
      include: {
        provider: true,
        skill: true,
      },
    });

    void invalidateCacheByPrefix(['trainings:list', 'public:stats']);
    recordTrainingEvent(req, 'training.create', training.id, 'success', {
      published: training.published,
    });
    if (training.published) {
      recordTrainingEvent(req, 'training.publish', training.id, 'success', { source: 'create' });
    }
    res.status(201).json(training);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create training' });
  }
};

export const updateTraining = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const payload = getWritePayload(req.body);
    if (!payload) {
      return res.status(400).json({ error: 'Invalid training payload' });
    }

    const unsupportedFields = Object.keys(payload).filter((field) => !TRAINING_WRITE_FIELDS.has(field));
    if (unsupportedFields.length > 0) {
      return res.status(400).json({ error: 'Unsupported training fields', fields: unsupportedFields });
    }

    // Ensure current user owns provider for this training
    const training = await prisma.training.findUnique({
      where: { id },
      include: { provider: true },
    });
    if (!training) return res.status(404).json({ error: 'Training not found' });

    const myProvider = await prisma.provider.findUnique({ where: { contactUserId: req.user!.id } });
    if (!myProvider || myProvider.id !== training.providerId) {
      recordTrainingEvent(req, 'training.update', id, 'denied', {
        reason: 'training_ownership_required',
      });
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (!myProvider.verified) {
      recordTrainingEvent(req, 'training.update', id, 'denied', {
        reason: 'provider_approval_required',
      });
      return res.status(403).json({ error: 'Provider approval required' });
    }

    const updates: any = {};

    for (const field of ['name', 'duration', 'description'] as const) {
      if (!hasOwn(payload, field)) continue;
      const value = typeof payload[field] === 'string' ? payload[field].trim() : '';
      if (!value) return res.status(400).json({ error: `${field} must be a non-empty string` });
      updates[field] = value;
    }

    if (hasOwn(payload, 'cost')) {
      const cost = Number(payload.cost);
      if (!Number.isFinite(cost) || cost < 0) {
        return res.status(400).json({ error: 'cost must be a non-negative number' });
      }
      updates.cost = cost;
    }

    for (const field of ['providesCertificate', 'published'] as const) {
      if (!hasOwn(payload, field)) continue;
      const parsed = parseBooleanInput(payload[field]);
      if (parsed === undefined) {
        return res.status(400).json({ error: `${field} must be a boolean value` });
      }
      updates[field] = parsed;
    }

    for (const field of ['skillId', 'certificateUrl', 'imageUrl'] as const) {
      if (!hasOwn(payload, field)) continue;
      if (payload[field] !== null && typeof payload[field] !== 'string') {
        return res.status(400).json({ error: `${field} must be a string or null` });
      }
      updates[field] = typeof payload[field] === 'string' ? payload[field].trim() || null : null;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No supported training fields supplied' });
    }

    const updated = await prisma.training.update({ where: { id }, data: updates });
    void invalidateCacheByPrefix(['trainings:list', 'public:stats']);
    recordTrainingEvent(req, 'training.update', updated.id, 'success', {
      fields: Object.keys(updates),
    });
    if (!training.published && updated.published) {
      recordTrainingEvent(req, 'training.publish', updated.id, 'success', { source: 'update' });
    } else if (training.published && !updated.published) {
      recordTrainingEvent(req, 'training.unpublish', updated.id, 'success', { source: 'update' });
    }
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update training' });
  }
};

export const deleteTraining = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const training = await prisma.training.findUnique({
      where: { id },
      include: { provider: true },
    });
    if (!training) return res.status(404).json({ error: 'Training not found' });

    const myProvider = await prisma.provider.findUnique({ where: { contactUserId: req.user!.id } });
    if (!myProvider || myProvider.id !== training.providerId) {
      recordTrainingEvent(req, 'training.delete', id, 'denied', {
        reason: 'training_ownership_required',
      });
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (!myProvider.verified) {
      recordTrainingEvent(req, 'training.delete', id, 'denied', {
        reason: 'provider_approval_required',
      });
      return res.status(403).json({ error: 'Provider approval required' });
    }

    await prisma.training.delete({ where: { id } });
    void invalidateCacheByPrefix(['trainings:list', 'public:stats']);
    recordTrainingEvent(req, 'training.delete', id, 'success');
    res.json({ message: 'Training deleted' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete training' });
  }
};

export const enrollInTraining = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const training = await prisma.training.findFirst({
      where: {
        id,
        published: true,
        provider: { verified: true, user: { isVerified: true } },
      },
    });

    if (!training) {
      return res.status(404).json({ error: 'Training not found' });
    }

    // Check if already enrolled
    const existing = await prisma.userCertification.findFirst({
      where: {
        userId: req.user!.id,
        trainingId: id,
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'Already enrolled' });
    }

    const enrollment = await prisma.userCertification.create({
      data: {
        userId: req.user!.id,
        trainingId: id,
        skillId: training.skillId || null,
        // Enrollment is not completion and must never create a certificate.
        certificateUrl: null,
      },
      include: {
        training: true,
        skill: true,
      },
    });

    recordTrainingEvent(req, 'training.enroll', id, 'success', {
      enrollmentId: enrollment.id,
    });
    res.status(201).json({
      message: 'Enrolled in training',
      enrollment: presentEnrollment(enrollment),
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to enroll in training' });
  }
};

export const getProviderEnrollments = async (req: AuthRequest, res: Response) => {
  try {
    const provider = await prisma.provider.findUnique({ where: { contactUserId: req.user!.id } });
    if (!provider) {
      recordTrainingEvent(req, 'training.enrollments.read', null, 'denied', {
        reason: 'provider_profile_required',
      });
      return res.status(403).json({ error: 'Provider profile required' });
    }
    if (!provider.verified) {
      recordTrainingEvent(req, 'training.enrollments.read', null, 'denied', {
        reason: 'provider_approval_required',
      });
      return res.status(403).json({ error: 'Provider approval required' });
    }

    const enrollments = await prisma.userCertification.findMany({
      where: { training: { providerId: provider.id } },
      include: {
        user: { 
          select: { 
            id: true, 
            name: true, 
            email: true,
            avatarUrl: true,
          } 
        },
        training: { 
          select: { 
            id: true, 
            name: true,
            imageUrl: true,
          } 
        },
        skill: { select: { id: true, name: true } },
      },
      orderBy: { issuedAt: 'desc' },
    });

    // Transform to include all necessary fields
    const transformedEnrollments = enrollments.map(presentEnrollment);

    res.json({ enrollments: transformedEnrollments });
  } catch (error: any) {
    console.error('[Trainings] Provider enrollment list failed', {
      errorType: typeof error?.name === 'string' ? error.name : 'Error',
      code: typeof error?.code === 'string' ? error.code : undefined,
    });
    res.status(500).json({ error: 'Failed to load enrollments' });
  }
};

export const issueCertificate = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params; // training id
    const payload = getWritePayload(req.body);
    const userId = typeof payload?.userId === 'string' ? payload.userId.trim() : '';
    const certificateUrl = normalizeCertificateUrl(payload?.certificateUrl);

    if (!userId || userId.length > 128) {
      return res.status(400).json({ error: 'A valid learner ID is required' });
    }
    if (!certificateUrl) {
      recordTrainingEvent(req, 'training.certificate.issue', id, 'denied', {
        reason: 'safe_certificate_url_required',
      });
      return res.status(400).json({
        error: 'A root-relative or HTTPS certificate URL is required',
      });
    }

    const provider = await prisma.provider.findUnique({
      where: { contactUserId: req.user!.id },
      select: {
        id: true,
        verified: true,
        user: { select: { isVerified: true } },
      },
    });
    if (!provider) {
      recordTrainingEvent(req, 'training.certificate.issue', id, 'denied', {
        reason: 'provider_profile_required',
      });
      return res.status(403).json({ error: 'Provider profile required' });
    }
    if (!provider.user.isVerified || !provider.verified) {
      recordTrainingEvent(req, 'training.certificate.issue', id, 'denied', {
        reason: 'verified_approved_provider_required',
      });
      return res.status(403).json({
        error: 'Verified and approved provider account required',
      });
    }

    const training = await prisma.training.findFirst({
      where: { id, providerId: provider.id },
      select: { id: true, providesCertificate: true },
    });
    if (!training) {
      recordTrainingEvent(req, 'training.certificate.issue', id, 'denied', {
        reason: 'training_ownership_required',
      });
      return res.status(404).json({ error: 'Training not found' });
    }
    if (!training.providesCertificate) {
      return res.status(400).json({
        error: 'This training is not configured to issue certificates',
      });
    }

    const enrollment = await prisma.userCertification.findFirst({
      where: { userId, trainingId: id },
    });
    if (!enrollment) {
      recordTrainingEvent(req, 'training.certificate.issue', id, 'denied', {
        reason: 'owned_enrollment_required',
      });
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    const updated = await prisma.userCertification.update({
      where: { id: enrollment.id },
      data: { certificateUrl },
    });

    recordTrainingEvent(req, 'training.certificate.issue', id, 'success', {
      enrollmentId: updated.id,
      targetUserId: updated.userId,
    });
    res.json({
      message: 'Certificate issued',
      certification: presentEnrollment(updated),
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to issue certificate' });
  }
};

export const adminUpdateTraining = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.training.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Training not found' });
    const { name, category, duration, description, cost, published } = req.body;
    const updated = await prisma.training.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: String(name).trim() }),
        ...(category !== undefined && { category: String(category).trim() }),
        ...(duration !== undefined && { duration: String(duration).trim() }),
        ...(description !== undefined && { description: String(description).trim() }),
        ...(cost !== undefined && { cost: Math.max(0, Number(cost) || 0) }),
        ...(published !== undefined && { published: Boolean(published) }),
      },
    });
    void invalidateCacheByPrefix(['trainings:list', 'trainings:detail', 'public:stats']);
    recordTrainingEvent(req, 'training.update', updated.id, 'success', {
      source: 'admin',
      fields: [
        ['name', name],
        ['category', category],
        ['duration', duration],
        ['description', description],
        ['cost', cost],
        ['published', published],
      ]
        .filter(([, value]) => value !== undefined)
        .map(([field]) => field),
    });
    if (!existing.published && updated.published) {
      recordTrainingEvent(req, 'training.publish', updated.id, 'success', { source: 'admin' });
    } else if (existing.published && !updated.published) {
      recordTrainingEvent(req, 'training.unpublish', updated.id, 'success', { source: 'admin' });
    }
    return res.json(updated);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to update training' });
  }
};

export const adminDeleteTraining = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.training.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Training not found' });
    await prisma.training.delete({ where: { id } });
    void invalidateCacheByPrefix(['trainings:list', 'trainings:detail', 'public:stats']);
    recordTrainingEvent(req, 'training.delete', id, 'success', { source: 'admin' });
    return res.json({ message: 'Training deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to delete training' });
  }
};
