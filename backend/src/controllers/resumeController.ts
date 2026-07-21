import path from "path";
import type { Response } from "express";
import prisma from "../config/database";
import type { AuthRequest } from "../middleware/auth";
import {
  getUploadKey,
  localPathForUploadKey,
  removeStoredUpload,
  validateStoredFile,
} from "../config/aws";
import { recordAuditEvent, requestAuditMeta } from "../utils/audit";
import { presentResume } from "../utils/resume";

const recordResumeEvent = (
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
    resourceType: "resume",
    resourceId: resourceId ? resourceId.slice(0, 128) : null,
    meta: { ...requestAuditMeta(req), ...meta, result },
  });
};

const storedKeyFromValue = (value: string): string | null => {
  const normalized = value.replace(/\\/g, "/");
  if (normalized.startsWith("private/") || normalized.startsWith("uploads/")) {
    return normalized;
  }

  try {
    const parsed = new URL(normalized, "http://local.invalid");
    const marker = "/uploads/";
    const index = parsed.pathname.indexOf(marker);
    return index >= 0
      ? decodeURIComponent(parsed.pathname.slice(index + marker.length))
      : null;
  } catch {
    return null;
  }
};

export const uploadResume = async (req: AuthRequest, res: Response) => {
  let key: string | null = null;
  try {
    if (!req.user || !req.file) {
      return res.status(400).json({ error: "PDF resume is required" });
    }

    key = getUploadKey(req, req.file);
    if (!(await validateStoredFile(req.file.path, "resume"))) {
      await removeStoredUpload(key);
      return res.status(400).json({ error: "The PDF content is invalid" });
    }

    const resume = await prisma.resume.create({
      data: {
        userId: req.user.id,
        s3Url: key,
        parsedText: null,
        skillsExtracted: [],
      },
    });

    recordResumeEvent(req, "resume.upload", resume.id, "success", {
      storage: "private",
    });
    return res.status(201).json(presentResume(resume));
  } catch (error) {
    if (key) await removeStoredUpload(key).catch(() => undefined);
    throw error;
  }
};

export const getUserResumes = async (req: AuthRequest, res: Response) => {
  const userId = req.params.id || req.user!.id;
  if (userId !== req.user!.id && req.user!.role !== "admin") {
    recordResumeEvent(req, "resume.list", null, "denied", {
      reason: "user_ownership_required",
      targetUserId: userId.slice(0, 128),
    });
    return res.status(404).json({ error: "User not found" });
  }

  const resumes = await prisma.resume.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return res.json(resumes.map(presentResume));
};

export const downloadResume = async (req: AuthRequest, res: Response) => {
  const resume = await prisma.resume.findUnique({
    where: { id: req.params.id },
    include: {
      applications: {
        select: {
          job: {
            select: {
              employer: { select: { userId: true, verified: true } },
            },
          },
        },
      },
    },
  });

  const canAccess =
    resume &&
    (resume.userId === req.user!.id ||
      req.user!.role === "admin" ||
      (req.user!.role === "employer" &&
        resume.applications.some(
          (application) =>
            application.job.employer.userId === req.user!.id &&
            application.job.employer.verified,
        )));
  if (!resume || !canAccess) {
    recordResumeEvent(req, "resume.download", req.params.id, "denied", {
      reason: "resume_access_required",
    });
    return res.status(404).json({ error: "Resume not found" });
  }

  const key = storedKeyFromValue(resume.s3Url);
  if (!key) {
    return res.status(404).json({ error: "Resume file not found" });
  }

  const filePath = localPathForUploadKey(key);
  res.set({
    "Cache-Control": "private, no-store",
    "Content-Type": "application/pdf",
    "Content-Security-Policy": "default-src 'none'; sandbox",
    "X-Content-Type-Options": "nosniff",
  });
  return res.download(filePath, `resume-${resume.id}.pdf`, (error) => {
    if (error && !res.headersSent) {
      const statusCode = (error as Error & { statusCode?: number }).statusCode;
      res.status(statusCode === 404 ? 404 : 500).json({
        error: statusCode === 404 ? "Resume file not found" : "Unable to download resume",
      });
    } else if (!error) {
      const accessMode =
        resume.userId === req.user!.id
          ? "owner"
          : req.user!.role === "admin"
            ? "admin"
            : "authorized_employer";
      recordResumeEvent(req, "resume.download", resume.id, "success", { accessMode });
    }
  });
};

export const deleteResume = async (req: AuthRequest, res: Response) => {
  const resume = await prisma.resume.findUnique({ where: { id: req.params.id } });
  if (!resume || (resume.userId !== req.user!.id && req.user!.role !== "admin")) {
    recordResumeEvent(req, "resume.delete", req.params.id, "denied", {
      reason: "resume_ownership_required",
    });
    return res.status(404).json({ error: "Resume not found" });
  }

  await prisma.resume.delete({ where: { id: resume.id } });
  const key = storedKeyFromValue(resume.s3Url);
  if (key) await removeStoredUpload(key);
  recordResumeEvent(req, "resume.delete", resume.id, "success");
  return res.json({ message: "Resume deleted successfully" });
};

export const getPresignedUrl = async (req: AuthRequest, res: Response) => {
  const { filename, contentType } = req.body as {
    filename?: string;
    contentType?: string;
  };
  if (
    contentType !== "application/pdf" ||
    path.extname(filename || "").toLowerCase() !== ".pdf"
  ) {
    return res.status(400).json({ error: "Only PDF resumes are allowed" });
  }

  return res.json({
    directUpload: true,
    uploadUrl: "/api/resumes/upload",
    field: "resume",
  });
};
