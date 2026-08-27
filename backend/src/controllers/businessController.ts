import { Response } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../config/database";
import { AuthRequest } from "../middleware/auth";
import { cacheGetOrSet, makeCacheKey } from "../utils/cache";

const toNumber = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

type BusinessHour = {
  dayOfWeek: number;
  openTime: string | null;
  closeTime: string | null;
  closed: boolean;
};

type BusinessStatus = "OPEN" | "CLOSING_SOON" | "CLOSED" | "HOURS_UNAVAILABLE";

type BusinessStatusResult = {
  status: BusinessStatus;
  statusLabel: string;
  closesAt: string | null;
};

type BusinessWithHours = Prisma.BusinessGetPayload<{
  include: {
    hours: true;
  };
}>;

type BusinessWithHoursAndDeals = Prisma.BusinessGetPayload<{
  include: {
    hours: true;
    deals: true;
  };
}>;

const parseTime = (time: string): number | null => {
  const [hours, minutes] = time.split(":").map(Number);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return hours * 60 + minutes;
};

const getCurrentBusinessTime = (timezone: string) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const weekday = parts.find((part) => part.type === "weekday")?.value;
  const hourValue = parts.find((part) => part.type === "hour")?.value;
  const minuteValue = parts.find((part) => part.type === "minute")?.value;

  const dayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  if (
    !weekday ||
    hourValue === undefined ||
    minuteValue === undefined ||
    dayMap[weekday] === undefined
  ) {
    return null;
  }

  const hour = Number(hourValue);
  const minute = Number(minuteValue);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return null;
  }

  return {
    dayOfWeek: dayMap[weekday],
    currentMinutes: hour * 60 + minute,
  };
};

const getBusinessStatus = (
  hours: BusinessHour[],
  timezone: string | null,
): BusinessStatusResult => {
  if (!timezone || hours.length === 0) {
    return {
      status: "HOURS_UNAVAILABLE",
      statusLabel: "Hours unavailable",
      closesAt: null,
    };
  }

  try {
    const currentTime = getCurrentBusinessTime(timezone);

    if (!currentTime) {
      return {
        status: "HOURS_UNAVAILABLE",
        statusLabel: "Hours unavailable",
        closesAt: null,
      };
    }

    const { dayOfWeek, currentMinutes } = currentTime;

    const todayHours = hours.find((hour) => hour.dayOfWeek === dayOfWeek);

    const previousDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const previousDayHours = hours.find(
      (hour) => hour.dayOfWeek === previousDay,
    );

    if (
      previousDayHours &&
      !previousDayHours.closed &&
      previousDayHours.openTime &&
      previousDayHours.closeTime
    ) {
      const previousOpen = parseTime(previousDayHours.openTime);
      const previousClose = parseTime(previousDayHours.closeTime);

      if (
        previousOpen !== null &&
        previousClose !== null &&
        previousClose <= previousOpen &&
        currentMinutes < previousClose
      ) {
        const minutesUntilClosing = previousClose - currentMinutes;

        if (minutesUntilClosing <= 60) {
          return {
            status: "CLOSING_SOON",
            statusLabel: "Closing Soon",
            closesAt: previousDayHours.closeTime,
          };
        }

        return {
          status: "OPEN",
          statusLabel: "Open",
          closesAt: previousDayHours.closeTime,
        };
      }
    }

    if (
      !todayHours ||
      todayHours.closed ||
      !todayHours.openTime ||
      !todayHours.closeTime
    ) {
      return {
        status: "CLOSED",
        statusLabel: "Closed",
        closesAt: null,
      };
    }

    const openingMinutes = parseTime(todayHours.openTime);
    const closingMinutes = parseTime(todayHours.closeTime);

    if (openingMinutes === null || closingMinutes === null) {
      return {
        status: "HOURS_UNAVAILABLE",
        statusLabel: "Hours unavailable",
        closesAt: null,
      };
    }

    const isOvernight = closingMinutes <= openingMinutes;

    if (!isOvernight) {
      if (currentMinutes < openingMinutes || currentMinutes >= closingMinutes) {
        return {
          status: "CLOSED",
          statusLabel: "Closed",
          closesAt: null,
        };
      }

      const minutesUntilClosing = closingMinutes - currentMinutes;

      if (minutesUntilClosing <= 60) {
        return {
          status: "CLOSING_SOON",
          statusLabel: "Closing Soon",
          closesAt: todayHours.closeTime,
        };
      }

      return {
        status: "OPEN",
        statusLabel: "Open",
        closesAt: todayHours.closeTime,
      };
    }

    if (currentMinutes >= openingMinutes) {
      const minutesUntilClosing = 24 * 60 - currentMinutes + closingMinutes;

      if (minutesUntilClosing <= 60) {
        return {
          status: "CLOSING_SOON",
          statusLabel: "Closing Soon",
          closesAt: todayHours.closeTime,
        };
      }

      return {
        status: "OPEN",
        statusLabel: "Open",
        closesAt: todayHours.closeTime,
      };
    }

    return {
      status: "CLOSED",
      statusLabel: "Closed",
      closesAt: null,
    };
  } catch (error) {
    console.error("Failed to calculate business status:", error);

    return {
      status: "HOURS_UNAVAILABLE",
      statusLabel: "Hours unavailable",
      closesAt: null,
    };
  }
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

    const where: Prisma.BusinessWhereInput = {
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
        prisma.business.findMany({
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

        prisma.business.count({
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
      ...business,
      ...getBusinessStatus(business.hours, business.timezone),
    }));

    res.set("Cache-Control", "public, max-age=30, stale-while-revalidate=120");

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
      return prisma.business.findMany({
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

    res.set("Cache-Control", "public, max-age=30, stale-while-revalidate=120");

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
        return await prisma.business.findFirst({
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
      ...result.value,
      ...getBusinessStatus(result.value.hours, result.value.timezone),
    };

    res.set("Cache-Control", "public, max-age=30, stale-while-revalidate=120");

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
