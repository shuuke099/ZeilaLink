import { Response } from "express";
import prisma from "../config/database";
import { AuthRequest } from "../middleware/auth";
import {
  cacheGetOrSet,
  invalidateCacheByPrefix,
  makeCacheKey,
} from "../utils/cache";
import { createStableSlug, slugWhenMissing } from "../utils/slug";

/* =========================================================
   HELPERS
========================================================= */

const normalizeStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const toNumber = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toOptionalNumber = (value: unknown): number | null => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toBoolean = (value: unknown, fallback = false): boolean => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }

  return fallback;
};

const toOptionalDate = (value: unknown): Date | null => {
  if (!value) {
    return null;
  }

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
};

const parsePriceLabelToCents = (
  priceLabel: string | null | undefined,
): number | null => {
  if (!priceLabel) {
    return null;
  }

  const numeric = Number(String(priceLabel).replace(/[^0-9.]/g, ""));

  if (!Number.isFinite(numeric) || numeric <= 0) {
    return null;
  }

  return Math.round(numeric * 100);
};

const getStripeSecretKey = () => {
  return (process.env.STRIPE_SECRET_KEY || "").trim();
};

const getFrontendOrigin = (): string => {
  const raw =
    process.env.FRONTEND_URL?.trim() ||
    (process.env.NODE_ENV === "production" ? "" : "http://localhost:3000");

  if (!raw) {
    throw new Error("FRONTEND_URL is required");
  }

  const parsed = new URL(raw);

  if (
    !["http:", "https:"].includes(parsed.protocol) ||
    parsed.username ||
    parsed.password ||
    (parsed.pathname !== "/" && parsed.pathname !== "") ||
    parsed.search ||
    parsed.hash ||
    (process.env.NODE_ENV === "production" && parsed.protocol !== "https:")
  ) {
    throw new Error("FRONTEND_URL must be a plain HTTPS origin in production");
  }

  return parsed.origin;
};

const externalRequestSignal = () => AbortSignal.timeout(10_000);

/* =========================================================
   BOOKING INPUT
========================================================= */

type BookingInput = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceDateTime: Date;
  isRemote: boolean;
  locationAddress: string | null;
  notes: string | null;
};

const parseBookingInput = (
  body: any,
  fallbackUser: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null,
): { bookingInput: BookingInput } | { error: string } => {
  const customerName = String(
    body?.customerName || fallbackUser?.name || "",
  ).trim();

  const customerEmail = String(
    body?.customerEmail || fallbackUser?.email || "",
  ).trim();

  const customerPhone = String(
    body?.customerPhone || fallbackUser?.phone || "",
  ).trim();

  const serviceDateTimeRaw = String(body?.serviceDateTime || "").trim();

  const serviceDateTime = new Date(serviceDateTimeRaw);

  const locationMode = String(body?.locationMode || "onsite")
    .trim()
    .toLowerCase();

  const isRemote = locationMode === "remote";

  const locationAddress = String(body?.locationAddress || "").trim();

  const notes = typeof body?.notes === "string" ? body.notes.trim() : "";

  if (!customerName || !customerEmail) {
    return {
      error: "Name and email are required.",
    };
  }

  if (!customerPhone) {
    return {
      error: "Phone number is required.",
    };
  }

  if (!serviceDateTimeRaw || Number.isNaN(serviceDateTime.getTime())) {
    return {
      error: "A valid service date and time is required.",
    };
  }

  if (!isRemote && !locationAddress) {
    return {
      error: "Location address is required for on-site services.",
    };
  }

  return {
    bookingInput: {
      customerName,
      customerEmail,
      customerPhone,
      serviceDateTime,
      isRemote,
      locationAddress: isRemote ? null : locationAddress,
      notes: notes || null,
    },
  };
};

/* =========================================================
   PUBLIC SERVICES
========================================================= */

