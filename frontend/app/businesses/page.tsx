import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { cookies, headers } from "next/headers";
import {
  ArrowRight,
  Briefcase,
  Building2,
  Crown,
  GraduationCap,
  Grid2X2,
  Heart,
  List,
  MapPin,
  Navigation,
  Phone,
  Star,
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
import {
  getBusinessCategoryLabel,
  getCanonicalBusinessName,
} from "./businessUi";

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
    view?: string | string[];
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

const directoryHref = (
  query: string,
  page: number,
  filters = "",
  view: "grid" | "list" = "grid",
) => {
  const params = new URLSearchParams(filters);
  if (query) params.set("q", query);
  if (page > 1) params.set("page", String(page));
  if (view === "list") params.set("view", "list");
  else params.delete("view");
  const suffix = params.size ? `?${params.toString()}` : "";
  return `/businesses${suffix}`;
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
  const viewMode = firstSearchValue(searchParams?.view) === "list" ? "list" : "grid";
  const filterParams = new URLSearchParams();
  for (const key of ["type", "category", "city", "lat", "lng", "radius"] as const) {
    const value = firstSearchValue(searchParams?.[key]);
    if (value) filterParams.set(key, value.slice(0, 120));
  }
  const result = await loadBusinesses(query, requestedPage, filterParams.toString());
  const hasDirectoryFilters = Boolean(query) || filterParams.size > 0;
  const unfilteredResult = hasDirectoryFilters
    ? await loadBusinesses("", 1, "")
    : result;
  const categoryBusinesses =
    unfilteredResult.status === "success"
      ? unfilteredResult.businesses
      : result.businesses;
  const directoryTotal =
    unfilteredResult.status === "success"
      ? unfilteredResult.pagination.total ?? categoryBusinesses.length
      : result.pagination.total ?? result.businesses.length;
  const canonical = absoluteUrl("/businesses");
  const nonce = headers().get("x-nonce") || undefined;
  const categoryCounts = Array.from(
    categoryBusinesses.reduce((counts, business) => {
      const category = business.category?.trim() || "Other";
      counts.set(category, (counts.get(category) || 0) + 1);
      return counts;
    }, new Map<string, number>()),
  ).sort((a, b) => b[1] - a[1]);

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
          name: getCanonicalBusinessName(business),
          url: absoluteUrl(
            `/businesses/${business.slug || business.id}`,
          ),
        })),
      },
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors dark:bg-background">
      <script
        nonce={nonce}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <Navbar />

      <main className="mx-auto max-w-[1440px] px-4 pb-20 pt-20 sm:px-6 lg:px-8">
        <section className="relative mb-4 min-h-[150px] overflow-hidden rounded-xl border border-violet-100 bg-gradient-to-r from-white via-[#f8f7ff] to-[#eeeaff] px-5 py-7 transition-colors dark:border-violet-900/60 dark:from-[#100d20] dark:via-[#151127] dark:to-[#211641] sm:px-7">
          <div className="relative z-10 max-w-xl">
            <h1 className="text-[28px] font-extrabold tracking-[-0.035em] text-heading sm:text-[32px]">{isSomali ? "Ganacsiyada" : "Businesses"}</h1>
            <p className="mt-2 text-[12px] font-medium text-muted">{isSomali ? "Ka hel ganacsiyada Soomaaliyeed ee lagu kalsoon yahay bulshadaada." : "Find trusted Somali-owned businesses in your community."}</p>
            <p className="mt-5 flex items-center gap-2 text-[10px] font-bold text-foreground"><Building2 size={14} className="text-primary" /><span className="text-primary">{directoryTotal}</span> {isSomali ? "ganacsi ayaa la helay" : "businesses found"}</p>
          </div>
          <div aria-hidden="true" className="absolute inset-y-0 right-0 hidden w-1/2 opacity-70 md:block"><div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-violet-200/80 to-transparent dark:from-violet-950/70" /><div className="absolute bottom-5 right-8 flex items-end gap-2 text-violet-300 dark:text-violet-700"><Building2 size={74} strokeWidth={1.2}/><Building2 size={110} strokeWidth={1.1}/><Building2 size={82} strokeWidth={1.2}/></div></div>
        </section>
        <BusinessDirectoryControls isSomali={isSomali} />

        {result.status === "error" ? (
          <section className="mt-10 rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center dark:border-amber-800/60 dark:bg-amber-950/30">
            <h2 className="text-2xl font-black text-amber-950 dark:text-amber-100">
              {isSomali
                ? "Hagaha ganacsiyada hadda lama heli karo"
                : "The business directory is temporarily unavailable"}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-amber-900/80 dark:text-amber-200/80">
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
                  className="text-2xl font-black text-heading"
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
                <p className="mt-1 text-sm text-muted">
                  {result.locationFallback
                    ? isSomali
                      ? "Ganacsi kuu dhow lama helin, sidaas darteed dhammaan ganacsiyada ayaan ku tusaynaa."
                      : "No nearby businesses were found, so we’re showing all available businesses."
                    : isSomali
                    ? `${result.pagination.total ?? result.businesses.length} urur ayaa la helay`
                    : `${result.pagination.total ?? result.businesses.length} organizations found`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {query && (
                  <Link
                    href="/businesses"
                    className="mr-1 text-sm font-black text-primary hover:underline"
                  >
                    {isSomali ? "Ka saar raadinta" : "Clear search"}
                  </Link>
                )}
                <div className="flex overflow-hidden rounded-lg border border-border bg-surface">
                  <Link
                    href={directoryHref(query, requestedPage, filterParams.toString(), "grid")}
                    aria-label={isSomali ? "Muuqaal shabaq" : "Grid view"}
                    className={`grid h-9 w-9 place-items-center transition ${viewMode === "grid" ? "bg-primary/10 text-primary" : "text-muted hover:text-primary"}`}
                  >
                    <Grid2X2 size={15} />
                  </Link>
                  <Link
                    href={directoryHref(query, requestedPage, filterParams.toString(), "list")}
                    aria-label={isSomali ? "Muuqaal liis" : "List view"}
                    className={`grid h-9 w-9 place-items-center border-l border-border transition ${viewMode === "list" ? "bg-primary/10 text-primary" : "text-muted hover:text-primary"}`}
                  >
                    <List size={16} />
                  </Link>
                </div>
              </div>
            </div>

            {result.businesses.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed border-border bg-surface p-12 text-center dark:bg-surface">
                <Building2
                  aria-hidden="true"
                  className="mx-auto text-muted/50"
                  size={44}
                />
                <h2 className="mt-4 text-xl font-black text-heading">
                  {isSomali ? "Ganacsi lama helin" : "No businesses found"}
                </h2>
                <p className="mt-2 text-muted">
                  {isSomali
                    ? "Isku day eray kale ama eeg dhammaan ganacsiyada."
                    : "Try another search term or browse all businesses."}
                </p>
              </div>
            ) : (
              <div className="grid items-start gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
              <div className={`order-2 ${viewMode === "grid" ? "grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4" : "grid gap-3"}`}>
                {result.businesses.map((business) => {
                  const localized = getLocalizedBusinessText(
                    business,
                    language,
                  );
                  const displayName = getCanonicalBusinessName(business);
                  const businessPath = `/businesses/${business.slug || business.id}`;
                  const safeLogo = getSafeStoredUrl(business.logoUrl);
                  const safeBanner = getSafeStoredUrl(business.bannerUrl);
                  const location = business.location || business.address;
                  const directionsQuery = [business.address, business.city, business.region]
                    .filter(Boolean)
                    .join(", ");

                  return (
                    <article
                      key={`${business.type}-${business.id}`}
                      className={`group relative min-w-0 overflow-hidden border border-border bg-surface shadow-[0_2px_8px_rgba(15,23,42,0.05)] transition duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg dark:bg-surface dark:shadow-[0_8px_24px_rgba(0,0,0,.28)] ${viewMode === "list" ? "grid h-[195px] grid-cols-[140px_minmax(0,1fr)] rounded-xl sm:grid-cols-[260px_minmax(0,1fr)]" : "flex h-[255px] flex-col rounded-lg sm:h-[275px]"}`}
                    >
                      <Link href={businessPath} aria-label={`${isSomali ? "Eeg" : "View"} ${displayName}`} className="absolute inset-0 z-10"><span className="sr-only">{isSomali ? "Eeg" : "View"} {displayName}</span></Link>
                      <div className={`relative block shrink-0 overflow-hidden bg-surface-muted ${viewMode === "list" ? "h-[195px] border-r border-border" : "h-[108px] sm:h-[125px]"}`}>
                        {safeBanner && <img src={safeBanner} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />}
                        {!safeBanner && safeLogo && <img src={safeLogo} alt="" className="h-full w-full object-contain p-6" />}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-transparent" />
                        {business.featured && <span className="absolute left-2 top-2 rounded bg-violet-700 px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wide text-white sm:text-[8px]">{isSomali ? "La xushay" : "Featured"}</span>}
                        <Heart size={16} className="absolute right-2 top-2 text-white drop-shadow" />
                      </div>
                      <div className={`flex min-h-0 flex-1 flex-col px-3 pb-3 ${viewMode === "list" ? "sm:px-5 sm:pb-4" : "sm:px-3 sm:pb-3"}`}>
                      <div className="min-w-0 pt-2.5">
                        <h3 className={`line-clamp-1 font-extrabold tracking-tight text-heading ${viewMode === "list" ? "text-[13px] sm:text-base" : "text-[11px] sm:text-[13px]"}`}>
                          <span className="transition-colors group-hover:text-primary">
                            {displayName}
                          </span>
                        </h3>
                      </div>

                      {(business.category || typeof business.distanceKm === "number") && (
                        <div className={`mt-2 flex min-w-0 items-center gap-1 font-bold ${viewMode === "list" ? "text-[9px]" : "text-[8px]"}`}>
                          {business.category && <span className="truncate rounded bg-primary/10 px-1.5 py-0.5 text-primary">{getBusinessCategoryLabel(business.category, isSomali)}</span>}
                          {typeof business.distanceKm === "number" && <span className="shrink-0 rounded bg-surface-muted px-1.5 py-0.5 text-muted">{business.distanceKm < 1 ? `${Math.round(business.distanceKm * 1000)} m` : `${business.distanceKm.toFixed(1)} km`}</span>}
                        </div>
                      )}

                      {location && (
                        <p className={`mt-2 flex min-w-0 items-center gap-1.5 font-medium text-muted ${viewMode === "list" ? "text-[10px]" : "text-[8px] sm:text-[9px]"}`}>
                          <MapPin
                            aria-hidden="true"
                            size={12}
                            className="shrink-0 text-primary"
                          />
                          <span className="truncate">{location}</span>
                        </p>
                      )}

                      <div className={`mt-2 flex items-center justify-between gap-2 ${viewMode === "list" ? "text-[10px]" : "text-[8px] sm:text-[9px]"}`}>
                        {typeof business.rating === "number" ? <p className="flex items-center gap-1 font-semibold text-amber-500"><Star size={11} className="fill-amber-400" />{business.rating.toFixed(1)} <span className="font-normal text-muted">({business.reviewsCount ?? 0})</span></p> : <span className="text-muted">{isSomali ? "Qiimeyn ma leh" : "Not rated"}</span>}
                        <span className={`shrink-0 rounded px-1.5 py-0.5 text-[8px] font-bold ${business.statusLabel === "Closed" ? "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"}`}>{business.statusLabel === "Closed" ? (isSomali ? "Xiran" : "Closed") : (isSomali ? "Furan" : "Open")}</span>
                      </div>

                      <p className="hidden">
                        {localized.description
                          ? compactDescription(localized.description, 210)
                          : isSomali
                            ? `${displayName} waa urur ku jira hagaha ganacsiyada ${SITE_NAME}.`
                            : `${displayName} is listed in the ${SITE_NAME} business directory.`}
                      </p>

                      {business.type !== "business" && <dl className="hidden">
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

                      <div className={`relative z-20 mt-auto grid grid-cols-2 divide-x divide-border border-t border-border pt-2 font-semibold text-foreground ${viewMode === "list" ? "text-[10px]" : "text-[8px] sm:text-[9px]"}`}>
                        {business.phone ? <a href={`tel:${business.phone}`} className="flex items-center justify-center gap-1.5 hover:text-primary"><Phone size={11} />{isSomali ? "Wac" : "Call"}</a> : <span className="flex items-center justify-center gap-1.5 text-muted/50"><Phone size={11} />{isSomali ? "Wac" : "Call"}</span>}
                        {directionsQuery ? <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(directionsQuery)}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 hover:text-primary"><Navigation size={11} />{isSomali ? "Tilmaamaha" : "Directions"}</a> : <span className="flex items-center justify-center gap-1.5 text-muted/50"><Navigation size={11} />{isSomali ? "Tilmaamaha" : "Directions"}</span>}
                      </div>
                      </div>
                    </article>
                  );
                })}
              </div>
              <aside className="order-1 hidden space-y-3 lg:block">
                <div className="rounded-xl border border-border bg-surface p-4 shadow-[0_2px_8px_rgba(15,23,42,.04)] dark:bg-surface dark:shadow-[0_8px_24px_rgba(0,0,0,.28)]"><h3 className="flex items-center gap-2 text-[12px] font-extrabold text-heading"><Building2 size={14} className="text-primary" />{isSomali ? "Qaybaha" : "Categories"}</h3><div className="mt-3 space-y-1"><Link href="/businesses" className={`flex items-center justify-between rounded-lg px-2.5 py-2 text-[9px] font-bold ${filterParams.has("category") ? "text-muted hover:bg-surface-muted hover:text-primary" : "bg-primary/10 text-primary"}`}><span>{isSomali ? "Dhammaan qaybaha" : "All Categories"}</span><span>{directoryTotal}</span></Link>{categoryCounts.slice(0, 8).map(([category, count]) => { const selected = filterParams.get("category") === category; return <Link key={category} href={`/businesses?category=${encodeURIComponent(category)}`} className={`flex items-center justify-between rounded-lg px-2.5 py-2 text-[9px] ${selected ? "bg-primary/10 font-bold text-primary" : "font-medium text-muted hover:bg-surface-muted hover:text-primary"}`}><span className="truncate">{getBusinessCategoryLabel(category, isSomali)}</span><span>{count}</span></Link>; })}</div></div>
                <div className="rounded-xl border border-violet-100 bg-gradient-to-b from-violet-50 to-white p-4 text-center dark:border-violet-900/60 dark:from-violet-950/35 dark:to-surface"><Crown className="mx-auto text-primary" size={20}/><h3 className="mt-2 text-[12px] font-extrabold text-heading">{isSomali ? "Noqo ganacsi la xushay" : "Get Featured"}</h3><p className="mt-1 text-[9px] leading-4 text-muted">{isSomali ? "Kordhi muuqaalka ganacsigaaga oo gaadh macaamiil badan." : "Boost your business visibility and reach more customers."}</p><Link href="/contact" className="mt-3 flex h-9 items-center justify-center rounded-lg bg-primary text-[9px] font-bold text-white">{isSomali ? "Noqo mid la xushay" : "Become Featured"}</Link></div>
              </aside>
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
                      viewMode,
                    )}
                    rel="prev"
                    className="rounded-xl border border-border bg-surface px-5 py-3 text-sm font-black text-foreground hover:border-primary hover:text-primary dark:bg-surface"
                  >
                    {isSomali ? "Hore" : "Previous"}
                  </Link>
                )}
                <span className="px-3 text-sm font-bold text-muted">
                  {isSomali ? "Bogga" : "Page"} {result.pagination.page} /{" "}
                  {result.pagination.totalPages}
                </span>
                {result.pagination.page < result.pagination.totalPages && (
                  <Link
                    href={directoryHref(
                      query,
                      result.pagination.page + 1,
                      filterParams.toString(),
                      viewMode,
                    )}
                    rel="next"
                    className="rounded-xl border border-border bg-surface px-5 py-3 text-sm font-black text-foreground hover:border-primary hover:text-primary dark:bg-surface"
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
