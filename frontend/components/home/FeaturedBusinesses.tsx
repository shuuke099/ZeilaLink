"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, Navigation, Phone, Star, ChevronRight, Building2, BadgeCheck } from "lucide-react";

import api from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { getBusinessCategoryLabel } from "@/app/businesses/businessUi";

type BusinessStatus = "OPEN" | "CLOSING_SOON" | "CLOSED" | "HOURS_UNAVAILABLE";

type BusinessHour = {
  id: string;
  businessId: string;
  dayOfWeek: number;
  openTime: string | null;
  closeTime: string | null;
  closed: boolean;
};

type Business = {
  id: string;
  slug: string | null;
  name: string;
  category: string;
  subcategory: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  rating: number;
  reviewsCount: number;
  verified: boolean;
  featured: boolean;
  timezone: string | null;
  hours: BusinessHour[];
  status: BusinessStatus;
  statusLabel: string;
  closesAt: string | null;
};

type FeaturedBusinessesResponse = {
  businesses: Business[];
};

const CARDS_PER_PAGE = 5;

const formatBusinessTime = (time: string | null) => {
  if (!time) return null;

  const [hourString, minuteString] = time.split(":");

  const hour = Number(hourString);
  const minute = Number(minuteString);

  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${String(minute).padStart(2, "0")} ${period}`;
};

const getStatusBadge = (status: BusinessStatus, isSomali: boolean) => {
  switch (status) {
    case "OPEN":
      return {
        className:
          "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
        shortLabel: isSomali ? "Furan" : "Open",
      };

    case "CLOSING_SOON":
      return {
        className:
          "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
        shortLabel: isSomali ? "Xirmeysa" : "Closing soon",
      };

    case "CLOSED":
      return {
        className:
          "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300",
        shortLabel: isSomali ? "Xiran" : "Closed",
      };

    default:
      return {
        className:
          "border-slate-300 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400",
        shortLabel: isSomali ? "Saacadaha lama hayo" : "Hours unavailable",
      };
  }
};

export default function FeaturedBusinesses() {
  const { language } = useLanguage();
  const so = language === "so";
  const t = (en: string, somali: string) => so ? somali : en;
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadBusinesses = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get<FeaturedBusinessesResponse>(
          "/businesses/featured",
          {
            params: {
              limit: 12,
            },
          },
        );

        let items = response.data.businesses || [];

        // Always fill the six-card homepage row, using other published
        // businesses after the featured records.
        if (items.length < CARDS_PER_PAGE) {
          const fallback = await api.get<FeaturedBusinessesResponse>(
            "/businesses",
            { params: { page: 1, limit: 12 } },
          );
          items = Array.from(
            new Map(
              [...items, ...(fallback.data.businesses || [])].map((business) => [
                business.id,
                business,
              ]),
            ).values(),
          );
        }

        setBusinesses(items);
      } catch (error) {
        console.error("Failed to load featured businesses:", error);

        setError("Unable to load featured businesses.");
      } finally {
        setLoading(false);
      }
    };

    void loadBusinesses();
  }, []);

  const visibleBusinesses = businesses.slice(0, CARDS_PER_PAGE);

  if (loading) {
    return (
      <section className="w-full bg-white py-10 dark:bg-background">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-8 xl:px-12">
          <div className="mb-6">
            <div className="h-7 w-52 animate-pulse rounded bg-gray-200" />

            <div className="mt-2 h-4 w-72 max-w-full animate-pulse rounded bg-gray-100" />
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className={`h-[335px] animate-pulse rounded-2xl border border-border bg-surface-muted sm:h-[355px] ${index === 4 ? "hidden sm:block" : ""}`}
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="w-full bg-white py-10 dark:bg-background">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-8 xl:px-12">
          <div className="rounded-xl border border-red-100 bg-red-50 p-5">
            <p className="text-sm font-medium text-red-600">{t(error, "Lama soo bandhigi karin ganacsiyada.")}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full bg-white py-10 dark:bg-background">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-8 xl:px-12">
        {/* Section header */}
        <div className="mb-6 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-slate-950 dark:text-white sm:text-2xl">
              {t("Featured Businesses", "Ganacsiyo Xul ah")}
            </h2>

            <p className="mt-1 text-[9px] text-slate-500 sm:text-[10px]">
              {t("Discover top-rated businesses in your community.", "Soo hel ganacsiyada sida wanaagsan loo qiimeeyay ee bulshadaada.")}
            </p>
          </div>

          <Link
            href="/businesses"
            className="flex shrink-0 items-center gap-1 text-xs font-semibold text-violet-700 transition hover:text-violet-900 sm:gap-2 sm:text-sm"
          >
            <span className="hidden xs:inline">{t("View all businesses", "Arag dhamaan ganacsiyada")}</span>

            <span className="xs:hidden">{t("View all", "Arag dhamaan ganacsiyada")}</span>

            <ChevronRight size={17} />
          </Link>
        </div>

        {businesses.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
            <p className="text-sm font-semibold text-slate-600">{t("Businesses will appear here as soon as they are published.", "Ganacsiyadu waxay halkan ka muuqan doonaan marka la daabaco.")}</p>
            <Link href="/businesses" className="mt-3 inline-flex text-sm font-bold text-violet-700 hover:text-violet-900">{t("Browse the business directory", "Eeg diiwaanka ganacsiyada")}</Link>
          </div>
        ) : (
        /* Business cards */
        <div className="relative">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
            {visibleBusinesses.map((business, index) => {
              const businessUrl = business.slug || business.id;
              const banner = business.bannerUrl;
              const logo = business.logoUrl;

              const location = [business.city, business.state]
                .filter(Boolean)
                .join(", ");
              const directionsQuery = [business.address, business.city, business.state]
                .filter(Boolean)
                .join(", ");
              const badge = getStatusBadge(business.status, so);

              return (
                <article
                  key={business.id}
                  className={`group relative flex min-h-[335px] min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_4px_16px_rgba(15,23,42,0.07)] transition duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl dark:bg-surface dark:shadow-[0_8px_24px_rgba(0,0,0,.35)] sm:min-h-[355px] ${index === 4 ? "hidden sm:flex" : ""}`}
                >
                  <Link href={`/businesses/${businessUrl}`} aria-label={`${t("View", "Eeg")} ${business.name}`} className="absolute inset-0 z-10 rounded-[inherit] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"><span className="sr-only">{t("View", "Eeg")} {business.name}</span></Link>

                  <div className="relative block h-[140px] shrink-0 overflow-hidden bg-surface-muted sm:h-[155px]">
                    {banner && <img src={banner} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />}
                    {!banner && logo && <img src={logo} alt={business.name} className="h-full w-full object-contain p-6" />}
                    {!banner && !logo && <Building2 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-muted/40" size={42} />}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/30 via-transparent to-transparent" />
                    {business.featured && <span className="absolute left-2.5 top-2.5 rounded-md bg-violet-700 px-2 py-1 text-[8px] font-extrabold uppercase tracking-wide text-white shadow-sm sm:text-[9px]">{t("Featured", "La xushay")}</span>}
                  </div>

                  <div className="flex min-h-0 flex-1 flex-col p-3 sm:p-4">
                    {(business.category || business.subcategory) && (
                      <div className="flex min-w-0 items-center gap-1.5 text-[9px] font-bold sm:text-[10px]">
                        <span className="truncate rounded-md bg-primary/10 px-2 py-1 text-primary">{business.subcategory || getBusinessCategoryLabel(business.category, so)}</span>
                      </div>
                    )}

                    <div className="mt-2.5 min-w-0">
                      <h3 className="line-clamp-2 text-[13px] font-extrabold leading-[1.25] tracking-[-0.015em] text-heading sm:text-[15px] xl:text-[16px]">
                        <span className="transition-colors group-hover:text-primary">{business.name}</span>
                      </h3>
                    </div>

                    <p className="mt-1.5 flex min-w-0 items-center gap-1.5 text-[10px] font-normal leading-4 text-muted sm:text-[11px]">
                      <MapPin aria-hidden="true" size={12} className="shrink-0 text-primary" />
                      <span className="truncate">{location || t("Online", "Onlayn")}</span>
                    </p>

                    <div className="mt-3 flex items-center justify-between gap-2 text-[10px] sm:text-[11px]">
                      <p className="flex items-center gap-1 font-bold text-foreground"><Star size={12} className="fill-amber-400 text-amber-500" />{Number(business.rating || 0).toFixed(1)} <span className="font-normal text-muted">({business.reviewsCount ?? 0})</span></p>
                      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[8px] font-bold sm:text-[9px] ${badge.className}`}>{badge.shortLabel}</span>
                    </div>

                    {business.verified && (
                      <p className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400"><BadgeCheck size={13} />{t("Verified", "La xaqiijiyey")}</p>
                    )}

                    <div className="relative z-20 mt-auto grid grid-cols-2 gap-2 border-t border-border pt-3 text-[10px] font-bold sm:text-[11px]">
                      {business.phone ? <a href={`tel:${business.phone}`} className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface-muted text-foreground transition hover:border-primary/50 hover:text-primary"><Phone size={13} />{t("Call", "Wac")}</a> : <span className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface-muted text-muted/50"><Phone size={13} />{t("Call", "Wac")}</span>}
                      {directionsQuery ? <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(directionsQuery)}`} target="_blank" rel="noopener noreferrer" className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface-muted text-foreground transition hover:border-primary/50 hover:text-primary"><Navigation size={13} />{t("Directions", "Tilmaamaha")}</a> : <span className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface-muted text-muted/50"><Navigation size={13} />{t("Directions", "Tilmaamaha")}</span>}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

        </div>
        )}

      </div>
    </section>
  );
}
