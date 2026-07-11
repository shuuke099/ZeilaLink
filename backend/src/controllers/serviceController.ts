import { Response } from 'express';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { cacheGetOrSet, invalidateCacheByPrefix, makeCacheKey } from '../utils/cache';

const normalizeStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const toNumber = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parsePriceLabelToCents = (priceLabel: string) => {
  const numeric = Number(String(priceLabel || '').replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return null;
  }
  return Math.round(numeric * 100);
};

const getStripeSecretKey = () => {
  const existing = (process.env.STRIPE_SECRET_KEY || '').trim();
  if (existing) {
    return existing;
  }

  const localEnvPath = path.join(process.cwd(), '.env');
  const rootEnvPath = path.join(process.cwd(), '..', '.env');
  const candidate = fs.existsSync(localEnvPath) ? localEnvPath : rootEnvPath;

  dotenv.config({ path: candidate });
  return (process.env.STRIPE_SECRET_KEY || '').trim();
};

type BookingInput = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  responsibleFullName: string;
  serviceDateTime: Date;
  isRemote: boolean;
  locationAddress: string | null;
  notes: string | null;
};

const parseBookingInput = (
  body: any,
  fallbackUser: { name?: string | null; email?: string | null; phone?: string | null } | null,
) => {
  const customerName = String(body?.customerName || fallbackUser?.name || '').trim();
  const customerEmail = String(body?.customerEmail || fallbackUser?.email || '').trim();
  const customerPhone = String(body?.customerPhone || fallbackUser?.phone || '').trim();
  const responsibleFullName = String(body?.responsibleFullName || '').trim();
  const serviceDateTimeRaw = String(body?.serviceDateTime || '').trim();
  const serviceDateTime = new Date(serviceDateTimeRaw);
  const locationMode = String(body?.locationMode || 'onsite').trim().toLowerCase();
  const isRemote = locationMode === 'remote';
  const locationAddress = String(body?.locationAddress || '').trim();
  const notes = typeof body?.notes === 'string' ? body.notes.trim() : '';

  if (!customerName || !customerEmail) {
    return { error: 'Login name and email are required.' };
  }

  if (!customerPhone) {
    return { error: 'Phone number is required.' };
  }

  if (!responsibleFullName) {
    return { error: 'Full name responsible for the booking is required.' };
  }

  if (!serviceDateTimeRaw || Number.isNaN(serviceDateTime.getTime())) {
    return { error: 'A valid service date and time is required.' };
  }

  if (!isRemote && !locationAddress) {
    return { error: 'Location address is required for on-site services.' };
  }

  const bookingInput: BookingInput = {
    customerName,
    customerEmail,
    customerPhone,
    responsibleFullName,
    serviceDateTime,
    isRemote,
    locationAddress: isRemote ? null : locationAddress,
    notes: notes || null,
  };

  return { bookingInput };
};