export const getServices = async (req: AuthRequest, res: Response) => {
  try {
    const {
      category,
      subcategory,
      search,
      city,
      state,
      remote,
      featured,
      page = 1,
      limit = 50,
    } = req.query;

    const pageNum = Math.max(1, toNumber(page, 1));

    const limitNum = Math.min(100, Math.max(1, toNumber(limit, 50)));

    const where: any = {
      published: true,
      active: true,
    };

    if (typeof category === "string" && category.trim()) {
      where.category = category.trim();
    }

    if (typeof subcategory === "string" && subcategory.trim()) {
      where.subcategory = subcategory.trim();
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

    if (remote === "true") {
      where.remoteAvailable = true;
    }

    if (featured === "true") {
      where.featured = true;
    }

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
          titleSo: {
            contains: searchQuery,
            mode: "insensitive",
          },
        },
        {
          provider: {
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

    const loadServices = async () => {
      const [services, total, categories] = await Promise.all([
        prisma.service.findMany({
          where,
          include: {
            business: {
              select: {
                id: true,
                slug: true,
                name: true,
                logoUrl: true,
                verified: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          skip: (pageNum - 1) * limitNum,
          take: limitNum,
        }),

        prisma.service.count({
          where,
        }),

        prisma.service.findMany({
          where: {
            published: true,
            active: true,
          },
          select: {
            category: true,
          },
          distinct: ["category"],
          orderBy: {
            category: "asc",
          },
        }),
      ]);

      return {
        services,

        categories: categories.map((item) => item.category),

        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      };
    };

    const cacheKey = makeCacheKey(
      "services:list",
      req.query as Record<string, unknown>,
    );

    const result = await cacheGetOrSet(cacheKey, 60, loadServices);

    res.set("Cache-Control", "public, max-age=30, stale-while-revalidate=120");

    res.set("X-Cache", result.hit ? "HIT" : "MISS");

    return res.json(result.value);
  } catch (error) {
    console.error("getServices:", error);

    return res.status(500).json({
      error: "Failed to fetch services",
    });
  }
};

/* =========================================================
   GET SERVICE
========================================================= */

export const getServiceById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await cacheGetOrSet(`services:detail:${id}`, 60, () =>
      prisma.service.findFirst({
        where: {
          OR: [{ id }, { slug: id }],
          published: true,
          active: true,
        },

        include: {
          business: {
            select: {
              id: true,
              slug: true,
              name: true,
              nameSo: true,
              description: true,
              logoUrl: true,
              bannerUrl: true,
              phone: true,
              email: true,
              website: true,
              city: true,
              state: true,
              verified: true,
              rating: true,
              reviewsCount: true,
            },
          },
        },
      }),
    );

    if (!result.value) {
      return res.status(404).json({
        error: "Service not found",
      });
    }

    res.set("Cache-Control", "public, max-age=30, stale-while-revalidate=120");

    res.set("X-Cache", result.hit ? "HIT" : "MISS");

    return res.json(result.value);
  } catch (error) {
    console.error("getServiceById:", error);

    return res.status(500).json({
      error: "Failed to fetch service",
    });
  }
};

/* =========================================================
   CREATE BOOKING
========================================================= */

export const createServiceBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const service = await prisma.service.findFirst({
      where: {
        published: true,
        active: true,
        OR: [{ id }, { slug: id }],
      },

      select: {
        id: true,
        title: true,
        remoteAvailable: true,
      },
    });

    if (!service) {
      return res.status(404).json({
        error: "Service not found",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: req.user!.id,
      },

      select: {
        name: true,
        email: true,
        phone: true,
      },
    });

    const parsed = parseBookingInput(req.body, user);

    if ("error" in parsed) {
      return res.status(400).json({
        error: parsed.error,
      });
    }

    const { bookingInput } = parsed;

    if (bookingInput.isRemote && !service.remoteAvailable) {
      return res.status(400).json({
        error: "This service is not available remotely.",
      });
    }

    const booking = await prisma.serviceBooking.create({
      data: {
        serviceId: service.id,
        userId: req.user!.id,

        customerName: bookingInput.customerName,

        customerEmail: bookingInput.customerEmail,

        customerPhone: bookingInput.customerPhone,

        serviceDateTime: bookingInput.serviceDateTime,

        isRemote: bookingInput.isRemote,

        locationAddress: bookingInput.locationAddress,

        notes: bookingInput.notes,
      },
    });

    return res.status(201).json({
      message: "Service booked successfully",
      booking,
    });
  } catch (error: any) {
    console.error("createServiceBooking:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        error: "Duplicate booking detected",
      });
    }

    return res.status(500).json({
      error: "Failed to create booking",
    });
  }
};

