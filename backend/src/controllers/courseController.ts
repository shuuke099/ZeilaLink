import { Response } from "express";
import prisma from "../config/database";
import { AuthRequest } from "../middleware/auth";
import { recordAuditEvent, requestAuditMeta } from "../utils/audit";
import {
  cacheGetOrSet,
  invalidateCacheByPrefix,
  makeCacheKey,
} from "../utils/cache";
import { createStableSlug, slugWhenMissing } from "../utils/slug";

const COURSE_WRITE_FIELDS = new Set([
  "name",
  "nameSo",
  "description",
  "descriptionSo",
  "category",
  "level",
  "duration",
  "durationSo",
  "deliveryMode",
  "address",
  "city",
  "state",
  "postalCode",
  "country",
  "timezone",
  "onlineUrl",
  "startDate",
  "endDate",
  "registrationDeadline",
  "schedule",
  "scheduleSo",
  "cost",
  "currency",
  "enrollmentUrl",
  "enrollmentOpen",
  "imageUrl",
  "gallery",
  "providesCertificate",
  "certificateUrl",
  "published",
  "featured",
  "featuredUntil",
  "skillIds",
]);

const hasOwn = (value: Record<string, unknown>, key: string) =>
  Object.prototype.hasOwnProperty.call(value, key);

const parseBooleanInput = (value: unknown): boolean | undefined => {
  if (value === true || value === "true" || value === "1") return true;
  if (value === false || value === "false" || value === "0") return false;
  return undefined;
};

const getWritePayload = (body: unknown): Record<string, unknown> | null => {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  return body as Record<string, unknown>;
};

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

const normalizeOptionalString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  return value.trim() || null;
};

const normalizeOptionalUrl = (value: unknown): string | null | undefined => {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || value.length > 2048) return undefined;

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (
    trimmed.startsWith("/") &&
    !trimmed.startsWith("//") &&
    !trimmed.includes("\\")
  ) {
    return trimmed;
  }

  try {
    return new URL(trimmed).protocol === "https:" ? trimmed : undefined;
  } catch {
    return undefined;
  }
};

const parseOptionalDate = (value: unknown): Date | null | undefined => {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" && !(value instanceof Date)) return undefined;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const parseStringArray = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) return undefined;

  const values = value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (values.length !== value.length) return undefined;
  return Array.from(new Set(values));
};

const providerAccountIsEligible = (provider: {
  contactUserId: string | null;
  user: { isVerified: boolean } | null;
}) => provider.contactUserId === null || provider.user?.isVerified === true;

const recordCourseEvent = (
  req: AuthRequest,
  action: string,
  resourceId: string | null,
  result: "success" | "denied",
  meta: Record<string, unknown> = {},
) => {
  if (result === "denied") req.authorizationDenialAudited = true;

  recordAuditEvent({
    userId: req.user?.id || null,
    action,
    resourceType: "course",
    resourceId: resourceId ? resourceId.slice(0, 128) : null,
    meta: { ...requestAuditMeta(req), ...meta, result },
  });
};

const courseInclude = {
  provider: {
    select: {
      id: true,
      slug: true,
      contactUserId: true,
      name: true,
      nameSo: true,
      description: true,
      descriptionSo: true,
      logoUrl: true,
      website: true,
      phone: true,
      email: true,
      address: true,
      city: true,
      state: true,
      postalCode: true,
      country: true,
      rating: true,
      verified: true,
      user: { select: { isVerified: true } },
    },
  },
  skills: {
    include: { skill: true },
  },
  _count: {
    select: { userCertifications: true },
  },
} as const;

const presentCourse = (course: any) => ({
  ...course,
  provider: {
    id: course.provider.id,
    slug: course.provider.slug,
    name: course.provider.name,
    nameSo: course.provider.nameSo,
    description: course.provider.description,
    descriptionSo: course.provider.descriptionSo,
    logoUrl: course.provider.logoUrl,
    website: course.provider.website,
    phone: course.provider.phone,
    email: course.provider.email,
    address: course.provider.address,
    city: course.provider.city,
    state: course.provider.state,
    postalCode: course.provider.postalCode,
    country: course.provider.country,
    rating: course.provider.rating,
    verified: course.provider.verified,
  },
  skills: course.skills.map((entry: any) => entry.skill),
});

