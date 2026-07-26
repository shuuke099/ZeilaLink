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
  Search,
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
  };
}

type BusinessesLoadResult =
  | {
      status: "success";
      businesses: PublicBusiness[];
      pagination: DirectoryPagination;
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
  async (query: string, page: number): Promise<BusinessesLoadResult> => {
    const params = new URLSearchParams();
    if (query) params.set("search", query);
    if (page > 1) params.set("page", String(page));

    try {
      const suffix = params.size ? `?${params.toString()}` : "";
      const response = await serverApiGet<unknown>(
        `/public/businesses${suffix}`,
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

const directoryHref = (query: string, page: number) => {
  const params = new URLSearchParams();
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
  return language === "so" ? "Shaqeeye" : "Employer";
};

export async function generateMetadata({
  searchParams,
}: BusinessesPageProps): Promise<Metadata> {
  const language = pageLanguage();
  const query = normalizedQuery(searchParams?.q);
  const page = normalizedPage(searchParams?.page);
  const result = await loadBusinesses(query, page);
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
  const result = await loadBusinesses(query, requestedPage);
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

      <main className="mx-auto max-w-7xl px-4 pb-20 pt-28 sm:px-6 lg:px-8">
        <nav
          aria-label={isSomali ? "Jidka bogga" : "Breadcrumb"}
          className="mb-8 flex items-center gap-2 text-sm font-semibold text-slate-500"
        >
          <Link href="/" className="transition-colors hover:text-primary">
            {isSomali ? "Bogga hore" : "Home"}
          </Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page" className="text-slate-900">
            {isSomali ? "Ganacsiyada" : "Businesses"}
          </span>
        </nav>

        <section className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 px-6 py-12 text-white sm:px-10 lg:px-14">
          <div
            aria-hidden="true"
            className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/30 blur-3xl"
          />
          <div className="relative max-w-3xl">
            <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-primary-light">
              {isSomali ? "Ururrada ZeilaLink" : "ZeilaLink organizations"}
            </span>
            <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">
              {isSomali ? "Hagaha ganacsiyada" : "Business directory"}
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-300">
              {isSomali
                ? "La kulan shaqeeyayaasha, shirkadaha iyo bixiyeyaasha tababarka ee kobcinaya shaqada iyo xirfadaha."
                : "Meet the employers, companies, and training providers creating career and skills opportunities."}
            </p>
          </div>

          <form
            action="/businesses"
            method="get"
            role="search"
            className="relative mt-8 flex max-w-3xl flex-col gap-3 sm:flex-row"
          >
            <label className="relative flex-1">
              <span className="sr-only">
                {isSomali ? "Raadi ganacsi" : "Search businesses"}
              </span>
              <Search
                aria-hidden="true"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={20}
              />
              <input
                type="search"
                name="q"
                defaultValue={query}
                maxLength={100}
                placeholder={
                  isSomali
                    ? "Magac, nooc ama goob ku raadi"
                    : "Search by name, type, or location"
                }
                className="w-full rounded-2xl border border-white/10 bg-white py-4 pl-12 pr-4 text-slate-900 outline-none transition focus:ring-4 focus:ring-primary/30"
              />
            </label>
            <button
              type="submit"
              className="rounded-2xl bg-primary px-7 py-4 font-black text-white transition hover:bg-primary-dark"
            >
              {isSomali ? "Raadi" : "Search"}
            </button>
          </form>
        </section>

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
          <section className="mt-10" aria-labelledby="business-results-heading">
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
                    : isSomali
                      ? "Ururrada la heli karo"
                      : "Featured organizations"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {isSomali
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
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {result.businesses.map((business) => {
                  const localized = getLocalizedBusinessText(
                    business,
                    language,
                  );
                  const businessPath = `/businesses/${business.slug || business.id}`;
                  const safeLogo = getSafeStoredUrl(business.logoUrl);
                  const location = business.location || business.address;
                  const alternateName = isSomali
                    ? business.name
                    : business.nameSo?.trim();

                  return (
                    <article
                      key={`${business.type}-${business.id}`}
                      className="flex h-full flex-col rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-primary/20 hover:shadow-xl"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
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
                              className="h-full w-full object-contain p-2"
                            />
                          ) : (
                            <Building2
                              aria-hidden="true"
                              size={26}
                              className="text-primary"
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-primary">
                            {businessTypeLabel(business.type, language)}
                          </span>
                          <h3 className="mt-2 text-xl font-black text-slate-900">
                            <Link
                              href={businessPath}
                              className="transition-colors hover:text-primary"
                            >
                              {localized.name}
                            </Link>
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
                        <p className="mt-5 flex items-start gap-2 text-sm font-medium text-slate-600">
                          <MapPin
                            aria-hidden="true"
                            size={16}
                            className="mt-0.5 shrink-0 text-primary"
                          />
                          {location}
                        </p>
                      )}

                      <p className="mt-4 line-clamp-4 text-sm leading-relaxed text-slate-600">
                        {localized.description
                          ? compactDescription(localized.description, 210)
                          : isSomali
                            ? `${localized.name} waa urur ku jira hagaha ganacsiyada ${SITE_NAME}.`
                            : `${localized.name} is listed in the ${SITE_NAME} business directory.`}
                      </p>

                      <dl className="mt-5 grid grid-cols-2 gap-3">
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
                      </dl>

                      <Link
                        href={businessPath}
                        className="mt-auto inline-flex items-center justify-center gap-2 border-t border-slate-100 pt-5 text-sm font-black text-primary hover:underline"
                      >
                        {isSomali ? "Eeg astaanta ganacsiga" : "View business profile"}
                        <ArrowRight aria-hidden="true" size={15} />
                      </Link>
                    </article>
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

        <section className="mt-14 grid gap-4 rounded-3xl border border-slate-100 bg-white p-8 sm:grid-cols-[1fr,auto] sm:items-center">
          <div>
            <h2 className="text-2xl font-black text-slate-900">
              {isSomali ? "La xiriir hibada saxda ah" : "Connect with the right talent"}
            </h2>
            <p className="mt-2 text-slate-600">
              {isSomali
                ? "Eeg shaqaalaha xirfadda leh ama sahami adeegyada bulshada ZeilaLink."
                : "Browse skilled workers or explore services from the ZeilaLink community."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/workers"
              className="rounded-xl bg-primary px-5 py-3 text-sm font-black text-white"
            >
              {isSomali ? "Eeg shaqaalaha" : "Browse workers"}
            </Link>
            <Link
              href="/services"
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700"
            >
              {isSomali ? "Eeg adeegyada" : "Browse services"}
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
