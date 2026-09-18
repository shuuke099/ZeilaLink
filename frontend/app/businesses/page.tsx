import BusinessStatusRefresh from "@/components/businesses/BusinessStatusRefresh";
import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { cookies, headers } from "next/headers";
import {
  BadgeCheck,
  Briefcase,
  Building2,
  Crown,
  GraduationCap,
  Grid2X2,
  List,
  MapPin,
  Navigation,
  Phone,
  Star,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import BusinessFavoriteButton from "@/components/businesses/BusinessFavoriteButton";
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

const getStatusBadge = (statusLabel?: string, status?: string, isSomali?: boolean) => {
  const currentStatus =
    status ||
    (statusLabel === "Open"
      ? "OPEN"
      : statusLabel === "Closing Soon"
        ? "CLOSING_SOON"
        : statusLabel === "Closed"
          ? "CLOSED"
          : "HOURS_UNAVAILABLE");

  switch (currentStatus) {
    case "OPEN":
      return {
        className:
          "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
        label: isSomali ? "Hadda furan" : "Open now",
        shortLabel: isSomali ? "Furan" : "Open",
      };
    case "CLOSING_SOON":
      return {
        className:
          "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
        label: isSomali ? "Dhawaan xirmeysa" : "Closing soon",
        shortLabel: isSomali ? "Xirmeysa" : "Closing soon",
      };
    case "CLOSED":
      return {
        className:
          "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300",
        label: isSomali ? "Xiran" : "Closed",
        shortLabel: isSomali ? "Xiran" : "Closed",
      };
    default:
      return {
        className:
          "border-slate-300 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400",
        label: isSomali ? "Saacadaha lama hayo" : "Hours unavailable",
        shortLabel: isSomali ? "Saacadaha lama hayo" : "Hours unavailable",
      };
  }
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
        suppressHydrationWarning
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <Navbar />
      <BusinessStatusRefresh />

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
              <div className="grid items-start gap-4 xl:grid-cols-[220px_minmax(0,1fr)]">
              <div className={`order-2 min-w-0 ${viewMode === "grid" ? "grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5" : "grid gap-3"}`}>
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

                  if (viewMode === "list") {
                    const description = localized.description
                      ? compactDescription(localized.description, 220)
                      : isSomali
                        ? `${displayName} waa urur ku jira hagaha ganacsiyada ${SITE_NAME}.`
                        : `${displayName} is listed in the ${SITE_NAME} business directory.`;

                    return (
                      <article
                        key={`${business.type}-${business.id}`}
                        className="group relative grid min-h-[225px] min-w-0 grid-cols-[138px_minmax(0,1fr)] overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_4px_16px_rgba(15,23,42,.07)] transition duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-xl dark:shadow-[0_8px_24px_rgba(0,0,0,.35)] sm:grid-cols-[245px_minmax(0,1fr)]"
                      >
                        <Link href={businessPath} aria-label={`${isSomali ? "Eeg" : "View"} ${displayName}`} className="absolute inset-0 z-10 rounded-[inherit] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"><span className="sr-only">{isSomali ? "Eeg" : "View"} {displayName}</span></Link>
                        <div className="relative min-h-[225px] overflow-hidden border-r border-border bg-surface-muted">
                          {safeBanner && <img src={safeBanner} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />}
                          {!safeBanner && safeLogo && <img src={safeLogo} alt="" className="h-full w-full object-contain p-8" />}
                          {!safeBanner && !safeLogo && <Building2 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-muted/40" size={46} />}
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/30 via-transparent to-transparent" />
                          {business.featured && <span className="absolute left-2 top-2 max-w-[66px] truncate rounded-md bg-violet-700 px-1.5 py-1 text-[7px] font-extrabold uppercase tracking-wide text-white shadow-sm sm:left-3 sm:top-3 sm:max-w-none sm:px-2 sm:text-[9px]">{isSomali ? "La xushay" : "Featured"}</span>}
                          <BusinessFavoriteButton business={business} isSomali={isSomali} className="absolute right-2 top-2 z-20 h-7 w-7 sm:right-3 sm:top-3 sm:h-8 sm:w-8" />
                        </div>

                        <div className="flex min-w-0 flex-col p-2.5 sm:p-5">
                          <div className="flex flex-wrap items-center gap-1.5 text-[8px] font-bold sm:gap-2 sm:text-[10px]">
                            {business.category && <span className="rounded-md border border-primary/25 bg-primary/10 px-2 py-1 text-primary">{getBusinessCategoryLabel(business.category, isSomali)}</span>}
                            {(() => {
                              const badge = getStatusBadge(business.statusLabel, business.status, isSomali);
                              return (
                                <span className={`rounded-full border px-2 py-1 ${badge.className}`}>
                                  ● {badge.label}
                                </span>
                              );
                            })()}
                          </div>

                          <h3 className="mt-2 line-clamp-2 text-[13px] font-extrabold leading-tight tracking-[-0.02em] text-heading transition-colors group-hover:text-primary sm:line-clamp-1 sm:text-[19px]">{displayName}</h3>
                          {(business.subcategory || business.category) && <p className="mt-1 truncate text-[10px] font-bold text-primary sm:text-[12px]">{business.subcategory || getBusinessCategoryLabel(business.category || "", isSomali)}</p>}
                          <p className="mt-1.5 line-clamp-2 text-[9px] font-medium leading-4 text-muted sm:mt-2 sm:text-[12px] sm:leading-5">{description}</p>

                          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[9px] font-semibold text-foreground sm:mt-3 sm:gap-x-4 sm:gap-y-2 sm:text-[11px]">
                            {typeof business.rating === "number" && <span className="inline-flex items-center gap-1"><Star size={13} className="fill-amber-400 text-amber-500" />{business.rating.toFixed(1)} <span className="font-normal text-muted">({business.reviewsCount ?? 0} {isSomali ? "faallo" : "reviews"})</span></span>}
                            {location && <span className="inline-flex min-w-0 items-center gap-1 text-muted"><MapPin size={13} className="shrink-0 text-primary" /><span className="truncate">{location}</span></span>}
                            {business.verified && <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400"><BadgeCheck size={13} />{isSomali ? "La xaqiijiyey" : "Verified"}</span>}
                          </div>

                          <div className="relative z-20 mt-auto grid grid-cols-2 gap-1.5 border-t border-border pt-2 text-[9px] font-bold sm:flex sm:flex-wrap sm:items-center sm:gap-2 sm:pt-3 sm:text-[11px]">
                            {business.phone ? <a href={`tel:${business.phone}`} className="inline-flex h-8 min-w-0 items-center justify-center gap-1 rounded-lg border border-border bg-surface-muted px-1 text-foreground transition hover:border-primary/50 hover:text-primary sm:h-9 sm:min-w-[88px] sm:gap-1.5 sm:px-3"><Phone size={12} />{isSomali ? "Wac" : "Call"}</a> : <span className="inline-flex h-8 min-w-0 items-center justify-center gap-1 rounded-lg border border-border bg-surface-muted px-1 text-muted/50 sm:h-9 sm:min-w-[88px] sm:gap-1.5 sm:px-3"><Phone size={12} />{isSomali ? "Wac" : "Call"}</span>}
                            {directionsQuery ? <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(directionsQuery)}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 min-w-0 items-center justify-center gap-1 rounded-lg border border-primary/40 bg-primary/10 px-1 text-primary transition hover:border-primary hover:bg-primary hover:text-white sm:h-9 sm:min-w-[105px] sm:gap-1.5 sm:px-3"><Navigation size={12} />{isSomali ? "Tilmaamaha" : "Directions"}</a> : <span className="inline-flex h-8 min-w-0 items-center justify-center gap-1 rounded-lg border border-border bg-surface-muted px-1 text-muted/50 sm:h-9 sm:min-w-[105px] sm:gap-1.5 sm:px-3"><Navigation size={12} />{isSomali ? "Tilmaamaha" : "Directions"}</span>}
                          </div>
                        </div>
                      </article>
                    );
                  }

                  return (
                    <article
                      key={`${business.type}-${business.id}`}
                      className="group relative flex min-h-[335px] min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_4px_16px_rgba(15,23,42,0.07)] transition duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl dark:bg-surface dark:shadow-[0_8px_24px_rgba(0,0,0,.35)] sm:min-h-[355px]"
                    >
                      <Link href={businessPath} aria-label={`${isSomali ? "Eeg" : "View"} ${displayName}`} className="absolute inset-0 z-10 rounded-[inherit] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"><span className="sr-only">{isSomali ? "Eeg" : "View"} {displayName}</span></Link>
                      <div className="relative block h-[140px] shrink-0 overflow-hidden bg-surface-muted sm:h-[155px]">
                        {safeBanner && <img src={safeBanner} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />}
                        {!safeBanner && safeLogo && <img src={safeLogo} alt="" className="h-full w-full object-contain p-6" />}
                        {!safeBanner && !safeLogo && <Building2 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-muted/40" size={42} />}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/30 via-transparent to-transparent" />
                        {business.featured && <span className="absolute left-2.5 top-2.5 rounded-md bg-violet-700 px-2 py-1 text-[8px] font-extrabold uppercase tracking-wide text-white shadow-sm sm:text-[9px]">{isSomali ? "La xushay" : "Featured"}</span>}
                        <BusinessFavoriteButton business={business} isSomali={isSomali} className="absolute right-2.5 top-2.5 z-20 h-7 w-7" />
                      </div>
                      <div className="flex min-h-0 flex-1 flex-col p-3 sm:p-4">

                      {(business.category || typeof business.distanceKm === "number") && (
                        <div className="flex min-w-0 items-center gap-1.5 text-[9px] font-bold sm:text-[10px]">
                          {business.category && <span className="truncate rounded-md bg-primary/10 px-2 py-1 text-primary">{getBusinessCategoryLabel(business.category, isSomali)}</span>}
                          {typeof business.distanceKm === "number" && <span className="shrink-0 rounded-md bg-surface-muted px-2 py-1 text-muted">{business.distanceKm < 1 ? `${Math.round(business.distanceKm * 1000)} m` : `${business.distanceKm.toFixed(1)} km`}</span>}
                        </div>
                      )}

                      <div className="mt-2.5 min-w-0">
                        <h3 className="line-clamp-2 text-[13px] font-extrabold leading-[1.25] tracking-[-0.015em] text-heading sm:text-[15px] xl:text-[16px]">
                          <span className="transition-colors group-hover:text-primary">
                            {displayName}
                          </span>
                        </h3>
                      </div>

                      {location && (
                        <p className="mt-1.5 flex min-w-0 items-center gap-1.5 text-[10px] font-normal leading-4 text-muted sm:text-[11px]">
                          <MapPin
                            aria-hidden="true"
                            size={12}
                            className="shrink-0 text-primary"
                          />
                          <span className="truncate">{location}</span>
                        </p>
                      )}

                      <div className="mt-3 flex items-center justify-between gap-2 text-[10px] sm:text-[11px]">
                        {typeof business.rating === "number" ? <p className="flex items-center gap-1 font-bold text-foreground"><Star size={12} className="fill-amber-400 text-amber-500" />{business.rating.toFixed(1)} <span className="font-normal text-muted">({business.reviewsCount ?? 0})</span></p> : <span className="text-muted">{isSomali ? "Qiimeyn ma leh" : "Not rated"}</span>}
                        {(() => {
                          const badge = getStatusBadge(business.statusLabel, business.status, isSomali);
                          return (
                            <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[8px] font-bold sm:text-[9px] ${badge.className}`}>
                              {badge.shortLabel}
                            </span>
                          );
                        })()}
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

                      <div className="relative z-20 mt-auto grid grid-cols-2 gap-2 border-t border-border pt-3 text-[10px] font-bold sm:text-[11px]">
                        {business.phone ? <a href={`tel:${business.phone}`} className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface-muted text-foreground transition hover:border-primary/50 hover:text-primary"><Phone size={13} />{isSomali ? "Wac" : "Call"}</a> : <span className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface-muted text-muted/50"><Phone size={13} />{isSomali ? "Wac" : "Call"}</span>}
                        {directionsQuery ? <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(directionsQuery)}`} target="_blank" rel="noopener noreferrer" className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface-muted text-foreground transition hover:border-primary/50 hover:text-primary"><Navigation size={13} />{isSomali ? "Tilmaamaha" : "Directions"}</a> : <span className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface-muted text-muted/50"><Navigation size={13} />{isSomali ? "Tilmaamaha" : "Directions"}</span>}
                      </div>
                      </div>
                    </article>
                  );
                })}
              </div>
              <aside className="order-1 hidden space-y-3 xl:block">
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