/* =========================================================
   STRIPE CHECKOUT
========================================================= */

export const createServiceBookingCheckoutSession = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const { id } = req.params;

    const stripeSecretKey = getStripeSecretKey();

    const frontendUrl = getFrontendOrigin();

    const currency = (process.env.STRIPE_CURRENCY || "usd").toLowerCase();

    if (!stripeSecretKey) {
      return res.status(503).json({
        error: "Payment service is unavailable.",
      });
    }

    const service = await prisma.service.findFirst({
      where: {
        published: true,
        active: true,

        OR: [{ id }, { slug: id }],
      },

      select: {
        id: true,
        slug: true,
        title: true,
        priceLabel: true,
        priceFrom: true,
        remoteAvailable: true,
      },
    });

    if (!service) {
      return res.status(404).json({
        error: "Service not found",
      });
    }

    /*
     * priceFrom is preferred because it is
     * numeric. priceLabel remains a fallback
     * for older/current service records.
     */
    const unitAmount =
      service.priceFrom !== null
        ? Math.round(service.priceFrom * 100)
        : parsePriceLabelToCents(service.priceLabel);

    if (unitAmount === null || unitAmount <= 0) {
      return res.status(400).json({
        error: "This service does not have a valid price for online payment.",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: req.user!.id,
      },

      select: {
        name: true,
        email: true,
        phone: true,
      },
    });

    const parsed = parseBookingInput(req.body, user);

    if ("error" in parsed) {
      return res.status(400).json({
        error: parsed.error,
      });
    }

    const { bookingInput } = parsed;

    if (bookingInput.isRemote && !service.remoteAvailable) {
      return res.status(400).json({
        error: "This service is not available remotely.",
      });
    }

    const form = new URLSearchParams();

    form.append("mode", "payment");

    const publicServiceIdentifier = service.slug || service.id;

    form.append(
      "success_url",
      `${frontendUrl}/services/${publicServiceIdentifier}?booking=success&session_id={CHECKOUT_SESSION_ID}`,
    );

    form.append(
      "cancel_url",
      `${frontendUrl}/services/${publicServiceIdentifier}?booking=cancelled`,
    );

    form.append("customer_email", bookingInput.customerEmail);

    form.append(
      "payment_intent_data[description]",
      `Service booking for ${service.title}`,
    );

    form.append("line_items[0][price_data][currency]", currency);

    form.append("line_items[0][price_data][unit_amount]", String(unitAmount));

    form.append("line_items[0][price_data][product_data][name]", service.title);

    form.append("line_items[0][quantity]", "1");

    form.append("metadata[serviceId]", service.id);

    form.append("metadata[userId]", req.user!.id);

    form.append("metadata[customerName]", bookingInput.customerName);

    form.append(
      "metadata[serviceDateTime]",
      bookingInput.serviceDateTime.toISOString(),
    );

    form.append(
      "metadata[locationMode]",
      bookingInput.isRemote ? "remote" : "onsite",
    );

    if (bookingInput.locationAddress) {
      form.append("metadata[locationAddress]", bookingInput.locationAddress);
    }

    const stripeResponse = await fetch(
      "https://api.stripe.com/v1/checkout/sessions",
      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${stripeSecretKey}`,

          "Content-Type": "application/x-www-form-urlencoded",
        },

        body: form,

        signal: externalRequestSignal(),
      },
    );

    if (!stripeResponse.ok) {
      const stripeError = await stripeResponse.text().catch(() => "");

      console.error(
        "Stripe checkout error:",
        stripeResponse.status,
        stripeError,
      );

      return res.status(502).json({
        error: "Failed to create checkout session.",
      });
    }

    const stripeSession = (await stripeResponse.json()) as {
      id?: string;
      url?: string;
    };

    let checkoutUrl: URL | null = null;

    try {
      checkoutUrl = stripeSession.url ? new URL(stripeSession.url) : null;
    } catch {
      checkoutUrl = null;
    }

    if (
      !stripeSession.id ||
      !checkoutUrl ||
      checkoutUrl.protocol !== "https:" ||
      checkoutUrl.hostname !== "checkout.stripe.com" ||
      Boolean(checkoutUrl.username || checkoutUrl.password)
    ) {
      return res.status(502).json({
        error: "Stripe did not return a valid checkout URL.",
      });
    }

    const booking = await prisma.serviceBooking.create({
      data: {
        serviceId: service.id,
        userId: req.user!.id,

        customerName: bookingInput.customerName,

        customerEmail: bookingInput.customerEmail,

        customerPhone: bookingInput.customerPhone,

        serviceDateTime: bookingInput.serviceDateTime,

        isRemote: bookingInput.isRemote,

        locationAddress: bookingInput.locationAddress,

        notes: bookingInput.notes,

        stripeCheckoutSessionId: stripeSession.id,

        paymentStatus: "checkout_started",
      },
    });

    return res.status(201).json({
      checkoutUrl: checkoutUrl.toString(),

      bookingId: booking.id,

      message: "Checkout session created successfully.",
    });
  } catch (error) {
    console.error("createServiceBookingCheckoutSession:", error);

    return res.status(500).json({
      error: "Failed to create checkout session",
    });
  }
};

/* =========================================================
   MY BOOKINGS
========================================================= */

export const getMyServiceBookings = async (req: AuthRequest, res: Response) => {
  try {
    const bookings = await prisma.serviceBooking.findMany({
      where: {
        userId: req.user!.id,
      },

      include: {
        service: {
          select: {
            id: true,
            slug: true,
            title: true,
            titleSo: true,
            category: true,
            provider: true,
            priceLabel: true,
            priceFrom: true,
            priceType: true,
            image: true,
            city: true,
            state: true,
            remoteAvailable: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      bookings,
    });
  } catch (error) {
    console.error("getMyServiceBookings:", error);

    return res.status(500).json({
      error: "Failed to fetch bookings",
    });
  }
};

/* =========================================================
   CONFIRM STRIPE PAYMENT
========================================================= */

export const confirmServiceBookingPayment = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const stripeSecretKey = getStripeSecretKey();

    const sessionId = String(req.body?.sessionId || "").trim();

    if (!stripeSecretKey) {
      return res.status(503).json({
        error: "Payment service is unavailable.",
      });
    }

    if (!/^cs_[A-Za-z0-9_]{8,240}$/.test(sessionId)) {
      return res.status(400).json({
        error: "A valid sessionId is required.",
      });
    }

    const stripeResponse = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(
        sessionId,
      )}`,
      {
        method: "GET",

        headers: {
          Authorization: `Bearer ${stripeSecretKey}`,
        },

        signal: externalRequestSignal(),
      },
    );

    if (!stripeResponse.ok) {
      return res.status(502).json({
        error: "Failed to verify checkout session.",
      });
    }

    const session = (await stripeResponse.json()) as {
      payment_status?: string;
    };

    if (session.payment_status !== "paid") {
      return res.status(400).json({
        error: "Payment is not completed yet.",
      });
    }

    const booking = await prisma.serviceBooking.findFirst({
      where: {
        stripeCheckoutSessionId: sessionId,

        userId: req.user!.id,
      },

      select: {
        id: true,
      },
    });

    if (!booking) {
      return res.status(404).json({
        error: "Booking not found for this Stripe session.",
      });
    }

    const updated = await prisma.serviceBooking.update({
      where: {
        id: booking.id,
      },

      data: {
        paymentStatus: "paid",
        status: "confirmed",
      },

      include: {
        service: {
          select: {
            id: true,
            slug: true,
            title: true,
            category: true,
            provider: true,
            priceLabel: true,
            priceFrom: true,
            priceType: true,
            image: true,
          },
        },
      },
    });

    return res.json({
      booking: updated,
      message: "Payment confirmed successfully.",
    });
  } catch (error) {
    console.error("confirmServiceBookingPayment:", error);

    return res.status(500).json({
      error: "Failed to confirm payment",
    });
  }
};

