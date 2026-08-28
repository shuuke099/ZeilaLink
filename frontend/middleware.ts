import { NextRequest, NextResponse } from "next/server";

const createNonce = (): string => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
};

export function middleware(request: NextRequest) {
  const nonce = createNonce();
  const isDevelopment = process.env.NODE_ENV !== "production";
  const analyticsEnabled = /^G-[A-Z0-9]+$/i.test(
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "",
  );
  const scriptSources = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    ...(analyticsEnabled ? ["https://www.googletagmanager.com"] : []),
    ...(isDevelopment ? ["'unsafe-eval'"] : []),
  ];
  const connectSources = [
    "'self'",
    ...(analyticsEnabled
      ? [
          "https://www.google-analytics.com",
          "https://*.google-analytics.com",
          "https://analytics.google.com",
          "https://www.googletagmanager.com",
        ]
      : []),
    ...(isDevelopment
      ? [
          "http://localhost:*",
          "http://127.0.0.1:*",
          "ws://localhost:*",
          "ws://127.0.0.1:*",
        ]
      : []),
  ];
  const imageSources = [
    "'self'",
    "data:",
    "blob:",
    "https://images.unsplash.com",
    "https://zeilalink-uploads.sfo2.cdn.digitaloceanspaces.com",
    "https://zeilalink-uploads.sfo2.digitaloceanspaces.com",
    ...(analyticsEnabled
      ? [
          "https://www.google-analytics.com",
          "https://*.google-analytics.com",
        ]
      : []),
  ];
  const policy = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "object-src 'none'",
    `script-src ${scriptSources.join(" ")}`,
    "script-src-attr 'none'",
    "style-src 'self' 'unsafe-inline'",
    `img-src ${imageSources.join(" ")}`,
    "font-src 'self' data:",
    `connect-src ${connectSources.join(" ")}`,
    "media-src 'self' blob:",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    ...(!isDevelopment ? ["upgrade-insecure-requests"] : []),
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("x-canonical-path", request.nextUrl.pathname);
  requestHeaders.set("Content-Security-Policy", policy);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set("Content-Security-Policy", policy);
  return response;
}

export const config = {
  matcher: [
    {
      source:
        "/((?!api|uploads|_next/static|_next/image|favicon.ico|icon.png|robots.txt|sitemap.xml).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
