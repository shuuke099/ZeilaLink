const { PHASE_DEVELOPMENT_SERVER } = require("next/constants");

const DEFAULT_INTERNAL_API_ORIGIN = "http://127.0.0.1:7000";
const isProductionRuntime = process.env.NODE_ENV === "production";

const parseHttpOrigin = (value, variableName) => {
  let parsed;

  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${variableName} must be an absolute http(s) URL.`);
  }

  if (
    (parsed.protocol !== "http:" && parsed.protocol !== "https:") ||
    parsed.username ||
    parsed.password ||
    (parsed.pathname !== "/" && parsed.pathname !== "") ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error(`${variableName} must be a plain http(s) origin without credentials or a path.`);
  }

  return parsed.origin;
};

const internalApiOrigin = parseHttpOrigin(
  process.env.INTERNAL_API_ORIGIN ||
    (isProductionRuntime
      ? (() => {
          throw new Error("INTERNAL_API_ORIGIN is required for a production build.");
        })()
      : DEFAULT_INTERNAL_API_ORIGIN),
  "INTERNAL_API_ORIGIN",
);

const configuredPublicApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
if (
  isProductionRuntime &&
  configuredPublicApiUrl &&
  configuredPublicApiUrl !== "/api"
) {
  throw new Error(
    "Production uses the same-origin /api proxy; remove NEXT_PUBLIC_API_URL or set it to /api.",
  );
}
if (
  !isProductionRuntime &&
  configuredPublicApiUrl &&
  /^https?:\/\//i.test(configuredPublicApiUrl)
) {
  parseHttpOrigin(configuredPublicApiUrl, "NEXT_PUBLIC_API_URL");
}

const backendOrigin = internalApiOrigin;
const backendUrl = new URL(backendOrigin);

const remotePatterns = [
  // Backend uploads (works for both development and production)
  {
    protocol: backendUrl.protocol.replace(":", ""),
    hostname: backendUrl.hostname,
    port: backendUrl.port || "",
    pathname: "/uploads/public/**",
  },

  // Unsplash
  {
    protocol: "https",
    hostname: "images.unsplash.com",
  },

  // DigitalOcean Spaces (update later)
  {
    protocol: "https",
    hostname: "<YOUR_SPACE>.<YOUR_REGION>.digitaloceanspaces.com",
    pathname: "/**",
  },
];

/**
 * Keep development and production artifacts separate. Running `next build`
 * while the dev server is open must not replace the files that dev HTML
 * references (for example, `static/css/app/layout.css`).
 *
 * @param {string} phase
 * @returns {import('next').NextConfig}
 */
module.exports = (phase) => {
  const isDevelopment = phase === PHASE_DEVELOPMENT_SERVER;

  const securityHeaders = [
    {
      key: "Referrer-Policy",
      value: "strict-origin-when-cross-origin",
    },
    {
      key: "X-Content-Type-Options",
      value: "nosniff",
    },
    {
      key: "X-Frame-Options",
      value: "DENY",
    },
    {
      key: "Permissions-Policy",
      value:
        "camera=(), microphone=(), geolocation=(), browsing-topics=()",
    },
    {
      key: "Cross-Origin-Opener-Policy",
      value: "same-origin-allow-popups",
    },
    ...(!isDevelopment
      ? [
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
        ]
      : []),
  ];

  return {
    distDir: isDevelopment ? ".next-dev" : ".next",
    reactStrictMode: true,
    poweredByHeader: false,

    images: {
      formats: ["image/avif", "image/webp"],
      minimumCacheTTL: 86400,
      remotePatterns,
    },

    async headers() {
      return [
        {
          source: "/:path*",
          headers: securityHeaders,
        },
      ];
    },

    async rewrites() {
      return [
        {
          source: "/favicon.ico",
          destination: "/icon.png",
        },
        {
          source: "/api/:path*",
          destination: `${internalApiOrigin}/api/:path*`,
        },
        {
          source: "/uploads/:path*",
          destination: `${backendOrigin}/uploads/:path*`,
        },
      ];
    },
  };
};
