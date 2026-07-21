import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { hashPassword, validatePassword } from '../utils/password';
import { presentResume } from '../utils/resume';
import { presentEnrollment } from '../utils/certificate';
import { invalidateCacheByPrefix } from '../utils/cache';

const adminUserSelect = {
  id: true, name: true, email: true, role: true, phone: true, location: true,
  bio: true, preferredLanguage: true, isVerified: true, avatarUrl: true, createdAt: true, updatedAt: true,
} as const;

const boundedPositiveInteger = (value: unknown, fallback: number, maximum: number) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0
    ? Math.min(parsed, maximum)
    : fallback;
};

const isNullableString = (value: unknown): value is string | null =>
  value === null || typeof value === 'string';

const hasOwn = (value: object, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(value, key);

const parseEmployerApprovalSnapshot = (value: unknown) => {
  if (!value || typeof value !== 'object') return null;
  const snapshot = value as Record<string, unknown>;
  const nullableFields = ['logoUrl', 'bannerUrl', 'description', 'website', 'address'] as const;
  if (
    !hasOwn(snapshot, 'name') ||
    typeof snapshot.name !== 'string' ||
    !nullableFields.every((field) => hasOwn(snapshot, field) && isNullableString(snapshot[field]))
  ) {
    return null;
  }
  return {
    name: snapshot.name,
    logoUrl: snapshot.logoUrl as string | null,
    bannerUrl: snapshot.bannerUrl as string | null,
    description: snapshot.description as string | null,
    website: snapshot.website as string | null,
    address: snapshot.address as string | null,
  };
};

const parseProviderApprovalSnapshot = (value: unknown) => {
  if (!value || typeof value !== 'object') return null;
  const snapshot = value as Record<string, unknown>;
  if (
    !hasOwn(snapshot, 'name') ||
    typeof snapshot.name !== 'string' ||
    !hasOwn(snapshot, 'logoUrl') ||
    !isNullableString(snapshot.logoUrl) ||
    !hasOwn(snapshot, 'description') ||
    !isNullableString(snapshot.description)
  ) {
    return null;
  }
  return {
    name: snapshot.name,
    logoUrl: snapshot.logoUrl as string | null,
    description: snapshot.description as string | null,
  };
};

export const getUserById = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        ...adminUserSelect,
        employer: true,
        provider: true,
        userSkills: { include: { skill: true } },
        userCertifications: { include: { training: { select: { id: true, name: true } }, skill: true } },
        workerExperiences: { orderBy: { startDate: 'desc' } },
        workerEducations: { orderBy: { createdAt: 'desc' } },
        workerLanguages: { orderBy: { language: 'asc' } },
        workerPreference: true,
        resumes: { select: { id: true, s3Url: true, skillsExtracted: true, createdAt: true }, orderBy: { createdAt: 'desc' } },
        _count: { select: { applications: true, serviceBookings: true, sentMessages: true, receivedMessages: true } },
      },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { userCertifications, ...userDetails } = user;
    return res.json({
      user: {
        ...userDetails,
        userCertifications: userCertifications.map(presentEnrollment),
        resumes: user.resumes.map(presentResume),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to load user' });
  }
};

export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password, role = 'worker', phone, location, isVerified = true } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedRole = String(role).trim().toLowerCase();
    if (!String(name || '').trim() || !normalizedEmail || !String(password || '')) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    if (!['worker', 'employer', 'provider', 'admin'].includes(normalizedRole)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    const passwordError = validatePassword(String(password));
    if (passwordError) return res.status(400).json({ error: passwordError });
    const passwordHash = await hashPassword(String(password));
    const user = await prisma.user.create({
      data: {
        name: String(name).trim(), email: normalizedEmail, passwordHash,
        role: normalizedRole as any, phone: String(phone || '').trim() || null,
        location: String(location || '').trim() || null, isVerified: Boolean(isVerified),
      },
      select: adminUserSelect,
    });
    await prisma.auditLog.create({ data: { userId: req.user!.id, action: 'admin_create_user', resourceType: 'user', resourceId: user.id, meta: { role: user.role } } });
    return res.status(201).json(user);
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(400).json({ error: 'Email already exists' });
    return res.status(500).json({ error: 'Failed to create user' });
  }
};