/* =========================================================
   ADMIN - GET SERVICES
========================================================= */

export const getAdminServices = async (req: AuthRequest, res: Response) => {
  try {
    const services = await prisma.service.findMany({
      include: {
        business: {
          select: {
            id: true,
            slug: true,
            name: true,
            logoUrl: true,
          },
        },

        _count: {
          select: {
            bookings: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      services,
    });
  } catch (error) {
    console.error("getAdminServices:", error);

    return res.status(500).json({
      error: "Failed to fetch admin services",
    });
  }
};

/* =========================================================
   ADMIN - CREATE SERVICE
========================================================= */

export const createAdminService = async (req: AuthRequest, res: Response) => {
  try {
    const title = String(req.body?.title || "").trim();

    const titleSo = String(req.body?.titleSo || "").trim() || null;

    const description = String(req.body?.description || "").trim();

    const descriptionSo = String(req.body?.descriptionSo || "").trim() || null;

    const category = String(req.body?.category || "").trim();

    const subcategory = String(req.body?.subcategory || "").trim() || null;

    const provider = String(req.body?.provider || "").trim();

    const businessId = String(req.body?.businessId || "").trim() || null;

    const priceLabel = String(req.body?.priceLabel || "").trim() || null;

    const priceFrom = toOptionalNumber(req.body?.priceFrom);

    const priceType = String(req.body?.priceType || "").trim() || null;

    const image = String(req.body?.image || "").trim() || null;

    const phone = String(req.body?.phone || "").trim() || null;

    const email = String(req.body?.email || "").trim() || null;

    const website = String(req.body?.website || "").trim() || null;

    const address = String(req.body?.address || "").trim() || null;

    const city = String(req.body?.city || "").trim() || null;

    const state = String(req.body?.state || "").trim() || null;

    const postalCode = String(req.body?.postalCode || "").trim() || null;

    const country = String(req.body?.country || "US").trim() || "US";

    const availabilityMode =
      String(req.body?.availabilityMode || "contact").trim() || "contact";

    if (!title || !description || !category || !provider) {
      return res.status(400).json({
        error: "title, description, category and provider are required",
      });
    }

    if (priceFrom !== null && priceFrom < 0) {
      return res.status(400).json({
        error: "priceFrom cannot be negative",
      });
    }

    if (businessId) {
      const business = await prisma.business.findUnique({
        where: {
          id: businessId,
        },

        select: {
          id: true,
        },
      });

      if (!business) {
        return res.status(400).json({
          error: "Invalid businessId",
        });
      }
    }

    const galleryInput = normalizeStringArray(req.body?.gallery);

    const serviceArea = normalizeStringArray(req.body?.serviceArea);

    const latitude = toOptionalNumber(req.body?.latitude);

    const longitude = toOptionalNumber(req.body?.longitude);

    const featuredUntil = toOptionalDate(req.body?.featuredUntil);

    const mode = String(req.body?.mode || "")
      .trim()
      .toLowerCase();

    const publishFlag =
      mode === "publish" || toBoolean(req.body?.published, false);

    const service = await prisma.$transaction(async (transaction) => {
      const created = await transaction.service.create({
        data: {
          title,
          titleSo,

          description,
          descriptionSo,

          category,
          subcategory,

          provider,
          businessId,

          priceLabel,
          priceFrom,
          priceType,

          image,

          gallery:
            galleryInput.length > 0 ? galleryInput : image ? [image] : [],

          phone,
          email,
          website,

          address,
          city,
          state,
          postalCode,
          country,

          latitude,
          longitude,

          serviceArea,

          remoteAvailable: toBoolean(req.body?.remoteAvailable, false),

          availabilityMode,

          rating: Math.max(0, toNumber(req.body?.rating, 0)),

          reviewsCount: Math.max(
            0,
            toNumber(req.body?.reviewsCount ?? req.body?.reviews, 0),
          ),

          viewsCount: Math.max(0, toNumber(req.body?.viewsCount, 0)),

          verified: toBoolean(req.body?.verified, false),

          featured: toBoolean(req.body?.featured, false),

          featuredUntil,

          published: publishFlag,

          active: toBoolean(req.body?.active, true),
        },
      });

      return transaction.service.update({
        where: {
          id: created.id,
        },

        data: {
          slug: createStableSlug(created.title, created.id, "service"),
        },
      });
    });

    void invalidateCacheByPrefix(["services:list", "services:detail"]);

    return res.status(201).json(service);
  } catch (error) {
    console.error("createAdminService:", error);

    return res.status(500).json({
      error: "Failed to create service",
    });
  }
};

/* =========================================================
   ADMIN - UPDATE SERVICE
========================================================= */

export const updateAdminService = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.service.findUnique({
      where: {
        id,
      },
    });

    if (!existing) {
      return res.status(404).json({
        error: "Service not found",
      });
    }

    /*
     * Validate business before changing
     * the relation.
     */
    let businessId: string | null | undefined = undefined;

    if (req.body?.businessId !== undefined) {
      const requestedBusinessId = String(req.body.businessId || "").trim();

      if (!requestedBusinessId) {
        businessId = null;
      } else {
        const business = await prisma.business.findUnique({
          where: {
            id: requestedBusinessId,
          },

          select: {
            id: true,
          },
        });

        if (!business) {
          return res.status(400).json({
            error: "Invalid businessId",
          });
        }

        businessId = requestedBusinessId;
      }
    }

    const nextImage =
      req.body?.image !== undefined
        ? String(req.body.image || "").trim() || null
        : existing.image;

    const galleryInput =
      req.body?.gallery !== undefined
        ? normalizeStringArray(req.body.gallery)
        : existing.gallery;

    const serviceArea =
      req.body?.serviceArea !== undefined
        ? normalizeStringArray(req.body.serviceArea)
        : undefined;

    const availabilityMode =
      req.body?.availabilityMode !== undefined
        ? String(req.body.availabilityMode || "").trim() || "contact"
        : undefined;

    const mode = String(req.body?.mode || "")
      .trim()
      .toLowerCase();

    let published: boolean | undefined = undefined;

    if (mode === "publish") {
      published = true;
    } else if (mode === "unpublish") {
      published = false;
    } else if (req.body?.published !== undefined) {
      published = toBoolean(req.body.published, existing.published);
    }

    let priceFrom: number | null | undefined = undefined;

    if (req.body?.priceFrom !== undefined) {
      priceFrom = toOptionalNumber(req.body.priceFrom);

      if (priceFrom !== null && priceFrom < 0) {
        return res.status(400).json({
          error: "priceFrom cannot be negative",
        });
      }
    }

    let featuredUntil: Date | null | undefined = undefined;

    if (req.body?.featuredUntil !== undefined) {
      featuredUntil = toOptionalDate(req.body.featuredUntil);

      if (req.body.featuredUntil && !featuredUntil) {
        return res.status(400).json({
          error: "featuredUntil must be a valid date",
        });
      }
    }

    const nextTitle =
      typeof req.body?.title === "string" && req.body.title.trim()
        ? req.body.title.trim()
        : existing.title;

    const generatedSlug = slugWhenMissing(
      existing.slug,
      nextTitle,
      existing.id,
      "service",
    );

    const updated = await prisma.service.update({
      where: {
        id,
      },

      data: {
        title:
          typeof req.body?.title === "string"
            ? req.body.title.trim()
            : undefined,

        titleSo:
          req.body?.titleSo !== undefined
            ? String(req.body.titleSo || "").trim() || null
            : undefined,

        description:
          typeof req.body?.description === "string"
            ? req.body.description.trim()
            : undefined,

        descriptionSo:
          req.body?.descriptionSo !== undefined
            ? String(req.body.descriptionSo || "").trim() || null
            : undefined,

        category:
          typeof req.body?.category === "string"
            ? req.body.category.trim()
            : undefined,

        subcategory:
          req.body?.subcategory !== undefined
            ? String(req.body.subcategory || "").trim() || null
            : undefined,

        provider:
          typeof req.body?.provider === "string"
            ? req.body.provider.trim()
            : undefined,

        businessId,

        priceLabel:
          req.body?.priceLabel !== undefined
            ? String(req.body.priceLabel || "").trim() || null
            : undefined,

        priceFrom,

        priceType:
          req.body?.priceType !== undefined
            ? String(req.body.priceType || "").trim() || null
            : undefined,

        image: nextImage,

        gallery:
          galleryInput.length > 0 ? galleryInput : nextImage ? [nextImage] : [],

        phone:
          req.body?.phone !== undefined
            ? String(req.body.phone || "").trim() || null
            : undefined,

        email:
          req.body?.email !== undefined
            ? String(req.body.email || "").trim() || null
            : undefined,

        website:
          req.body?.website !== undefined
            ? String(req.body.website || "").trim() || null
            : undefined,

        address:
          req.body?.address !== undefined
            ? String(req.body.address || "").trim() || null
            : undefined,

        city:
          req.body?.city !== undefined
            ? String(req.body.city || "").trim() || null
            : undefined,

        state:
          req.body?.state !== undefined
            ? String(req.body.state || "").trim() || null
            : undefined,

        postalCode:
          req.body?.postalCode !== undefined
            ? String(req.body.postalCode || "").trim() || null
            : undefined,

        country:
          req.body?.country !== undefined
            ? String(req.body.country || "").trim() || "US"
            : undefined,

        latitude:
          req.body?.latitude !== undefined
            ? toOptionalNumber(req.body.latitude)
            : undefined,

        longitude:
          req.body?.longitude !== undefined
            ? toOptionalNumber(req.body.longitude)
            : undefined,

        serviceArea,

        remoteAvailable:
          req.body?.remoteAvailable !== undefined
            ? toBoolean(req.body.remoteAvailable, existing.remoteAvailable)
            : undefined,

        availabilityMode,

        rating:
          req.body?.rating !== undefined
            ? Math.max(0, toNumber(req.body.rating, existing.rating))
            : undefined,

        reviewsCount:
          req.body?.reviewsCount !== undefined ||
          req.body?.reviews !== undefined
            ? Math.max(
                0,
                toNumber(
                  req.body?.reviewsCount ?? req.body?.reviews,
                  existing.reviewsCount,
                ),
              )
            : undefined,

        viewsCount:
          req.body?.viewsCount !== undefined
            ? Math.max(0, toNumber(req.body.viewsCount, existing.viewsCount))
            : undefined,

        verified:
          req.body?.verified !== undefined
            ? toBoolean(req.body.verified, existing.verified)
            : undefined,

        featured:
          req.body?.featured !== undefined
            ? toBoolean(req.body.featured, existing.featured)
            : undefined,

        featuredUntil,

        published,

        active:
          req.body?.active !== undefined
            ? toBoolean(req.body.active, existing.active)
            : undefined,

        ...(generatedSlug
          ? {
              slug: createStableSlug(nextTitle, existing.id, "service"),
            }
          : {}),
      },
    });

    void invalidateCacheByPrefix(["services:list", "services:detail"]);

    return res.json(updated);
  } catch (error) {
    console.error("updateAdminService:", error);

    return res.status(500).json({
      error: "Failed to update service",
    });
  }
};

/* =========================================================
   ADMIN - DELETE SERVICE
========================================================= */

export const deleteAdminService = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.service.findUnique({
      where: {
        id,
      },
    });

    if (!existing) {
      return res.status(404).json({
        error: "Service not found",
      });
    }

    await prisma.service.delete({
      where: {
        id,
      },
    });

    void invalidateCacheByPrefix(["services:list", "services:detail"]);

    return res.json({
      message: "Service deleted successfully",
    });
  } catch (error) {
    console.error("deleteAdminService:", error);

    return res.status(500).json({
      error: "Failed to delete service",
    });
  }
};

