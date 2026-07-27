import type { Metadata } from "next";

export const SITE_NAME = "ZeilaLink";
export const DEFAULT_SITE_ORIGIN = "https://zeilalink.com";

export const SITE_TITLE =
  "ZeilaLink | Jobs, Training, Services & Business Directory for Somali & East African Communities";
export const SITE_DESCRIPTION_EN =
  "ZeilaLink connects Somali communities with jobs, skilled workers, training programs, trusted services, and businesses.";
export const SITE_DESCRIPTION_SO =
  "ZeilaLink waxay bulshada Soomaaliyeed ku xirtaa shaqooyin, shaqaale xirfad leh, tababaro, adeegyo lagu kalsoon yahay, iyo ganacsiyo.";
export const SITE_DESCRIPTION = `${SITE_DESCRIPTION_EN} ${SITE_DESCRIPTION_SO}`;

export const SITE_KEYWORDS = [
  "ZeilaLink",

  // English
  "Somali jobs",
  "Minnesota jobs",
  "Minneapolis jobs",
  "St Paul jobs",
  "African jobs",
  "East African jobs",
  "jobs in Minnesota",
  "skilled workers",
  "training programs",
  "professional services",
  "business directory",
  "resume help",
  "career services",
  "employment",
  "job search",
  "Somali businesses",

  // Somali
  "shaqooyin",
  "shaqaale",
  "tababaro",
  "adeegyo",
  "ganacsiyo",
  "Soomaali",
];

export const SITE_LANGUAGES = ["en", "so"] as const;
export const SITE_CONTACT_EMAIL = "contact@zeilalink.com";
export const SITE_CONTACT_PHONE = "+19522288655";

const toOrigin = (value: string | undefined): URL | null => {
  const candidate = value?.trim();
  if (!candidate) return null;

  try {
    const parsed = new URL(candidate);
    if (
      !["http:", "https:"].includes(parsed.protocol) ||
      parsed.username ||
      parsed.password
    ) {
      return null;
    }

    return new URL(parsed.origin);
  } catch {
    return null;
  }
};

export const SITE_URL =
  toOrigin(process.env.NEXT_PUBLIC_SITE_URL) ?? new URL(DEFAULT_SITE_ORIGIN);
export const SITE_ORIGIN = SITE_URL.origin;

const safePath = (path: string): string => {
  const trimmed = path.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return "/";
  return trimmed;
};

export const absoluteUrl = (path = "/"): string =>
  new URL(safePath(path), SITE_URL).toString();

export const canonicalUrl = (pathname: string | null | undefined): string =>
  absoluteUrl(pathname || "/");

const trimmedPublicValue = (
  value: string | undefined,
  maximumLength = 256,
): string | undefined => {
  const trimmed = value?.trim();
  if (!trimmed || trimmed.length > maximumLength) return undefined;
  return trimmed;
};

export const GOOGLE_SITE_VERIFICATION = trimmedPublicValue(
  process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
);
export const BING_SITE_VERIFICATION = trimmedPublicValue(
  process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION,
);

const configuredAnalyticsId = trimmedPublicValue(
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
  32,
);
export const GOOGLE_ANALYTICS_ID =
  configuredAnalyticsId && /^G-[A-Z0-9]+$/i.test(configuredAnalyticsId)
    ? configuredAnalyticsId.toUpperCase()
    : undefined;

export const ORGANIZATION_ID = `${SITE_ORIGIN}/#organization`;
export const WEBSITE_ID = `${SITE_ORIGIN}/#website`;

interface PageMetadataOptions {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
}

export const createPageMetadata = ({
  title,
  description,
  path,
  keywords = [],
}: PageMetadataOptions): Metadata => {
  const canonical = canonicalUrl(path);
  const allKeywords = Array.from(
    new Set([SITE_NAME, ...keywords, ...SITE_KEYWORDS]),
  );

  return {
    title,
    description,
    keywords: allKeywords,
    alternates: {
      canonical,
    },
    openGraph: {
      type: "website",
      url: canonical,
      siteName: SITE_NAME,
      title,
      description,
      locale: "en_US",
      alternateLocale: ["so_SO"],
      images: [
        {
          url: absoluteUrl("/opengraph-image"),
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} — jobs, training, workers, services, and businesses`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteUrl("/twitter-image")],
    },
  };
};

export const getInternalApiOrigin = (): URL => {
  return (
    toOrigin(process.env.INTERNAL_API_ORIGIN) ??
    toOrigin(process.env.NEXT_PUBLIC_SITE_URL) ??
    new URL(DEFAULT_SITE_ORIGIN)
  );
};
