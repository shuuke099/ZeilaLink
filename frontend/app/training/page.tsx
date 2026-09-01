import type { Metadata } from "next";
import { headers } from "next/headers";
import { serverApiGet } from "@/lib/serverApi";
import TrainingsClient, {
  type Training,
} from "@/app/trainings/TrainingsClient";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Training Programs | Barnaamijyada Tababarka | ZeilaLink",
  description:
    "Discover verified career training and skills programs on ZeilaLink. Ka hel koorsooyin iyo barnaamijyo tababar oo lagu horumariyo xirfadahaaga.",
  alternates: {
    canonical: "/training",
  },
  openGraph: {
    title: "Training Programs | ZeilaLink",
    description:
      "Career-building courses and training programs for Somali professionals.",
    url: "/training",
    siteName: "ZeilaLink",
    locale: "en_SO",
    alternateLocale: ["so_SO"],
    images: [
      {
        url: absoluteUrl("/opengraph-image"),
        width: 1200,
        height: 630,
        alt: "ZeilaLink training programs",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Training Programs | Barnaamijyada Tababarka | ZeilaLink",
    description:
      "Career-building courses and training programs for Somali professionals.",
    images: [absoluteUrl("/twitter-image")],
  },
};

type TrainingResponse = {
  courses?: unknown[];
};

const isTraining = (value: unknown): value is Training => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  const provider = item.provider;

  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    typeof item.description === "string" &&
    typeof item.duration === "string" &&
    typeof item.cost === "number" &&
    Boolean(provider) &&
    typeof provider === "object" &&
    !Array.isArray(provider) &&
    typeof (provider as Record<string, unknown>).id === "string" &&
    typeof (provider as Record<string, unknown>).name === "string"
  );
};

const loadTrainings = async () => {
  try {
    const response = await serverApiGet<TrainingResponse>(
      "/courses?limit=100",
    );
    return {
      trainings: (response.courses || []).filter(isTraining),
      loadError: false,
    };
  } catch {
    return { trainings: [] as Training[], loadError: true };
  }
};

export default async function TrainingCatalogPage() {
  const { trainings, loadError } = await loadTrainings();
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
        name: "Home",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Training",
        item: `${siteUrl}/training`,
      },
    ],
  };

  return (
    <>
      <script
        nonce={nonce}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <TrainingsClient
        initialTrainings={trainings}
        loadError={loadError}
      />
    </>
  );
}