const publicProviderWhere = {
  verified: true,
  OR: [{ contactUserId: null }, { user: { is: { isVerified: true } } }],
};

const syncCourseSkills = async (
  transaction: any,
  courseId: string,
  skillIds: string[],
) => {
  const uniqueSkillIds = Array.from(new Set(skillIds));

  if (uniqueSkillIds.length > 0) {
    const count = await transaction.skill.count({
      where: { id: { in: uniqueSkillIds } },
    });

    if (count !== uniqueSkillIds.length) throw new Error("INVALID_SKILL_IDS");
  }

  await transaction.courseSkill.deleteMany({ where: { courseId } });

  if (uniqueSkillIds.length > 0) {
    await transaction.courseSkill.createMany({
      data: uniqueSkillIds.map((skillId) => ({ courseId, skillId })),
      skipDuplicates: true,
    });
  }
};

export const getCourses = async (req: AuthRequest, res: Response) => {
  try {
    const {
      search,
      skillId,
      category,
      level,
      deliveryMode,
      page = 1,
      limit = 20,
      all,
      mine,
      featured,
    } = req.query as any;

    const pageNumber = boundedPositiveInteger(page, 1, 1_000_000);
    const pageSize = boundedPositiveInteger(limit, 20, 100);
    const skip = (pageNumber - 1) * pageSize;

    const where: any = {};
    let requirePublished = true;

    const wantsMine = mine === "true" || mine === true;
    const wantsAll = all === "true" || all === true;

    const requestedProviderId =
      typeof (req.query as any).providerId === "string"
        ? String((req.query as any).providerId).trim() || undefined
        : undefined;

    let effectiveProviderId = requestedProviderId;

    if (req.user?.role === "provider" && (wantsMine || wantsAll)) {
      const provider = await prisma.provider.findUnique({
        where: { contactUserId: req.user.id },
        select: { id: true },
      });

      if (!provider) {
        return res.json({
          courses: [],
          pagination: { total: 0, page: pageNumber, limit: pageSize, pages: 0 },
        });
      }

      effectiveProviderId = provider.id;
      requirePublished = false;
    } else if (wantsMine && (!req.user || req.user.role !== "provider")) {
      return res.json({
        courses: [],
        pagination: { total: 0, page: pageNumber, limit: pageSize, pages: 0 },
      });
    }

    if (req.user?.role === "admin" && wantsAll) requirePublished = false;

    if (requirePublished) {
      where.published = true;
      where.provider = publicProviderWhere;
    }

    if (typeof search === "string" && search.trim()) {
      const query = search.trim().slice(0, 200);

      const searchFilter = {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { nameSo: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { descriptionSo: { contains: query, mode: "insensitive" } },
          { duration: { contains: query, mode: "insensitive" } },
          { durationSo: { contains: query, mode: "insensitive" } },
          { category: { contains: query, mode: "insensitive" } },
          { level: { contains: query, mode: "insensitive" } },
          {
            provider: {
              is: {
                OR: [
                  { name: { contains: query, mode: "insensitive" } },
                  { nameSo: { contains: query, mode: "insensitive" } },
                  { description: { contains: query, mode: "insensitive" } },
                  { descriptionSo: { contains: query, mode: "insensitive" } },
                ],
              },
            },
          },
          {
            skills: {
              some: {
                skill: {
                  is: {
                    OR: [
                      { name: { contains: query, mode: "insensitive" } },
                      { description: { contains: query, mode: "insensitive" } },
                      { category: { contains: query, mode: "insensitive" } },
                    ],
                  },
                },
              },
            },
          },
        ],
      };

      if (where.provider) {
        where.AND = [{ provider: where.provider }, searchFilter];
        delete where.provider;
      } else {
        Object.assign(where, searchFilter);
      }
    }

    if (effectiveProviderId) where.providerId = effectiveProviderId;

    if (typeof skillId === "string" && skillId.trim()) {
      where.skills = { some: { skillId: skillId.trim() } };
    }

    if (typeof category === "string" && category.trim()) {
      where.category = { equals: category.trim(), mode: "insensitive" };
    }

    if (typeof level === "string" && level.trim()) {
      where.level = { equals: level.trim(), mode: "insensitive" };
    }

    if (typeof deliveryMode === "string" && deliveryMode.trim()) {
      where.deliveryMode = deliveryMode.trim();
    }

    if (featured === "true" || featured === true) {
      where.featured = true;

      const featuredFilter = {
        OR: [{ featuredUntil: null }, { featuredUntil: { gt: new Date() } }],
      };

      if (where.AND) {
        where.AND.push(featuredFilter);
      } else if (where.OR) {
        const existingOr = where.OR;
        delete where.OR;
        where.AND = [{ OR: existingOr }, featuredFilter];
      } else {
        Object.assign(where, featuredFilter);
      }
    }

    const loadCourses = async () => {
      const [courses, total] = await Promise.all([
        prisma.course.findMany({
          where,
          include: courseInclude,
          skip,
          take: pageSize,
          orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
        }),
        prisma.course.count({ where }),
      ]);

      return {
        courses: courses.map(presentCourse),
        pagination: {
          total,
          page: pageNumber,
          limit: pageSize,
          pages: Math.ceil(total / pageSize),
        },
      };
    };

    const publicCacheable = requirePublished && !mine && !all;
    const cacheKey = makeCacheKey(
      "courses:list",
      req.query as Record<string, unknown>,
    );

    const result = publicCacheable
      ? await cacheGetOrSet(cacheKey, 30, loadCourses)
      : { value: await loadCourses(), hit: false };

    res.set(
      "Cache-Control",
      publicCacheable
        ? "public, max-age=15, stale-while-revalidate=60"
        : "private, no-store",
    );

    res.set(
      "X-Cache",
      publicCacheable ? (result.hit ? "HIT" : "MISS") : "BYPASS",
    );

    return res.json(result.value);
  } catch (error: any) {
    console.error("[Courses] List failed", {
      errorType: typeof error?.name === "string" ? error.name : "Error",
      code: typeof error?.code === "string" ? error.code : undefined,
    });

    return res.status(500).json({ error: "Failed to load courses" });
  }
};

