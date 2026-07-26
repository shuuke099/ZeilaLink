import type { MetadataRoute } from "next";
import { absoluteUrl, SITE_ORIGIN } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/uploads/public/"],
        disallow: [
          "/api/",
          "/uploads/",
          "/admin$",
          "/admin/",
          "/employer$",
          "/employer/",
          "/provider$",
          "/provider/",
          "/worker$",
          "/worker/",
          "/login$",
          "/register$",
          "/forgot-password$",
          "/verify-email$",
          "/resend-verification$",
          "/jobs/*/apply",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: SITE_ORIGIN,
  };
}
