import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { cookies, headers } from "next/headers";
import {
  ArrowRight,
  Briefcase,
  Languages,
  MapPin,
  Search,
  UserRound,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { serverApiGet } from "@/lib/serverApi";
import { getSafeStoredUrl } from "@/lib/safeUrl";
import { SITE_NAME, absoluteUrl } from "@/lib/seo";
import {
  type DirectoryLanguage,
  type DirectoryPagination,
  type PublicWorker,
  getLocalizedWorkerText,
  parseWorkersResponse,
} from "@/lib/publicDirectoryTypes";

export const dynamic = "force-dynamic";

const compactDescription = (value: string, maximumLength = 160) => {
  const compact = value.replace(/\s+/g, " ").trim();
  if (compact.length <= maximumLength) return compact;
  return `${compact.slice(0, Math.max(1, maximumLength - 1)).trimEnd()}…`;
};

interface WorkersPageProps {
  searchParams?: {
    q?: string | string[];
    page?: string | string[];
  };
}

type WorkersLoadResult =
  | {
      status: "success";
      workers: PublicWorker[];
      pagination: DirectoryPagination;
    }
  | { status: "error"; workers: []; pagination: DirectoryPagination };

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

const loadWorkers = cache(
  async (query: string, page: number): Promise<WorkersLoadResult> => {
    const params = new URLSearchParams();
    if (query) params.set("search", query);
    if (page > 1) params.set("page", String(page));

    try {
      const suffix = params.size ? `?${params.toString()}` : "";
      const response = await serverApiGet<unknown>(
        `/public/workers${suffix}`,
      );
      const parsed = parseWorkersResponse(response);

      if (!parsed) {
        return {
          status: "error",
          workers: [],
          pagination: { page: 1, totalPages: 1, total: 0 },
        };
      }

      return { status: "success", ...parsed };
    } catch {
      return {
        status: "error",
        workers: [],
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
  return `/workers${suffix}`;
};

const workerDescription = (
  worker: PublicWorker,
  language: DirectoryLanguage,
) => {
  const localized = getLocalizedWorkerText(worker, language);
  if (localized.bio) return localized.bio;
  if (localized.headline) return localized.headline;
  return language === "so"
    ? `${worker.name} waa xirfadle ku jira hagaha shaqaalaha ee ${SITE_NAME}.`
    : `${worker.name} is a professional listed in the ${SITE_NAME} worker directory.`;
};

export async function generateMetadata({
  searchParams,
}: WorkersPageProps): Promise<Metadata> {
  const language = pageLanguage();
  const query = normalizedQuery(searchParams?.q);
  const page = normalizedPage(searchParams?.page);
  const result = await loadWorkers(query, page);
  const canonical = absoluteUrl("/workers");
  const baseTitle =
    language === "so" ? "Raadi Shaqaale Xirfad Leh" : "Find Skilled Workers";
  const title = query
    ? language === "so"
      ? `Shaqaale la xiriira “${query}” | ${SITE_NAME}`
      : `Workers matching “${query}” | ${SITE_NAME}`
    : `${baseTitle} | ${SITE_NAME}`;
  const description =
    language === "so"
      ? `Ka hel shaqaale iyo xirfadlayaal la xaqiijiyey gudaha hagaha ${SITE_NAME}. Eeg xirfadaha, khibradaha, luqadaha iyo goobaha ay joogaan.`
      : `Discover skilled professionals in the ${SITE_NAME} worker directory. Explore their skills, experience, languages, and locations.`;

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
          alt: "ZeilaLink skilled worker directory",
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

export default async function WorkersPage({
  searchParams,
}: WorkersPageProps) {
  const language = pageLanguage();
  const isSomali = language === "so";
  const query = normalizedQuery(searchParams?.q);
  const requestedPage = normalizedPage(searchParams?.page);
  const result = await loadWorkers(query, requestedPage);
  const nonce = headers().get("x-nonce") || undefined;
  const canonical = absoluteUrl("/workers");

  const breadcrumbData = {
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
        name: isSomali ? "Shaqaale" : "Workers",
        item: canonical,
      },
    ],
  };

  const collectionData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: isSomali ? "Hagaha shaqaalaha" : "Worker directory",
    url: canonical,
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: absoluteUrl("/"),
    },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: result.workers.map((worker, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: worker.name,
        url: absoluteUrl(`/workers/${worker.slug || worker.id}`),
      })),
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <script
        nonce={nonce}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([breadcrumbData, collectionData]).replace(
            /</g,
            "\\u003c",
          ),
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
            {isSomali ? "Shaqaale" : "Workers"}
          </span>
        </nav>

        <section className="overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white px-6 py-10 shadow-sm sm:px-10 lg:px-14">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full bg-primary/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-primary">
              {isSomali ? "Hibada ZeilaLink" : "ZeilaLink talent"}
            </span>
            <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
              {isSomali
                ? "Raadi shaqaalaha xirfadda leh"
                : "Find skilled workers"}
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-600">
              {isSomali
                ? "Ka raadi xirfadlayaal Soomaaliyeed khibraddooda, xirfadahooda, luqadahooda iyo goobta ay joogaan."
                : "Search Somali professionals by their experience, skills, languages, and location."}
            </p>
          </div>

          <form
            action="/workers"
            method="get"
            role="search"
            className="mt-8 flex max-w-3xl flex-col gap-3 sm:flex-row"
          >
            <label className="relative flex-1">
              <span className="sr-only">
                {isSomali ? "Raadi shaqaale" : "Search workers"}
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
                    ? "Magac, xirfad ama goob ku raadi"
                    : "Search by name, skill, or location"
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-slate-900 outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
              />
            </label>
            <button
              type="submit"
              className="rounded-2xl bg-primary px-7 py-4 font-black text-white transition hover:bg-primary-darker"
            >
              {isSomali ? "Raadi" : "Search"}
            </button>
          </form>
        </section>

        {result.status === "error" ? (
          <section className="mt-10 rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center">
            <h2 className="text-2xl font-black text-amber-950">
              {isSomali
                ? "Hagaha shaqaalaha hadda lama heli karo"
                : "The worker directory is temporarily unavailable"}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-amber-900/80">
              {isSomali
                ? "Xogta lama soo qaadi karin. Fadlan mar kale isku day wax yar ka dib."
                : "We could not load the directory data. Please try again in a moment."}
            </p>
          </section>
        ) : (
          <section className="mt-10" aria-labelledby="worker-results-heading">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2
                  id="worker-results-heading"
                  className="text-2xl font-black text-slate-900"
                >
                  {query
                    ? isSomali
                      ? `Natiijooyinka “${query}”`
                      : `Results for “${query}”`
                    : isSomali
                      ? "Xirfadlayaasha la heli karo"
                      : "Available professionals"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {isSomali
                    ? `${result.pagination.total ?? result.workers.length} shaqaale ayaa la helay`
                    : `${result.pagination.total ?? result.workers.length} workers found`}
                </p>
              </div>
              {query && (
                <Link
                  href="/workers"
                  className="text-sm font-black text-primary hover:underline"
                >
                  {isSomali ? "Ka saar raadinta" : "Clear search"}
                </Link>
              )}
            </div>

            {result.workers.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
                <UserRound
                  aria-hidden="true"
                  className="mx-auto text-slate-300"
                  size={44}
                />
                <h2 className="mt-4 text-xl font-black text-slate-900">
                  {isSomali ? "Shaqaale lama helin" : "No workers found"}
                </h2>
                <p className="mt-2 text-slate-600">
                  {isSomali
                    ? "Isku day eray kale ama eeg dhammaan shaqaalaha."
                    : "Try another search term or browse all workers."}
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {result.workers.map((worker) => {
                  const localized = getLocalizedWorkerText(worker, language);
                  const profilePath = `/workers/${worker.slug || worker.id}`;
                  const safeAvatar = getSafeStoredUrl(worker.avatarUrl);
                  const skills = worker.userSkills
                    .map((entry) => entry.skill?.name?.trim())
                    .filter((name): name is string => Boolean(name))
                    .slice(0, 4);

                  return (
                    <article
                      key={worker.id}
                      className="flex h-full flex-col rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-primary/20 hover:shadow-xl"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-primary/10">
                          {safeAvatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={safeAvatar}
                              alt={
                                isSomali
                                  ? `Sawirka astaanta ${worker.name}`
                                  : `${worker.name} profile photo`
                              }
                              loading="lazy"
                              decoding="async"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span
                              aria-hidden="true"
                              className="text-xl font-black text-primary"
                            >
                              {worker.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-xl font-black text-slate-900">
                            <Link
                              href={profilePath}
                              className="transition-colors hover:text-primary"
                            >
                              {worker.name}
                            </Link>
                          </h3>
                          <p className="mt-1 line-clamp-2 text-sm font-semibold text-primary">
                            {localized.headline ||
                              (isSomali ? "Xirfadle" : "Professional")}
                          </p>
                        </div>
                      </div>

                      {worker.location && (
                        <p className="mt-5 flex items-center gap-2 text-sm font-medium text-slate-600">
                          <MapPin
                            aria-hidden="true"
                            size={16}
                            className="text-primary"
                          />
                          {worker.location}
                        </p>
                      )}

                      <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-slate-600">
                        {compactDescription(
                          workerDescription(worker, language),
                          180,
                        )}
                      </p>

                      {skills.length > 0 && (
                        <ul
                          className="mt-5 flex flex-wrap gap-2"
                          aria-label={isSomali ? "Xirfadaha" : "Skills"}
                        >
                          {skills.map((skill) => (
                            <li
                              key={skill}
                              className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700"
                            >
                              {skill}
                            </li>
                          ))}
                        </ul>
                      )}

                      <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-5">
                        <span className="flex items-center gap-2 text-xs font-bold text-slate-500">
                          {worker.workerExperiences.length > 0 ? (
                            <Briefcase
                              aria-hidden="true"
                              size={15}
                            />
                          ) : (
                            <Languages aria-hidden="true" size={15} />
                          )}
                          {worker.workerExperiences.length > 0
                            ? isSomali
                              ? `${worker.workerExperiences.length} khibradood`
                              : `${worker.workerExperiences.length} experience entries`
                            : isSomali
                              ? `${worker.workerLanguages.length} luqadood`
                              : `${worker.workerLanguages.length} languages`}
                        </span>
                        <Link
                          href={profilePath}
                          aria-label={
                            isSomali
                              ? `Eeg astaanta ${worker.name}`
                              : `View ${worker.name}'s profile`
                          }
                          className="inline-flex items-center gap-1 text-sm font-black text-primary hover:underline"
                        >
                          {isSomali ? "Eeg" : "View"}
                          <ArrowRight aria-hidden="true" size={15} />
                        </Link>
                      </div>
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

        <section className="mt-14 grid gap-4 rounded-3xl bg-slate-900 p-8 text-white sm:grid-cols-[1fr,auto] sm:items-center">
          <div>
            <h2 className="text-2xl font-black">
              {isSomali ? "Ma raadineysaa fursad?" : "Looking for an opportunity?"}
            </h2>
            <p className="mt-2 text-slate-300">
              {isSomali
                ? "Ka eeg shaqooyinka iyo tababarrada cusub ee ZeilaLink."
                : "Explore the latest jobs and training programs on ZeilaLink."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/jobs"
              className="rounded-xl bg-primary px-5 py-3 text-sm font-black text-white"
            >
              {isSomali ? "Eeg shaqooyinka" : "Browse jobs"}
            </Link>
            <Link
              href="/training"
              className="rounded-xl border border-white/20 px-5 py-3 text-sm font-black text-white"
            >
              {isSomali ? "Eeg tababarrada" : "Browse training"}
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
