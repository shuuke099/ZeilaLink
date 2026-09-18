import { BusinessHour, getBusinessStatus, parseBusinessHours, formatBusinessHours, normalizeBusinessHours } from "../utils/businessHours";
import { Response } from "express";
import prisma from "../config/database";
import { AuthRequest } from "../middleware/auth";
import { cacheGetOrSet, makeCacheKey } from "../utils/cache";
import { randomUUID } from "crypto";
import { slugify } from "../utils/slug";

const toNumber = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

type BusinessWithHours = Record<string, any> & {
  hours: BusinessHour[];
  timezone: string | null;
};

// The controller can compile even when the generated Prisma Client is stale.
// After regenerating Prisma, this still points to the normal Business delegate.
const businessDb = (prisma as any).business;

const presentDirectoryBusiness = (business: any) => {
  const normalizedHours = business.hours ? normalizeBusinessHours(business.hours) : [];
  return {
    type: "business" as const,
    ...business,
    hours: normalizedHours.length ? normalizedHours : business.hours,
    region: business.state,
    location: [business.city, business.state, business.country].filter(Boolean).join(", "),
    openingHours: {
      weekdays: formatBusinessHours(normalizedHours.find((item: any) => item.dayOfWeek === 1)),
      weekends: formatBusinessHours(normalizedHours.find((item: any) => item.dayOfWeek === 6)),
    },
    jobCount: 0,
    trainingCount: 0,
  };
};

export const getBusinesses = async (req: AuthRequest, res: Response) => {
  try {
    const {
      search,
      category,
      city,
      state,
      featured,
      page = 1,
      limit = 20,
    } = req.query;

    const pageNum = Math.max(1, toNumber(page, 1));
    const limitNum = Math.min(100, Math.max(1, toNumber(limit, 20)));

    const where: Record<string, any> = {
      published: true,
      active: true,
    };

    if (typeof search === "string" && search.trim()) {
      const searchQuery = search.trim().slice(0, 200);

      where.OR = [
        {
          name: {
            contains: searchQuery,
            mode: "insensitive",
          },
        },
        {
          nameSo: {
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
          descriptionSo: {
            contains: searchQuery,
            mode: "insensitive",
          },
        },
        {
          category: {
            contains: searchQuery,
            mode: "insensitive",
          },
        },
        {
          subcategory: {
            contains: searchQuery,
            mode: "insensitive",
          },
        },
        {
          city: {
            contains: searchQuery,
            mode: "insensitive",
          },
        },
        {
          state: {
            contains: searchQuery,
            mode: "insensitive",
          },
        },
      ];
    }

    if (typeof category === "string" && category.trim()) {
      where.category = {
        equals: category.trim(),
        mode: "insensitive",
      };
    }

    if (typeof city === "string" && city.trim()) {
      where.city = {
        equals: city.trim(),
        mode: "insensitive",
      };
    }

    if (typeof state === "string" && state.trim()) {
      where.state = {
        equals: state.trim(),
        mode: "insensitive",
      };
    }

    if (featured === "true") {
      where.featured = true;
    }

    if (featured === "false") {
      where.featured = false;
    }

    const loadBusinesses = async (): Promise<{
      businesses: BusinessWithHours[];
      total: number;
    }> => {
      const [businesses, total] = await Promise.all([
        businessDb.findMany({
          where,
          include: {
            hours: {
              orderBy: {
                dayOfWeek: "asc",
              },
            },
          },
          orderBy: [
            {
              featured: "desc",
            },
            {
              rating: "desc",
            },
            {
              createdAt: "desc",
            },
          ],
          skip: (pageNum - 1) * limitNum,
          take: limitNum,
        }),

        businessDb.count({
          where,
        }),
      ]);

      return {
        businesses,
        total,
      };
    };

    const cacheKey = makeCacheKey(
      "businesses:list",
      req.query as Record<string, unknown>,
    );

    const result = await cacheGetOrSet<{
      businesses: BusinessWithHours[];
      total: number;
    }>(cacheKey, 60, loadBusinesses);

    const businesses = result.value.businesses.map((business) => ({
      ...presentDirectoryBusiness(business),
      ...getBusinessStatus(business.hours, business.timezone),
    }));

    res.set("Cache-Control", "no-store");

    res.set("X-Cache", result.hit ? "HIT" : "MISS");

    return res.json({
      businesses,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: result.value.total,
        pages: Math.ceil(result.value.total / limitNum),
      },
    });
  } catch (error) {
    console.error("Failed to fetch businesses:", error);

    return res.status(500).json({
      error: "Failed to fetch businesses",
    });
  }
};

