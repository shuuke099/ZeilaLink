import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getTrainings = async (req: AuthRequest, res: Response) => {
  try {
    const { search, skillId, page = 1, limit = 20, all, mine } = req.query as any;
    // Do NOT destructure providerId so we can resolve it dynamically

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    let requirePublished = true;

    // Resolve effective providerId when providers request their own trainings
    let effectiveProviderId: string | undefined = (req.query as any).providerId as string | undefined;
    
    // Handle mine=true parameter - providers see only their own trainings
    if (req.user?.role === 'provider' && (mine === 'true' || mine === true)) {
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
            page: Number(page),
            limit: Number(limit),
            pages: 0,
          },
        });
      }
    } else if ((mine === 'true' || mine === true) && (!req.user || req.user.role !== 'provider')) {
      // If mine=true but user is not authenticated or not a provider, return empty
      return res.json({
        trainings: [],
        pagination: {
          total: 0,
          page: Number(page),
          limit: Number(limit),
          pages: 0,
        },
      });
    }
    
    // Handle all=true parameter - providers see all their trainings (published and unpublished)
    if (req.user?.role === 'provider' && (all === 'true' || all === true) && !mine) {
      if (!effectiveProviderId) {
        const prov = await prisma.provider.findUnique({ where: { contactUserId: req.user.id } });
        if (prov) effectiveProviderId = prov.id;
      }
      if (effectiveProviderId) requirePublished = false;
    }
    
    // Allow admins to view all trainings (published and unpublished) when all=true
    if (req.user?.role === 'admin' && (all === 'true' || all === true)) {
      requirePublished = false;
    }
    
    // For public access (no user), always show only published trainings
    if (requirePublished) {
      where.published = true;
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

    const [trainings, total] = await Promise.all([
      prisma.training.findMany({
        where,
        include: {
          provider: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
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
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.training.count({ where }),
    ]);

    // Transform trainings to match frontend expectations
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

    res.json({
      trainings: transformedTrainings,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error('[getTrainings] Error:', error);
    res.status(500).json({ error: error.message });
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
                name: true,
                email: true,
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
    res.status(500).json({ error: error.message });
  }
};

export const createTraining = async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      skillId,
      duration,
      cost,
      description,
      certificateUrl,
      imageUrl,
      providesCertificate,
      published,
    } = req.body;

    let provider = await prisma.provider.findUnique({ where: { contactUserId: req.user!.id } });
    if (!provider) {
      // Auto-create a minimal provider profile for the current user
      const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
      provider = await prisma.provider.create({
        data: {
          contactUserId: req.user!.id,
          name: user?.name || 'Training Provider',
          verified: false,
        },
      });
    }

    const providesCertificateFlag =
      typeof providesCertificate === 'string'
        ? providesCertificate === 'true'
        : Boolean(providesCertificate);
    const publishFlag =
      typeof published === 'string' ? published === 'true' : Boolean(published);

    const training = await prisma.training.create({
      data: {
        name,
        providerId: provider.id,
        skillId,
        duration,
        cost: Math.max(0, Number(cost) || 0),
        description,
        certificateUrl,
        imageUrl,
        providesCertificate: providesCertificateFlag,
        published: publishFlag, // Allow unverified providers to publish
      },
      include: {
        provider: true,
        skill: true,
      },
    });

    res.status(201).json(training);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateTraining = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;

    // Ensure current user owns provider for this training
    const training = await prisma.training.findUnique({
      where: { id },
      include: { provider: true },
    });
    if (!training) return res.status(404).json({ error: 'Training not found' });

    const myProvider = await prisma.provider.findUnique({ where: { contactUserId: req.user!.id } });
    if (!myProvider || myProvider.id !== training.providerId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updates: any = { ...data };

    if (data.cost !== undefined) {
      updates.cost = Math.max(0, Number(data.cost) || 0);
    }
    if (data.providesCertificate !== undefined) {
      updates.providesCertificate =
        typeof data.providesCertificate === 'string'
          ? data.providesCertificate === 'true'
          : Boolean(data.providesCertificate);
    }
    if (data.published !== undefined) {
      updates.published =
        typeof data.published === 'string'
          ? data.published === 'true'
          : Boolean(data.published);
    }

    const updated = await prisma.training.update({ where: { id }, data: updates });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
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
      return res.status(403).json({ error: 'Not authorized' });
    }

    await prisma.training.delete({ where: { id } });
    res.json({ message: 'Training deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const enrollInTraining = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const training = await prisma.training.findUnique({
      where: { id },
    });

    if (!training || !training.published) {
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

    const certification = await prisma.userCertification.create({
      data: {
        userId: req.user!.id,
        trainingId: id,
        skillId: training.skillId || null,
        certificateUrl: training.certificateUrl,
      },
      include: {
        training: true,
        skill: true,
      },
    });

    res.status(201).json(certification);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const completeTraining = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const certification = await prisma.userCertification.findFirst({
      where: {
        userId: req.user!.id,
        trainingId: id,
      },
    });

    if (!certification) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    // Mark as completed (in a real system, you'd verify completion)
    res.json({ message: 'Training marked as completed', certification });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getProviderEnrollments = async (req: AuthRequest, res: Response) => {
  try {
    const provider = await prisma.provider.findUnique({ where: { contactUserId: req.user!.id } });
    if (!provider) return res.status(403).json({ error: 'Provider profile required' });

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
    const transformedEnrollments = enrollments.map((enrollment) => ({
      id: enrollment.id,
      userId: enrollment.userId,
      trainingId: enrollment.trainingId,
      user: enrollment.user,
      training: enrollment.training,
      skill: enrollment.skill,
      issuedAt: enrollment.issuedAt,
      certificateUrl: enrollment.certificateUrl,
    }));

    res.json({ enrollments: transformedEnrollments });
  } catch (error: any) {
    console.error('[getProviderEnrollments] Error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const issueCertificate = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params; // training id
    const { userId, certificateUrl } = req.body as { userId: string; certificateUrl?: string };

    const provider = await prisma.provider.findUnique({ where: { contactUserId: req.user!.id } });
    if (!provider) return res.status(403).json({ error: 'Provider profile required' });

    const enrollment = await prisma.userCertification.findFirst({
      where: { userId, trainingId: id, training: { providerId: provider.id } },
    });
    if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });

    const updated = await prisma.userCertification.update({
      where: { id: enrollment.id },
      data: { certificateUrl: certificateUrl || enrollment.certificateUrl || null },
    });

    res.json({ message: 'Certificate issued', certification: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};