export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { role, search, status, page = 1, limit = 20 } = req.query;

    const pageNumber = boundedPositiveInteger(page, 1, 1_000_000);
    const pageSize = boundedPositiveInteger(limit, 20, 100);
    const skip = (pageNumber - 1) * pageSize;

    const where: any = {};
    const filters: any[] = [];

    if (role) {
      where.role = role;
    }

    if (search) {
      filters.push({
        OR: [
          { name: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } },
        ],
      });
    }

    if (status === 'verified') {
      where.isVerified = true;
    } else if (status === 'unverified') {
      where.isVerified = false;
    } else if (status === 'pending_approval') {
      filters.push({
        OR: [
          {
            role: 'employer',
            isVerified: true,
            employer: { is: { verified: false } },
          },
          {
            role: 'provider',
            isVerified: true,
            provider: { is: { verified: false } },
          },
        ],
      });
    }

    if (filters.length > 0) {
      where.AND = filters;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          location: true,
          isVerified: true,
          avatarUrl: true,
          createdAt: true,
          updatedAt: true,
          employer: {
            select: {
              id: true,
              name: true,
              logoUrl: true,
              bannerUrl: true,
              description: true,
              website: true,
              address: true,
              verified: true,
            },
          },
          provider: {
            select: {
              id: true,
              name: true,
              logoUrl: true,
              description: true,
              verified: true,
            },
          },
        },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      users: users.map(({ employer, provider, ...user }) => {
        const organization = employer
          ? {
              id: employer.id,
              type: 'employer' as const,
              name: employer.name,
              verified: employer.verified,
              identity: {
                name: employer.name,
                logoUrl: employer.logoUrl,
                bannerUrl: employer.bannerUrl,
                description: employer.description,
                website: employer.website,
                address: employer.address,
              },
            }
          : provider
            ? {
                id: provider.id,
                type: 'provider' as const,
                name: provider.name,
                verified: provider.verified,
                identity: {
                  name: provider.name,
                  logoUrl: provider.logoUrl,
                  description: provider.description,
                },
              }
            : null;

        return {
          ...user,
          organizationApproved:
            user.role === 'employer' || user.role === 'provider'
              ? Boolean(organization?.verified)
              : true,
          organization,
        };
      }),
      pagination: {
        total,
        page: pageNumber,
        limit: pageSize,
        pages: Math.ceil(total / pageSize),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to load users' });
  }
};

