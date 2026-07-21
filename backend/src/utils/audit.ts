import { createHash } from "crypto";
import type { Request } from "express";
import prisma from "../config/database";

type AuditInput = {
  userId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  meta?: Record<string, unknown>;
};

export const identifierFingerprint = (value: string): string =>
  createHash("sha256")
    .update(value.trim().toLowerCase())
    .digest("hex")
    .slice(0, 16);

export const requestAuditMeta = (req: Request) => ({
  ip: req.ip,
  method: req.method,
  path: req.path,
  userAgent: (req.get("user-agent") || "unknown").slice(0, 256),
});

// Never pass passwords, tokens, OTP values, or document contents in `meta`.
export const recordAuditEvent = ({
  userId = null,
  action,
  resourceType,
  resourceId = null,
  meta = {},
}: AuditInput): void => {
  void prisma.auditLog
    .create({
      data: {
        userId,
        action,
        resourceType,
        resourceId,
        meta: meta as any,
      },
    })
    .catch(() => {
      console.error("[Audit] Failed to persist security event");
    });
};
