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
import BusinessProfileView from "./BusinessProfileView";
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
        `/businesses/${encodeURIComponent(identifier)}`,
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
  if (type === "business") {
    return language === "so" ? "Ganacsi deegaan" : "Local business";
  }
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
  const safeBanner = getSafeStoredUrl(business.bannerUrl);
  const imageSource = safeBanner || safeLogo;
  const image = imageSource
    ? imageSource.startsWith("/")
      ? absoluteUrl(imageSource)
      : imageSource
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
  const safeBanner = getSafeStoredUrl(business.bannerUrl);
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
        image: safeBanner || schemaLogo,
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
    <div className="min-h-screen bg-[#fafafe]">
      <script
        nonce={nonce}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <Navbar />

      <BusinessProfileView business={business} language={language} />

      <main className="hidden">
        <section className="relative min-h-[280px] overflow-hidden rounded-xl border border-slate-200 bg-slate-950 text-white shadow-[0_2px_8px_rgba(15,23,42,.06)] sm:min-h-[320px]">
          {safeBanner && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={safeBanner}
              alt={isSomali ? `Sawirka daboolka ${localized.name}` : `${localized.name} cover`}
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/75 to-slate-950/25" />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-slate-950/15" />
          <div className="relative flex min-h-[280px] flex-col justify-end gap-4 p-5 sm:min-h-[320px] sm:flex-row sm:items-end sm:justify-start sm:p-7">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-white/90 bg-white shadow-lg sm:h-20 sm:w-20">
              {safeLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={safeLogo}
                  alt={
                    isSomali
                      ? `Astaanta ${localized.name}`
                      : `${localized.name} logo`
                  }
                  className="h-full w-full object-contain p-2"
                />
              ) : (
                <Building2
                  aria-hidden="true"
                  size={30}
                  className="text-primary"
                />
              )}
            </div>
            <div className="min-w-0 flex-1 pb-1">
              <span className="inline-flex rounded border border-white/20 bg-slate-950/45 px-2 py-1 text-[8px] font-bold uppercase tracking-wide text-violet-200 backdrop-blur-md">
                {businessTypeLabel(business.type, language)}
              </span>
              <h1 className="mt-2 text-[25px] font-extrabold tracking-[-0.035em] !text-white drop-shadow-lg sm:text-[30px]">
                {localized.name}
              </h1>
              {alternateName && alternateName !== localized.name && (
                <p
                  lang={isSomali ? "en" : "so"}
                  className="mt-1 text-[11px] font-semibold text-white/80"
                >
                  {alternateName}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-4 text-[10px] font-medium text-white/85">
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

        <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_330px]">
          <div className="space-y-4">
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,.04)] sm:p-5">
              <h2 className="text-[14px] font-extrabold text-slate-900">
                {isSomali
                  ? `Ku saabsan ${localized.name}`
                  : `About ${localized.name}`}
              </h2>
              <p
                lang={isSomali ? "so" : "en"}
                className="mt-3 whitespace-pre-line text-[11px] leading-5 text-slate-600"
              >
                {localized.description ||
                  (isSomali
                    ? "Ururkani wali ma uusan darin sharaxaad faahfaahsan."
                    : "This organization has not added a detailed description yet.")}
              </p>
              {showAlternateDescription && (
                <div className="mt-6 border-t border-slate-100 pt-6">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {isSomali ? "English description" : "Sharaxaad Soomaali"}
                  </h3>
                  <p
                    lang={isSomali ? "en" : "so"}
                    className="mt-2 whitespace-pre-line text-[10px] leading-5 text-slate-600"
                  >
                    {alternateDescription}
                  </p>
                </div>
              )}
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,.04)] sm:p-5">
              <h2 className="text-[14px] font-extrabold text-slate-900">
                {business.type === "employer"
                  ? isSomali
                    ? "Fursadaha shaqada"
                    : "Employment opportunities"
                  : isSomali
                    ? "Fursadaha tababarka"
                    : "Training opportunities"}
              </h2>
              <p className="mt-2 text-[10px] leading-5 text-slate-600">
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
                className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2.5 text-[10px] font-bold text-white"
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

          <aside className="space-y-3 lg:sticky lg:top-20">
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,.04)]">
              <h2 className="text-[12px] font-extrabold text-slate-900">
                {isSomali ? "Faahfaahinta ururka" : "Organization details"}
              </h2>
              <dl className="mt-3 space-y-3 text-[10px]">
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
                    <dd className="mt-1 font-semibold leading-5 text-slate-900">
                      {business.address}
                    </dd>
                  </div>
                )}
                {business.category && (
                  <div>
                    <dt className="font-bold text-slate-500">{isSomali ? "Qaybta" : "Category"}</dt>
                    <dd className="mt-1 font-black text-slate-900">{business.category}</dd>
                  </div>
                )}
                {business.phone && (
                  <div>
                    <dt className="font-bold text-slate-500">{isSomali ? "Telefoon" : "Phone"}</dt>
                    <dd className="mt-1"><a className="font-black text-primary hover:underline" href={`tel:${business.phone}`}>{business.phone}</a></dd>
                  </div>
                )}
                {business.email && (
                  <div>
                    <dt className="font-bold text-slate-500">Email</dt>
                    <dd className="mt-1 break-all"><a className="font-black text-primary hover:underline" href={`mailto:${business.email}`}>{business.email}</a></dd>
                  </div>
                )}
                {business.openingHours && (business.openingHours.weekdays || business.openingHours.weekends) && (
                  <div>
                    <dt className="font-bold text-slate-500">{isSomali ? "Saacadaha furitaanka" : "Opening hours"}</dt>
                    <dd className="mt-2 space-y-1 text-sm font-semibold text-slate-900">
                      {business.openingHours.weekdays && <p><span className="text-slate-500">{isSomali ? "Maalmaha shaqada:" : "Weekdays:"}</span> {business.openingHours.weekdays}</p>}
                      {business.openingHours.weekends && <p><span className="text-slate-500">{isSomali ? "Dhamaadka toddobaadka:" : "Weekends:"}</span> {business.openingHours.weekends}</p>}
                    </dd>
                  </div>
                )}
                {(business.latitude != null && business.longitude != null) && (
                  <div>
                    <dt className="font-bold text-slate-500">{isSomali ? "Khariidadda" : "Directions"}</dt>
                    <dd className="mt-2"><a target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-black text-primary hover:underline" href={`https://www.google.com/maps/dir/?api=1&destination=${business.latitude},${business.longitude}`}>{isSomali ? "Hel jidka" : "Get directions"}<ExternalLink size={15} /></a></dd>
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
              <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
                <Briefcase
                  aria-hidden="true"
                  className="mx-auto text-primary"
                  size={24}
                />
                <p className="mt-1 text-lg font-extrabold text-slate-900">
                  {business.jobCount ?? 0}
                </p>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {isSomali ? "Shaqooyin" : "Jobs"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
                <GraduationCap
                  aria-hidden="true"
                  className="mx-auto text-primary"
                  size={24}
                />
                <p className="mt-1 text-lg font-extrabold text-slate-900">
                  {business.trainingCount ?? 0}
                </p>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {isSomali ? "Tababarro" : "Programs"}
                </p>
              </div>
            </section>

            <section className="rounded-xl bg-primary p-4 text-white">
              <h2 className="text-[13px] font-extrabold !text-white">
                {isSomali ? "Sii wad sahminta" : "Keep exploring"}
              </h2>
              <p className="mt-2 text-[9px] leading-4 text-white/80">
                {isSomali
                  ? "Eeg shaqaale xirfad leh iyo adeegyo kale oo ZeilaLink ah."
                  : "Discover skilled workers and more services on ZeilaLink."}
              </p>
              <div className="mt-3 flex flex-col gap-2">
                <Link
                  href="/workers"
                  className="rounded-lg bg-white px-4 py-2.5 text-center text-[9px] font-bold text-primary"
                >
                  {isSomali ? "Eeg shaqaalaha" : "Browse workers"}
                </Link>
                <Link
                  href="/services"
                  className="rounded-lg border border-white/30 px-4 py-2.5 text-center text-[9px] font-bold text-white"
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
