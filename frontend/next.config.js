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

/** @type {import('next').NextConfig} */
const nextConfig = {
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
};

module.exports = nextConfig;