export const getServices = async (req: AuthRequest, res: Response) => {
  try {
    const { category, search, page = 1, limit = 50 } = req.query;
    const pageNum = Math.max(1, toNumber(page, 1));
    const limitNum = Math.min(100, Math.max(1, toNumber(limit, 50)));

    const where: any = { published: true };

    if (typeof category === 'string' && category.trim()) {
      where.category = category.trim();
    }

    if (typeof search === 'string' && search.trim()) {
      where.OR = [
        { title: { contains: search.trim(), mode: 'insensitive' } },
        { provider: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    const loadServices = async () => {
      const [services, total, categories] = await Promise.all([
        prisma.service.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (pageNum - 1) * limitNum,
          take: limitNum,
        }),
        prisma.service.count({ where }),
        prisma.service.findMany({
          where: { published: true },
          select: { category: true },
          distinct: ['category'],
          orderBy: { category: 'asc' },
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

    const cacheKey = makeCacheKey('services:list', req.query as Record<string, unknown>);
    const result = await cacheGetOrSet(cacheKey, 60, loadServices);

    res.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=120');
    res.set('X-Cache', result.hit ? 'HIT' : 'MISS');
    return res.json(result.value);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch services' });
  }
};

export const getServiceById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await cacheGetOrSet(`services:detail:${id}`, 60, () =>
      prisma.service.findFirst({
        where: {
          id,
          published: true,
        },
      }),
    );

    if (!result.value) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=120');
    res.set('X-Cache', result.hit ? 'HIT' : 'MISS');
    return res.json(result.value);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch service' });
  }
};

export const createServiceBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const service = await prisma.service.findFirst({
      where: { id, published: true },
      select: { id: true, title: true },
    });

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { name: true, email: true, phone: true },
    });

    const parsed = parseBookingInput(req.body, user);
    if ('error' in parsed) {
      return res.status(400).json({ error: parsed.error });
    }

    const { bookingInput } = parsed;

    const booking = await prisma.serviceBooking.create({
      data: {
        serviceId: service.id,
        userId: req.user!.id,
        customerName: bookingInput.customerName,
        customerEmail: bookingInput.customerEmail,
        customerPhone: bookingInput.customerPhone,
        responsibleFullName: bookingInput.responsibleFullName,
        serviceDateTime: bookingInput.serviceDateTime,
        isRemote: bookingInput.isRemote,
        locationAddress: bookingInput.locationAddress,
        notes: bookingInput.notes,
      },
    });

    return res.status(201).json({
      message: 'Service booked successfully',
      booking,
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Duplicate booking detected' });
    }
    return res.status(500).json({ error: error.message || 'Failed to create booking' });
  }
};

export const createServiceBookingCheckoutSession = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const stripeSecretKey = getStripeSecretKey();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const currency = (process.env.STRIPE_CURRENCY || 'usd').toLowerCase();

    if (!stripeSecretKey) {
      return res.status(503).json({ error: 'Stripe is not configured. Missing STRIPE_SECRET_KEY.' });
    }

    const service = await prisma.service.findFirst({
      where: { id, published: true },
      select: { id: true, title: true, priceLabel: true },
    });

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const unitAmount = parsePriceLabelToCents(service.priceLabel);
    if (!unitAmount) {
      return res.status(400).json({ error: 'Invalid service price. Unable to create Stripe checkout session.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { name: true, email: true, phone: true },
    });

    const parsed = parseBookingInput(req.body, user);
    if ('error' in parsed) {
      return res.status(400).json({ error: parsed.error });
    }

    const { bookingInput } = parsed;

    const form = new URLSearchParams();
    form.append('mode', 'payment');
    form.append('success_url', `${frontendUrl}/services/${service.id}?booking=success&session_id={CHECKOUT_SESSION_ID}`);
    form.append('cancel_url', `${frontendUrl}/services/${service.id}?booking=cancelled`);
    form.append('customer_email', bookingInput.customerEmail);
    form.append('payment_intent_data[description]', `Service booking for ${service.title}`);
    form.append('line_items[0][price_data][currency]', currency);
    form.append('line_items[0][price_data][unit_amount]', String(unitAmount));
    form.append('line_items[0][price_data][product_data][name]', service.title);
    form.append('line_items[0][quantity]', '1');
    form.append('metadata[serviceId]', service.id);
    form.append('metadata[userId]', req.user!.id);
    form.append('metadata[responsibleFullName]', bookingInput.responsibleFullName);
    form.append('metadata[serviceDateTime]', bookingInput.serviceDateTime.toISOString());
    form.append('metadata[locationMode]', bookingInput.isRemote ? 'remote' : 'onsite');
    if (bookingInput.locationAddress) {
      form.append('metadata[locationAddress]', bookingInput.locationAddress);
    }

    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form,
    });

    if (!stripeResponse.ok) {
      const stripeErrorText = await stripeResponse.text();
      return res.status(502).json({
        error: 'Failed to create Stripe checkout session.',
        details: stripeErrorText,
      });
    }

    const stripeSession = await stripeResponse.json() as { id?: string; url?: string };
    if (!stripeSession.id || !stripeSession.url) {
      return res.status(502).json({ error: 'Stripe did not return a checkout URL.' });
    }

    const booking = await prisma.serviceBooking.create({
      data: {
        serviceId: service.id,
        userId: req.user!.id,
        customerName: bookingInput.customerName,
        customerEmail: bookingInput.customerEmail,
        customerPhone: bookingInput.customerPhone,
        responsibleFullName: bookingInput.responsibleFullName,
        serviceDateTime: bookingInput.serviceDateTime,
        isRemote: bookingInput.isRemote,
        locationAddress: bookingInput.locationAddress,
        notes: bookingInput.notes,
        stripeCheckoutSessionId: stripeSession.id,
        paymentStatus: 'checkout_started',
      },
    });

    return res.status(201).json({
      checkoutUrl: stripeSession.url,
      bookingId: booking.id,
      message: 'Checkout session created successfully.',
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to create checkout session' });
  }
};