export const getCourseById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const course = await prisma.course.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: courseInclude,
    });

    if (!course) return res.status(404).json({ error: "Course not found" });

    const publiclyVisible =
      course.published &&
      course.provider.verified &&
      providerAccountIsEligible(course.provider);

    if (!publiclyVisible) {
      const canViewDraft =
        req.user?.role === "admin" ||
        (req.user?.role === "provider" &&
          course.provider.contactUserId === req.user.id);

      if (!canViewDraft) {
        recordCourseEvent(req, "course.read", id, "denied", {
          reason: "published_approved_provider_or_ownership_required",
        });

        return res.status(404).json({ error: "Course not found" });
      }

      res.set("Cache-Control", "private, no-store");
    } else {
      res.set(
        "Cache-Control",
        "public, max-age=30, stale-while-revalidate=120",
      );
    }

    return res.json({ course: presentCourse(course) });
  } catch {
    return res.status(500).json({ error: "Failed to load course" });
  }
};

export const createCourse = async (req: AuthRequest, res: Response) => {
  try {
    const payload = getWritePayload(req.body);
    if (!payload)
      return res.status(400).json({ error: "Invalid course payload" });

    const unsupportedFields = Object.keys(payload).filter(
      (field) => !COURSE_WRITE_FIELDS.has(field),
    );

    if (unsupportedFields.length > 0) {
      return res.status(400).json({
        error: "Unsupported course fields",
        fields: unsupportedFields,
      });
    }

    const name = typeof payload.name === "string" ? payload.name.trim() : "";
    const duration =
      typeof payload.duration === "string" ? payload.duration.trim() : "";
    const description =
      typeof payload.description === "string" ? payload.description.trim() : "";

    if (!name || !duration || !description) {
      return res.status(400).json({
        error: "name, duration and description are required",
      });
    }

    if (name.length > 300) {
      return res.status(400).json({ error: "Course name is too long" });
    }

    const cost = hasOwn(payload, "cost") ? Number(payload.cost) : 0;

    if (!Number.isFinite(cost) || cost < 0) {
      return res
        .status(400)
        .json({ error: "cost must be a non-negative number" });
    }

    const providesCertificate = hasOwn(payload, "providesCertificate")
      ? parseBooleanInput(payload.providesCertificate)
      : false;

    const published = hasOwn(payload, "published")
      ? parseBooleanInput(payload.published)
      : false;

    const featured = hasOwn(payload, "featured")
      ? parseBooleanInput(payload.featured)
      : false;

    const enrollmentOpen = hasOwn(payload, "enrollmentOpen")
      ? parseBooleanInput(payload.enrollmentOpen)
      : true;

    if (
      providesCertificate === undefined ||
      published === undefined ||
      featured === undefined ||
      enrollmentOpen === undefined
    ) {
      return res.status(400).json({
        error: "Boolean course fields must contain valid boolean values",
      });
    }

    const skillIds = hasOwn(payload, "skillIds")
      ? parseStringArray(payload.skillIds)
      : [];

    if (skillIds === undefined) {
      return res
        .status(400)
        .json({ error: "skillIds must be an array of skill IDs" });
    }

    const gallery = hasOwn(payload, "gallery")
      ? parseStringArray(payload.gallery)
      : [];

    if (gallery === undefined) {
      return res
        .status(400)
        .json({ error: "gallery must be an array of URLs" });
    }

    for (const url of gallery) {
      if (normalizeOptionalUrl(url) === undefined) {
        return res.status(400).json({
          error: "Gallery URLs must be HTTPS or safe local paths",
        });
      }
    }

    const urlFields = [
      "onlineUrl",
      "enrollmentUrl",
      "imageUrl",
      "certificateUrl",
    ] as const;

    const normalizedUrls: Record<string, string | null> = {};

    for (const field of urlFields) {
      if (!hasOwn(payload, field)) continue;

      const normalized = normalizeOptionalUrl(payload[field]);

      if (normalized === undefined) {
        return res.status(400).json({
          error: `${field} must be HTTPS or a safe local path`,
        });
      }

      normalizedUrls[field] = normalized;
    }

    const dateFields = [
      "startDate",
      "endDate",
      "registrationDeadline",
      "featuredUntil",
    ] as const;

    const normalizedDates: Record<string, Date | null> = {};

    for (const field of dateFields) {
      if (!hasOwn(payload, field)) continue;

      const parsed = parseOptionalDate(payload[field]);

      if (parsed === undefined) {
        return res.status(400).json({
          error: `${field} must be a valid date or null`,
        });
      }

      normalizedDates[field] = parsed;
    }

    const provider = await prisma.provider.findUnique({
      where: { contactUserId: req.user!.id },
      select: {
        id: true,
        verified: true,
        contactUserId: true,
        user: { select: { isVerified: true } },
      },
    });

    if (!provider) {
      recordCourseEvent(req, "course.create", null, "denied", {
        reason: "provider_profile_required",
      });

      return res.status(403).json({ error: "Provider profile required" });
    }

    if (!provider.verified || !providerAccountIsEligible(provider)) {
      recordCourseEvent(req, "course.create", null, "denied", {
        reason: "verified_approved_provider_required",
      });

      return res.status(403).json({
        error: "Verified and approved provider account required",
      });
    }

    const course = await prisma.$transaction(async (transaction) => {
      const created = await transaction.course.create({
        data: {
          name,
          nameSo: normalizeOptionalString(payload.nameSo),
          description,
          descriptionSo: normalizeOptionalString(payload.descriptionSo),
          providerId: provider.id,
          category: normalizeOptionalString(payload.category),
          level: normalizeOptionalString(payload.level),
          duration,
          durationSo: normalizeOptionalString(payload.durationSo),
          deliveryMode:
            normalizeOptionalString(payload.deliveryMode) || "in_person",
          address: normalizeOptionalString(payload.address),
          city: normalizeOptionalString(payload.city),
          state: normalizeOptionalString(payload.state),
          postalCode: normalizeOptionalString(payload.postalCode),
          country: normalizeOptionalString(payload.country) || "US",
          timezone: normalizeOptionalString(payload.timezone),
          onlineUrl: normalizedUrls.onlineUrl ?? null,
          startDate: normalizedDates.startDate ?? null,
          endDate: normalizedDates.endDate ?? null,
          registrationDeadline: normalizedDates.registrationDeadline ?? null,
          schedule: normalizeOptionalString(payload.schedule),
          scheduleSo: normalizeOptionalString(payload.scheduleSo),
          cost,
          currency: normalizeOptionalString(payload.currency) || "USD",
          enrollmentUrl: normalizedUrls.enrollmentUrl ?? null,
          enrollmentOpen,
          imageUrl: normalizedUrls.imageUrl ?? null,
          gallery,
          providesCertificate,
          certificateUrl: normalizedUrls.certificateUrl ?? null,
          published,
          featured,
          featuredUntil: normalizedDates.featuredUntil ?? null,
        },
      });

      await syncCourseSkills(transaction, created.id, skillIds);

      return transaction.course.update({
        where: { id: created.id },
        data: { slug: createStableSlug(created.name, created.id, "course") },
        include: courseInclude,
      });
    });

    void invalidateCacheByPrefix([
      "courses:list",
      "courses:detail",
      "public:stats",
    ]);

    recordCourseEvent(req, "course.create", course.id, "success", {
      published: course.published,
    });

    if (course.published) {
      recordCourseEvent(req, "course.publish", course.id, "success", {
        source: "create",
      });
    }

    return res.status(201).json(presentCourse(course));
  } catch (error: any) {
    if (error instanceof Error && error.message === "INVALID_SKILL_IDS") {
      return res
        .status(400)
        .json({ error: "One or more skill IDs are invalid" });
    }

    return res.status(500).json({ error: "Failed to create course" });
  }
};

