import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import {
  Award,
  BookOpen,
  Briefcase,
  CalendarDays,
  Languages,
  MapPin,
  UserRound,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { ServerApiError, serverApiGet } from "@/lib/serverApi";
import { getSafeStoredUrl } from "@/lib/safeUrl";
import { SITE_NAME, absoluteUrl } from "@/lib/seo";
import {
  type DirectoryLanguage,
  type PublicWorker,
  getLocalizedWorkerText,
  isPublicDirectoryIdentifier,
  parseWorkerDetailResponse,
} from "@/lib/publicDirectoryTypes";

export const dynamic = "force-dynamic";

const compactDescription = (value: string, maximumLength = 160) => {
  const compact = value.replace(/\s+/g, " ").trim();
  if (compact.length <= maximumLength) return compact;
  return `${compact.slice(0, Math.max(1, maximumLength - 1)).trimEnd()}…`;
};

interface WorkerProfilePageProps {
  params: { slug: string };
}

type WorkerLoadResult =
  | { status: "success"; worker: PublicWorker }
  | { status: "not-found" }
  | { status: "error" };

const pageLanguage = (): DirectoryLanguage =>
  cookies().get("language")?.value === "so" ? "so" : "en";

const loadWorker = cache(async (identifier: string): Promise<WorkerLoadResult> => {
  if (!isPublicDirectoryIdentifier(identifier)) return { status: "not-found" };

  try {
    const response = await serverApiGet<unknown>(
      `/public/workers/${encodeURIComponent(identifier)}`,
    );
    const worker = parseWorkerDetailResponse(response);
    return worker ? { status: "success", worker } : { status: "error" };
  } catch (error) {
    if (error instanceof ServerApiError && error.status === 404) {
      return { status: "not-found" };
    }
    return { status: "error" };
  }
});

const profileDescription = (
  worker: PublicWorker,
  language: DirectoryLanguage,
) => {
  const localized = getLocalizedWorkerText(worker, language);
  if (localized.bio) return compactDescription(localized.bio);
  if (localized.headline) {
    return compactDescription(
      language === "so"
        ? `${worker.name} — ${localized.headline}. Ka eeg xirfadaha iyo khibradda ${SITE_NAME}.`
        : `${worker.name} — ${localized.headline}. View skills and experience on ${SITE_NAME}.`,
    );
  }
  return language === "so"
    ? `Eeg xirfadaha iyo khibradda ${worker.name} ee ${SITE_NAME}.`
    : `View ${worker.name}'s skills and professional experience on ${SITE_NAME}.`;
};

const formatDate = (
  value: string | null | undefined,
  language: DirectoryLanguage,
) => {
  if (!value || Number.isNaN(Date.parse(value))) return null;
  return new Intl.DateTimeFormat(language === "so" ? "so-SO" : "en-US", {
    month: "short",
    year: "numeric",
  }).format(new Date(value));
};

const dateRange = (
  start: string | null | undefined,
  end: string | null | undefined,
  current: boolean | undefined,
  language: DirectoryLanguage,
) => {
  const startLabel = formatDate(start, language);
  const endLabel = current
    ? language === "so"
      ? "Hadda"
      : "Present"
    : formatDate(end, language);
  if (startLabel && endLabel) return `${startLabel} – ${endLabel}`;
  return startLabel || endLabel;
};

const titleCase = (value: string) =>
  value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

export async function generateMetadata({
  params,
}: WorkerProfilePageProps): Promise<Metadata> {
  const language = pageLanguage();
  const result = await loadWorker(params.slug);

  if (result.status === "not-found") {
    return {
      title:
        language === "so"
          ? `Shaqaalaha Lama Helin | ${SITE_NAME}`
          : `Worker Not Found | ${SITE_NAME}`,
      robots: { index: false, follow: false },
    };
  }

  if (result.status === "error") {
    return {
      title:
        language === "so"
          ? `Astaanta Shaqaalaha | ${SITE_NAME}`
          : `Worker Profile | ${SITE_NAME}`,
      description:
        language === "so"
          ? "Astaantan shaqaalaha si ku-meel-gaar ah lama heli karo."
          : "This worker profile is temporarily unavailable.",
      robots: { index: false, follow: true },
    };
  }

  const { worker } = result;
  if (worker.slug && params.slug !== worker.slug) {
    permanentRedirect(`/workers/${worker.slug}`);
  }

  const localized = getLocalizedWorkerText(worker, language);
  const title = localized.headline
    ? `${worker.name}, ${localized.headline} | ${SITE_NAME}`
    : `${worker.name} | ${SITE_NAME}`;
  const description = profileDescription(worker, language);
  const canonical = absoluteUrl(`/workers/${worker.slug || worker.id}`);
  const safeAvatar = getSafeStoredUrl(worker.avatarUrl);
  const image = safeAvatar
    ? safeAvatar.startsWith("/")
      ? absoluteUrl(safeAvatar)
      : safeAvatar
    : undefined;

  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      type: "profile",
      siteName: SITE_NAME,
      title,
      description,
      url: canonical,
      locale: "en_SO",
      alternateLocale: ["so_SO"],
      images: [
        {
          url: image || absoluteUrl("/opengraph-image"),
          alt: image ? worker.name : "ZeilaLink skilled worker directory",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image || absoluteUrl("/twitter-image")],
    },
  };
}

