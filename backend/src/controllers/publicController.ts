import { Request, Response } from 'express';
import prisma from '../config/database';
import { cacheGetOrSet } from '../utils/cache';

export const getPublicStats = async (req: Request, res: Response) => {
    try {
        const result = await cacheGetOrSet('public:stats', 60, async () => {
        const [jobsCount, trainingsCount, workersCount, applicationsCount, acceptedApplicationsCount] = await Promise.all([
            prisma.job.count({
                where: {
                    published: true,
                    employer: { verified: true, user: { isVerified: true } },
                },
            }),
            prisma.training.count({
                where: {
                    published: true,
                    provider: { verified: true, user: { isVerified: true } },
                },
            }),
            prisma.user.count({ where: { role: 'worker', isVerified: true } }),
            prisma.application.count({
                where: {
                    user: { isVerified: true },
                    job: { employer: { verified: true, user: { isVerified: true } } },
                },
            }),
            prisma.application.count({
                where: {
                    status: 'accepted',
                    user: { isVerified: true },
                    job: { employer: { verified: true, user: { isVerified: true } } },
                },
            }),
        ]);

        const successRate = applicationsCount > 0
            ? `${Math.round((acceptedApplicationsCount / applicationsCount) * 100)}%`
            : null;

        return {
            jobsCount,
            trainingsCount,
            workersCount,
            successRate,
            // Format with + or k if needed for frontend display
            formatted: {
                jobs: jobsCount > 1000 ? `${(jobsCount / 1000).toFixed(1)}k+` : `${jobsCount}+`,
                trainings: trainingsCount > 100 ? `${trainingsCount}+` : `${trainingsCount}+`,
                workers: workersCount > 1000 ? `${(workersCount / 1000).toFixed(1)}k+` : `${workersCount}+`,
            }
        };
        });

        res.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=120');
        res.set('X-Cache', result.hit ? 'HIT' : 'MISS');
        res.json(result.value);
    } catch {
        res.status(500).json({ error: 'Public statistics are temporarily unavailable' });
    }
};
