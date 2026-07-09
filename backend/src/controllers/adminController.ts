import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { role, search, status, page = 1, limit = 20 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (status === 'verified') {
      where.isVerified = true;
    } else if (status === 'unverified') {
      where.isVerified = false;
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
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      users,
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

export const getJobs = async (req: AuthRequest, res: Response) => {
  try {
    const { published, page = 1, limit = 20 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

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
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.job.count({ where }),
    ]);

    res.json({
      jobs,
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

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, role, phone, location, isVerified, avatarUrl } = req.body;

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(role !== undefined && { role }),
        ...(phone !== undefined && { phone }),
        ...(location !== undefined && { location }),
        ...(isVerified !== undefined && { isVerified }),
        ...(avatarUrl !== undefined && { avatarUrl }),
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
    res.status(500).json({ error: error.message });
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
        meta: { email: existing.email, role: existing.role },
      },
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const verifyEmployer = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const employer = await prisma.employer.update({
      where: { id },
      data: { verified: true },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Log action
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'verify_employer',
        resourceType: 'employer',
        resourceId: id,
        meta: { employerName: employer.name },
      },
    });

    res.json(employer);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const verifyProvider = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const provider = await prisma.provider.update({
      where: { id },
      data: { verified: true },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Log action
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'verify_provider',
        resourceType: 'provider',
        resourceId: id,
        meta: { providerName: provider.name },
      },
    });

    res.json(provider);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getAuditLogs = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, action, page = 1, limit = 50 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

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
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      logs,
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

export const testEmail = async (req: AuthRequest, res: Response) => {
  try {
    const { sendVerificationEmail } = await import('../utils/email.js');
    const testEmail = req.body.email || process.env.EMAIL_USER || 'thaprinmohamett1333@gmail.com';
    const testCode = '123456';
    
    await sendVerificationEmail(testEmail, testCode, 'Test User');
    
    res.json({
      success: true,
      message: `Test email sent successfully to ${testEmail}`,
      code: testCode,
    });
  } catch (error: any) {
    console.error('[Admin] Email test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send test email',
      details: process.env.NODE_ENV === 'development' ? {
        code: error.code,
        responseCode: error.responseCode,
        response: error.response,
      } : undefined,
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
    console.error('[Admin] Error fetching metrics:', error);
    res.status(500).json({ error: error.message });
  }
};
