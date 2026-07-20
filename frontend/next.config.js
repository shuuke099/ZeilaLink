const { PHASE_DEVELOPMENT_SERVER } = require("next/constants");

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7000/api";

const backendUrl = new URL(apiUrl);

const backendOrigin = backendUrl.origin;

const remotePatterns = [
  // Backend uploads (works for both development and production)
  {
    protocol: backendUrl.protocol.replace(":", ""),
    hostname: backendUrl.hostname,
    port: backendUrl.port || "",
    pathname: "/uploads/**",
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
module.exports = (phase) => ({
  distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
  reactStrictMode: true,

  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    remotePatterns,
  },

  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination: `${backendOrigin}/uploads/:path*`,
      },
    ];
  },
});
