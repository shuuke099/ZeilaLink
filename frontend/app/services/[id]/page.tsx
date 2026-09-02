import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { cookies, headers } from "next/headers";
import { notFound, permanentRedirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import { ServerApiError, serverApiGet } from "@/lib/serverApi";
import ServiceDetail from "../components/ServiceDetail";
import {
  getServiceById,
  type ServiceItem,
} from "../data/services";

export const dynamic = "force-dynamic";

type ServicePageProps = {
  params: { id: string };
};

type LoadResult =
  | { status: "success"; service: ServiceItem }
  | { status: "demo"; service: ServiceItem }
  | { status: "not-found" }
  | { status: "error" };

const isSafeIdentifier = (value: string) =>
  /^[A-Za-z0-9][A-Za-z0-9_-]{0,199}$/.test(value);

const normalizeService = (value: unknown): ServiceItem | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const item = value as Record<string, unknown>;
  if (
    typeof item.id !== "string" ||
    typeof item.title !== "string" ||
    typeof item.category !== "string" ||
    typeof item.provider !== "string" ||
    typeof item.priceLabel !== "string" ||
    typeof item.image !== "string" ||
    typeof item.description !== "string"
  ) {
    return null;
  }

  return {
    ...(item as unknown as ServiceItem),
    rating: typeof item.rating === "number" ? item.rating : 0,
    reviews: typeof item.reviews === "number" ? item.reviews : 0,
    badge: typeof item.badge === "string" ? item.badge : item.category,
    gallery: Array.isArray(item.gallery)
      ? item.gallery.filter((entry): entry is string => typeof entry === "string")
      : [],
    includes: Array.isArray(item.includes)
      ? item.includes.filter((entry): entry is string => typeof entry === "string")
      : [],
    highlights: Array.isArray(item.highlights)
      ? item.highlights.filter((entry): entry is string => typeof entry === "string")
      : [],
    packageName:
      typeof item.packageName === "string" ? item.packageName : "",
    packageDescription:
      typeof item.packageDescription === "string"
        ? item.packageDescription
        : "",
    revisions: typeof item.revisions === "string" ? item.revisions : "",
    deliveryTime:
      typeof item.deliveryTime === "string" ? item.deliveryTime : "",
    support: typeof item.support === "string" ? item.support : "",
    expertName: typeof item.expertName === "string" ? item.expertName : "",
    expertRole: typeof item.expertRole === "string" ? item.expertRole : "",
    expertImage: typeof item.expertImage === "string" ? item.expertImage : "",
    isDemo: false,
  };
};

const loadService = cache(async (identifier: string): Promise<LoadResult> => {
  if (!isSafeIdentifier(identifier)) return { status: "not-found" };

  try {
    const response = await serverApiGet<unknown>(
      `/services/${encodeURIComponent(identifier)}`,
    );
    const service = normalizeService(response);
    if (service) return { status: "success", service };
  } catch (error) {
    if (!(error instanceof ServerApiError) || error.status !== 404) {
      const demo = getServiceById(identifier);
      return demo
        ? { status: "demo", service: demo }
        : { status: "error" };
    }
  }

  const demo = getServiceById(identifier);
  return demo
    ? { status: "demo", service: demo }
    : { status: "not-found" };
});

const compactDescription = (value: string, max = 158) => {
  const compact = value.replace(/\s+/g, " ").trim();
  return compact.length > max
    ? `${compact.slice(0, max - 3).trimEnd()}...`
    : compact;
};