export default async function WorkerProfilePage({
  params,
}: WorkerProfilePageProps) {
  if (!isPublicDirectoryIdentifier(params.slug)) notFound();

  const language = pageLanguage();
  const isSomali = language === "so";
  const result = await loadWorker(params.slug);

  if (result.status === "not-found") notFound();

  if (result.status === "error") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="mx-auto max-w-4xl px-4 pb-20 pt-32 sm:px-6">
          <section className="rounded-3xl border border-amber-200 bg-amber-50 p-10 text-center">
            <h1 className="text-3xl font-black text-amber-950">
              {isSomali
                ? "Astaanta shaqaalaha hadda lama heli karo"
                : "This worker profile is temporarily unavailable"}
            </h1>
            <p className="mt-3 text-amber-900/80">
              {isSomali
                ? "Xogta lama soo qaadi karin. Fadlan wax yar ka dib isku day."
                : "We could not load this profile. Please try again shortly."}
            </p>
            <Link
              href="/workers"
              className="mt-6 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-black text-white"
            >
              {isSomali ? "Ku laabo shaqaalaha" : "Back to workers"}
            </Link>
          </section>
        </main>
      </div>
    );
  }

  const { worker } = result;
  const localized = getLocalizedWorkerText(worker, language);
  const profilePath = `/workers/${worker.slug || worker.id}`;
  const canonical = absoluteUrl(profilePath);
  const safeAvatar = getSafeStoredUrl(worker.avatarUrl);
  const schemaAvatar = safeAvatar
    ? safeAvatar.startsWith("/")
      ? absoluteUrl(safeAvatar)
      : safeAvatar
    : undefined;
  const nonce = headers().get("x-nonce") || undefined;
  const skills = worker.userSkills
    .map((entry) => entry.skill?.name?.trim())
    .filter((name): name is string => Boolean(name));
  const spokenLanguages = worker.workerLanguages
    .map((entry) => entry.language?.trim())
    .filter((name): name is string => Boolean(name));
  const alternateBio =
    language === "so" ? worker.bio?.trim() : worker.bioSo?.trim();
  const showAlternateBio =
    Boolean(alternateBio) && alternateBio !== localized.bio;
  const alternateHeadline =
    language === "so" ? worker.headline?.trim() : worker.headlineSo?.trim();
  const showAlternateHeadline =
    Boolean(alternateHeadline) && alternateHeadline !== localized.headline;

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
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
            item: absoluteUrl("/workers"),
          },
          {
            "@type": "ListItem",
            position: 3,
            name: worker.name,
            item: canonical,
          },
        ],
      },
      {
        "@type": "ProfilePage",
        "@id": `${canonical}#profile`,
        url: canonical,
        name: `${worker.name} | ${SITE_NAME}`,
        description: profileDescription(worker, language),
        dateCreated: worker.createdAt || undefined,
        mainEntity: { "@id": `${canonical}#person` },
      },
      {
        "@type": "Person",
        "@id": `${canonical}#person`,
        name: worker.name,
        url: canonical,
        description: localized.bio || undefined,
        jobTitle: localized.headline || undefined,
        image: schemaAvatar,
        address: worker.location
          ? {
              "@type": "PostalAddress",
              addressLocality: worker.location,
            }
          : undefined,
        knowsAbout: skills.length > 0 ? skills : undefined,
        knowsLanguage:
          spokenLanguages.length > 0 ? spokenLanguages : undefined,
      },
    ],
  };

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
          className="mb-8 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-500"
        >
          <Link href="/" className="hover:text-primary">
            {isSomali ? "Bogga hore" : "Home"}
          </Link>
          <span aria-hidden="true">/</span>
          <Link href="/workers" className="hover:text-primary">
            {isSomali ? "Shaqaale" : "Workers"}
          </Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page" className="text-slate-900">
            {worker.name}
          </span>
        </nav>

        <section className="overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white p-6 shadow-sm sm:p-10">
          <div className="flex flex-col gap-7 sm:flex-row sm:items-center">
            <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-slate-100 bg-primary/10 sm:h-36 sm:w-36">
              {safeAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={safeAvatar}
                  alt={
                    isSomali
                      ? `Sawirka astaanta ${worker.name}`
                      : `${worker.name} profile photo`
                  }
                  className="h-full w-full object-cover"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="text-5xl font-black text-primary"
                >
                  {worker.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-wider text-emerald-700">
                {isSomali ? "Astaanta xirfadlaha" : "Professional profile"}
              </span>
              <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
                {worker.name}
              </h1>
              <p className="mt-3 text-xl font-bold text-primary">
                {localized.headline ||
                  (isSomali ? "Xirfadle ZeilaLink" : "ZeilaLink professional")}
              </p>
              {showAlternateHeadline && (
                <p
                  lang={isSomali ? "en" : "so"}
                  className="mt-1 text-sm font-semibold text-slate-500"
                >
                  {alternateHeadline}
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-slate-600">
                {worker.location && (
                  <span className="inline-flex items-center gap-2">
                    <MapPin aria-hidden="true" size={17} className="text-primary" />
                    {worker.location}
                  </span>
                )}
                {worker.preferredLanguage && (
                  <span className="inline-flex items-center gap-2">
                    <Languages
                      aria-hidden="true"
                      size={17}
                      className="text-primary"
                    />
                    {isSomali ? "Luqadda la doorbido:" : "Preferred language:"}{" "}
                    {worker.preferredLanguage}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,2fr),minmax(280px,1fr)]">
          <div className="space-y-8">
            <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-2xl font-black text-slate-900">
                {isSomali ? "Ku saabsan" : "About"}
              </h2>
              <p
                lang={isSomali ? "so" : "en"}
                className="mt-4 whitespace-pre-line leading-8 text-slate-700"
              >
                {localized.bio ||
                  (isSomali
                    ? "Xirfadlahan wali ma uusan darin taariikh nololeed faahfaahsan."
                    : "This professional has not added a detailed biography yet.")}
              </p>
              {showAlternateBio && (
                <div className="mt-6 border-t border-slate-100 pt-6">
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-500">
                    {isSomali ? "English biography" : "Taariikh nololeed Soomaali"}
                  </h3>
                  <p
                    lang={isSomali ? "en" : "so"}
                    className="mt-3 whitespace-pre-line leading-7 text-slate-600"
                  >
                    {alternateBio}
                  </p>
                </div>
              )}
            </section>

            {worker.workerExperiences.length > 0 && (
              <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
                <h2 className="flex items-center gap-3 text-2xl font-black text-slate-900">
                  <Briefcase
                    aria-hidden="true"
                    size={24}
                    className="text-primary"
                  />
                  {isSomali ? "Khibradda shaqada" : "Work experience"}
                </h2>
                <ol className="mt-6 space-y-6">
                  {worker.workerExperiences.map((experience, index) => {
                    const range = dateRange(
                      experience.startDate,
                      experience.endDate,
                      experience.isCurrent,
                      language,
                    );
                    return (
                      <li
                        key={experience.id || `${experience.company}-${index}`}
                        className="border-l-2 border-primary/20 pl-5"
                      >
                        <h3 className="text-lg font-black text-slate-900">
                          {experience.jobTitle ||
                            (isSomali ? "Doorka shaqada" : "Professional role")}
                        </h3>
                        {experience.company && (
                          <p className="mt-1 font-bold text-primary">
                            {experience.company}
                          </p>
                        )}
                        {range && (
                          <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                            <CalendarDays aria-hidden="true" size={15} />
                            {range}
                          </p>
                        )}
                        {experience.achievements && (
                          <p className="mt-3 whitespace-pre-line leading-7 text-slate-600">
                            {experience.achievements}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </section>
            )}

            {worker.workerEducations.length > 0 && (
              <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
                <h2 className="flex items-center gap-3 text-2xl font-black text-slate-900">
                  <BookOpen
                    aria-hidden="true"
                    size={24}
                    className="text-primary"
                  />
                  {isSomali ? "Waxbarashada" : "Education"}
                </h2>
                <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                  {worker.workerEducations.map((education, index) => (
                    <li
                      key={education.id || `${education.institution}-${index}`}
                      className="rounded-2xl bg-slate-50 p-5"
                    >
                      <h3 className="font-black text-slate-900">
                        {education.certificationName ||
                          education.fieldOfStudy ||
                          education.degreeLevel ||
                          (isSomali ? "Waxbarasho" : "Education")}
                      </h3>
                      {education.institution && (
                        <p className="mt-2 font-semibold text-primary">
                          {education.institution}
                        </p>
                      )}
                      {education.degreeLevel && education.fieldOfStudy && (
                        <p className="mt-2 text-sm text-slate-600">
                          {titleCase(education.degreeLevel)} ·{" "}
                          {education.fieldOfStudy}
                        </p>
                      )}
                      {dateRange(
                        education.startDate,
                        education.endDate,
                        false,
                        language,
                      ) && (
                        <p className="mt-3 text-xs font-bold text-slate-500">
                          {dateRange(
                            education.startDate,
                            education.endDate,
                            false,
                            language,
                          )}
                        </p>
                      )}
                      {education.isVerified && (
                        <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700">
                          <Award aria-hidden="true" size={13} />
                          {isSomali ? "La xaqiijiyey" : "Verified"}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black text-slate-900">
                {isSomali ? "Xirfadaha" : "Skills"}
              </h2>
              {worker.userSkills.length > 0 ? (
                <ul className="mt-4 flex flex-wrap gap-2">
                  {worker.userSkills.map((entry, index) => {
                    const name = entry.skill?.name?.trim();
                    if (!name) return null;
                    return (
                      <li
                        key={entry.id || `${name}-${index}`}
                        className="rounded-xl bg-primary/10 px-3 py-2 text-sm font-black text-primary"
                      >
                        {name}
                        {entry.level ? (
                          <span className="ml-1 font-medium text-primary/70">
                            · {titleCase(entry.level)}
                          </span>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-slate-600">
                  {isSomali
                    ? "Xirfado wali laguma darin."
                    : "No skills have been added yet."}
                </p>
              )}
            </section>

            {worker.workerLanguages.length > 0 && (
              <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-black text-slate-900">
                  {isSomali ? "Luqadaha" : "Languages"}
                </h2>
                <ul className="mt-4 space-y-3">
                  {worker.workerLanguages.map((entry, index) => (
                    <li
                      key={entry.id || `${entry.language}-${index}`}
                      className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
                    >
                      <span className="font-bold text-slate-800">
                        {entry.language ||
                          (isSomali ? "Luqad" : "Language")}
                      </span>
                      {entry.level && (
                        <span className="text-xs font-black uppercase text-slate-500">
                          {titleCase(entry.level)}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {worker.workerPreference && (
              <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-black text-slate-900">
                  {isSomali ? "Shaqada la doonayo" : "Work preferences"}
                </h2>
                <dl className="mt-4 space-y-4 text-sm">
                  {worker.workerPreference.employmentType && (
                    <div>
                      <dt className="font-bold text-slate-500">
                        {isSomali ? "Nooca shaqada" : "Employment type"}
                      </dt>
                      <dd className="mt-1 font-black text-slate-900">
                        {titleCase(worker.workerPreference.employmentType)}
                      </dd>
                    </div>
                  )}
                  {worker.workerPreference.shiftPreference && (
                    <div>
                      <dt className="font-bold text-slate-500">
                        {isSomali ? "Waqtiga shaqada" : "Shift preference"}
                      </dt>
                      <dd className="mt-1 font-black text-slate-900">
                        {titleCase(worker.workerPreference.shiftPreference)}
                      </dd>
                    </div>
                  )}
                  {(worker.workerPreference.desiredSalaryMin != null ||
                    worker.workerPreference.desiredSalaryMax != null) && (
                    <div>
                      <dt className="font-bold text-slate-500">
                        {isSomali ? "Mushaharka la doonayo" : "Desired salary"}
                      </dt>
                      <dd className="mt-1 font-black text-slate-900">
                        {worker.workerPreference.desiredSalaryMin != null
                          ? `$${worker.workerPreference.desiredSalaryMin.toLocaleString()}`
                          : ""}
                        {worker.workerPreference.desiredSalaryMin != null &&
                        worker.workerPreference.desiredSalaryMax != null
                          ? " – "
                          : ""}
                        {worker.workerPreference.desiredSalaryMax != null
                          ? `$${worker.workerPreference.desiredSalaryMax.toLocaleString()}`
                          : ""}
                      </dd>
                    </div>
                  )}
                </dl>
              </section>
            )}

            <section className="rounded-3xl bg-slate-900 p-6 text-white">
              <h2 className="text-xl font-black">
                {isSomali ? "Sii wad sahminta" : "Keep exploring"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {isSomali
                  ? "Eeg shaqooyin, tababarro iyo ganacsiyo kale oo ZeilaLink ku jira."
                  : "Browse more jobs, training programs, and businesses on ZeilaLink."}
              </p>
              <div className="mt-5 flex flex-col gap-3">
                <Link
                  href="/jobs"
                  className="rounded-xl bg-primary px-4 py-3 text-center text-sm font-black text-white"
                >
                  {isSomali ? "Raadi shaqooyin" : "Find jobs"}
                </Link>
                <Link
                  href="/businesses"
                  className="rounded-xl border border-white/20 px-4 py-3 text-center text-sm font-black text-white"
                >
                  {isSomali ? "Eeg ganacsiyada" : "Browse businesses"}
                </Link>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