export const updateCourse = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const payload = getWritePayload(req.body);

    if (!payload)
      return res.status(400).json({ error: "Invalid course payload" });

    const unsupportedFields = Object.keys(payload).filter(
      (field) => !COURSE_WRITE_FIELDS.has(field),
    );

    if (unsupportedFields.length > 0) {
      return res.status(400).json({
        error: "Unsupported course fields",
        fields: unsupportedFields,
      });
    }

    const course = await prisma.course.findUnique({
      where: { id },
      include: { provider: true },
    });

    if (!course) return res.status(404).json({ error: "Course not found" });

    const myProvider = await prisma.provider.findUnique({
      where: { contactUserId: req.user!.id },
      select: {
        id: true,
        verified: true,
        contactUserId: true,
        user: { select: { isVerified: true } },
      },
    });

    if (!myProvider || myProvider.id !== course.providerId) {
      recordCourseEvent(req, "course.update", id, "denied", {
        reason: "course_ownership_required",
      });

      return res.status(403).json({ error: "Not authorized" });
    }

    if (!myProvider.verified || !providerAccountIsEligible(myProvider)) {
      recordCourseEvent(req, "course.update", id, "denied", {
        reason: "provider_approval_required",
      });

      return res.status(403).json({ error: "Provider approval required" });
    }

    const updates: any = {};

    for (const field of ["name", "duration", "description"] as const) {
      if (!hasOwn(payload, field)) continue;

      const value =
        typeof payload[field] === "string" ? payload[field].trim() : "";

      if (!value) {
        return res.status(400).json({
          error: `${field} must be a non-empty string`,
        });
      }

      updates[field] = value;
    }

    for (const field of [
      "nameSo",
      "descriptionSo",
      "category",
      "level",
      "durationSo",
      "address",
      "city",
      "state",
      "postalCode",
      "timezone",
      "schedule",
      "scheduleSo",
    ] as const) {
      if (!hasOwn(payload, field)) continue;

      if (payload[field] !== null && typeof payload[field] !== "string") {
        return res.status(400).json({
          error: `${field} must be a string or null`,
        });
      }

      updates[field] = normalizeOptionalString(payload[field]);
    }

    for (const field of ["country", "currency", "deliveryMode"] as const) {
      if (!hasOwn(payload, field)) continue;

      if (typeof payload[field] !== "string" || !payload[field].trim()) {
        return res.status(400).json({
          error: `${field} must be a non-empty string`,
        });
      }

      updates[field] = payload[field].trim();
    }

    if (hasOwn(payload, "cost")) {
      const cost = Number(payload.cost);

      if (!Number.isFinite(cost) || cost < 0) {
        return res.status(400).json({
          error: "cost must be a non-negative number",
        });
      }

      updates.cost = cost;
    }

    for (const field of [
      "providesCertificate",
      "published",
      "featured",
      "enrollmentOpen",
    ] as const) {
      if (!hasOwn(payload, field)) continue;

      const parsed = parseBooleanInput(payload[field]);

      if (parsed === undefined) {
        return res.status(400).json({
          error: `${field} must be a boolean value`,
        });
      }

      updates[field] = parsed;
    }

    for (const field of [
      "onlineUrl",
      "enrollmentUrl",
      "imageUrl",
      "certificateUrl",
    ] as const) {
      if (!hasOwn(payload, field)) continue;

      const normalized = normalizeOptionalUrl(payload[field]);

      if (normalized === undefined) {
        return res.status(400).json({
          error: `${field} must be HTTPS or a safe local path`,
        });
      }

      updates[field] = normalized;
    }

    for (const field of [
      "startDate",
      "endDate",
      "registrationDeadline",
      "featuredUntil",
    ] as const) {
      if (!hasOwn(payload, field)) continue;

      const parsed = parseOptionalDate(payload[field]);

      if (parsed === undefined) {
        return res.status(400).json({
          error: `${field} must be a valid date or null`,
        });
      }

      updates[field] = parsed;
    }

    if (hasOwn(payload, "gallery")) {
      const gallery = parseStringArray(payload.gallery);

      if (gallery === undefined) {
        return res
          .status(400)
          .json({ error: "gallery must be an array of URLs" });
      }

      for (const url of gallery) {
        if (normalizeOptionalUrl(url) === undefined) {
          return res.status(400).json({
            error: "Gallery URLs must be HTTPS or safe local paths",
          });
        }
      }

      updates.gallery = gallery;
    }

    let skillIds: string[] | undefined;

    if (hasOwn(payload, "skillIds")) {
      skillIds = parseStringArray(payload.skillIds);

      if (skillIds === undefined) {
        return res.status(400).json({
          error: "skillIds must be an array of skill IDs",
        });
      }
    }

    const missingSlug = slugWhenMissing(
      course.slug,
      hasOwn(updates, "name") ? updates.name : course.name,
      course.id,
      "course",
    );

    if (missingSlug) updates.slug = missingSlug;

    if (Object.keys(updates).length === 0 && skillIds === undefined) {
      return res
        .status(400)
        .json({ error: "No supported course fields supplied" });
    }

    const updated = await prisma.$transaction(async (transaction) => {
      if (skillIds !== undefined) {
        await syncCourseSkills(transaction, course.id, skillIds);
      }

      return transaction.course.update({
        where: { id },
        data: updates,
        include: courseInclude,
      });
    });

    void invalidateCacheByPrefix([
      "courses:list",
      "courses:detail",
      "public:stats",
    ]);

    recordCourseEvent(req, "course.update", updated.id, "success", {
      fields: [
        ...Object.keys(updates),
        ...(skillIds !== undefined ? ["skillIds"] : []),
      ],
    });

    if (!course.published && updated.published) {
      recordCourseEvent(req, "course.publish", updated.id, "success", {
        source: "update",
      });
    } else if (course.published && !updated.published) {
      recordCourseEvent(req, "course.unpublish", updated.id, "success", {
        source: "update",
      });
    }

    return res.json(presentCourse(updated));
  } catch (error: any) {
    if (error instanceof Error && error.message === "INVALID_SKILL_IDS") {
      return res
        .status(400)
        .json({ error: "One or more skill IDs are invalid" });
    }

    return res.status(500).json({ error: "Failed to update course" });
  }
};

