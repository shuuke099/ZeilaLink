"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Navigation, Phone } from "lucide-react";
import api from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";

/* ============================================================
   TYPES
============================================================ */

type Service = {
  id: string;
  slug: string;
  title: string;
  titleSo: string | null;
  description: string;
  descriptionSo: string | null;
  category: string;
  subcategory: string | null;
  provider: string | null;
  businessId: string | null;
  priceLabel: string | null;
  priceFrom: number | null;
  priceType: string | null;
  image: string | null;
  gallery: string[];
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  serviceArea: string[];
  remoteAvailable: boolean;
  availabilityMode: string | null;
  rating: number;
  reviewsCount: number;
  viewsCount: number;
  verified: boolean;
  featured: boolean;
  published: boolean;
  active: boolean;
};

type ServicesResponse = {
  services: Service[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

/* ============================================================
   CONFIG
============================================================ */

const CARDS_PER_PAGE = 5;
const FALLBACK_IMAGE = "/images/service-placeholder.jpg";

/* ============================================================
   SERVICE CARD
============================================================ */

function ServiceCard({ service, className }: { service: Service; className?: string }) {
  const { language } = useLanguage();
  const so = language === "so";
  const title = so ? service.titleSo?.trim() || service.title : service.title;
  const description = so
    ? service.descriptionSo?.trim() || service.description
    : service.description;
  const serviceUrl = `/services/${service.slug || service.id}`;
  const image = service.image || FALLBACK_IMAGE;
  const directionsQuery =
    [service.address, service.city, service.state, service.postalCode, service.country]
      .filter(Boolean)
      .join(", ") || service.serviceArea?.filter(Boolean).join(", ");

  return (
    <article className={`group relative flex min-h-[330px] min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_4px_16px_rgba(15,23,42,.07)] transition duration-200 hover:-translate-y-1 hover:border-primary/35 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_8px_24px_rgba(0,0,0,.35)] sm:min-h-[355px] ${className ?? ""}`}>
      <Link
        href={serviceUrl}
        aria-label={`${so ? "Eeg" : "View"} ${title}`}
        className="absolute inset-0 z-10 rounded-[inherit] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      >
        <span className="sr-only">{so ? "Eeg" : "View"} {title}</span>
      </Link>

      <div className="relative h-[135px] shrink-0 overflow-hidden bg-surface-muted dark:bg-slate-800 sm:h-[155px]">
        <img
          src={image}
          alt={`${title} service`}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          onError={(event) => {
            event.currentTarget.src = FALLBACK_IMAGE;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/25 via-transparent to-transparent" />
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-3 sm:p-4">
        <div className="min-h-0 min-w-0">
          <h3 className="line-clamp-2 text-[13px] font-extrabold leading-[1.25] tracking-[-0.015em] text-heading dark:text-white sm:text-[15px] xl:text-[16px]">{title}</h3>
          {service.provider && <p className="mt-1.5 truncate text-[10px] font-bold leading-4 text-primary sm:text-[11px]">{service.provider}</p>}
          <p className="mt-2.5 line-clamp-3 text-[11px] font-medium leading-[1.55] text-slate-600 dark:text-slate-300 sm:text-[12px]">{description}</p>
        </div>

        <div className="relative z-20 mt-auto grid grid-cols-2 gap-2 border-t border-border pt-3 text-[10px] font-bold sm:text-[11px]">
          {service.phone ? (
            <a href={`tel:${service.phone}`} className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 text-primary transition hover:border-primary hover:bg-primary hover:text-white">
              <Phone size={13} />{so ? "Wac" : "Call"}
            </a>
          ) : (
            <span className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface-muted text-muted/50">
              <Phone size={13} />{so ? "Wac" : "Call"}
            </span>
          )}
          {directionsQuery ? (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(directionsQuery)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface-muted text-foreground transition hover:border-primary/50 hover:text-primary dark:text-slate-200"
            >
              <Navigation size={13} />{so ? "Tilmaamaha" : "Directions"}
            </a>
          ) : (
            <span className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface-muted text-muted/50">
              <Navigation size={13} />{so ? "Tilmaamaha" : "Directions"}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

/* ============================================================
   LOADING SKELETON
============================================================ */

function LoadingSkeleton() {
  return (
    <section className="w-full bg-white dark:bg-background">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-8 xl:px-12">
        {/* Header */}
        <div className="mb-5 flex items-end justify-between">
          <div>
            <div className="h-6 w-40 animate-pulse rounded bg-gray-200" />
            <div className="mt-2 hidden h-4 w-72 animate-pulse rounded bg-gray-100 md:block" />
          </div>

          <div className="h-4 w-16 animate-pulse rounded bg-gray-100" />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className={`h-[330px] animate-pulse rounded-2xl bg-surface-muted sm:h-[355px] ${index === 4 ? "hidden sm:block" : ""}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   POPULAR SERVICES
============================================================ */

export default function PopularServices() {
  const { language } = useLanguage();
  const t = (en: string, somali: string) => language === "so" ? somali : en;
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ============================================================
     FETCH SERVICES
  ============================================================ */

  useEffect(() => {
    let cancelled = false;

    const loadServices = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get<ServicesResponse>("/services", {
          params: {
            limit: 24,
          },
        });

        if (cancelled) return;

        setServices(response.data.services || []);
      } catch (error) {
        console.error("Failed to load popular services:", error);

        if (!cancelled) {
          setError("Unable to load popular services.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadServices();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ============================================================
     PAGINATION
  ============================================================ */

  const visibleServices = services.slice(0, CARDS_PER_PAGE);

  /* ============================================================
     STATES
  ============================================================ */

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <section className="w-full bg-white py-8 dark:bg-background md:py-10">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-8 xl:px-12">
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-600">{t(error, "Lama soo bandhigi karin adeegyada caanka ah.")}</p>
          </div>
        </div>
      </section>
    );
  }

  if (services.length === 0) {
    return null;
  }

  /* ============================================================
     UI
  ============================================================ */

  return (
    <section className="w-full bg-white pb-5 dark:bg-background md:pb-5">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-8 xl:px-12">
        {/* Header */}
        <div className="mb-5 flex items-end justify-between md:mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-950 dark:text-white sm:text-2xl">
              {t("Popular Services", "Adeegyada ogu cansan")}
            </h2>

            <p className="mt-1 hidden text-[9px] text-slate-500 sm:text-[10px] md:block">
              {t("Book trusted professionals for your everyday needs.", "Ballan ka qabso xirfadlayaal lagu kalsoon yahay si ay kaaga caawiyaan baahiyahaaga maalinlaha ah.")}
            </p>
          </div>

          <Link
            href="/services"
            className="flex items-center gap-1 whitespace-nowrap text-sm font-semibold text-violet-700 transition hover:text-violet-900"
          >
            <span className="md:hidden">{t("View all", "Arag dhamaan adeegyada")}</span>
            <span className="hidden md:inline">{t("View all services", "Arag dhamaan adeegyada")}</span>
            <ChevronRight size={17} />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
            {visibleServices.map((service, index) => (
              <ServiceCard key={service.id} service={service} className={index === 4 ? "hidden sm:flex" : ""} />
            ))}
        </div>
      </div>
    </section>
  );
}