export const getJobs = async (req: AuthRequest, res: Response) => {
  try {
    const { published, page = 1, limit = 20 } = req.query;

    const pageNumber = boundedPositiveInteger(page, 1, 1_000_000);
    const pageSize = boundedPositiveInteger(limit, 20, 100);
    const skip = (pageNumber - 1) * pageSize;

    const where: any = {};

    if (published !== undefined) {
      where.published = published === 'true';
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

    res.json({
      jobs,
      pagination: {
        total,
        page: pageNumber,
        limit: pageSize,
        pages: Math.ceil(total / pageSize),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to load jobs' });
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, role, phone, location, bio, preferredLanguage, isVerified, avatarUrl } = req.body;

    if (role !== undefined && !['worker', 'employer', 'provider', 'admin'].includes(String(role))) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    if (email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) {
      return res.status(400).json({ error: 'Invalid email address' });
    }
    if (isVerified !== undefined && typeof isVerified !== 'boolean') {
      return res.status(400).json({ error: 'isVerified must be a boolean' });
    }
    if (preferredLanguage !== undefined && !['en', 'so'].includes(String(preferredLanguage))) {
      return res.status(400).json({ error: 'Invalid preferred language' });
    }
    if (
      req.user!.id === id &&
      ((role !== undefined && role !== 'admin') || isVerified === false)
    ) {
      return res.status(400).json({ error: 'Admins cannot remove their own access' });
    }
    if (
      avatarUrl !== undefined &&
      avatarUrl !== null &&
      !(typeof avatarUrl === 'string' && (
        (/^\/(?!\/)/.test(avatarUrl) && !avatarUrl.includes('\\')) ||
        /^https:\/\//i.test(avatarUrl)
      ))
    ) {
      return res.status(400).json({ error: 'Invalid avatar URL' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: String(name).trim() }),
        ...(email !== undefined && { email: String(email).trim().toLowerCase() }),
        ...(role !== undefined && { role }),
        ...(phone !== undefined && { phone: String(phone || '').trim() || null }),
        ...(location !== undefined && { location: String(location || '').trim() || null }),
        ...(bio !== undefined && { bio: String(bio || '').slice(0, 5000) || null }),
        ...(preferredLanguage !== undefined && { preferredLanguage }),
        ...(isVerified !== undefined && { isVerified }),
        ...(avatarUrl !== undefined && { avatarUrl: avatarUrl || null }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        location: true,
        isVerified: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'admin_update_user',
        resourceType: 'user',
        resourceId: id,
        meta: { fields: Object.keys(req.body || {}) },
      },
    });

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update user' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Prevent self-delete for safety
    if (req.user?.id === id) {
      return res.status(400).json({ error: 'Admins cannot delete their own account.' });
    }

    // Ensure user exists
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'User not found' });

    await prisma.user.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'admin_delete_user',
        resourceType: 'user',
        resourceId: id,
        meta: { role: existing.role },
      },
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

export const verifyEmployer = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const reviewedIdentity = parseEmployerApprovalSnapshot(req.body?.identity);
    if (!reviewedIdentity) {
      return res.status(400).json({ error: 'The reviewed employer profile snapshot is required' });
    }

    const pendingEmployer = await prisma.employer.findUnique({
      where: { id },
      select: { id: true, user: { select: { isVerified: true } } },
    });
    if (!pendingEmployer) return res.status(404).json({ error: 'Employer not found' });
    if (!pendingEmployer.user.isVerified) {
      return res.status(400).json({ error: 'Email verification is required before approval' });
    }

    const employer = await prisma.$transaction(async (transaction) => {
      const approval = await transaction.employer.updateMany({
        where: {
          id,
          verified: false,
          ...reviewedIdentity,
          user: { isVerified: true },
        },
        data: { verified: true },
      });
      if (approval.count !== 1) return null;

      const approvedEmployer = await transaction.employer.findUniqueOrThrow({
        where: { id },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      await transaction.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'verify_employer',
          resourceType: 'employer',
          resourceId: id,
          meta: { result: 'approved' },
        },
      });
      return approvedEmployer;
    });
    if (!employer) {
      return res.status(409).json({
        error: 'The employer profile changed. Reload and review it before approving.',
      });
    }
    await invalidateCacheByPrefix(['jobs:list', 'public:stats']);

    res.json(employer);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to approve employer' });
  }
};

export const verifyProvider = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const reviewedIdentity = parseProviderApprovalSnapshot(req.body?.identity);
    if (!reviewedIdentity) {
      return res.status(400).json({ error: 'The reviewed provider profile snapshot is required' });
    }

    const pendingProvider = await prisma.provider.findUnique({
      where: { id },
      select: { id: true, user: { select: { isVerified: true } } },
    });
    if (!pendingProvider) return res.status(404).json({ error: 'Provider not found' });
    if (!pendingProvider.user.isVerified) {
      return res.status(400).json({ error: 'Email verification is required before approval' });
    }

    const provider = await prisma.$transaction(async (transaction) => {
      const approval = await transaction.provider.updateMany({
        where: {
          id,
          verified: false,
          ...reviewedIdentity,
          user: { isVerified: true },
        },
        data: { verified: true },
      });
      if (approval.count !== 1) return null;

      const approvedProvider = await transaction.provider.findUniqueOrThrow({
        where: { id },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      await transaction.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'verify_provider',
          resourceType: 'provider',
          resourceId: id,
          meta: { result: 'approved' },
        },
      });
      return approvedProvider;
    });
    if (!provider) {
      return res.status(409).json({
        error: 'The provider profile changed. Reload and review it before approving.',
      });
    }
    await invalidateCacheByPrefix(['trainings:list', 'public:stats']);

    res.json(provider);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to approve provider' });
  }
};

