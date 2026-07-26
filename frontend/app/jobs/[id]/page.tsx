import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import Navbar from "@/components/Navbar";
import { ServerApiError, serverApiGet } from "@/lib/serverApi";
import { absoluteUrl } from "@/lib/seo";
import ApplyButton from "./ApplyButton";
import {
  getLocalizedJobText,
  isValidJobId,
  parsePublicJob,
  type PublicJob,
} from "../jobTypes";
import {
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  DollarSign,
  Flag,
  Globe,
  MapPin,
  ShieldCheck,
  Truck,
  Users2,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface JobDetailPageProps {
  params: { id: string };
}

type JobLoadResult =
  | { status: "success"; job: PublicJob }
  | { status: "not-found" }
  | { status: "error" };

const loadJob = cache(async (id: string): Promise<JobLoadResult> => {
  try {
    const response = await serverApiGet<unknown>(
      `/jobs/${encodeURIComponent(id)}`,
    );
    const job = parsePublicJob(response);
    return job ? { status: "success", job } : { status: "error" };
  } catch (error) {
    if (error instanceof ServerApiError && error.status === 404) {
      return { status: "not-found" };
    }
    return { status: "error" };
  }
});

const metadataDescription = (description: string) => {
  const compact = description.replace(/\s+/g, " ").trim();
  return compact.length > 155 ? `${compact.slice(0, 152)}...` : compact;
};

export async function generateMetadata({
  params,
}: JobDetailPageProps): Promise<Metadata> {
  if (!isValidJobId(params.id)) {
    return {
      title: "Job Not Found | ZeilaLink",
      robots: { index: false, follow: false },
    };
  }

  const result = await loadJob(params.id);
  if (result.status === "not-found") {
    return {
      title: "Job Not Found | ZeilaLink",
      robots: { index: false, follow: false },
    };
  }
  if (result.status === "error") {
    return {
      title: "Job Opportunity | ZeilaLink",
      description: "This job listing is temporarily unavailable.",
      robots: { index: false, follow: true },
    };
  }

  const description = metadataDescription(result.job.description);
  const title = `${result.job.title} at ${result.job.employer.name}`;
  const canonicalPath = `/jobs/${result.job.slug || result.job.id}`;
  const somaliDescription = result.job.descriptionSo
    ? metadataDescription(result.job.descriptionSo)
    : "";
  const bilingualDescription = somaliDescription
    ? metadataDescription(`${description} ${somaliDescription}`)
    : description;

  return {
    title: `${title} | ZeilaLink`,
    description: bilingualDescription,
    keywords: [
      result.job.title,
      result.job.titleSo,
      result.job.location,
      result.job.employer.name,
      result.job.employer.nameSo,
      "Somalia jobs",
      "Shaqooyin Soomaaliya",
      ...(result.job.tags || []),
    ].filter((keyword): keyword is string => Boolean(keyword)),
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      type: "article",
      title,
      description: bilingualDescription,
      url: canonicalPath,
      siteName: "ZeilaLink",
      locale: "en_SO",
      alternateLocale: ["so_SO"],
      images: [
        {
          url: absoluteUrl("/opengraph-image"),
          width: 1200,
          height: 630,
          alt: `${result.job.title} at ${result.job.employer.name}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: bilingualDescription,
      images: [absoluteUrl("/twitter-image")],
    },
  };
}

const toListItems = (text?: string | null) => {
  if (!text) return [];

  const trimmed = text.trim();
  if (!trimmed) return [];

  const byLine = trimmed
    .split(/\r?\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
  if (byLine.length > 1) return byLine;

  const bySentence = trimmed
    .split(/(?<=\.|\?|!)\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
  if (bySentence.length > 1) return bySentence;

  const byComma = trimmed
    .split(/[,;•]/)
    .map((item) => item.trim())
    .filter(Boolean);
  if (byComma.length > 1) return byComma;

  return byLine.length === 1 ? byLine : [];
};

const toParagraphs = (text?: string | null) => {
  if (!text) return [];
  const parts = text
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length > 0) return parts;
  return [text.trim()];
};

const formatSalaryRange = (min?: number | null, max?: number | null) => {
  const fmt = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);

  if (min != null && max != null) return `${fmt(min)} - ${fmt(max)}`;
  if (min != null) return `${fmt(min)}+`;
  if (max != null) return `Up to ${fmt(max)}`;
  return "Salary negotiable";
};

const formatDate = (dateString?: string | null, locale = "en-US") => {
  if (!dateString) return undefined;
  try {
    return new Intl.DateTimeFormat(locale, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(dateString));
  } catch {
    return undefined;
  }
};

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const savedLanguage = cookies().get("language")?.value;
  const language = savedLanguage === "so" ? "so" : "en";
  const isEn = language === "en";

  if (!isValidJobId(params.id)) {
    notFound();
  }

  const result = await loadJob(params.id);
  if (result.status === "not-found") {
    notFound();
  }

  if (result.status === "error") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-4xl px-4 pb-12 pt-28 sm:px-6">
          <section className="rounded-3xl border border-amber-200 bg-amber-50 p-10 text-center">
            <h1 className="text-2xl font-black text-amber-950">
              {isEn
                ? "Job details are temporarily unavailable"
                : "Faahfaahinta shaqada hadda lama heli karo"}
            </h1>
            <p className="mt-3 text-sm font-medium text-amber-900/80">
              {isEn
                ? "The jobs service could not be reached. This does not mean the listing was removed. Please try again shortly."
                : "Adeegga shaqooyinka lama gaari karo. Tani macnaheedu ma aha in shaqada la saaray. Fadlan wax yar kadib isku day."}
            </p>
            <Link
              href="/jobs"
              className="mt-6 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-black text-white"
            >
              {isEn ? "Back to jobs" : "Ku laabo shaqooyinka"}
            </Link>
          </section>
        </div>
      </div>
    );
  }

  const { job } = result;
  if (job.slug && params.id !== job.slug) {
    permanentRedirect(`/jobs/${job.slug}`);
  }

  const nonce = headers().get("x-nonce") || undefined;
  const localized = getLocalizedJobText(job, language);
  const descriptionParagraphs = toParagraphs(localized.description);
  const keyResponsibilities = toListItems(localized.description);
  const requirementItems = toListItems(localized.requirements);
  const benefitItems = toListItems(localized.benefits);
  const postedDate = formatDate(job.createdAt, isEn ? "en-US" : "so-SO");
  const deadlineDate = formatDate(
    job.applicationDeadline,
    isEn ? "en-US" : "so-SO",
  );
  const canonicalPath = `/jobs/${job.slug || job.id}`;
  const configuredSiteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ||
    "https://zeilalink.com";
  const canonicalUrl = `${configuredSiteUrl}${canonicalPath}`;
  const businessPath = job.employer.slug
    ? `/businesses/${job.employer.slug}`
    : null;

  const jobStructuredData = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.descriptionSo
      ? `${job.description}\n\n${job.descriptionSo}`
      : job.description,
    url: canonicalUrl,
    identifier: {
      "@type": "PropertyValue",
      name: "ZeilaLink",
      value: job.id,
    },
    inLanguage: job.descriptionSo ? ["en", "so"] : ["en"],
    datePosted: job.createdAt,
    ...(job.applicationDeadline
      ? { validThrough: job.applicationDeadline }
      : {}),
    employmentType: job.employmentType,
    hiringOrganization: {
      "@type": "Organization",
      name: job.employer.name,
      ...(businessPath
        ? { url: `${configuredSiteUrl}${businessPath}` }
        : {}),
      ...(job.employer.logoUrl ? { logo: job.employer.logoUrl } : {}),
    },
    ...(job.remote
      ? { jobLocationType: "TELECOMMUTE" }
      : {
          jobLocation: {
            "@type": "Place",
            address: {
              "@type": "PostalAddress",
              addressLocality: job.location,
            },
          },
        }),
    ...(job.salaryMin != null || job.salaryMax != null
      ? {
          baseSalary: {
            "@type": "MonetaryAmount",
            currency: "USD",
            value: {
              "@type": "QuantitativeValue",
              ...(job.salaryMin != null ? { minValue: job.salaryMin } : {}),
              ...(job.salaryMax != null ? { maxValue: job.salaryMax } : {}),
              unitText: "YEAR",
            },
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
        item: configuredSiteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: isEn ? "Jobs" : "Shaqooyin",
        item: `${configuredSiteUrl}/jobs`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: localized.title,
        item: canonicalUrl,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <script
        nonce={nonce}
        suppressHydrationWarning
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            jobStructuredData,
            breadcrumbStructuredData,
          ]).replace(/</g, "\\u003c"),
        }}
      />
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 pb-12 pt-28 sm:px-6 lg:px-8">
        <div className="space-y-6">
            <nav
              aria-label={isEn ? "Breadcrumb" : "Jidka bogga"}
              className="flex flex-wrap items-center gap-2 text-sm font-semibold text-primary-darker/65"
            >
              <Link href="/" className="hover:text-primary">
                {isEn ? "Home" : "Bogga Hore"}
              </Link>
              <span aria-hidden="true">/</span>
              <Link href="/jobs" className="hover:text-primary">
                {isEn ? "Jobs" : "Shaqooyin"}
              </Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page">{localized.title}</span>
            </nav>

            <section className="rounded-3xl border border-border bg-white p-6 shadow-soft sm:p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div className="flex-1">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-primary">
                    <MapPin size={13} />
                    {job.location}
                  </div>
                  <h1 className="text-4xl font-black tracking-tight text-primary-darker">
                    {localized.title}
                  </h1>
                  <p className="mt-2 text-sm font-semibold text-primary-darker/70">
                    {localized.employerName}
                    <span className="mx-2 text-primary-darker/40">•</span>
                    {formatSalaryRange(job.salaryMin, job.salaryMax)}{" "}
                    {isEn ? "/ year" : "/ sanadkii"}
                  </p>
                </div>

                <ApplyButton jobId={job.id} />
              </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
              <div className="space-y-6">
                <section className="rounded-3xl border border-border bg-white p-6 sm:p-8">
                  <h2 className="mb-4 text-xl font-black text-primary-darker">
                    {isEn ? "Job Description" : "Faahfaahinta Shaqada"}
                  </h2>
                  <div className="space-y-4 text-[15px] leading-relaxed text-primary-darker/80">
                    {descriptionParagraphs.map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>
                </section>

                {keyResponsibilities.length > 1 && (
                  <section className="rounded-3xl border border-border bg-white p-6 sm:p-8">
                    <h2 className="mb-4 text-xl font-black text-primary-darker">
                      {isEn
                        ? "Key Responsibilities"
                        : "Mas'uuliyadaha Muhiimka ah"}
                    </h2>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {keyResponsibilities.slice(0, 4).map((item, index) => {
                        const icons = [Users2, Truck, ShieldCheck, Flag];
                        const Icon = icons[index % icons.length];
                        return (
                          <div
                            key={index}
                            className="rounded-2xl border border-border bg-surface-muted p-4"
                          >
                            <Icon size={16} className="mb-2 text-primary" />
                            <p className="text-sm font-semibold text-primary-darker/80">
                              {item}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {requirementItems.length > 0 && (
                  <section className="rounded-3xl border border-border bg-white p-6 sm:p-8">
                    <h2 className="mb-4 text-xl font-black text-primary-darker">
                      {isEn
                        ? "Qualifications & Skills"
                        : "Aqoonta iyo Xirfadaha"}
                    </h2>
                    <ul className="space-y-3">
                      {requirementItems.map((item, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-3 text-sm font-semibold text-primary-darker/80"
                        >
                          <CheckCircle2
                            size={16}
                            className="mt-0.5 shrink-0 text-primary"
                          />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {benefitItems.length > 0 && (
                  <section className="rounded-3xl border border-primary/20 bg-primary p-6 text-white sm:p-8">
                    <h2 className="mb-4 text-xl font-black text-white">
                      {isEn
                        ? "Perks & Benefits"
                        : "Gunnooyinka iyo Faa'iidooyinka"}
                    </h2>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {benefitItems.slice(0, 6).map((item, index) => (
                        <div
                          key={index}
                          className="rounded-xl border border-white/25 bg-primary-dark/35 p-3"
                        >
                          <p className="text-sm font-semibold text-white/90">
                            {item}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              <aside className="space-y-6">
                <section className="rounded-3xl border border-border bg-white p-6">
                  <h3 className="text-lg font-black text-primary-darker">
                    {isEn ? "Job Summary" : "Soo Koobidda Shaqada"}
                  </h3>
                  <div className="mt-5 space-y-4">
                    <div className="flex items-start gap-3 text-sm text-primary-darker/80">
                      <CalendarDays size={16} className="mt-0.5 text-primary" />
                      <div>
                        <p className="font-black text-primary-darker">
                          {isEn ? "Posted on" : "La daabacay"}
                        </p>
                        <p>
                          {postedDate ?? (isEn ? "Recently" : "Dhowaan")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 text-sm text-primary-darker/80">
                      <Briefcase size={16} className="mt-0.5 text-primary" />
                      <div>
                        <p className="font-black text-primary-darker">
                          {isEn ? "Job Type" : "Nooca Shaqada"}
                        </p>
                        <p>{job.employmentType}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 text-sm text-primary-darker/80">
                      <DollarSign size={16} className="mt-0.5 text-primary" />
                      <div>
                        <p className="font-black text-primary-darker">
                          {isEn ? "Salary Range" : "Xadka Mushaharka"}
                        </p>
                        <p>{formatSalaryRange(job.salaryMin, job.salaryMax)}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 text-sm text-primary-darker/80">
                      <MapPin size={16} className="mt-0.5 text-primary" />
                      <div>
                        <p className="font-black text-primary-darker">
                          {isEn ? "Location" : "Goobta"}
                        </p>
                        <p>
                          {job.remote
                            ? `${job.location} (${isEn ? "Remote option" : "Shaqo fog"})`
                            : job.location}
                        </p>
                      </div>
                    </div>

                    {deadlineDate && (
                      <div className="flex items-start gap-3 text-sm text-primary-darker/80">
                        <Clock3 size={16} className="mt-0.5 text-primary" />
                        <div>
                          <p className="font-black text-primary-darker">
                            {isEn
                              ? "Deadline"
                              : "Waqtiga Kama Dambaysta ah"}
                          </p>
                          <p>{deadlineDate}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                <section className="rounded-3xl border border-border bg-white p-6">
                  <h3 className="mb-4 text-lg font-black text-primary-darker">
                    {isEn ? "About" : "Ku saabsan"} {localized.employerName}
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-border bg-surface-muted">
                        {job.employer?.avatarUrl || job.employer?.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={
                              job.employer.avatarUrl ??
                              job.employer.logoUrl ??
                              undefined
                            }
                            alt={`${localized.employerName} logo`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Building2 size={18} className="text-primary" />
                        )}
                      </div>
                      <p className="font-black text-primary-darker">
                        {localized.employerName}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-sm font-semibold text-primary-darker/80">
                      <Globe size={15} className="text-primary" />
                      {job.remote
                        ? isEn
                          ? "Remote-friendly employer"
                          : "Shaqo-bixiye oggol shaqada fog"
                        : job.location}
                    </div>

                    {localized.employerDescription && (
                      <p className="text-sm leading-relaxed text-primary-darker/80">
                        {localized.employerDescription.length > 220
                          ? `${localized.employerDescription.slice(0, 220)}...`
                          : localized.employerDescription}
                      </p>
                    )}

                    {businessPath && (
                      <Link
                        href={businessPath}
                        className="inline-flex text-sm font-black text-primary hover:underline"
                      >
                        {isEn
                          ? "View business profile"
                          : "Eeg bogga ganacsiga"}
                      </Link>
                    )}
                  </div>
                </section>
              </aside>
            </div>

            {(job.descriptionSo || job.titleSo) && (
              <details className="rounded-3xl border border-border bg-white p-6">
                <summary className="cursor-pointer text-base font-black text-primary-darker">
                  {isEn ? "Akhri af-Soomaali" : "Read in English"}
                </summary>
                <div className="mt-4 space-y-3 text-sm leading-relaxed text-primary-darker/80">
                  <h2 className="text-xl font-black text-primary-darker">
                    {isEn ? job.titleSo || job.title : job.title}
                  </h2>
                  <p className="whitespace-pre-line">
                    {isEn
                      ? job.descriptionSo || job.description
                      : job.description}
                  </p>
                </div>
              </details>
            )}

            <section className="rounded-3xl border border-primary/15 bg-primary/5 p-6">
              <h2 className="text-lg font-black text-primary-darker">
                {isEn
                  ? "Explore more on ZeilaLink"
                  : "Wax badan ka eeg ZeilaLink"}
              </h2>
              <div className="mt-3 flex flex-wrap gap-3 text-sm font-bold">
                <Link href="/jobs" className="text-primary hover:underline">
                  {isEn ? "More jobs" : "Shaqooyin kale"}
                </Link>
                <Link href="/workers" className="text-primary hover:underline">
                  {isEn ? "Worker profiles" : "Bogagga shaqaalaha"}
                </Link>
                <Link href="/training" className="text-primary hover:underline">
                  {isEn ? "Training programs" : "Barnaamijyada tababarka"}
                </Link>
                <Link href="/services" className="text-primary hover:underline">
                  {isEn
                    ? "Professional services"
                    : "Adeegyada xirfadeed"}
                </Link>
              </div>
            </section>
        </div>
      </div>
    </div>
  );
}
