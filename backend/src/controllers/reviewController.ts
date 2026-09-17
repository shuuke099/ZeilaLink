import type { Response } from "express";
import prisma from "../config/database";
import type { AuthRequest } from "../middleware/auth";
import { invalidateCacheByPrefix } from "../utils/cache";

type ReviewTargetType = "business" | "service" | "course";

const isTargetType = (value: string): value is ReviewTargetType =>
  value === "business" || value === "service" || value === "course";

const resolveTarget = async (type: ReviewTargetType, identifier: string) => {
  if (type === "business") {
    const target = await prisma.business.findFirst({
      where: { OR: [{ id: identifier }, { slug: identifier }], published: true, active: true },
      select: { id: true, userId: true, rating: true, reviewsCount: true },
    });
    return target ? { ...target, ownerUserId: target.userId } : null;
  }

  if (type === "service") {
    const target = await prisma.service.findFirst({
      where: { OR: [{ id: identifier }, { slug: identifier }], published: true, active: true },
      select: {
        id: true,
        rating: true,
        reviewsCount: true,
        business: { select: { userId: true } },
      },
    });
    return target
      ? { ...target, ownerUserId: target.business?.userId || null }
      : null;
  }

  const target = await prisma.course.findFirst({
    where: { OR: [{ id: identifier }, { slug: identifier }], published: true },
    select: {
      id: true,
      rating: true,
      reviewsCount: true,
      provider: { select: { contactUserId: true } },
    },
  });
  return target
    ? { ...target, ownerUserId: target.provider.contactUserId }
    : null;
};

const reviewSelect = {
  id: true,
  rating: true,
  comment: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { id: true, name: true, avatarUrl: true } },
} as const;

export const getReviews = async (req: AuthRequest, res: Response) => {
  try {
    const type = req.params.type;
    const identifier = req.params.id?.trim();
    if (!isTargetType(type) || !identifier) {
      return res.status(400).json({ error: "Invalid review target" });
    }

    const target = await resolveTarget(type, identifier);
    if (!target) return res.status(404).json({ error: "Review target not found" });

    const userId = req.user?.id;
    let reviews;
    let myReview = null;
    if (type === "business") {
      reviews = await prisma.businessReview.findMany({ where: { businessId: target.id }, select: reviewSelect, orderBy: { updatedAt: "desc" }, take: 50 });
      if (userId) myReview = await prisma.businessReview.findUnique({ where: { businessId_userId: { businessId: target.id, userId } }, select: reviewSelect });
    } else if (type === "service") {
      reviews = await prisma.serviceReview.findMany({ where: { serviceId: target.id }, select: reviewSelect, orderBy: { updatedAt: "desc" }, take: 50 });
      if (userId) myReview = await prisma.serviceReview.findUnique({ where: { serviceId_userId: { serviceId: target.id, userId } }, select: reviewSelect });
    } else {
      reviews = await prisma.courseReview.findMany({ where: { courseId: target.id }, select: reviewSelect, orderBy: { updatedAt: "desc" }, take: 50 });
      if (userId) myReview = await prisma.courseReview.findUnique({ where: { courseId_userId: { courseId: target.id, userId } }, select: reviewSelect });
    }

    return res.json({
      targetId: target.id,
      summary: { rating: target.rating, count: target.reviewsCount },
      reviews,
      myReview,
    });
  } catch (error) {
    console.error("getReviews:", error);
    return res.status(500).json({ error: "Failed to load reviews" });
  }
};

const nextSummary = (
  currentRating: number,
  currentCount: number,
  previousRating: number | null,
  rating: number,
) => {
  if (previousRating !== null && currentCount > 0) {
    return {
      rating: ((currentRating * currentCount) - previousRating + rating) / currentCount,
      count: currentCount,
    };
  }

  return {
    rating: ((currentRating * currentCount) + rating) / (currentCount + 1),
    count: currentCount + 1,
  };
};

export const upsertReview = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Authentication required" });

    const type = req.params.type;
    const identifier = req.params.id?.trim();
    const rating = Number(req.body?.rating);
    const rawComment = req.body?.comment;
    const comment = typeof rawComment === "string" ? rawComment.trim() : "";

    if (!isTargetType(type) || !identifier) {
      return res.status(400).json({ error: "Invalid review target" });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be a whole number from 1 to 5" });
    }
    if (comment.length > 1000) {
      return res.status(400).json({ error: "Review must be 1000 characters or fewer" });
    }

    const target = await resolveTarget(type, identifier);
    if (!target) return res.status(404).json({ error: "Review target not found" });
    if (target.ownerUserId === req.user.id) {
      return res.status(403).json({ error: "You cannot review your own listing" });
    }

    const userId = req.user.id;
    const saved = await prisma.$transaction(async (tx) => {
      if (type === "business") {
        const existing = await tx.businessReview.findUnique({ where: { businessId_userId: { businessId: target.id, userId } } });
        const summary = nextSummary(target.rating, target.reviewsCount, existing?.rating ?? null, rating);
        const review = await tx.businessReview.upsert({
          where: { businessId_userId: { businessId: target.id, userId } },
          create: { businessId: target.id, userId, rating, comment: comment || null },
          update: { rating, comment: comment || null },
          select: reviewSelect,
        });
        await tx.business.update({ where: { id: target.id }, data: { rating: summary.rating, reviewsCount: summary.count } });
        return { review, summary };
      }

      if (type === "service") {
        const existing = await tx.serviceReview.findUnique({ where: { serviceId_userId: { serviceId: target.id, userId } } });
        const summary = nextSummary(target.rating, target.reviewsCount, existing?.rating ?? null, rating);
        const review = await tx.serviceReview.upsert({
          where: { serviceId_userId: { serviceId: target.id, userId } },
          create: { serviceId: target.id, userId, rating, comment: comment || null },
          update: { rating, comment: comment || null },
          select: reviewSelect,
        });
        await tx.service.update({ where: { id: target.id }, data: { rating: summary.rating, reviewsCount: summary.count } });
        return { review, summary };
      }

      const existing = await tx.courseReview.findUnique({ where: { courseId_userId: { courseId: target.id, userId } } });
      const summary = nextSummary(target.rating, target.reviewsCount, existing?.rating ?? null, rating);
      const review = await tx.courseReview.upsert({
        where: { courseId_userId: { courseId: target.id, userId } },
        create: { courseId: target.id, userId, rating, comment: comment || null },
        update: { rating, comment: comment || null },
        select: reviewSelect,
      });
      await tx.course.update({ where: { id: target.id }, data: { rating: summary.rating, reviewsCount: summary.count } });
      return { review, summary };
    });

    const prefixes = type === "business"
      ? ["businesses:list", "businesses:detail", "businesses:featured", "public:businesses"]
      : type === "service"
        ? ["services:list", "services:detail"]
        : ["courses:list", "courses:detail"];
    void invalidateCacheByPrefix(prefixes);

    return res.status(200).json(saved);
  } catch (error) {
    console.error("upsertReview:", error);
    return res.status(500).json({ error: "Failed to save review" });
  }
};