export const getFeaturedBusinesses = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const limitNum = Math.min(20, Math.max(1, toNumber(req.query.limit, 10)));

    const loadFeaturedBusinesses = async (): Promise<BusinessWithHours[]> => {
      return businessDb.findMany({
        where: {
          featured: true,
          published: true,
          active: true,
        },
        include: {
          hours: {
            orderBy: {
              dayOfWeek: "asc",
            },
          },
        },
        orderBy: [
          {
            rating: "desc",
          },
          {
            reviewsCount: "desc",
          },
          {
            createdAt: "desc",
          },
        ],
        take: limitNum,
      });
    };

    const cacheKey = makeCacheKey("businesses:featured", {
      limit: limitNum,
    });

    const result = await cacheGetOrSet<BusinessWithHours[]>(
      cacheKey,
      60,
      loadFeaturedBusinesses,
    );

    const businesses = result.value.map((business) => ({
      ...business,
      ...getBusinessStatus(business.hours, business.timezone),
    }));

    res.set("Cache-Control", "no-store");

    res.set("X-Cache", result.hit ? "HIT" : "MISS");

    return res.json({
      businesses,
    });
  } catch (error) {
    console.error("Failed to fetch featured businesses:", error);

    return res.status(500).json({
      error: "Failed to fetch featured businesses",
    });
  }
};

export const getBusinessById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || !id.trim()) {
      return res.status(400).json({
        error: "Business ID or slug is required",
      });
    }

    const identifier = id.trim();
    const now = new Date();

    const result = await cacheGetOrSet(
      `businesses:detail:${identifier}`,
      60,
      async () => {
        return await businessDb.findFirst({
          where: {
            published: true,
            active: true,
            OR: [{ id: identifier }, { slug: identifier }],
          },
          include: {
            hours: {
              orderBy: {
                dayOfWeek: "asc",
              },
            },
            deals: {
              where: {
                active: true,
                published: true,
              },
              orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
            },
          },
        });
      },
    );

    if (!result.value) {
      return res.status(404).json({
        error: "Business not found",
      });
    }

    const business = {
      ...presentDirectoryBusiness(result.value),
      ...getBusinessStatus(result.value.hours, result.value.timezone),
    };

    res.set("Cache-Control", "no-store");

    res.set("X-Cache", result.hit ? "HIT" : "MISS");

    return res.json({
      business,
    });
  } catch (error) {
    console.error("Failed to fetch business:", error);

    return res.status(500).json({
      error: "Failed to fetch business",
    });
  }
};

