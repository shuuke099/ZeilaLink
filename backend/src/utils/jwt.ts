import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import type { Request, Response } from "express";
import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";

const JWT_ISSUER = process.env.JWT_ISSUER || "zeilalink-api";
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || "zeilalink-web";
const MINIMUM_SECRET_BYTES = 32;
const DEFAULT_SESSION_DURATION_MS = 12 * 60 * 60 * 1000;

const isProduction = process.env.NODE_ENV === "production";
export const AUTH_COOKIE_NAME = isProduction
  ? "__Host-zeilalink_session"
  : "zeilalink_session";

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET?.trim();
  const minimumBytes = isProduction ? MINIMUM_SECRET_BYTES : 16;

  if (!secret || Buffer.byteLength(secret, "utf8") < minimumBytes) {
    throw new Error(
      `JWT_SECRET must be configured with at least ${minimumBytes} bytes`,
    );
  }

  if (["secret", "changeme", "development"].includes(secret.toLowerCase())) {
    throw new Error("JWT_SECRET uses a known insecure value");
  }

  return secret;
};

export const assertJwtConfiguration = (): void => {
  getJwtSecret();

  if (isProduction) {
    const cookieDuration = Number(
      process.env.AUTH_COOKIE_MAX_AGE_MS || DEFAULT_SESSION_DURATION_MS,
    );
    if (
      !Number.isFinite(cookieDuration) ||
      cookieDuration <= 0 ||
      cookieDuration > 24 * 60 * 60 * 1000
    ) {
      throw new Error(
        "AUTH_COOKIE_MAX_AGE_MS must be between 1 millisecond and 24 hours in production",
      );
    }

    const jwtDuration = process.env.JWT_EXPIRES_IN || "12h";
    const match = jwtDuration.match(/^(\d+)(s|m|h|d)$/i);
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };
    const duration = match
      ? Number(match[1]) * multipliers[match[2].toLowerCase()]
      : Number.NaN;
    if (!Number.isFinite(duration) || duration <= 0 || duration > 24 * 60 * 60 * 1000) {
      throw new Error("JWT_EXPIRES_IN must be a duration no longer than 24 hours");
    }
  }
};

const sessionBindingForPasswordHash = (passwordHash: string): string =>
  createHmac("sha256", getJwtSecret())
    .update(`session:${passwordHash}`)
    .digest("base64url");

export const generateToken = (userId: string, passwordHash: string): string => {
  const expiresIn = (process.env.JWT_EXPIRES_IN || "12h") as SignOptions["expiresIn"];

  return jwt.sign(
    {
      purpose: "access",
      session: sessionBindingForPasswordHash(passwordHash),
    },
    getJwtSecret(),
    {
      algorithm: "HS256",
      audience: JWT_AUDIENCE,
      issuer: JWT_ISSUER,
      jwtid: randomUUID(),
      subject: userId,
      expiresIn,
    },
  );
};

export const verifyToken = (
  token: string,
): { userId: string; sessionBinding: string } => {
  const decoded = jwt.verify(token, getJwtSecret(), {
    algorithms: ["HS256"],
    audience: JWT_AUDIENCE,
    issuer: JWT_ISSUER,
  }) as JwtPayload;

  if (
    decoded.purpose !== "access" ||
    typeof decoded.sub !== "string" ||
    decoded.sub.length === 0 ||
    typeof decoded.session !== "string"
  ) {
    throw new Error("Invalid access token");
  }

  return { userId: decoded.sub, sessionBinding: decoded.session };
};

export const verifySessionBinding = (
  passwordHash: string,
  suppliedBinding: string,
): boolean => {
  const expected = Buffer.from(sessionBindingForPasswordHash(passwordHash));
  const supplied = Buffer.from(suppliedBinding);
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
};

const parseCookies = (cookieHeader?: string): Record<string, string> => {
  if (!cookieHeader) return {};

  return cookieHeader.split(";").reduce<Record<string, string>>((cookies, pair) => {
    const separator = pair.indexOf("=");
    if (separator < 1) return cookies;

    const key = pair.slice(0, separator).trim();
    const value = pair.slice(separator + 1).trim();
    try {
      cookies[key] = decodeURIComponent(value);
    } catch {
      cookies[key] = value;
    }
    return cookies;
  }, {});
};

export const getRequestToken = (req: Request): string | null => {
  const cookies = parseCookies(req.headers.cookie);
  const cookieToken = isProduction
    ? cookies[AUTH_COOKIE_NAME]
    : cookies[AUTH_COOKIE_NAME] ||
      cookies["__Host-zeilalink_session"] ||
      cookies.zeilalink_session;
  if (cookieToken) return cookieToken;

  const authorization = req.headers.authorization;
  if (!authorization) return null;
  const [scheme, token] = authorization.trim().split(/\s+/, 2);
  return scheme?.toLowerCase() === "bearer" && token ? token : null;
};

const authCookieOptions = () => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: (isProduction ? "strict" : "lax") as "strict" | "lax",
  path: "/",
  maxAge: Number(process.env.AUTH_COOKIE_MAX_AGE_MS || DEFAULT_SESSION_DURATION_MS),
});

export const setAuthCookie = (res: Response, token: string): void => {
  res.cookie(AUTH_COOKIE_NAME, token, authCookieOptions());
};

export const clearAuthCookie = (res: Response): void => {
  const options = {
    httpOnly: true,
    secure: isProduction,
    sameSite: (isProduction ? "strict" : "lax") as "strict" | "lax",
    path: "/",
  };

  res.clearCookie(AUTH_COOKIE_NAME, options);
  res.clearCookie("zeilalink_session", { ...options, secure: false });
  if (isProduction) {
    res.clearCookie("__Host-zeilalink_session", options);
  }
};