export const deleteCourse = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const course = await prisma.course.findUnique({
      where: { id },
      select: { id: true, providerId: true },
    });

    if (!course) return res.status(404).json({ error: "Course not found" });

    const myProvider = await prisma.provider.findUnique({
      where: { contactUserId: req.user!.id },
      select: {
        id: true,
        verified: true,
        contactUserId: true,
        user: { select: { isVerified: true } },
      },
    });

    if (!myProvider || myProvider.id !== course.providerId) {
      recordCourseEvent(req, "course.delete", id, "denied", {
        reason: "course_ownership_required",
      });

      return res.status(403).json({ error: "Not authorized" });
    }

    if (!myProvider.verified || !providerAccountIsEligible(myProvider)) {
      recordCourseEvent(req, "course.delete", id, "denied", {
        reason: "provider_approval_required",
      });

      return res.status(403).json({ error: "Provider approval required" });
    }

    await prisma.course.delete({ where: { id } });

    void invalidateCacheByPrefix([
      "courses:list",
      "courses:detail",
      "public:stats",
    ]);
    recordCourseEvent(req, "course.delete", id, "success");

    return res.json({ message: "Course deleted" });
  } catch {
    return res.status(500).json({ error: "Failed to delete course" });
  }
};

export const getProviderCertifications = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const provider = await prisma.provider.findUnique({
      where: { contactUserId: req.user!.id },
      select: { id: true, verified: true },
    });

    if (!provider) {
      recordCourseEvent(req, "course.certifications.read", null, "denied", {
        reason: "provider_profile_required",
      });

      return res.status(403).json({ error: "Provider profile required" });
    }

    if (!provider.verified) {
      recordCourseEvent(req, "course.certifications.read", null, "denied", {
        reason: "provider_approval_required",
      });

      return res.status(403).json({ error: "Provider approval required" });
    }

    const certifications = await prisma.userCertification.findMany({
      where: { course: { providerId: provider.id } },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        course: {
          select: {
            id: true,
            slug: true,
            name: true,
            imageUrl: true,
          },
        },
        skill: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { issuedAt: "desc" },
    });

    return res.json({ certifications });
  } catch (error: any) {
    console.error("[Courses] Provider certification list failed", {
      errorType: typeof error?.name === "string" ? error.name : "Error",
      code: typeof error?.code === "string" ? error.code : undefined,
    });

    return res.status(500).json({ error: "Failed to load certifications" });
  }
};

