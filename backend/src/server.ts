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

const app = express();
const PORT = process.env.PORT || 7000;

const splitOriginList = (value?: string) =>
  (value || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const parseAllowedOrigins = () => {
  const fromEnv = [
    ...splitOriginList(process.env.FRONTEND_URL),
    ...splitOriginList(process.env.FRONTEND_URLS),
    ...splitOriginList(process.env.ALLOWED_ORIGINS),
  ];

  const devDefaults = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
  ];

  return Array.from(new Set([...fromEnv, ...devDefaults]));
};

const isAllowedDevTunnelOrigin = (origin: string) => {
  if (process.env.NODE_ENV === "production") return false;

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

// Middleware
app.set("trust proxy", 1);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false, // can be customized per needs
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

      return callback(
        new Error(
          `CORS blocked for origin: ${origin}. Allowed origins: ${allowedOrigins.join(", ")}`,
        ),
      );
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(localUploadsPath));

// Enforce HTTPS in production
if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    if (req.secure) return next();
    if (req.get("x-forwarded-proto") === "https") return next();
    return res.redirect(301, "https://" + req.get("host") + req.originalUrl);
  });
}

// Rate limiting - more lenient in development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 100 : 1000, // 1000 requests in dev, 100 in production
  message: "Too many requests from this IP, please try again later.",
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

// Error handling
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error("[Server] Error:", {
      message: err.message,
      stack: err.stack,
      status: err.status,
      path: req.path,
      method: req.method,
    });

    res.status(err.status || 500).json({
      error: err.message || "Internal server error",
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  },
);

// Start server with error handling
app
  .listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📁 Uploads directory: ${localUploadsPath}`);
    console.log(`🌐 API available at http://localhost:${PORT}/api`);
    // Server started successfully
  })
  .on("error", (err: any) => {
    console.error("Failed to start server:", err);
    if (err.code === "EADDRINUSE") {
      console.error(
        `Port ${PORT} is already in use. Please use a different port.`,
      );
    }
    process.exit(1);
  });

// Handle uncaught errors
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
