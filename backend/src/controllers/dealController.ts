import { Response } from "express";
import prisma from "../config/database";
import { AuthRequest } from "../middleware/auth";
import { cacheGetOrSet, makeCacheKey } from "../utils/cache";

const toNumber = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getActiveDealDateFilter = () => {
  const now = new Date();

  return {
    AND: [
      {
        OR: [{ startDate: null }, { startDate: { lte: now } }],
      },
      {
        OR: [{ validUntil: null }, { validUntil: { gte: now } }],
      },
    ],
  };
};

const businessSelect = {
  id: true,
  slug: true,
  name: true,
  nameSo: true,
  category: true,
  subcategory: true,
  logoUrl: true,
  bannerUrl: true,
  phone: true,
  website: true,
  address: true,
  city: true,
  state: true,
  verified: true,
  rating: true,
  reviewsCount: true,
};

export const getDeals = async (req: AuthRequest, res: Response) => {
  try {
    const { search, businessId, featured, page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(1, toNumber(page, 1));
    const limitNum = Math.min(100, Math.max(1, toNumber(limit, 20)));

    const where: any = {
      published: true,
      active: true,
      ...getActiveDealDateFilter(),
      business: {
        published: true,
        active: true,
      },
    };

    if (typeof search === "string" && search.trim()) {
      const searchQuery = search.trim().slice(0, 200);

      where.OR = [
        {
          title: {
            contains: searchQuery,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: searchQuery,
            mode: "insensitive",
          },
        },
        {
          discountText: {
            contains: searchQuery,
            mode: "insensitive",
          },
        },
        {
          promoCode: {
            contains: searchQuery,
            mode: "insensitive",
          },
        },
        {
          business: {
            name: {
              contains: searchQuery,
              mode: "insensitive",
            },
          },
        },
      ];
    }

    if (typeof businessId === "string" && businessId.trim()) {
      where.businessId = businessId.trim();
    }

    if (featured === "true") {
      where.featured = true;
    }

    if (featured === "false") {
      where.featured = false;
    }

    const loadDeals = async () => {
      const [deals, total] = await Promise.all([
        prisma.deal.findMany({
          where,
          include: {
            business: {
              select: businessSelect,
            },
          },
          orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
          skip: (pageNum - 1) * limitNum,
          take: limitNum,
        }),

        prisma.deal.count({
          where,
        }),
      ]);

      return {
        deals,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      };
    };

    const cacheKey = makeCacheKey(
      "deals:list",
      req.query as Record<string, unknown>,
    );

    const result = await cacheGetOrSet(cacheKey, 60, loadDeals);

    res.set("Cache-Control", "public, max-age=30, stale-while-revalidate=120");

    res.set("X-Cache", result.hit ? "HIT" : "MISS");

    return res.json(result.value);
  } catch (error) {
    console.error("Failed to fetch deals:", error);

    return res.status(500).json({
      error: "Failed to fetch deals",
    });
  }
};

export const getFeaturedDeals = async (req: AuthRequest, res: Response) => {
  try {
    const limitNum = Math.min(20, Math.max(1, toNumber(req.query.limit, 6)));

    const loadFeaturedDeals = async () => {
      const deals = await prisma.deal.findMany({
        where: {
          featured: true,
          published: true,
          active: true,
          ...getActiveDealDateFilter(),
          business: {
            published: true,
            active: true,
          },
        },
        include: {
          business: {
            select: businessSelect,
          },
        },
        orderBy: [{ createdAt: "desc" }],
        take: limitNum,
      });

      return {
        deals,
      };
    };

    const cacheKey = makeCacheKey("deals:featured", {
      limit: limitNum,
    });

    const result = await cacheGetOrSet(cacheKey, 60, loadFeaturedDeals);

    res.set("Cache-Control", "public, max-age=30, stale-while-revalidate=120");

    res.set("X-Cache", result.hit ? "HIT" : "MISS");

    return res.json(result.value);
  } catch (error) {
    console.error("Failed to fetch featured deals:", error);

    return res.status(500).json({
      error: "Failed to fetch featured deals",
    });
  }
};

export const getDealById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || !id.trim()) {
      return res.status(400).json({
        error: "Deal ID or slug is required",
      });
    }

    const identifier = id.trim();

    const result = await cacheGetOrSet(`deals:detail:${identifier}`, 60, () =>
      prisma.deal.findFirst({
        where: {
          published: true,
          active: true,
          ...getActiveDealDateFilter(),
          business: {
            published: true,
            active: true,
          },
          OR: [
            {
              id: identifier,
            },
            {
              slug: identifier,
            },
          ],
        },
        include: {
          business: {
            select: businessSelect,
          },
        },
      }),
    );

    if (!result.value) {
      return res.status(404).json({
        error: "Deal not found",
      });
    }

    res.set("Cache-Control", "public, max-age=30, stale-while-revalidate=120");

    res.set("X-Cache", result.hit ? "HIT" : "MISS");

    return res.json({
      deal: result.value,
    });
  } catch (error) {
    console.error("Failed to fetch deal:", error);

    return res.status(500).json({
      error: "Failed to fetch deal",
    });
  }
};
