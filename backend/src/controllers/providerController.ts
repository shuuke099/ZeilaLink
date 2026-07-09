import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';

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

    if (verified !== undefined) {
      where.verified = verified === 'true';
    }

    const providers = await prisma.provider.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        _count: {
          select: { trainings: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(providers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
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
            name: true,
            email: true,
            phone: true,
            location: true,
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

    res.json(provider);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createProvider = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, logoUrl } = req.body;

    const provider = await prisma.provider.upsert({
      where: { contactUserId: req.user!.id },
      update: { name, description, logoUrl },
      create: { name, contactUserId: req.user!.id, description, logoUrl },
      include: { user: { select: { name: true, email: true } } },
    });

    res.status(201).json(provider);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
  }
};

export const getProviderCourses = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

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
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
  }
};