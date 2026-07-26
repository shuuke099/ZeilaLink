import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import {
  Briefcase,
  Building2,
  CalendarDays,
  ExternalLink,
  GraduationCap,
  MapPin,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { ServerApiError, serverApiGet } from "@/lib/serverApi";
import { getSafeStoredUrl } from "@/lib/safeUrl";
import { SITE_NAME, absoluteUrl } from "@/lib/seo";
import {
  type DirectoryLanguage,
  type PublicBusiness,
  getLocalizedBusinessText,
  isPublicDirectoryIdentifier,
  parseBusinessDetailResponse,
} from "@/lib/publicDirectoryTypes";

export const dynamic = "force-dynamic";

const compactDescription = (value: string, maximumLength = 160) => {
  const compact = value.replace(/\s+/g, " ").trim();
  if (compact.length <= maximumLength) return compact;
  return `${compact.slice(0, Math.max(1, maximumLength - 1)).trimEnd()}…`;
};

interface BusinessProfilePageProps {
  params: { slug: string };
}

type BusinessLoadResult =
  | { status: "success"; business: PublicBusiness }
  | { status: "not-found" }
  | { status: "error" };

const pageLanguage = (): DirectoryLanguage =>
  cookies().get("language")?.value === "so" ? "so" : "en";

const loadBusiness = cache(
  async (identifier: string): Promise<BusinessLoadResult> => {
    if (!isPublicDirectoryIdentifier(identifier)) {
      return { status: "not-found" };
    }

    try {
      const response = await serverApiGet<unknown>(
        `/public/businesses/${encodeURIComponent(identifier)}`,
      );
      const business = parseBusinessDetailResponse(response);
      return business ? { status: "success", business } : { status: "error" };
    } catch (error) {
      if (error instanceof ServerApiError && error.status === 404) {
        return { status: "not-found" };
      }
      return { status: "error" };
    }
  },
);

const businessTypeLabel = (
  type: PublicBusiness["type"],
  language: DirectoryLanguage,
) => {
  if (type === "provider") {
    return language === "so" ? "Bixiyaha tababarka" : "Training provider";
  }
  return language === "so" ? "Shaqeeye" : "Employer";
};

const profileDescription = (
  business: PublicBusiness,
  language: DirectoryLanguage,
) => {
  const localized = getLocalizedBusinessText(business, language);
  if (localized.description) {
    return compactDescription(localized.description);
  }
  return language === "so"
    ? `Eeg astaanta ${localized.name}, ${businessTypeLabel(business.type, language)} ku jira hagaha ${SITE_NAME}.`
    : `View ${localized.name}, a ${businessTypeLabel(business.type, language).toLowerCase()} in the ${SITE_NAME} directory.`;
};

const joinedDate = (
  value: string | null | undefined,
  language: DirectoryLanguage,
) => {
  if (!value || Number.isNaN(Date.parse(value))) return null;
  return new Intl.DateTimeFormat(language === "so" ? "so-SO" : "en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(value));
};

export async function generateMetadata({
  params,
}: BusinessProfilePageProps): Promise<Metadata> {
  const language = pageLanguage();
  const result = await loadBusiness(params.slug);

  if (result.status === "not-found") {
    return {
      title:
        language === "so"
          ? `Ganacsiga Lama Helin | ${SITE_NAME}`
          : `Business Not Found | ${SITE_NAME}`,
      robots: { index: false, follow: false },
    };
  }

  if (result.status === "error") {
    return {
      title:
        language === "so"
          ? `Astaanta Ganacsiga | ${SITE_NAME}`
          : `Business Profile | ${SITE_NAME}`,
      description:
        language === "so"
          ? "Astaantan ganacsiga si ku-meel-gaar ah lama heli karo."
          : "This business profile is temporarily unavailable.",
      robots: { index: false, follow: true },
    };
  }

  const { business } = result;
  if (business.slug && params.slug !== business.slug) {
    permanentRedirect(`/businesses/${business.slug}`);
  }

  const localized = getLocalizedBusinessText(business, language);
  const typeLabel = businessTypeLabel(business.type, language);
  const title = `${localized.name} – ${typeLabel} | ${SITE_NAME}`;
  const description = profileDescription(business, language);
  const canonical = absoluteUrl(
    `/businesses/${business.slug || business.id}`,
  );
  const safeLogo = getSafeStoredUrl(business.logoUrl);
  const image = safeLogo
    ? safeLogo.startsWith("/")
      ? absoluteUrl(safeLogo)
      : safeLogo
    : undefined;

  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title,
      description,
      url: canonical,
      locale: "en_SO",
      alternateLocale: ["so_SO"],
      images: [
        {
          url: image || absoluteUrl("/opengraph-image"),
          alt: image
            ? `${localized.name} logo`
            : "ZeilaLink business directory",
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

export default async function BusinessProfilePage({
  params,
}: BusinessProfilePageProps) {
  if (!isPublicDirectoryIdentifier(params.slug)) notFound();

  const language = pageLanguage();
  const isSomali = language === "so";
  const result = await loadBusiness(params.slug);

  if (result.status === "not-found") notFound();

  if (result.status === "error") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="mx-auto max-w-4xl px-4 pb-20 pt-32 sm:px-6">
          <section className="rounded-3xl border border-amber-200 bg-amber-50 p-10 text-center">
            <h1 className="text-3xl font-black text-amber-950">
              {isSomali
                ? "Astaanta ganacsiga hadda lama heli karo"
                : "This business profile is temporarily unavailable"}
            </h1>
            <p className="mt-3 text-amber-900/80">
              {isSomali
                ? "Xogta lama soo qaadi karin. Fadlan wax yar ka dib isku day."
                : "We could not load this profile. Please try again shortly."}
            </p>
            <Link
              href="/businesses"
              className="mt-6 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-black text-white"
            >
              {isSomali ? "Ku laabo ganacsiyada" : "Back to businesses"}
            </Link>
          </section>
        </main>
      </div>
    );
  }

  const { business } = result;
  const localized = getLocalizedBusinessText(business, language);
  const profilePath = `/businesses/${business.slug || business.id}`;
  const canonical = absoluteUrl(profilePath);
  const safeLogo = getSafeStoredUrl(business.logoUrl);
  const schemaLogo = safeLogo
    ? safeLogo.startsWith("/")
      ? absoluteUrl(safeLogo)
      : safeLogo
    : undefined;
  const safeWebsite = getSafeStoredUrl(business.website);
  const externalWebsite =
    safeWebsite && !safeWebsite.startsWith("/") ? safeWebsite : null;
  const alternateDescription =
    language === "so"
      ? business.description?.trim()
      : business.descriptionSo?.trim();
  const showAlternateDescription =
    Boolean(alternateDescription) &&
    alternateDescription !== localized.description;
  const alternateName = isSomali
    ? business.name
    : business.nameSo?.trim();
  const dateLabel = joinedDate(business.createdAt, language);
  const nonce = headers().get("x-nonce") || undefined;
  const schemaType =
    business.type === "employer" ? "LocalBusiness" : "Organization";

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
            name: isSomali ? "Ganacsiyada" : "Businesses",
            item: absoluteUrl("/businesses"),
          },
          {
            "@type": "ListItem",
            position: 3,
            name: localized.name,
            item: canonical,
          },
        ],
      },
      {
        "@type": schemaType,
        "@id": `${canonical}#organization`,
        name: localized.name,
        alternateName:
          business.nameSo?.trim() && business.nameSo !== localized.name
            ? business.nameSo
            : business.name !== localized.name
              ? business.name
              : undefined,
        url: canonical,
        description: localized.description || undefined,
        logo: schemaLogo,
        image: schemaLogo,
        sameAs: externalWebsite ? [externalWebsite] : undefined,
        address:
          business.address || business.location
            ? {
                "@type": "PostalAddress",
                streetAddress: business.address || undefined,
                addressLocality: business.location || undefined,
              }
            : undefined,
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
          <Link href="/businesses" className="hover:text-primary">
            {isSomali ? "Ganacsiyada" : "Businesses"}
          </Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page" className="text-slate-900">
            {localized.name}
          </span>
        </nav>

        <section className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-6 text-white sm:p-10">
          <div
            aria-hidden="true"
            className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/30 blur-3xl"
          />
          <div className="relative flex flex-col gap-7 sm:flex-row sm:items-center">
            <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-white sm:h-36 sm:w-36">
              {safeLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={safeLogo}
                  alt={
                    isSomali
                      ? `Astaanta ${localized.name}`
                      : `${localized.name} logo`
                  }
                  className="h-full w-full object-contain p-4"
                />
              ) : (
                <Building2
                  aria-hidden="true"
                  size={48}
                  className="text-primary"
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-primary-light">
                {businessTypeLabel(business.type, language)}
              </span>
              <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
                {localized.name}
              </h1>
              {alternateName && alternateName !== localized.name && (
                <p
                  lang={isSomali ? "en" : "so"}
                  className="mt-2 text-lg font-semibold text-slate-300"
                >
                  {alternateName}
                </p>
              )}
              <div className="mt-5 flex flex-wrap gap-4 text-sm font-semibold text-slate-300">
                {(business.location || business.address) && (
                  <span className="inline-flex items-center gap-2">
                    <MapPin aria-hidden="true" size={17} className="text-primary" />
                    {business.location || business.address}
                  </span>
                )}
                {dateLabel && (
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays
                      aria-hidden="true"
                      size={17}
                      className="text-primary"
                    />
                    {isSomali ? `Ku biiray ${dateLabel}` : `Joined ${dateLabel}`}
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
                {isSomali
                  ? `Ku saabsan ${localized.name}`
                  : `About ${localized.name}`}
              </h2>
              <p
                lang={isSomali ? "so" : "en"}
                className="mt-4 whitespace-pre-line leading-8 text-slate-700"
              >
                {localized.description ||
                  (isSomali
                    ? "Ururkani wali ma uusan darin sharaxaad faahfaahsan."
                    : "This organization has not added a detailed description yet.")}
              </p>
              {showAlternateDescription && (
                <div className="mt-6 border-t border-slate-100 pt-6">
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-500">
                    {isSomali ? "English description" : "Sharaxaad Soomaali"}
                  </h3>
                  <p
                    lang={isSomali ? "en" : "so"}
                    className="mt-3 whitespace-pre-line leading-7 text-slate-600"
                  >
                    {alternateDescription}
                  </p>
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-2xl font-black text-slate-900">
                {business.type === "employer"
                  ? isSomali
                    ? "Fursadaha shaqada"
                    : "Employment opportunities"
                  : isSomali
                    ? "Fursadaha tababarka"
                    : "Training opportunities"}
              </h2>
              <p className="mt-3 leading-7 text-slate-600">
                {business.type === "employer"
                  ? isSomali
                    ? `${localized.name} wuxuu leeyahay ${business.jobCount ?? 0} shaqo oo hadda ku qoran ZeilaLink.`
                    : `${localized.name} has ${business.jobCount ?? 0} current job listings on ZeilaLink.`
                  : isSomali
                    ? `${localized.name} wuxuu leeyahay ${business.trainingCount ?? 0} barnaamij tababar oo ku qoran ZeilaLink.`
                    : `${localized.name} has ${business.trainingCount ?? 0} training programs listed on ZeilaLink.`}
              </p>
              <Link
                href={business.type === "employer" ? "/jobs" : "/training"}
                className="mt-5 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-black text-white"
              >
                {business.type === "employer"
                  ? isSomali
                    ? "Eeg shaqooyinka"
                    : "Browse jobs"
                  : isSomali
                    ? "Eeg tababarrada"
                    : "Browse training"}
              </Link>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black text-slate-900">
                {isSomali ? "Faahfaahinta ururka" : "Organization details"}
              </h2>
              <dl className="mt-5 space-y-5 text-sm">
                <div>
                  <dt className="font-bold text-slate-500">
                    {isSomali ? "Nooca" : "Type"}
                  </dt>
                  <dd className="mt-1 font-black text-slate-900">
                    {businessTypeLabel(business.type, language)}
                  </dd>
                </div>
                {business.address && (
                  <div>
                    <dt className="font-bold text-slate-500">
                      {isSomali ? "Cinwaanka" : "Address"}
                    </dt>
                    <dd className="mt-1 font-black leading-6 text-slate-900">
                      {business.address}
                    </dd>
                  </div>
                )}
                {business.location &&
                  business.location !== business.address && (
                    <div>
                      <dt className="font-bold text-slate-500">
                        {isSomali ? "Goobta" : "Location"}
                      </dt>
                      <dd className="mt-1 font-black text-slate-900">
                        {business.location}
                      </dd>
                    </div>
                  )}
                {externalWebsite && (
                  <div>
                    <dt className="font-bold text-slate-500">
                      {isSomali ? "Bogga internetka" : "Website"}
                    </dt>
                    <dd className="mt-2">
                      <a
                        href={externalWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 font-black text-primary hover:underline"
                      >
                        {isSomali ? "Booqo bogga" : "Visit website"}
                        <ExternalLink aria-hidden="true" size={15} />
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
            </section>

            <section className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-slate-100 bg-white p-5 text-center shadow-sm">
                <Briefcase
                  aria-hidden="true"
                  className="mx-auto text-primary"
                  size={24}
                />
                <p className="mt-2 text-2xl font-black text-slate-900">
                  {business.jobCount ?? 0}
                </p>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {isSomali ? "Shaqooyin" : "Jobs"}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white p-5 text-center shadow-sm">
                <GraduationCap
                  aria-hidden="true"
                  className="mx-auto text-primary"
                  size={24}
                />
                <p className="mt-2 text-2xl font-black text-slate-900">
                  {business.trainingCount ?? 0}
                </p>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {isSomali ? "Tababarro" : "Programs"}
                </p>
              </div>
            </section>

            <section className="rounded-3xl bg-primary p-6 text-white">
              <h2 className="text-xl font-black">
                {isSomali ? "Sii wad sahminta" : "Keep exploring"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/80">
                {isSomali
                  ? "Eeg shaqaale xirfad leh iyo adeegyo kale oo ZeilaLink ah."
                  : "Discover skilled workers and more services on ZeilaLink."}
              </p>
              <div className="mt-5 flex flex-col gap-3">
                <Link
                  href="/workers"
                  className="rounded-xl bg-white px-4 py-3 text-center text-sm font-black text-primary"
                >
                  {isSomali ? "Eeg shaqaalaha" : "Browse workers"}
                </Link>
                <Link
                  href="/services"
                  className="rounded-xl border border-white/30 px-4 py-3 text-center text-sm font-black text-white"
                >
                  {isSomali ? "Eeg adeegyada" : "Browse services"}
                </Link>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
