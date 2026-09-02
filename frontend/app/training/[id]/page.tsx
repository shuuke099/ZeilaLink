import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { cookies, headers } from "next/headers";
import { notFound, permanentRedirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import { ServerApiError, serverApiGet } from "@/lib/serverApi";
import { absoluteUrl } from "@/lib/seo";
import TrainingDetailClient, {
  type TrainingDetail,
} from "@/app/trainings/TrainingDetailClient";

export const dynamic = "force-dynamic";

type TrainingPageProps = {
  params: { id: string };
};

type LoadResult =
  | { status: "success"; training: TrainingDetail }
  | { status: "not-found" }
  | { status: "error" };

const isSafeIdentifier = (value: string) =>
  /^[A-Za-z0-9][A-Za-z0-9_-]{0,199}$/.test(value);

const parseTraining = (value: unknown): TrainingDetail | null => {
  const candidate =
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    ("training" in value || "course" in value)
      ? (value as { training?: unknown; course?: unknown }).training ??
        (value as { course?: unknown }).course
      : value;

  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return null;
  }

  const item = candidate as Record<string, unknown>;
  const provider = item.provider;
  if (!provider || typeof provider !== "object" || Array.isArray(provider)) {
    return null;
  }

  return typeof item.id === "string" &&
    typeof item.name === "string" &&
    typeof item.description === "string" &&
    typeof item.duration === "string" &&
    typeof item.cost === "number" &&
    typeof (provider as Record<string, unknown>).id === "string" &&
    typeof (provider as Record<string, unknown>).name === "string"
    ? (candidate as TrainingDetail)
    : null;
};

const loadTraining = cache(async (identifier: string): Promise<LoadResult> => {
  if (!isSafeIdentifier(identifier)) return { status: "not-found" };

  try {
    const response = await serverApiGet<unknown>(
      `/courses/${encodeURIComponent(identifier)}`,
    );
    const training = parseTraining(response);
    return training
      ? { status: "success", training }
      : { status: "error" };
  } catch (error) {
    if (error instanceof ServerApiError && error.status === 404) {
      return { status: "not-found" };
    }
    return { status: "error" };
  }
});

const compactDescription = (value: string, max = 158) => {
  const compact = value.replace(/\s+/g, " ").trim();
  return compact.length > max
    ? `${compact.slice(0, max - 3).trimEnd()}...`
    : compact;
};

export async function generateMetadata({
  params,
}: TrainingPageProps): Promise<Metadata> {
  const result = await loadTraining(params.id);
  if (result.status === "not-found") {
    return {
      title: "Training Not Found | ZeilaLink",
      robots: { index: false, follow: false },
    };
  }
  if (result.status === "error") {
    return {
      title: "Training Program | ZeilaLink",
      description: "This training program is temporarily unavailable.",
      robots: { index: false, follow: true },
    };
  }

  const { training } = result;
  const path = `/training/${training.slug || training.id}`;
  const description = compactDescription(
    training.descriptionSo
      ? `${training.description} ${training.descriptionSo}`
      : training.description,
  );
  const title = `${training.name} | Training at ${training.provider.name}`;

  return {
    title: `${title} | ZeilaLink`,
    description,
    keywords: [
      training.name,
      training.nameSo,
      training.provider.name,
      training.provider.nameSo,
      training.skills?.[0]?.name,
      "training Somalia",
      "tababar Soomaaliya",
    ].filter((value): value is string => Boolean(value)),
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      title,
      description,
      url: path,
      siteName: "ZeilaLink",
      locale: "en_SO",
      alternateLocale: ["so_SO"],
      images: [
        {
          url: training.imageUrl || absoluteUrl("/opengraph-image"),
          alt: training.imageUrl
            ? training.name
            : "ZeilaLink training programs",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [training.imageUrl || absoluteUrl("/twitter-image")],
    },
  };
}

export default async function TrainingDetailPage({
  params,
}: TrainingPageProps) {
  const result = await loadTraining(params.id);
  const language = cookies().get("language")?.value === "so" ? "so" : "en";
  const isEn = language === "en";

  if (result.status === "not-found") notFound();
  if (result.status === "error") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="mx-auto max-w-3xl px-4 pb-16 pt-32 text-center">
          <h1 className="text-3xl font-black text-primary-darker">
            {isEn
              ? "Training details are temporarily unavailable"
              : "Faahfaahinta tababarka hadda lama heli karo"}
          </h1>
          <p className="mt-3 text-primary-darker/70">
            {isEn
              ? "Please try again shortly."
              : "Fadlan wax yar kadib isku day."}
          </p>
          <Link href="/training" className="btn-primary mt-6">
            {isEn ? "Back to training" : "Ku laabo tababarka"}
          </Link>
        </main>
      </div>
    );
  }

  const { training } = result;
  if (training.slug && params.id !== training.slug) {
    permanentRedirect(`/training/${training.slug}`);
  }

  const path = `/training/${training.slug || training.id}`;
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ||
    "https://zeilalink.com";
  const url = `${siteUrl}${path}`;
  const nonce = headers().get("x-nonce") || undefined;
  const courseStructuredData = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: training.name,
    ...(training.nameSo ? { alternateName: training.nameSo } : {}),
    description: training.descriptionSo
      ? `${training.description}\n\n${training.descriptionSo}`
      : training.description,
    url,
    inLanguage: training.descriptionSo ? ["en", "so"] : ["en"],
    provider: {
      "@type": "Organization",
      name: training.provider.name,
      ...(training.provider.slug
        ? { url: `${siteUrl}/businesses/${training.provider.slug}` }
        : {}),
      ...(training.provider.logoUrl
        ? { logo: training.provider.logoUrl }
        : {}),
    },
    offers: {
      "@type": "Offer",
      category: training.cost === 0 ? "Free" : "Paid",
      price: training.cost,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url,
    },
    ...(training.imageUrl ? { image: training.imageUrl } : {}),
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
        name: isEn ? "Training" : "Tababar",
        item: `${siteUrl}/training`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: training.name,
        item: url,
      },
    ],
  };

  return (
    <>
      <script
        nonce={nonce}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            courseStructuredData,
            breadcrumbStructuredData,
          ]).replace(/</g, "\\u003c"),
        }}
      />
      <TrainingDetailClient
        initialTraining={training}
        publicPath={path}
      />
    </>
  );
}
