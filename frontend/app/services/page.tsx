import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import Navbar from "@/components/Navbar";
import { serverApiGet } from "@/lib/serverApi";
import { absoluteUrl } from "@/lib/seo";
import ServiceList from "./components/ServiceList";
import type { ServiceItem } from "./data/services";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Professional Services | Adeegyo | ZeilaLink",
  description:
    "Find trusted professional, local, and online services on ZeilaLink. Ka hel adeegyo xirfadeed oo la isku halayn karo oo Af-Soomaali iyo English ah.",
  alternates: {
    canonical: "/services",
  },
  openGraph: {
    title: "Professional Services | ZeilaLink",
    description:
      "Search trusted services for Somali communities in English and Somali.",
    url: "/services",
    siteName: "ZeilaLink",
    locale: "en_SO",
    alternateLocale: ["so_SO"],
    images: [
      {
        url: absoluteUrl("/opengraph-image"),
        width: 1200,
        height: 630,
        alt: "ZeilaLink professional services",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Professional Services | Adeegyo | ZeilaLink",
    description:
      "Search trusted services for Somali communities in English and Somali.",
    images: [absoluteUrl("/twitter-image")],
  },
};

type ServicesResponse = {
  services?: unknown[];
  categories?: unknown[];
};

const isService = (value: unknown): value is ServiceItem => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.title === "string" &&
    typeof item.description === "string" &&
    typeof item.category === "string" &&
    typeof item.provider === "string" &&
    typeof item.priceLabel === "string" &&
    typeof item.image === "string"
  );
};

const loadServices = async () => {
  try {
    const response = await serverApiGet<ServicesResponse>(
      "/services?limit=100",
    );
    return {
      services: (response.services || []).filter(isService),
      categories: (response.categories || []).filter(
        (value): value is string =>
          typeof value === "string" && value.trim().length > 0,
      ),
      loadError: false,
    };
  } catch {
    return {
      services: [] as ServiceItem[],
      categories: [] as string[],
      loadError: true,
    };
  }
};

export default async function ServicesPage() {
  const isEn = cookies().get("language")?.value !== "so";
  const { services, categories, loadError } = await loadServices();
  const nonce = headers().get("x-nonce") || undefined;
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ||
    "https://zeilalink.com";
  const structuredData = {
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
    ],
  };

  return (
    <div className="min-h-screen bg-background transition-colors">
      <script
        nonce={nonce}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <Navbar />
      <ServiceList
        isEn={isEn}
        initialServices={services}
        initialCategories={categories}
        loadError={loadError}
      />
    </div>
  );
}