export const getMyServiceBookings = async (req: AuthRequest, res: Response) => {
  try {
    const bookings = await prisma.serviceBooking.findMany({
      where: { userId: req.user!.id },
      include: {
        service: {
          select: {
            id: true,
            title: true,
            category: true,
            provider: true,
            priceLabel: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ bookings });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch bookings' });
  }
};

export const confirmServiceBookingPayment = async (req: AuthRequest, res: Response) => {
  try {
    const stripeSecretKey = getStripeSecretKey();
    const sessionId = String(req.body?.sessionId || '').trim();

    if (!stripeSecretKey) {
      return res.status(503).json({ error: 'Stripe is not configured. Missing STRIPE_SECRET_KEY.' });
    }

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required.' });
    }

    const stripeResponse = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
      },
    });

    if (!stripeResponse.ok) {
      const stripeErrorText = await stripeResponse.text();
      return res.status(502).json({
        error: 'Failed to verify Stripe checkout session.',
        details: stripeErrorText,
      });
    }

    const session = await stripeResponse.json() as { payment_status?: string };
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Payment is not completed yet.' });
    }

    const booking = await prisma.serviceBooking.findFirst({
      where: {
        stripeCheckoutSessionId: sessionId,
        userId: req.user!.id,
      },
      select: { id: true },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found for this Stripe session.' });
    }

    const updated = await prisma.serviceBooking.update({
      where: { id: booking.id },
      data: {
        paymentStatus: 'paid',
        status: 'confirmed',
      },
      include: {
        service: {
          select: {
            id: true,
            title: true,
            category: true,
            provider: true,
            priceLabel: true,
            image: true,
          },
        },
      },
    });

    return res.json({ booking: updated, message: 'Payment confirmed successfully.' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to confirm payment' });
  }
};

export const getAdminServices = async (req: AuthRequest, res: Response) => {
  try {
    const services = await prisma.service.findMany({
      include: {
        _count: {
          select: { bookings: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ services });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch admin services' });
  }
};

export const createAdminService = async (req: AuthRequest, res: Response) => {
  try {
    const title = String(req.body?.title || '').trim();
    const titleSo = String(req.body?.titleSo || '').trim();
    const category = String(req.body?.category || '').trim();
    const provider = String(req.body?.provider || '').trim();
    const priceLabel = String(req.body?.priceLabel || '').trim();
    const image = String(req.body?.image || '').trim();
    const description = String(req.body?.description || '').trim();
    const descriptionSo = String(req.body?.descriptionSo || '').trim();
    const availabilityMode = String(req.body?.availabilityMode || 'instant_booking').trim() || 'instant_booking';
    const slaResponse = String(req.body?.slaResponse || '').trim();
    const mode = String(req.body?.mode || '').trim().toLowerCase();
    const publishFlag = mode === 'publish' || req.body?.published === true || req.body?.published === 'true';

    if (!title || !category || !provider || !priceLabel || !image || !description) {
      return res.status(400).json({ error: 'title, category, provider, priceLabel, image and description are required' });
    }

    const galleryInput = normalizeStringArray(req.body?.gallery);
    const attachments = normalizeStringArray(req.body?.attachments);
    const includes = normalizeStringArray(req.body?.includes);
    const highlights = normalizeStringArray(req.body?.highlights);
    const advancedConfig = (req.body?.advancedConfig && typeof req.body.advancedConfig === 'object')
      ? req.body.advancedConfig
      : {};

    const service = await prisma.service.create({
      data: {
        title,
        titleSo: titleSo || null,
        category,
        provider,
        rating: toNumber(req.body?.rating, 0),
        reviews: Math.max(0, toNumber(req.body?.reviews, 0)),
        priceLabel,
        image,
        badge: String(req.body?.badge || category).trim(),
        description,
        descriptionSo: descriptionSo || null,
        availabilityMode,
        slaResponse: slaResponse || null,
        gallery: galleryInput.length > 0 ? galleryInput : [image],
        attachments,
        advancedConfig,
        includes,
        highlights,
        packageName: String(req.body?.packageName || '').trim() || null,
        packageDescription: String(req.body?.packageDescription || '').trim() || null,
        revisions: String(req.body?.revisions || '').trim() || null,
        deliveryTime: String(req.body?.deliveryTime || '').trim() || null,
        support: String(req.body?.support || '').trim() || null,
        expertName: String(req.body?.expertName || '').trim() || null,
        expertRole: String(req.body?.expertRole || '').trim() || null,
        expertImage: String(req.body?.expertImage || '').trim() || null,
        published: publishFlag,
      },
    });

    void invalidateCacheByPrefix(['services:list', 'services:detail']);
    return res.status(201).json(service);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to create service' });
  }
};

export const updateAdminService = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.service.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const nextImage = typeof req.body?.image === 'string' && req.body.image.trim()
      ? req.body.image.trim()
      : existing.image;

    const galleryInput = req.body?.gallery !== undefined
      ? normalizeStringArray(req.body.gallery)
      : existing.gallery;
    const attachmentsInput = req.body?.attachments !== undefined
      ? normalizeStringArray(req.body.attachments)
      : existing.attachments;
    const availabilityMode = req.body?.availabilityMode !== undefined
      ? String(req.body.availabilityMode || '').trim() || 'instant_booking'
      : undefined;
    const slaResponse = req.body?.slaResponse !== undefined
      ? String(req.body.slaResponse || '').trim() || null
      : undefined;
    const mode = String(req.body?.mode || '').trim().toLowerCase();
    const publishFlag = mode === 'publish' || req.body?.published === true || req.body?.published === 'true';

    const updated = await prisma.service.update({
      where: { id },
      data: {
        title: typeof req.body?.title === 'string' ? req.body.title.trim() : undefined,
        titleSo: req.body?.titleSo !== undefined ? String(req.body.titleSo || '').trim() || null : undefined,
        category: typeof req.body?.category === 'string' ? req.body.category.trim() : undefined,
        provider: typeof req.body?.provider === 'string' ? req.body.provider.trim() : undefined,
        rating: req.body?.rating !== undefined ? toNumber(req.body.rating, existing.rating) : undefined,
        reviews: req.body?.reviews !== undefined ? Math.max(0, toNumber(req.body.reviews, existing.reviews)) : undefined,
        priceLabel: typeof req.body?.priceLabel === 'string' ? req.body.priceLabel.trim() : undefined,
        image: nextImage,
        badge: typeof req.body?.badge === 'string' ? req.body.badge.trim() : undefined,
        description: typeof req.body?.description === 'string' ? req.body.description.trim() : undefined,
        descriptionSo: req.body?.descriptionSo !== undefined ? String(req.body.descriptionSo || '').trim() || null : undefined,
        availabilityMode,
        slaResponse,
        gallery: galleryInput.length > 0 ? galleryInput : [nextImage],
        attachments: attachmentsInput,
        advancedConfig: req.body?.advancedConfig !== undefined ? req.body.advancedConfig : undefined,
        includes: req.body?.includes !== undefined ? normalizeStringArray(req.body.includes) : undefined,
        highlights: req.body?.highlights !== undefined ? normalizeStringArray(req.body.highlights) : undefined,
        packageName: req.body?.packageName !== undefined ? String(req.body.packageName || '').trim() || null : undefined,
        packageDescription: req.body?.packageDescription !== undefined ? String(req.body.packageDescription || '').trim() || null : undefined,
        revisions: req.body?.revisions !== undefined ? String(req.body.revisions || '').trim() || null : undefined,
        deliveryTime: req.body?.deliveryTime !== undefined ? String(req.body.deliveryTime || '').trim() || null : undefined,
        support: req.body?.support !== undefined ? String(req.body.support || '').trim() || null : undefined,
        expertName: req.body?.expertName !== undefined ? String(req.body.expertName || '').trim() || null : undefined,
        expertRole: req.body?.expertRole !== undefined ? String(req.body.expertRole || '').trim() || null : undefined,
        expertImage: req.body?.expertImage !== undefined ? String(req.body.expertImage || '').trim() || null : undefined,
        published: req.body?.published !== undefined || mode
          ? publishFlag
          : undefined,
      },
    });

    void invalidateCacheByPrefix(['services:list', 'services:detail']);
    return res.json(updated);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to update service' });
  }
};

export const deleteAdminService = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.service.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Service not found' });
    }

    await prisma.service.delete({ where: { id } });
    void invalidateCacheByPrefix(['services:list', 'services:detail']);
    return res.json({ message: 'Service deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to delete service' });
  }
};

export const getAdminServiceBookings = async (req: AuthRequest, res: Response) => {
  try {
    const bookings = await prisma.serviceBooking.findMany({
      include: {
        service: {
          select: {
            id: true,
            title: true,
            category: true,
            provider: true,
            priceLabel: true,
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
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ bookings });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch admin bookings' });
  }
};

export const updateAdminServiceBookingStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const status = String(req.body?.status || '').trim().toLowerCase();

    if (!status) {
      return res.status(400).json({ error: 'status is required' });
    }

    const updated = await prisma.serviceBooking.update({
      where: { id },
      data: { status },
    });

    return res.json(updated);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Booking not found' });
    }
    return res.status(500).json({ error: error.message || 'Failed to update booking status' });
  }
};