export const getAuditLogs = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, action, page = 1, limit = 50 } = req.query;

    const pageNumber = boundedPositiveInteger(page, 1, 1_000_000);
    const pageSize = boundedPositiveInteger(limit, 50, 100);
    const skip = (pageNumber - 1) * pageSize;

    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (action) {
      where.action = { contains: action as string, mode: 'insensitive' };
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      logs,
      pagination: {
        total,
        page: pageNumber,
        limit: pageSize,
        pages: Math.ceil(total / pageSize),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to load audit logs' });
  }
};

export const testEmail = async (req: AuthRequest, res: Response) => {
  try {
    const { DEFAULT_CONTACT_ADDRESS, isValidEmailAddress, sendVerificationEmail } =
      await import('../utils/email.js');
    const requestedEmail =
      typeof req.body?.email === 'string' ? req.body.email.trim() : '';
    const testEmailAddress =
      requestedEmail ||
      process.env.CONTACT_EMAIL_TO?.trim() ||
      DEFAULT_CONTACT_ADDRESS;

    if (!isValidEmailAddress(testEmailAddress)) {
      return res.status(400).json({
        success: false,
        error: 'A valid test recipient email is required',
      });
    }

    const testCode = '123456';

    await sendVerificationEmail(testEmailAddress, testCode, 'Test User');

    return res.json({
      success: true,
      message: 'Test email accepted for delivery',
    });
  } catch (error: any) {
    console.error('[Admin] Email test failed', {
      code: typeof error?.code === 'string' ? error.code.slice(0, 40) : undefined,
      responseCode:
        typeof error?.responseCode === 'number'
          ? error.responseCode
          : undefined,
    });
    return res.status(503).json({
      success: false,
      error: 'Email service is currently unavailable',
    });
  }
};

export const getMetrics = async (req: AuthRequest, res: Response) => {
  try {
    const [
      totalUsers,
      totalWorkers,
      totalEmployers,
      totalProviders,
      totalJobs,
      totalTrainings,
      totalApplications,
      flaggedJobs,
      recentActivity,
    ] = await Promise.all([
      // Total users
      prisma.user.count(),
      
      // Workers (users with role 'worker')
      prisma.user.count({ where: { role: 'worker' } }),
      
      // Employers count
      prisma.employer.count(),
      
      // Providers count
      prisma.provider.count(),
      
      // Active jobs (published)
      prisma.job.count({ where: { published: true } }),
      
      // Active trainings (published)
      prisma.training.count({ where: { published: true } }),
      
      // Total applications
      prisma.application.count(),
      
      // Flagged jobs (you can add a flagged field later, for now using 0)
      Promise.resolve(0),
      
      // Recent activity from audit logs (last 24 hours)
      prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),
    ]);

    // Format recent activity
    const formattedActivity = recentActivity.map((log, index) => {
      const actionMap: Record<string, { title: string; description: string }> = {
        'admin_update_user': {
          title: 'User updated',
          description: `Admin updated user profile`,
        },
        'admin_delete_user': {
          title: 'User deleted',
          description: `User account was removed`,
        },
        'verify_employer': {
          title: 'Employer verified',
          description: `Employer account was verified`,
        },
        'verify_provider': {
          title: 'Provider verified',
          description: `Training provider was verified`,
        },
      };

      const actionInfo = actionMap[log.action] || {
        title: 'System activity',
        description: log.action,
      };

      const timeAgo = Math.floor((Date.now() - log.createdAt.getTime()) / 60000);
      const timeString = timeAgo < 1 ? 'Just now' : 
                        timeAgo < 60 ? `${timeAgo} minutes ago` :
                        timeAgo < 1440 ? `${Math.floor(timeAgo / 60)} hours ago` :
                        `${Math.floor(timeAgo / 1440)} days ago`;

      return {
        id: log.id,
        title: actionInfo.title,
        description: actionInfo.description,
        time: timeString,
      };
    });

    res.json({
      totalUsers,
      totalWorkers,
      totalEmployers,
      totalProviders,
      totalJobs,
      totalTrainings,
      totalApplications,
      flaggedJobs,
      recentActivity: formattedActivity,
    });
  } catch (error: any) {
    console.error('[Admin] Metrics request failed', {
      errorType: typeof error?.name === 'string' ? error.name : 'Error',
      code: typeof error?.code === 'string' ? error.code : undefined,
    });
    res.status(500).json({ error: 'Failed to load metrics' });
  }
};
