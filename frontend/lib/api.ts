import axios from "axios";

// Production is served behind the same-site /api reverse proxy. Keeping this
// relative avoids shipping a developer's localhost URL to real phones.
const DEFAULT_API_URL =
  process.env.NODE_ENV === "production" ? "/api" : "http://localhost:7000/api";

const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL;
const shouldUseSameOriginApi = process.env.NODE_ENV === "production";

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

const baseURL = ensureApiPath(
  shouldUseSameOriginApi ? "/api" : configuredApiUrl,
);
const debugApi = process.env.NEXT_PUBLIC_API_DEBUG === "true";

export const api = axios.create({
  baseURL,
  withCredentials: true,
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

// Preserve browser-generated multipart boundaries. Authentication is supplied
// automatically by the server-owned HttpOnly session cookie.
api.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    // Let the browser set proper multipart boundaries
    if (config.headers?.set) {
      config.headers.set("Content-Type", undefined as any);
    } else if (config.headers) {
      delete (config.headers as Record<string, any>)["Content-Type"];
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
        const isAuthEndpoint =
          /\/auth\/(login|register|verify-email|resend-verification|forgot-password|verify-reset-otp|reset-password|session|me|logout)$/i.test(
            requestUrl,
          );

        if (!isAuthEndpoint) {
          window.dispatchEvent(new Event("auth:unauthorized"));
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
