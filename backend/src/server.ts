import dotenv from "dotenv";
import path from "path";
import fs from "fs";

const localEnvPath = path.join(process.cwd(), ".env");
const rootEnvPath = path.join(process.cwd(), "..", ".env");

dotenv.config({
  path: fs.existsSync(localEnvPath) ? localEnvPath : rootEnvPath,
});

import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

// Routes
import authRoutes from "./routes/authRoutes";
import jobRoutes from "./routes/jobRoutes";
import applicationRoutes from "./routes/applicationRoutes";
import resumeRoutes from "./routes/resumeRoutes";
import trainingRoutes from "./routes/trainingRoutes";
import providerRoutes from "./routes/providerRoutes";
import messageRoutes from "./routes/messageRoutes";
import adminRoutes from "./routes/adminRoutes";
import employerRoutes from "./routes/employerRoutes";
import publicRoutes from "./routes/publicRoutes";
import uploadsRoutes from "./routes/uploadsRoutes";
import chatRoutes from "./routes/chatRoutes";
import serviceRoutes from "./routes/serviceRoutes";
import { localUploadsPath } from "./config/aws";
import { assertJwtConfiguration } from "./utils/jwt";
import { assertOtpConfiguration } from "./utils/otp";

const app = express();
const PORT = process.env.PORT || 7000;
const isProduction = process.env.NODE_ENV === "production";

assertJwtConfiguration();
assertOtpConfiguration();

const splitOriginList = (value?: string) =>
  (value || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const normalizeBrowserOrigin = (value: string): string => {
  const parsed = new URL(value);
  if (
    !["http:", "https:"].includes(parsed.protocol) ||
    parsed.username ||
    parsed.password ||
    (parsed.pathname !== "/" && parsed.pathname !== "") ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error("Browser origins must be plain HTTP(S) origins without paths");
  }
  return parsed.origin;
};

const parseAllowedOrigins = () => {
  const fromEnv = [
    ...splitOriginList(process.env.FRONTEND_URL),
    ...splitOriginList(process.env.FRONTEND_URLS),
    ...splitOriginList(process.env.ALLOWED_ORIGINS),
  ].map(normalizeBrowserOrigin);

  const devDefaults = isProduction ? [] : [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
  ];

  const origins = Array.from(new Set([...fromEnv, ...devDefaults]));

  if (isProduction) {
    if (origins.length === 0) {
      throw new Error(
        "Production requires FRONTEND_URL, FRONTEND_URLS, or ALLOWED_ORIGINS",
      );
    }

    for (const origin of origins) {
      const parsed = new URL(origin);
      if (parsed.protocol !== "https:") {
        throw new Error("Production browser origins must use HTTPS");
      }
    }
  }

  return origins;
};

const isAllowedDevTunnelOrigin = (origin: string) => {
  if (isProduction) return false;

  try {
    const parsedOrigin = new URL(origin);
    return (
      parsedOrigin.protocol === "https:" &&
      parsedOrigin.hostname.endsWith(".devtunnels.ms")
    );
  } catch {
    return false;
  }
};

const allowedOrigins = parseAllowedOrigins();
const productionBackendOrigin = (() => {
  if (!isProduction) return null;
  const value = process.env.BACKEND_PUBLIC_URL?.trim();
  if (!value) throw new Error("BACKEND_PUBLIC_URL is required in production");
  const parsed = new URL(value);
  if (
    parsed.protocol !== "https:" ||
    parsed.username ||
    parsed.password ||
    (parsed.pathname !== "/" && parsed.pathname !== "") ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error("BACKEND_PUBLIC_URL must be a plain HTTPS origin");
  }
  return parsed.origin;
})();
const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const configuredTrustProxyHops = process.env.TRUST_PROXY_HOPS?.trim();
const trustProxyHops = configuredTrustProxyHops
  ? Number(configuredTrustProxyHops)
  : 0;
const trustedProxyAddresses = splitOriginList(process.env.TRUST_PROXY_ADDRESSES);

if (
  !Number.isInteger(trustProxyHops) ||
  trustProxyHops < 0 ||
  trustProxyHops > 10
) {
  throw new Error("TRUST_PROXY_HOPS must be an integer from 0 through 10");
}
if (isProduction && trustedProxyAddresses.length === 0) {
  throw new Error(
    "TRUST_PROXY_ADDRESSES must list the trusted proxy IPs or CIDR ranges in production",
  );
}

const requestOrigin = (req: express.Request): string => {
  return `${req.protocol}://${req.get("host")}`;
};

const isTrustedOrigin = (req: express.Request, origin: string): boolean =>
  origin === requestOrigin(req) ||
  allowedOrigins.includes(origin) ||
  isAllowedDevTunnelOrigin(origin);

// Middleware
app.disable("x-powered-by");
app.set("trust proxy", isProduction ? trustedProxyAddresses : trustProxyHops);

// Redirect before routes or static files so private responses are never sent over HTTP.
if (isProduction) {
  app.use((req, res, next) => {
    if (req.secure) return next();
    return res.redirect(308, `${productionBackendOrigin}${req.originalUrl}`);
  });
}

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    frameguard: { action: "deny" },
    strictTransportSecurity: isProduction
      ? { maxAge: 31_536_000, includeSubDomains: true, preload: true }
      : false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'none'"],
      },
    },
  }),
);
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server and curl/postman requests with no Origin header.
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin) || isAllowedDevTunnelOrigin(origin)) {
        return callback(null, true);
      }

      const error: any = new Error("Origin not allowed");
      error.status = 403;
      return callback(error);
    },
    credentials: true,
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use("/api", (_req, res, next) => {
  res.set("Cache-Control", "private, no-store");
  return next();
});

