import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { cookies, headers } from "next/headers";
import {
  ArrowRight,
  Briefcase,
  Building2,
  GraduationCap,
  MapPin,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { serverApiGet } from "@/lib/serverApi";
import { getSafeStoredUrl } from "@/lib/safeUrl";
import { SITE_NAME, absoluteUrl } from "@/lib/seo";
import {
  type DirectoryLanguage,
  type DirectoryPagination,
  type PublicBusiness,
  getLocalizedBusinessText,
  parseBusinessesResponse,
} from "@/lib/publicDirectoryTypes";
import BusinessDirectoryControls from "./BusinessDirectoryControls";

export const dynamic = "force-dynamic";

const compactDescription = (value: string, maximumLength = 160) => {
  const compact = value.replace(/\s+/g, " ").trim();
  if (compact.length <= maximumLength) return compact;
  return `${compact.slice(0, Math.max(1, maximumLength - 1)).trimEnd()}…`;
};

interface BusinessesPageProps {
  searchParams?: {
    q?: string | string[];
    page?: string | string[];
    type?: string | string[];
    category?: string | string[];
    city?: string | string[];
    lat?: string | string[];
    lng?: string | string[];
    radius?: string | string[];
  };
}

type BusinessesLoadResult =
  | {
      status: "success";
      businesses: PublicBusiness[];
      pagination: DirectoryPagination;
      locationFallback: boolean;
    }
  | { status: "error"; businesses: []; pagination: DirectoryPagination };

const pageLanguage = (): DirectoryLanguage =>
  cookies().get("language")?.value === "so" ? "so" : "en";

const firstSearchValue = (value?: string | string[]) =>
  (Array.isArray(value) ? value[0] : value)?.trim() || "";

const normalizedQuery = (value?: string | string[]) =>
  firstSearchValue(value).replace(/\s+/g, " ").slice(0, 100);

const normalizedPage = (value?: string | string[]) => {
  const parsed = Number(firstSearchValue(value));
  return Number.isInteger(parsed) && parsed > 0 && parsed <= 10_000
    ? parsed
    : 1;
};

const loadBusinesses = cache(
  async (query: string, page: number, filters: string): Promise<BusinessesLoadResult> => {
    const params = new URLSearchParams();
    if (query) params.set("search", query);
    if (page > 1) params.set("page", String(page));
    const selectedFilters = new URLSearchParams(filters);
    selectedFilters.forEach((value, key) => params.set(key, value));

    try {
      const suffix = params.size ? `?${params.toString()}` : "";
      const response = await serverApiGet<unknown>(
        `/businesses${suffix}`,
      );
      const parsed = parseBusinessesResponse(response);
      if (!parsed) {
        return {
          status: "error",
          businesses: [],
          pagination: { page: 1, totalPages: 1, total: 0 },
        };
      }
      return { status: "success", ...parsed };
    } catch {
      return {
        status: "error",
        businesses: [],
        pagination: { page: 1, totalPages: 1, total: 0 },
      };
    }
  },
);

const directoryHref = (query: string, page: number, filters = "") => {
  const params = new URLSearchParams(filters);
  if (query) params.set("q", query);
  if (page > 1) params.set("page", String(page));
  const suffix = params.size ? `?${params.toString()}` : "";
  return `/businesses${suffix}`;
};

const businessTypeLabel = (
  type: PublicBusiness["type"],
  language: DirectoryLanguage,
) => {
  if (type === "provider") {
    return language === "so" ? "Bixiyaha tababarka" : "Training provider";
  }
  if (type === "business") return language === "so" ? "Ganacsi deegaan" : "Local business";
  return language === "so" ? "Shaqeeye" : "Employer";
};

export async function generateMetadata({
  searchParams,
}: BusinessesPageProps): Promise<Metadata> {
  const language = pageLanguage();
  const query = normalizedQuery(searchParams?.q);
  const page = normalizedPage(searchParams?.page);
  const result = await loadBusinesses(query, page, "");
  const canonical = absoluteUrl("/businesses");
  const title = query
    ? language === "so"
      ? `Ganacsiyo la xiriira “${query}” | ${SITE_NAME}`
      : `Businesses matching “${query}” | ${SITE_NAME}`
    : language === "so"
      ? `Hagaha Ganacsiyada | ${SITE_NAME}`
      : `Business Directory | ${SITE_NAME}`;
  const description =
    language === "so"
      ? `Ka hel shaqeeyayaasha, shirkadaha iyo bixiyeyaasha tababarka ee ku jira hagaha ganacsiyada ${SITE_NAME}.`
      : `Discover employers, companies, and training providers in the ${SITE_NAME} business directory.`;

  return {
    title,
    description: compactDescription(description),
    alternates: { canonical },
    robots:
      result.status === "error" || Boolean(query)
        ? { index: false, follow: true }
        : { index: true, follow: true },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title,
      description: compactDescription(description),
      url: canonical,
      locale: "en_SO",
      alternateLocale: ["so_SO"],
      images: [
        {
          url: absoluteUrl("/opengraph-image"),
          width: 1200,
          height: 630,
          alt: "ZeilaLink business directory",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: compactDescription(description),
      images: [absoluteUrl("/twitter-image")],
    },
  };
}

export default async function BusinessesPage({
  searchParams,
}: BusinessesPageProps) {
  const language = pageLanguage();
  const isSomali = language === "so";
  const query = normalizedQuery(searchParams?.q);
  const requestedPage = normalizedPage(searchParams?.page);
  const filterParams = new URLSearchParams();
  for (const key of ["type", "category", "city", "lat", "lng", "radius"] as const) {
    const value = firstSearchValue(searchParams?.[key]);
    if (value) filterParams.set(key, value.slice(0, 120));
  }
  const result = await loadBusinesses(query, requestedPage, filterParams.toString());
  const canonical = absoluteUrl("/businesses");
  const nonce = headers().get("x-nonce") || undefined;

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: isSomali ? "Bogga hore" : "Home",
          item: absoluteUrl("/"),
        },
        {
          "@type": "ListItem",
          position: 2,
          name: isSomali ? "Ganacsiyada" : "Businesses",
          item: canonical,
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: isSomali ? "Hagaha ganacsiyada" : "Business directory",
      url: canonical,
      isPartOf: {
        "@type": "WebSite",
        name: SITE_NAME,
        url: absoluteUrl("/"),
      },
      mainEntity: {
        "@type": "ItemList",
        itemListElement: result.businesses.map((business, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: getLocalizedBusinessText(business, language).name,
          url: absoluteUrl(
            `/businesses/${business.slug || business.id}`,
          ),
        })),
      },
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <script
        nonce={nonce}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <Navbar />

      <main className="mx-auto max-w-[1440px] px-4 pb-20 pt-24 sm:px-6 lg:px-8">
        <BusinessDirectoryControls isSomali={isSomali} />

        {result.status === "error" ? (
          <section className="mt-10 rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center">
            <h2 className="text-2xl font-black text-amber-950">
              {isSomali
                ? "Hagaha ganacsiyada hadda lama heli karo"
                : "The business directory is temporarily unavailable"}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-amber-900/80">
              {isSomali
                ? "Xogta lama soo qaadi karin. Fadlan mar kale isku day wax yar ka dib."
                : "We could not load the directory data. Please try again in a moment."}
            </p>
          </section>
        ) : (
          <section className="mt-7" aria-labelledby="business-results-heading">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2
                  id="business-results-heading"
                  className="text-2xl font-black text-slate-900"
                >
                  {query
                    ? isSomali
                      ? `Natiijooyinka “${query}”`
                      : `Results for “${query}”`
                    : filterParams.has("lat") && !result.locationFallback
                      ? isSomali
                        ? "Ganacsiyada kuugu dhow"
                        : "Businesses near you"
                    : isSomali
                      ? "Ururrada la heli karo"
                      : "Featured organizations"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {result.locationFallback
                    ? isSomali
                      ? "Ganacsi kuu dhow lama helin, sidaas darteed dhammaan ganacsiyada ayaan ku tusaynaa."
                      : "No nearby businesses were found, so we’re showing all available businesses."
                    : isSomali
                    ? `${result.pagination.total ?? result.businesses.length} urur ayaa la helay`
                    : `${result.pagination.total ?? result.businesses.length} organizations found`}
                </p>
              </div>
              {query && (
                <Link
                  href="/businesses"
                  className="text-sm font-black text-primary hover:underline"
                >
                  {isSomali ? "Ka saar raadinta" : "Clear search"}
                </Link>
              )}
            </div>

            {result.businesses.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
                <Building2
                  aria-hidden="true"
                  className="mx-auto text-slate-300"
                  size={44}
                />
                <h2 className="mt-4 text-xl font-black text-slate-900">
                  {isSomali ? "Ganacsi lama helin" : "No businesses found"}
                </h2>
                <p className="mt-2 text-slate-600">
                  {isSomali
                    ? "Isku day eray kale ama eeg dhammaan ganacsiyada."
                    : "Try another search term or browse all businesses."}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {result.businesses.map((business) => {
                  const localized = getLocalizedBusinessText(
                    business,
                    language,
                  );
                  const businessPath = `/businesses/${business.slug || business.id}`;
                  const safeLogo = getSafeStoredUrl(business.logoUrl);
                  const safeBanner = getSafeStoredUrl(business.bannerUrl);
                  const location = business.location || business.address;
                  const alternateName = isSomali
                    ? business.name
                    : business.nameSo?.trim();

                  return (
                    <Link
                      href={businessPath}
                      key={`${business.type}-${business.id}`}
                      className="group flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.05)] transition duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lg"
                    >
                      <div className="relative block h-36 overflow-hidden bg-slate-100">
                        {safeBanner && <img src={safeBanner} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-transparent" />
                        {business.featured && <span className="absolute left-3 top-3 rounded bg-violet-700 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-white">{isSomali ? "La xushay" : "Featured"}</span>}
                      </div>
                      <div className="flex flex-1 flex-col px-4 pb-4">
                      <div className="relative -mt-8 flex items-end gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border-4 border-white bg-white shadow-md">
                          {safeLogo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={safeLogo}
                              alt={
                                isSomali
                                  ? `Astaanta ${localized.name}`
                                  : `${localized.name} logo`
                              }
                              loading="lazy"
                              decoding="async"
                              className="h-full w-full object-contain p-2.5"
                            />
                          ) : (
                            <Building2
                              aria-hidden="true"
                              size={26}
                              className="text-primary"
                            />
                          )}
                        </div>
                        <div className="min-w-0 pb-1">
                          <span className="inline-flex rounded-full border border-primary/10 bg-primary/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.13em] text-primary">
                            {businessTypeLabel(business.type, language)}
                          </span>
                          <h3 className="mt-1 line-clamp-1 text-base font-bold tracking-tight text-slate-950">
                            <span className="transition-colors group-hover:text-primary">
                              {localized.name}
                            </span>
                          </h3>
                          {alternateName &&
                            alternateName !== localized.name && (
                            <p
                              lang={isSomali ? "en" : "so"}
                              className="mt-1 text-sm text-slate-500"
                            >
                              {alternateName}
                            </p>
                          )}
                        </div>
                      </div>

                      {location && (
                        <p className="mt-5 flex items-start gap-2 text-sm font-semibold text-slate-500">
                          <MapPin
                            aria-hidden="true"
                            size={16}
                            className="mt-0.5 shrink-0 text-primary"
                          />
                          {location}
                        </p>
                      )}

                      {(business.category || typeof business.distanceKm === "number") && (
                        <div className="mt-3 flex flex-wrap gap-2 text-xs font-black">
                          {business.category && <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{business.category}</span>}
                          {typeof business.distanceKm === "number" && <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">{business.distanceKm < 1 ? `${Math.round(business.distanceKm * 1000)} m` : `${business.distanceKm.toFixed(1)} km`} {isSomali ? "kuu jirta" : "away"}</span>}
                        </div>
                      )}

                      <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">
                        {localized.description
                          ? compactDescription(localized.description, 210)
                          : isSomali
                            ? `${localized.name} waa urur ku jira hagaha ganacsiyada ${SITE_NAME}.`
                            : `${localized.name} is listed in the ${SITE_NAME} business directory.`}
                      </p>

                      {business.type !== "business" && <dl className="mt-5 grid grid-cols-2 gap-3">
                        {business.type === "employer" && (
                          <div className="rounded-2xl bg-slate-50 p-3">
                            <dt className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                              <Briefcase
                                aria-hidden="true"
                                size={14}
                              />
                              {isSomali ? "Shaqooyin" : "Jobs"}
                            </dt>
                            <dd className="mt-1 text-lg font-black text-slate-900">
                              {business.jobCount ?? 0}
                            </dd>
                          </div>
                        )}
                        {business.type === "provider" && (
                          <div className="rounded-2xl bg-slate-50 p-3">
                            <dt className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                              <GraduationCap aria-hidden="true" size={14} />
                              {isSomali ? "Tababarro" : "Programs"}
                            </dt>
                            <dd className="mt-1 text-lg font-black text-slate-900">
                              {business.trainingCount ?? 0}
                            </dd>
                          </div>
                        )}
                      </dl>}

                      <div className="mt-auto inline-flex items-center justify-between gap-2 border-t border-slate-100 pt-5 text-sm font-black text-slate-900 transition group-hover:text-primary">
                        {isSomali ? "Eeg astaanta ganacsiga" : "View business profile"}
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 transition group-hover:bg-primary group-hover:text-white"><ArrowRight aria-hidden="true" size={15} /></span>
                      </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {result.pagination.totalPages > 1 && (
              <nav
                aria-label={isSomali ? "Bogagga natiijada" : "Results pages"}
                className="mt-10 flex items-center justify-center gap-3"
              >
                {result.pagination.page > 1 && (
                  <Link
                    href={directoryHref(
                      query,
                      result.pagination.page - 1,
                      filterParams.toString(),
                    )}
                    rel="prev"
                    className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:border-primary hover:text-primary"
                  >
                    {isSomali ? "Hore" : "Previous"}
                  </Link>
                )}
                <span className="px-3 text-sm font-bold text-slate-600">
                  {isSomali ? "Bogga" : "Page"} {result.pagination.page} /{" "}
                  {result.pagination.totalPages}
                </span>
                {result.pagination.page < result.pagination.totalPages && (
                  <Link
                    href={directoryHref(
                      query,
                      result.pagination.page + 1,
                      filterParams.toString(),
                    )}
                    rel="next"
                    className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:border-primary hover:text-primary"
                  >
                    {isSomali ? "Xiga" : "Next"}
                  </Link>
                )}
              </nav>
            )}
          </section>
        )}

      </main>
    </div>
  );
}