/* =========================================================
   ADMIN - GET BOOKINGS
========================================================= */

export const getAdminServiceBookings = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const bookings = await prisma.serviceBooking.findMany({
      include: {
        service: {
          select: {
            id: true,
            slug: true,
            title: true,
            category: true,
            provider: true,
            priceLabel: true,
            priceFrom: true,
            priceType: true,
            image: true,
          },
        },

        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      bookings,
    });
  } catch (error) {
    console.error("getAdminServiceBookings:", error);

    return res.status(500).json({
      error: "Failed to fetch admin bookings",
    });
  }
};

/* =========================================================
   ADMIN - UPDATE BOOKING STATUS
========================================================= */

export const updateAdminServiceBookingStatus = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const { id } = req.params;

    const status = String(req.body?.status || "")
      .trim()
      .toLowerCase();

    const allowedStatuses = [
      "pending",
      "confirmed",
      "in_progress",
      "completed",
      "cancelled",
    ];

    if (!status) {
      return res.status(400).json({
        error: "status is required",
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        error: "Invalid booking status",
      });
    }

    const updated = await prisma.serviceBooking.update({
      where: {
        id,
      },

      data: {
        status,
      },
    });

    return res.json(updated);
  } catch (error: any) {
    console.error("updateAdminServiceBookingStatus:", error);

    if (error.code === "P2025") {
      return res.status(404).json({
        error: "Booking not found",
      });
    }

    return res.status(500).json({
      error: "Failed to update booking status",
    });
  }
};