// Cookie-authenticated mutations must originate from this application. Bearer-only
// native/server clients remain supported during the cookie migration.
app.use((req, res, next) => {
  if (!unsafeMethods.has(req.method)) return next();

  const origin = req.get("origin");
  const fetchSite = req.get("sec-fetch-site");
  if (origin && !isTrustedOrigin(req, origin)) {
    return res.status(403).json({ error: "Request origin not allowed" });
  }
  if (!origin && fetchSite === "cross-site") {
    return res.status(403).json({ error: "Cross-site request blocked" });
  }

  return next();
});

// Only deliberately public images are static. Resumes/documents are downloaded
// through authenticated, ownership-checked API routes.
app.use(
  "/uploads/public",
  express.static(path.join(localUploadsPath, "public"), {
    dotfiles: "deny",
    fallthrough: false,
    setHeaders: (res) => {
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.setHeader("X-Content-Type-Options", "nosniff");
    },
  }),
);

// Rate limiting - more lenient in development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProduction ? 300 : 2000,
  message: { error: "Too many requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api", applicationRoutes);
app.use("/api/resumes", resumeRoutes);
app.use("/api/trainings", trainingRoutes);
app.use("/api/providers", providerRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/employers", employerRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/uploads", uploadsRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/services", serviceRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Error handling
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    const candidateStatus = Number(err?.status);
    const status =
      Number.isInteger(candidateStatus) && candidateStatus >= 400 && candidateStatus <= 599
        ? candidateStatus
        : 500;
    console.error("[Server] Request failed", {
      errorType: typeof err?.name === "string" ? err.name : "Error",
      status,
      path: req.path,
      method: req.method,
    });

    const publicMessages: Record<number, string> = {
      400: "Invalid request",
      401: "Authentication required",
      403: "Request forbidden",
      404: "Not found",
      409: "Request conflict",
      413: "Request is too large",
      429: "Too many requests",
    };
    const publicMessage = publicMessages[status] ||
      (status >= 500 ? "Internal server error" : "Request failed");
    res.status(status).json({ error: publicMessage });
  },
);

// Start server with error handling
app
  .listen(PORT, () => {
    console.log(`[Server] Listening on port ${PORT}`);
  })
  .on("error", (err: any) => {
    console.error("Failed to start server", {
      errorType: typeof err?.name === "string" ? err.name : "Error",
      code: typeof err?.code === "string" ? err.code : undefined,
    });
    if (err.code === "EADDRINUSE") {
      console.error(
        `Port ${PORT} is already in use. Please use a different port.`,
      );
    }
    process.exit(1);
  });

// Handle uncaught errors
process.on("uncaughtException", (error) => {
  console.error("Uncaught exception", { errorType: error.name || "Error" });
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection", {
    errorType: reason instanceof Error ? reason.name : typeof reason,
  });
  process.exit(1);
});
