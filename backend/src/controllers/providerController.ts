import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { recordAuditEvent, requestAuditMeta } from '../utils/audit';
import { invalidateCacheByPrefix } from '../utils/cache';

const safeOptionalUrl = (value: unknown): string | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  if (typeof value !== 'string' || value.length > 2048) return undefined;
  const trimmed = value.trim();
  if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.includes('\\')) {
    return trimmed;
  }
  try {
    return new URL(trimmed).protocol === 'https:' ? trimmed : undefined;
  } catch {
    return undefined;
  }
};

export const getProviders = async (req: AuthRequest, res: Response) => {
  try {
    const { search, verified } = req.query;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (req.user!.role !== 'admin') {
      where.verified = true;
      where.user = { isVerified: true };
    } else if (verified !== undefined) {
      where.verified = verified === 'true';
    }

    const providers = await prisma.provider.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        logoUrl: true,
        rating: true,
        verified: true,
        createdAt: true,
        _count: {
          select: { trainings: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // This is a directory response. Keep the organization contact user id and
    // all account contact fields out of it, including for authenticated users.
    res.json(providers);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to load providers' });
  }
};

export const getProviderById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const provider = await prisma.provider.findUnique({
      where: { id },
      include: {
        user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                location: true,
                avatarUrl: true,
                isVerified: true,
          },
        },
        trainings: {
          where: { published: true },
          include: {
            skill: true,
          },
        },
      },
    });

    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    const canViewPrivateContact =
      req.user!.role === 'admin' || provider.contactUserId === req.user!.id;
    if ((!provider.verified || !provider.user.isVerified) && !canViewPrivateContact) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    if (canViewPrivateContact) {
      return res.json(provider);
    }

    return res.json({
      id: provider.id,
      name: provider.name,
      description: provider.description,
      logoUrl: provider.logoUrl,
      rating: provider.rating,
      verified: provider.verified,
      createdAt: provider.createdAt,
      trainings: provider.trainings,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to load provider' });
  }
};

export const createProvider = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, logoUrl } = req.body;
    const normalizedName = typeof name === 'string' ? name.trim() : '';
    if (!normalizedName || normalizedName.length > 200) {
      return res.status(400).json({ error: 'Provider name must contain 1 to 200 characters' });
    }
    if (description !== undefined && description !== null && (typeof description !== 'string' || description.length > 5000)) {
      return res.status(400).json({ error: 'Invalid provider description' });
    }
    const normalizedLogo = safeOptionalUrl(logoUrl);
    if (logoUrl !== undefined && normalizedLogo === undefined) {
      return res.status(400).json({ error: 'Logo URL must be HTTPS or a safe local path' });
    }

    const existingProvider = await prisma.provider.findUnique({
      where: { contactUserId: req.user!.id },
      select: {
        id: true,
        name: true,
        description: true,
        logoUrl: true,
        verified: true,
      },
    });
    const normalizedDescription =
      typeof description === 'string' ? description.trim() || null : null;
    const changedIdentityFields = existingProvider
      ? [
          ...(existingProvider.name !== normalizedName ? ['name'] : []),
          ...(description !== undefined && existingProvider.description !== normalizedDescription
            ? ['description']
            : []),
          ...(logoUrl !== undefined && existingProvider.logoUrl !== normalizedLogo
            ? ['logoUrl']
            : []),
        ]
      : [];
    const verificationReset = Boolean(
      existingProvider?.verified && changedIdentityFields.length > 0,
    );

    const provider = await prisma.provider.upsert({
      where: { contactUserId: req.user!.id },
      update: {
        name: normalizedName,
        ...(description !== undefined && {
          description: normalizedDescription,
        }),
        ...(logoUrl !== undefined && { logoUrl: normalizedLogo }),
        ...(changedIdentityFields.length > 0 && { verified: false }),
      },
      create: {
        name: normalizedName,
        contactUserId: req.user!.id,
        description: typeof description === 'string' ? description.trim() || null : null,
        logoUrl: normalizedLogo,
        verified: false,
      },
      include: { user: { select: { name: true, email: true } } },
    });

    if (changedIdentityFields.length > 0) {
      await invalidateCacheByPrefix(['trainings:list', 'public:stats']);
    }

    if (verificationReset) {
      recordAuditEvent({
        userId: req.user!.id,
        action: 'provider.verification_reset',
        resourceType: 'provider',
        resourceId: provider.id,
        meta: {
          ...requestAuditMeta(req),
          result: 'success',
          reason: 'approved_identity_changed',
          changedFields: changedIdentityFields,
        },
      });
    }

    res.status(201).json(provider);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to save provider profile' });
  }
};

export const getMyProvider = async (req: AuthRequest, res: Response) => {
  try {
    const provider = await prisma.provider.findUnique({
      where: { contactUserId: req.user!.id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
            location: true,
          },
        },
      },
    });

    if (!provider) {
      return res.status(404).json({ error: 'Provider profile not found' });
    }

    res.json(provider);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to load provider profile' });
  }
};

export const getProviderCourses = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const provider = await prisma.provider.findUnique({
      where: { id },
      select: {
        contactUserId: true,
        verified: true,
        user: { select: { isVerified: true } },
      },
    });
    const canViewPrivate =
      req.user!.role === 'admin' || provider?.contactUserId === req.user!.id;
    if (!provider || ((!provider.verified || !provider.user.isVerified) && !canViewPrivate)) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    const trainings = await prisma.training.findMany({
      where: { providerId: id, published: true },
      include: {
        skill: true,
        _count: {
          select: { userCertifications: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(trainings);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to load provider courses' });
  }
};

export const getMyMetrics = async (req: AuthRequest, res: Response) => {
  try {
    const provider = await prisma.provider.findUnique({ where: { contactUserId: req.user!.id } });
    if (!provider) return res.json({ totalCourses: 0, activeTrainees: 0, certificatesIssued: 0, averageRating: null });

    const [totalCourses, activeTrainees, certificatesIssued] = await Promise.all([
      prisma.training.count({ where: { providerId: provider.id } }),
      prisma.userCertification.count({ where: { training: { providerId: provider.id } } }),
      prisma.userCertification.count({ where: { training: { providerId: provider.id }, NOT: { certificateUrl: null } } }),
    ]);

    res.json({ totalCourses, activeTrainees, certificatesIssued, averageRating: provider.rating ?? null });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to load provider metrics' });
  }
};
