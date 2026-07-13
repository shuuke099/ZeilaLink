const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const resolveBackendOrigin = () => {
  const raw = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7000/api";
  const normalized = raw.endsWith("/api") ? raw.slice(0, -4) : raw;
  try {
    return new URL(normalized).origin;
  } catch {
    return "http://localhost:7000";
  }
};

const backendOrigin = resolveBackendOrigin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,

    remotePatterns: [
      // Local development
      {
        protocol: "http",
        hostname: "localhost",
        port: "7000",
        pathname: "/uploads/**",
      },

      // DigitalOcean Spaces
      {
        protocol: "https",
        hostname: "<YOUR_SPACE>.<YOUR_REGION>.digitaloceanspaces.com",
        pathname: "/**",
      },

      // Optional: Unsplash
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination: `${backendOrigin}/uploads/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