const adminData = (body: Record<string, any>) => {
  const required = (key: string) => { const value = String(body[key] || "").trim(); if (!value) throw Object.assign(new Error(`${key} is required`), { status: 400 }); return value; };
  const optional = (key: string) => String(body[key] || "").trim() || null;
  const coordinate = (key: string, min: number, max: number) => { if (body[key] === "" || body[key] == null) return null; const value = Number(body[key]); if (!Number.isFinite(value) || value < min || value > max) throw Object.assign(new Error(`Invalid ${key}`), { status: 400 }); return value; };
  const stringArray = (key: string) => Array.isArray(body[key])
    ? Array.from(new Set(body[key].filter((item: unknown): item is string => typeof item === "string").map((item: string) => item.trim()).filter(Boolean)))
    : [];
  return {
    name: required("name"),
    nameSo: optional("nameSo"),
    category: required("category"),
    subcategory: optional("subcategory"),
    description: required("description"),
    descriptionSo: optional("descriptionSo"),
    logoUrl: optional("logoUrl"),
    bannerUrl: optional("bannerUrl"),
    gallery: stringArray("gallery"),
    website: optional("website"),
    phone: optional("phone"),
    email: optional("email"),
    address: required("address"),
    city: required("city"),
    state: optional("region"),
    country: required("country"),
    postalCode: optional("postalCode"),
    latitude: coordinate("latitude", -90, 90),
    longitude: coordinate("longitude", -180, 180),
    timezone: optional("timezone"),
    hasPhysicalLocation: body.hasPhysicalLocation !== false,
    serviceArea: stringArray("serviceArea"),
    remoteAvailable: body.remoteAvailable === true,
    verified: body.verified === true,
    claimed: body.claimed === true,
    featured: body.featured === true,
    published: body.published !== false,
    active: body.active !== false,
  };
};
const adminHours = (body: Record<string, any>) => {
  const value = body.openingHours || {};
  const weekdayInput = String(body.weekdayHours || value.weekdays || "");
  const weekendInput = String(body.weekendHours || value.weekends || "");

  return Array.from({ length: 7 }, (_, dayOfWeek) => {
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const inputString = isWeekend ? weekendInput : weekdayInput;
    const parsed = parseBusinessHours(inputString);
    return {
      dayOfWeek,
      openTime: parsed.openTime,
      closeTime: parsed.closeTime,
      closed: parsed.closed,
    };
  });
};

export const getAdminBusinesses = async (_req: AuthRequest, res: Response) => { const businesses = await businessDb.findMany({ include: { hours: true }, orderBy: [{ featured: "desc" }, { createdAt: "desc" }] }); return res.json({ businesses: businesses.map(presentDirectoryBusiness) }); };
export const getAdminBusinessById = async (req: AuthRequest, res: Response) => { const business = await businessDb.findUnique({ where: { id: req.params.id }, include: { hours: true } }); if (!business) return res.status(404).json({ error: "Business not found" }); return res.json({ business: presentDirectoryBusiness(business) }); };
export const createAdminBusiness = async (req: AuthRequest, res: Response) => { try { if (!req.user) return res.status(401).json({ error: "Authentication required" }); const data = adminData(req.body || {}); const business = await businessDb.create({ data: { ...data, userId: req.user.id, slug: `${slugify(data.name, "business")}-${randomUUID()}`, hours: { create: adminHours(req.body || {}) } }, include: { hours: true } }); return res.status(201).json(presentDirectoryBusiness(business)); } catch (error: any) { return res.status(error?.status || 500).json({ error: error?.status ? error.message : "Failed to create business" }); } };
export const updateAdminBusiness = async (req: AuthRequest, res: Response) => { try { const existing = await businessDb.findUnique({ where: { id: req.params.id } }); if (!existing) return res.status(404).json({ error: "Business not found" }); const data = adminData({ ...existing, region: existing.state, ...(req.body || {}) }); const business = await businessDb.update({ where: { id: existing.id }, data: { ...data, hours: { deleteMany: {}, create: adminHours(req.body || {}) } }, include: { hours: true } }); return res.json(presentDirectoryBusiness(business)); } catch (error: any) { return res.status(error?.status || 500).json({ error: error?.status ? error.message : "Failed to update business" }); } };
export const deleteAdminBusiness = async (req: AuthRequest, res: Response) => { const result = await businessDb.deleteMany({ where: { id: req.params.id } }); if (!result.count) return res.status(404).json({ error: "Business not found" }); return res.json({ message: "Business deleted successfully" }); };
