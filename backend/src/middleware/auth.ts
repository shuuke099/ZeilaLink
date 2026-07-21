import type { NextFunction, Request, Response } from "express";
import prisma from "../config/database";
import { recordAuditEvent, requestAuditMeta } from "../utils/audit";
import {
  getRequestToken,
  verifySessionBinding,
  verifyToken,
} from "../utils/jwt";

export interface AuthRequest extends Request {
  authorizationDenialAudited?: boolean;
  user?: {
    id: string;
    email: string;
    role: string;
    isVerified: boolean;
  };
}

const loadAuthenticatedUser = async (req: Request) => {
  const token = getRequestToken(req);
  if (!token) return null;

  const decoded = verifyToken(token);
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: {
      id: true,
      email: true,
      role: true,
      isVerified: true,
      passwordHash: true,
    },
  });

  if (!user || !verifySessionBinding(user.passwordHash, decoded.sessionBinding)) {
    return null;
  }

  const { passwordHash: _passwordHash, ...authenticatedUser } = user;
  return authenticatedUser;
};

const recordAuthorizationDenial = (
  req: AuthRequest,
  reason: string,
  options: {
    userId?: string | null;
    resourceType?: string;
    resourceId?: string | null;
    meta?: Record<string, unknown>;
  } = {},
) => {
  req.authorizationDenialAudited = true;
  recordAuditEvent({
    userId: options.userId === undefined ? req.user?.id || null : options.userId,
    action: "authorization.denied",
    resourceType: options.resourceType || "request",
    resourceId: options.resourceId ? options.resourceId.slice(0, 128) : null,
    meta: {
      ...requestAuditMeta(req),
      ...options.meta,
      result: "denied",
      reason,
    },
  });
};

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = await loadAuthenticatedUser(req);

    if (!user) {
      recordAuthorizationDenial(req, "authentication_required", { userId: null });
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!user.isVerified) {
      recordAuthorizationDenial(req, "account_not_verified", { userId: user.id });
      return res.status(403).json({ error: "Verified account required" });
    }

    req.user = user;
    res.once("finish", () => {
      if (
        (res.statusCode === 401 || res.statusCode === 403) &&
        !req.authorizationDenialAudited
      ) {
        recordAuthorizationDenial(req, "downstream_authorization_denied", {
          meta: { statusCode: res.statusCode },
        });
      }
    });
    return next();
  } catch {
    recordAuthorizationDenial(req, "invalid_or_expired_session", { userId: null });
    return res.status(401).json({ error: "Invalid or expired session" });
  }
};

export const optionalAuthenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const user = await loadAuthenticatedUser(req);
    if (user?.isVerified) {
      req.user = user;
    }
  } catch {
    // Public endpoints continue anonymously when a stale session is supplied.
  }
  return next();
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      recordAuthorizationDenial(req, "authentication_required", {
        meta: { requiredRoles: roles },
      });
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!roles.includes(req.user.role)) {
      recordAuthorizationDenial(req, "insufficient_role", {
        meta: { requiredRoles: roles, actorRole: req.user.role },
      });
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    return next();
  };
};

export const requireSelfOrAdmin = (parameter = "id") => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      recordAuthorizationDenial(req, "authentication_required", {
        resourceType: "user",
        resourceId: req.params[parameter] || null,
      });
      return res.status(401).json({ error: "Authentication required" });
    }

    const targetUserId = req.params[parameter];
    if (targetUserId !== req.user.id && req.user.role !== "admin") {
      recordAuthorizationDenial(req, "user_ownership_required", {
        resourceType: "user",
        resourceId: targetUserId || null,
      });
      return res.status(403).json({ error: "Not authorized for this user" });
    }

    return next();
  };
};

export const requireApprovedOrganization = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      recordAuthorizationDenial(req, "authentication_required", {
        resourceType: "organization",
      });
      return res.status(401).json({ error: "Authentication required" });
    }

    if (req.user.role === "admin") return next();

    if (req.user.role === "employer") {
      const employer = await prisma.employer.findUnique({
        where: { userId: req.user.id },
        select: { verified: true },
      });
      if (employer?.verified) return next();
      recordAuthorizationDenial(req, "employer_approval_required", {
        resourceType: "employer",
      });
      return res.status(403).json({ error: "Employer approval required" });
    }

    if (req.user.role === "provider") {
      const provider = await prisma.provider.findUnique({
        where: { contactUserId: req.user.id },
        select: { verified: true },
      });
      if (provider?.verified) return next();
      recordAuthorizationDenial(req, "provider_approval_required", {
        resourceType: "provider",
      });
      return res.status(403).json({ error: "Provider approval required" });
    }

    recordAuthorizationDenial(req, "approved_organization_role_required", {
      resourceType: "organization",
      meta: { actorRole: req.user.role },
    });
    return res.status(403).json({ error: "Approved organization required" });
  } catch (error) {
    return next(error);
  }
};
