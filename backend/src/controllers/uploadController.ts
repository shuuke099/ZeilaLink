import path from "path";
import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth";
import {
  getDirectUploadUrl,
  getUploadKey,
  localPathForUploadKey,
  publicUrlForKey,
  removeStoredUpload,
  validateStoredFile,
} from "../config/aws";
import { recordAuditEvent, requestAuditMeta } from "../utils/audit";

const allowedPublicImages = new Set(["image/jpeg", "image/png", "image/webp"]);

const recordUploadEvent = (
  req: AuthRequest,
  action: string,
  resourceType: "upload" | "document",
  resourceId: string | null,
  result: "success" | "denied",
  meta: Record<string, unknown> = {},
) => {
  if (result === "denied") req.authorizationDenialAudited = true;
  recordAuditEvent({
    userId: req.user?.id || null,
    action,
    resourceType,
    resourceId: resourceId ? resourceId.slice(0, 128) : null,
    meta: { ...requestAuditMeta(req), ...meta, result },
  });
};

export const getPublicPresignedUrl = async (req: AuthRequest, res: Response) => {
  const { filename, contentType } = req.body as {
    filename?: string;
    contentType?: string;
  };
  const extension = path.extname(filename || "").toLowerCase();
  const extensionMatches =
    contentType === "image/jpeg"
      ? extension === ".jpg" || extension === ".jpeg"
      : contentType === "image/png"
        ? extension === ".png"
        : contentType === "image/webp" && extension === ".webp";

  if (!contentType || !allowedPublicImages.has(contentType) || !extensionMatches) {
    return res.status(400).json({
      error: "Only JPEG, PNG, and WEBP images are allowed",
    });
  }

  return res.json({
    directUpload: true,
    uploadUrl: getDirectUploadUrl(),
  });
};

export const directUploadResponse = async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: "File is required" });
  }

  const key = getUploadKey(req, req.file);
  try {
    if (
      !(await validateStoredFile(
        req.file.path,
        "public-image",
        req.file.mimetype,
      ))
    ) {
      await removeStoredUpload(key);
      return res.status(400).json({ error: "The image content is invalid" });
    }

    const publicUrl = publicUrlForKey(key);
    recordUploadEvent(req, "upload.create", "upload", path.basename(key), "success", {
      visibility: "public",
      mediaType: "image",
    });
    return res.status(201).json({ publicUrl, url: publicUrl });
  } catch (error) {
    await removeStoredUpload(key).catch(() => undefined);
    throw error;
  }
};

export const privateUploadResponse = async (req: AuthRequest, res: Response) => {
  if (!req.file || !req.user) {
    if (!req.user) {
      recordUploadEvent(req, "document.upload", "document", null, "denied", {
        reason: "authentication_required",
      });
    }
    return res.status(400).json({ error: "PDF document is required" });
  }

  const key = getUploadKey(req, req.file);
  try {
    if (!(await validateStoredFile(req.file.path, "private-document"))) {
      await removeStoredUpload(key);
      return res.status(400).json({ error: "The PDF content is invalid" });
    }

    const fileId = path.basename(key);
    recordUploadEvent(req, "document.upload", "document", fileId, "success", {
      visibility: "private",
      mediaType: "pdf",
    });
    return res.status(201).json({
      url: `/api/uploads/private/${encodeURIComponent(req.user.id)}/${encodeURIComponent(fileId)}`,
    });
  } catch (error) {
    await removeStoredUpload(key).catch(() => undefined);
    throw error;
  }
};

export const downloadPrivateDocument = async (
  req: AuthRequest,
  res: Response,
) => {
  if (!req.user) {
    recordUploadEvent(req, "document.download", "document", req.params.fileId || null, "denied", {
      reason: "authentication_required",
    });
    return res.status(401).json({ error: "Authentication required" });
  }

  const { userId, fileId } = req.params;
  if (userId !== req.user.id && req.user.role !== "admin") {
    recordUploadEvent(req, "document.download", "document", fileId || null, "denied", {
      reason: "document_ownership_required",
      targetUserId: userId.slice(0, 128),
    });
    return res.status(404).json({ error: "Document not found" });
  }
  if (!/^[0-9a-f-]{36}\.pdf$/i.test(fileId)) {
    return res.status(404).json({ error: "Document not found" });
  }

  const key = `private/documents/${userId}/${fileId}`;
  const filePath = localPathForUploadKey(key);
  res.set({
    "Cache-Control": "private, no-store",
    "Content-Type": "application/pdf",
    "Content-Security-Policy": "default-src 'none'; sandbox",
    "X-Content-Type-Options": "nosniff",
  });
  return res.download(filePath, "document.pdf", (error) => {
    if (error && !res.headersSent) {
      const statusCode = (error as Error & { statusCode?: number }).statusCode;
      res.status(statusCode === 404 ? 404 : 500).json({
        error: statusCode === 404 ? "Document not found" : "Unable to download document",
      });
    } else if (!error) {
      recordUploadEvent(req, "document.download", "document", fileId, "success", {
        accessMode: userId === req.user!.id ? "owner" : "admin",
      });
    }
  });
};

export const deletePrivateDocument = async (
  req: AuthRequest,
  res: Response,
) => {
  if (!req.user) {
    recordUploadEvent(req, "document.delete", "document", req.params.fileId || null, "denied", {
      reason: "authentication_required",
    });
    return res.status(401).json({ error: "Authentication required" });
  }

  const { userId, fileId } = req.params;
  const validUserId = /^[A-Za-z0-9_-]{1,128}$/.test(userId);
  const validFileId = /^[0-9a-f-]{36}\.pdf$/i.test(fileId);
  if (!validUserId || !validFileId) {
    return res.status(404).json({ error: "Document not found" });
  }
  if (userId !== req.user.id && req.user.role !== "admin") {
    recordUploadEvent(req, "document.delete", "document", fileId, "denied", {
      reason: "document_ownership_required",
      targetUserId: userId.slice(0, 128),
    });
    return res.status(404).json({ error: "Document not found" });
  }

  const key = `private/documents/${userId}/${fileId}`;
  const removed = await removeStoredUpload(key);
  if (!removed) {
    return res.status(404).json({ error: "Document not found" });
  }

  recordUploadEvent(req, "document.delete", "document", fileId, "success", {
    accessMode: userId === req.user.id ? "owner" : "admin",
  });
  return res.json({ message: "Document deleted successfully" });
};
