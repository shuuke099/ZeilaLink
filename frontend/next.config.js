const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const resolveBackendOrigin = () => {
  const raw = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7000/api';
  const normalized = raw.endsWith('/api') ? raw.slice(0, -4) : raw;
  try {
    return new URL(normalized).origin;
  } catch {
    return 'http://localhost:7000';
  }
};

const backendOrigin = resolveBackendOrigin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
    domains: ['localhost', 'somali-job-platform-uploads.s3.amazonaws.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '**.r2.cloudflarestorage.com',
      },
      {
        protocol: 'https',
        hostname: '**.cloudflare.com',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: `${backendOrigin}/uploads/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