export const adminUpdateCourse = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.course.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Course not found" });

    const payload = getWritePayload(req.body);
    if (!payload)
      return res.status(400).json({ error: "Invalid course payload" });

    const unsupportedFields = Object.keys(payload).filter(
      (field) => !COURSE_WRITE_FIELDS.has(field),
    );

    if (unsupportedFields.length > 0) {
      return res.status(400).json({
        error: "Unsupported course fields",
        fields: unsupportedFields,
      });
    }

    const updates: any = {};

    for (const field of ["name", "duration", "description"] as const) {
      if (!hasOwn(payload, field)) continue;

      const value =
        typeof payload[field] === "string" ? payload[field].trim() : "";

      if (!value) {
        return res.status(400).json({
          error: `${field} must be a non-empty string`,
        });
      }

      updates[field] = value;
    }

    for (const field of [
      "nameSo",
      "descriptionSo",
      "category",
      "level",
      "durationSo",
      "address",
      "city",
      "state",
      "postalCode",
      "timezone",
      "schedule",
      "scheduleSo",
    ] as const) {
      if (!hasOwn(payload, field)) continue;

      if (payload[field] !== null && typeof payload[field] !== "string") {
        return res.status(400).json({
          error: `${field} must be a string or null`,
        });
      }

      updates[field] = normalizeOptionalString(payload[field]);
    }

    for (const field of ["country", "currency", "deliveryMode"] as const) {
      if (!hasOwn(payload, field)) continue;

      if (typeof payload[field] !== "string" || !payload[field].trim()) {
        return res.status(400).json({
          error: `${field} must be a non-empty string`,
        });
      }

      updates[field] = payload[field].trim();
    }

    if (hasOwn(payload, "cost")) {
      const cost = Number(payload.cost);

      if (!Number.isFinite(cost) || cost < 0) {
        return res
          .status(400)
          .json({ error: "cost must be a non-negative number" });
      }

      updates.cost = cost;
    }

    for (const field of [
      "published",
      "featured",
      "enrollmentOpen",
      "providesCertificate",
    ] as const) {
      if (!hasOwn(payload, field)) continue;

      const parsed = parseBooleanInput(payload[field]);

      if (parsed === undefined) {
        return res.status(400).json({
          error: `${field} must be a boolean value`,
        });
      }

      updates[field] = parsed;
    }

    for (const field of [
      "onlineUrl",
      "enrollmentUrl",
      "imageUrl",
      "certificateUrl",
    ] as const) {
      if (!hasOwn(payload, field)) continue;

      const normalized = normalizeOptionalUrl(payload[field]);

      if (normalized === undefined) {
        return res.status(400).json({
          error: `${field} must be HTTPS or a safe local path`,
        });
      }

      updates[field] = normalized;
    }

    for (const field of [
      "startDate",
      "endDate",
      "registrationDeadline",
      "featuredUntil",
    ] as const) {
      if (!hasOwn(payload, field)) continue;

      const parsed = parseOptionalDate(payload[field]);

      if (parsed === undefined) {
        return res.status(400).json({
          error: `${field} must be a valid date or null`,
        });
      }

      updates[field] = parsed;
    }

    if (hasOwn(payload, "gallery")) {
      const gallery = parseStringArray(payload.gallery);

      if (gallery === undefined) {
        return res
          .status(400)
          .json({ error: "gallery must be an array of URLs" });
      }

      for (const url of gallery) {
        if (normalizeOptionalUrl(url) === undefined) {
          return res.status(400).json({
            error: "Gallery URLs must be HTTPS or safe local paths",
          });
        }
      }

      updates.gallery = gallery;
    }

    let skillIds: string[] | undefined;

    if (hasOwn(payload, "skillIds")) {
      skillIds = parseStringArray(payload.skillIds);

      if (skillIds === undefined) {
        return res.status(400).json({
          error: "skillIds must be an array of skill IDs",
        });
      }
    }

    const missingSlug = slugWhenMissing(
      existing.slug,
      updates.name ?? existing.name,
      existing.id,
      "course",
    );

    if (missingSlug) updates.slug = missingSlug;

    if (Object.keys(updates).length === 0 && skillIds === undefined) {
      return res
        .status(400)
        .json({ error: "No supported course fields supplied" });
    }

    const updated = await prisma.$transaction(async (transaction) => {
      if (skillIds !== undefined) {
        await syncCourseSkills(transaction, existing.id, skillIds);
      }

      return transaction.course.update({
        where: { id },
        data: updates,
        include: courseInclude,
      });
    });

    void invalidateCacheByPrefix([
      "courses:list",
      "courses:detail",
      "public:stats",
    ]);

    recordCourseEvent(req, "course.update", updated.id, "success", {
      source: "admin",
      fields: [
        ...Object.keys(updates),
        ...(skillIds !== undefined ? ["skillIds"] : []),
      ],
    });

    if (!existing.published && updated.published) {
      recordCourseEvent(req, "course.publish", updated.id, "success", {
        source: "admin",
      });
    } else if (existing.published && !updated.published) {
      recordCourseEvent(req, "course.unpublish", updated.id, "success", {
        source: "admin",
      });
    }

    return res.json(presentCourse(updated));
  } catch (error: any) {
    if (error instanceof Error && error.message === "INVALID_SKILL_IDS") {
      return res
        .status(400)
        .json({ error: "One or more skill IDs are invalid" });
    }

    return res.status(500).json({ error: "Failed to update course" });
  }
};

export const adminDeleteCourse = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.course.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) return res.status(404).json({ error: "Course not found" });

    await prisma.course.delete({ where: { id } });

    void invalidateCacheByPrefix([
      "courses:list",
      "courses:detail",
      "public:stats",
    ]);

    recordCourseEvent(req, "course.delete", id, "success", { source: "admin" });

    return res.json({ message: "Course deleted successfully" });
  } catch {
    return res.status(500).json({ error: "Failed to delete course" });
  }
};
