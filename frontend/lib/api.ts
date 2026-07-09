import axios from "axios";

const DEFAULT_API_URL = "http://localhost:7000/api";

const ensureApiPath = (rawUrl?: string) => {
  if (!rawUrl) {
    return DEFAULT_API_URL;
  }

  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return DEFAULT_API_URL;
  }

  let normalized = trimmed;

  // Support values like ":7000" or "7000"
  const portOnlyMatch = normalized.match(/^:?(\d{2,5})$/);
  if (portOnlyMatch) {
    normalized = `http://localhost:${portOnlyMatch[1]}`;
  }

  // Allow URLs starting with "//host"
  if (normalized.startsWith("//")) {
    normalized = `http:${normalized}`;
  }

  // If there's no protocol but we have a hostname, assume http
  if (!/^https?:\/\//i.test(normalized) && !normalized.startsWith("/")) {
    normalized = `http://${normalized}`;
  }

  normalized = normalized.replace(/\/+$/, "");
  return /\/api($|\/)/i.test(normalized) ? normalized : `${normalized}/api`;
};

const baseURL = ensureApiPath(process.env.NEXT_PUBLIC_API_URL);
const debugApi = process.env.NEXT_PUBLIC_API_DEBUG === "true";

const isLikelyJwt = (value: string) =>
  value.split(".").length === 3 && !/\s/.test(value);

const parseJwtPayload = (token: string): Record<string, unknown> | null => {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(normalized);
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const isTokenExpired = (token: string) => {
  const payload = parseJwtPayload(token);
  const exp = payload?.exp;
  if (typeof exp !== "number") return false;
  const nowInSeconds = Math.floor(Date.now() / 1000);
  return exp <= nowInSeconds;
};

const getStoredUserRole = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { role?: string };
    return typeof parsed.role === "string" ? parsed.role.toLowerCase() : null;
  } catch {
    return null;
  }
};

const getStoredToken = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = localStorage.getItem("token")?.trim();
  if (!raw || raw === "null" || raw === "undefined") {
    return null;
  }

  if (!isLikelyJwt(raw) || isTokenExpired(raw)) {
    localStorage.removeItem("token");
    return null;
  }

  return raw;
};

export const api = axios.create({
  baseURL,
  timeout: 10000, // 10 second timeout
  headers: {
    "Content-Type": "application/json",
  },
});

if (process.env.NODE_ENV !== "production" && debugApi) {
  console.log(`[api] API Base URL: ${baseURL}`);
  if (baseURL === DEFAULT_API_URL) {
    console.warn(
      "[api] Using default API URL. Set NEXT_PUBLIC_API_URL in .env if different.",
    );
  }
}

// Add token to requests
api.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    // Let the browser set proper multipart boundaries
    if (config.headers?.set) {
      config.headers.set("Content-Type", undefined as any);
    } else if (config.headers) {
      delete (config.headers as Record<string, any>)["Content-Type"];
    }
  }

  if (typeof window !== "undefined") {
    const requestUrl: string = config.url || "";
    const isAdminEndpoint = /(^|\/)admin(\/|$)/i.test(requestUrl);
    const token = getStoredToken();
    const role = getStoredUserRole();

    if (isAdminEndpoint && (!token || role !== "admin")) {
      return Promise.reject(
        new axios.AxiosError(
          "Blocked admin API request without valid admin session",
          "ERR_ADMIN_SESSION_REQUIRED",
          config,
        ),
      );
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (config.headers?.Authorization) {
      delete config.headers.Authorization;
    }
  }
  return config;
});

// Handle responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle connection errors - check multiple error indicators
    const isConnectionError =
      error.code === "ERR_NETWORK" ||
      error.code === "ECONNREFUSED" ||
      error.code === "ERR_CONNECTION_REFUSED" ||
      error.message?.includes("Network Error") ||
      error.message?.includes("ERR_CONNECTION_REFUSED") ||
      error.message?.includes("Failed to fetch") ||
      (!error.response && error.request);

    if (isConnectionError) {
      error.isConnectionError = true;
      const backendUrl = baseURL.replace("/api", "");
      const activeOrigin =
        typeof window !== "undefined"
          ? window.location.origin
          : "unknown-origin";
      error.connectionErrorMessage = `Cannot connect to backend server (or CORS blocked this origin).

Possible causes:
- Backend server is not running
- Backend CORS does not allow this frontend origin: ${activeOrigin}

Expected backend URL: ${backendUrl}

To fix:
1. Open a terminal
2. Navigate to backend:
   cd backend
3. Start backend:
   npm run dev
4. Ensure backend CORS allows your frontend origin (for example localhost:3001)

Then refresh this page.`;

      console.error("❌ [api] Connection error:", {
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        message: error.message,
        code: error.code,
        fullError: error,
      });

      // Show user-friendly alert in development
      if (
        process.env.NODE_ENV === "development" &&
        typeof window !== "undefined"
      ) {
        console.error(
          "%c⚠️ BACKEND SERVER NOT RUNNING!",
          "color: red; font-size: 16px; font-weight: bold;",
        );
        console.error(
          "%cPlease start the backend server:",
          "color: orange; font-size: 14px;",
        );
        console.error("%c1. cd backend", "color: yellow;");
        console.error("%c2. npm run dev", "color: yellow;");
      }
    }

    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        const requestUrl: string = error.config?.url || "";
        const authHeader =
          error.config?.headers?.Authorization ||
          error.config?.headers?.authorization;
        const hadBearerToken =
          typeof authHeader === "string" && authHeader.startsWith("Bearer ");
        const tokenInStorage = !!localStorage.getItem("token");
        const isAuthEndpoint =
          /\/auth\/(login|register|verify-email|resend-verification|forgot-password|verify-reset-otp|reset-password)$/i.test(
            requestUrl,
          );

        // Avoid wiping session for public/auth-form failures. Only clear when
        // an authenticated request is actually rejected.
        if (!isAuthEndpoint && (hadBearerToken || tokenInStorage)) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }

        const isApplyOrEnrollRequest =
          /\/jobs\/[^/]+\/apply(\?.*)?$/i.test(requestUrl) ||
          /\/trainings\/[^/]+\/enroll(\?.*)?$/i.test(requestUrl);

        if (isApplyOrEnrollRequest) {
          const nextPath = window.location.pathname + window.location.search;
          window.location.href = `/login?redirect=${encodeURIComponent(nextPath)}`;
        }
      }
    }
    return Promise.reject(error);
  },
);

export default api;