export async function generateMetadata({
  params,
}: ServicePageProps): Promise<Metadata> {
  const result = await loadService(params.id);
  if (result.status === "not-found") {
    return {
      title: "Service Not Found | ZeilaLink",
      robots: { index: false, follow: false },
    };
  }
  if (result.status === "error") {
    return {
      title: "Professional Service | ZeilaLink",
      description: "This service is temporarily unavailable.",
      robots: { index: false, follow: true },
    };
  }

  const { service } = result;
  const path = `/services/${service.slug || service.id}`;
  const description = compactDescription(
    service.descriptionSo
      ? `${service.description} ${service.descriptionSo}`
      : service.description,
  );
  const title = `${service.title} by ${service.provider}`;

  return {
    title: `${title} | ZeilaLink`,
    description,
    keywords: [
      service.title,
      service.titleSo,
      service.provider,
      service.providerSo,
      service.category,
      service.categorySo,
      "services Somalia",
      "adeegyo Soomaaliya",
    ].filter((value): value is string => Boolean(value)),
    alternates: { canonical: path },
    robots:
      result.status === "demo"
        ? { index: false, follow: true }
        : { index: true, follow: true },
    openGraph: {
      type: "website",
      title,
      description,
      url: path,
      siteName: "ZeilaLink",
      locale: "en_SO",
      alternateLocale: ["so_SO"],
      images: [{ url: service.image, alt: service.title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [service.image],
    },
  };
}

export default async function ServiceDetailPage({
  params,
}: ServicePageProps) {
  const result = await loadService(params.id);
  const isEn = cookies().get("language")?.value !== "so";

  if (result.status === "not-found") notFound();
  if (result.status === "error") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="mx-auto max-w-3xl px-4 pb-16 pt-32 text-center">
          <h1 className="text-3xl font-black text-slate-900">
            {isEn
              ? "Service details are temporarily unavailable"
              : "Faahfaahinta adeegga hadda lama heli karo"}
          </h1>
          <p className="mt-3 text-slate-600">
            {isEn
              ? "Please try again shortly."
              : "Fadlan wax yar kadib isku day."}
          </p>
          <Link href="/services" className="btn-primary mt-6">
            {isEn ? "Back to services" : "Ku laabo adeegyada"}
          </Link>
        </main>
      </div>
    );
  }

  const { service } = result;
  if (
    result.status === "success" &&
    service.slug &&
    params.id !== service.slug
  ) {
    permanentRedirect(`/services/${service.slug}`);
  }

  const path = `/services/${service.slug || service.id}`;
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ||
    "https://zeilalink.com";
  const url = `${siteUrl}${path}`;
  const nonce = headers().get("x-nonce") || undefined;
  const numericPrice = Number(
    service.priceLabel.replace(/[^0-9.]/g, ""),
  );
  const providerStructuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${url}#provider`,
    name: service.provider,
    description: service.description,
    image: service.expertImage || service.image,
    areaServed: {
      "@type": "Country",
      name: "Somalia",
    },
    url,
  };
  const serviceStructuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    ...(service.titleSo ? { alternateName: service.titleSo } : {}),
    description: service.descriptionSo
      ? `${service.description}\n\n${service.descriptionSo}`
      : service.description,
    url,
    image: service.image,
    serviceType: service.category,
    areaServed: "Somalia",
    inLanguage: service.descriptionSo ? ["en", "so"] : ["en"],
    provider: { "@id": `${url}#provider` },
    ...(Number.isFinite(numericPrice)
      ? {
          offers: {
            "@type": "Offer",
            price: numericPrice,
            priceCurrency: "USD",
            url,
            availability: "https://schema.org/InStock",
          },
        }
      : {}),
  };
  const breadcrumbStructuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: isEn ? "Home" : "Bogga Hore",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: isEn ? "Services" : "Adeegyo",
        item: `${siteUrl}/services`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name:
          !isEn && service.titleSo ? service.titleSo : service.title,
        item: url,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background transition-colors">
      <script
        nonce={nonce}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            providerStructuredData,
            serviceStructuredData,
            breadcrumbStructuredData,
          ]).replace(/</g, "\\u003c"),
        }}
      />
      <Navbar />

      <div className="hidden">
        <nav
          aria-label={isEn ? "Breadcrumb" : "Jidka bogga"}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500"
        >
          <Link href="/" className="hover:text-primary">
            {isEn ? "Home" : "Bogga Hore"}
          </Link>
          <span aria-hidden="true">/</span>
          <Link href="/services" className="hover:text-primary">
            {isEn ? "Services" : "Adeegyo"}
          </Link>
        </nav>
        <Link
          href="/services"
          className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-slate-50"
        >
          {isEn ? "Back to services" : "Ku laabo adeegyada"}
        </Link>
      </div>

      <ServiceDetail service={service} isEn={isEn} />
    </div>
  );
}
