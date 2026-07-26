import { Request, Response } from 'express';
import prisma from '../config/database';
import { cacheGetOrSet } from '../utils/cache';

const boundedPositiveInteger = (
  value: unknown,
  fallback: number,
  maximum: number,
) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0
    ? Math.min(parsed, maximum)
    : fallback;
};

const searchQuery = (value: unknown) =>
  typeof value === 'string' ? value.trim().slice(0, 200) : '';

const setPublicDirectoryCacheHeaders = (res: Response) => {
  res.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=120');
};

const publicWorkerWhere = (search: string) => {
  const where: any = {
    role: 'worker',
    isVerified: true,
    profilePublic: true,
  };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { headline: { contains: search, mode: 'insensitive' } },
      { headlineSo: { contains: search, mode: 'insensitive' } },
      { bio: { contains: search, mode: 'insensitive' } },
      { bioSo: { contains: search, mode: 'insensitive' } },
      { location: { contains: search, mode: 'insensitive' } },
      {
        userSkills: {
          some: {
            skill: {
              is: {
                OR: [
                  { name: { contains: search, mode: 'insensitive' } },
                  { description: { contains: search, mode: 'insensitive' } },
                  { category: { contains: search, mode: 'insensitive' } },
                ],
              },
            },
          },
        },
      },
      {
        workerExperiences: {
          some: {
            OR: [
              { jobTitle: { contains: search, mode: 'insensitive' } },
              { company: { contains: search, mode: 'insensitive' } },
              { achievements: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      },
      {
        workerLanguages: {
          some: {
            language: { contains: search, mode: 'insensitive' },
          },
        },
      },
    ];
  }

  return where;
};

const publicWorkerListSelect = {
  id: true,
  slug: true,
  name: true,
  headline: true,
  headlineSo: true,
  bio: true,
  bioSo: true,
  location: true,
  avatarUrl: true,
  createdAt: true,
  updatedAt: true,
  userSkills: {
    select: {
      level: true,
      skill: {
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' as const },
  },
  workerLanguages: {
    select: {
      language: true,
      level: true,
    },
    orderBy: { createdAt: 'asc' as const },
  },
} as const;

const presentPublicWorker = (worker: any) => ({
  id: worker.id,
  slug: worker.slug,
  name: worker.name,
  headline: worker.headline,
  headlineSo: worker.headlineSo,
  bio: worker.bio,
  bioSo: worker.bioSo,
  location: worker.location,
  avatarUrl: worker.avatarUrl,
  createdAt: worker.createdAt,
  updatedAt: worker.updatedAt,
  skills: worker.userSkills.map((entry: any) => ({
    ...entry.skill,
    level: entry.level,
  })),
  languages: worker.workerLanguages,
});

export const getPublicWorkers = async (req: Request, res: Response) => {
  try {
    const page = boundedPositiveInteger(req.query.page, 1, 10_000);
    const limit = boundedPositiveInteger(req.query.limit, 20, 50);
    const where = publicWorkerWhere(searchQuery(req.query.search));

    const [workers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: publicWorkerListSelect,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    setPublicDirectoryCacheHeaders(res);
    return res.json({
      workers: workers.map(presentPublicWorker),
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch {
    return res.status(500).json({ error: 'Failed to load public workers' });
  }
};

export const getPublicWorkerByIdentifier = async (
  req: Request,
  res: Response,
) => {
  try {
    const identifier = String(req.params.identifier || '').trim();
    if (!identifier || identifier.length > 256) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    const worker = await prisma.user.findFirst({
      where: {
        role: 'worker',
        isVerified: true,
        profilePublic: true,
        OR: [{ id: identifier }, { slug: identifier }],
      },
      select: {
        ...publicWorkerListSelect,
        workerExperiences: {
          select: {
            id: true,
            jobTitle: true,
            company: true,
            startDate: true,
            endDate: true,
            isCurrent: true,
            achievements: true,
          },
          orderBy: { startDate: 'desc' },
        },
        workerEducations: {
          select: {
            id: true,
            degreeLevel: true,
            institution: true,
            fieldOfStudy: true,
            certificationName: true,
            isVerified: true,
            startDate: true,
            endDate: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    setPublicDirectoryCacheHeaders(res);
    return res.json({
      worker: {
        ...presentPublicWorker(worker),
        experiences: worker.workerExperiences,
        educations: worker.workerEducations,
      },
    });
  } catch {
    return res.status(500).json({ error: 'Failed to load public worker' });
  }
};

const employerDirectoryWhere = (search: string) => {
  const where: any = {
    verified: true,
    user: { isVerified: true },
  };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { nameSo: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { descriptionSo: { contains: search, mode: 'insensitive' } },
      { address: { contains: search, mode: 'insensitive' } },
      {
        jobs: {
          some: {
            published: true,
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { titleSo: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
              { descriptionSo: { contains: search, mode: 'insensitive' } },
              { tags: { has: search } },
              { tags: { has: search.toLowerCase() } },
            ],
          },
        },
      },
    ];
  }
  return where;
};

const providerDirectoryWhere = (search: string) => {
  const where: any = {
    verified: true,
    user: { isVerified: true },
  };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { nameSo: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { descriptionSo: { contains: search, mode: 'insensitive' } },
      {
        trainings: {
          some: {
            published: true,
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { nameSo: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
              { descriptionSo: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      },
    ];
  }
  return where;
};

const employerDirectorySelect = {
  id: true,
  slug: true,
  name: true,
  nameSo: true,
  description: true,
  descriptionSo: true,
  logoUrl: true,
  bannerUrl: true,
  website: true,
  address: true,
  verified: true,
  createdAt: true,
  _count: {
    select: {
      jobs: { where: { published: true } },
    },
  },
} as const;

const providerDirectorySelect = {
  id: true,
  slug: true,
  name: true,
  nameSo: true,
  description: true,
  descriptionSo: true,
  logoUrl: true,
  rating: true,
  verified: true,
  createdAt: true,
  _count: {
    select: {
      trainings: { where: { published: true } },
    },
  },
} as const;

const presentEmployerBusiness = (employer: any) => ({
  type: 'employer' as const,
  id: employer.id,
  slug: employer.slug,
  name: employer.name,
  nameSo: employer.nameSo,
  description: employer.description,
  descriptionSo: employer.descriptionSo,
  logoUrl: employer.logoUrl,
  bannerUrl: employer.bannerUrl,
  website: employer.website,
  address: employer.address,
  verified: employer.verified,
  createdAt: employer.createdAt,
  offeringsCount: employer._count.jobs,
});

const presentProviderBusiness = (provider: any) => ({
  type: 'provider' as const,
  id: provider.id,
  slug: provider.slug,
  name: provider.name,
  nameSo: provider.nameSo,
  description: provider.description,
  descriptionSo: provider.descriptionSo,
  logoUrl: provider.logoUrl,
  rating: provider.rating,
  verified: provider.verified,
  createdAt: provider.createdAt,
  offeringsCount: provider._count.trainings,
});

export const getPublicBusinesses = async (req: Request, res: Response) => {
  try {
    // Merging two independently ordered organization tables requires reading
    // the top N candidates from each. Bound deep pages to keep this public
    // endpoint from turning a large offset into an unbounded memory query.
    const page = boundedPositiveInteger(req.query.page, 1, 200);
    const limit = boundedPositiveInteger(req.query.limit, 20, 50);
    const skip = (page - 1) * limit;
    const candidateLimit = skip + limit;
    const search = searchQuery(req.query.search);
    const employerWhere = employerDirectoryWhere(search);
    const providerWhere = providerDirectoryWhere(search);

    const [employers, providers, employerCount, providerCount] =
      await Promise.all([
        prisma.employer.findMany({
          where: employerWhere,
          select: employerDirectorySelect,
          orderBy: { createdAt: 'desc' },
          take: candidateLimit,
        }),
        prisma.provider.findMany({
          where: providerWhere,
          select: providerDirectorySelect,
          orderBy: { createdAt: 'desc' },
          take: candidateLimit,
        }),
        prisma.employer.count({ where: employerWhere }),
        prisma.provider.count({ where: providerWhere }),
      ]);

    const businesses = [
      ...employers.map(presentEmployerBusiness),
      ...providers.map(presentProviderBusiness),
    ]
      .sort(
        (left, right) =>
          new Date(right.createdAt).getTime() -
          new Date(left.createdAt).getTime(),
      )
      .slice(skip, skip + limit);
    const total = employerCount + providerCount;

    setPublicDirectoryCacheHeaders(res);
    return res.json({
      businesses,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch {
    return res.status(500).json({ error: 'Failed to load public businesses' });
  }
};

export const getPublicBusinessByIdentifier = async (
  req: Request,
  res: Response,
) => {
  try {
    const identifier = String(req.params.identifier || '').trim();
    if (!identifier || identifier.length > 256) {
      return res.status(404).json({ error: 'Business not found' });
    }
    const identifierWhere = {
      OR: [{ id: identifier }, { slug: identifier }],
    };

    const [employer, provider] = await Promise.all([
      prisma.employer.findFirst({
        where: {
          verified: true,
          user: { isVerified: true },
          ...identifierWhere,
        },
        select: {
          ...employerDirectorySelect,
          jobs: {
            where: { published: true },
            select: {
              id: true,
              slug: true,
              title: true,
              titleSo: true,
              description: true,
              descriptionSo: true,
              location: true,
              employmentType: true,
              remote: true,
              tags: true,
              applicationDeadline: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
      prisma.provider.findFirst({
        where: {
          verified: true,
          user: { isVerified: true },
          ...identifierWhere,
        },
        select: {
          ...providerDirectorySelect,
          trainings: {
            where: { published: true },
            select: {
              id: true,
              slug: true,
              name: true,
              nameSo: true,
              description: true,
              descriptionSo: true,
              duration: true,
              durationSo: true,
              cost: true,
              imageUrl: true,
              providesCertificate: true,
              createdAt: true,
              skill: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  category: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
    ]);

    if (!employer && !provider) {
      return res.status(404).json({ error: 'Business not found' });
    }

    setPublicDirectoryCacheHeaders(res);
    if (employer) {
      return res.json({
        business: {
          ...presentEmployerBusiness(employer),
          offerings: {
            jobs: employer.jobs,
            trainings: [],
          },
        },
      });
    }

    return res.json({
      business: {
        ...presentProviderBusiness(provider),
        offerings: {
          jobs: [],
          trainings: provider!.trainings,
        },
      },
    });
  } catch {
    return res.status(500).json({ error: 'Failed to load public business' });
  }
};

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
