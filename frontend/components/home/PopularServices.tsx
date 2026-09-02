"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Star } from "lucide-react";
import api from "@/lib/api";

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

const CARDS_PER_PAGE = 6;
const FALLBACK_IMAGE = "/images/service-placeholder.jpg";

/* ============================================================
   SERVICE CARD
============================================================ */

function ServiceCard({ service }: { service: Service }) {
  const serviceUrl = `/services/${service.slug || service.id}`;
  const image = service.image || FALLBACK_IMAGE;

  return (
    <article className="group w-full min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-200 hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <Link href={serviceUrl} className="block">
        {/* Image */}
        <div className="relative h-[125px] w-full overflow-hidden bg-gray-100 sm:h-[140px] md:h-[145px]">
          <img
            src={image}
            alt={service.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(event) => {
              event.currentTarget.src = FALLBACK_IMAGE;
            }}
          />
        </div>

        {/* Information */}
        <div className="p-3">
          <h3 className="truncate text-sm font-bold text-slate-950 transition-colors group-hover:text-violet-700 dark:text-white dark:group-hover:text-violet-300">
            {service.title}
          </h3>

          <p className="mt-1 truncate text-sm font-bold text-violet-700">
            {service.priceLabel || "Contact for pricing"}
          </p>

          {service.rating > 0 && (
            <div className="mt-1.5 flex items-center gap-1">
              <Star size={13} className="fill-amber-400 text-amber-400" />

              <span className="text-xs font-semibold text-slate-700">
                {Number(service.rating).toFixed(1)}
              </span>

              {service.reviewsCount > 0 && (
                <span className="text-xs text-slate-400">
                  ({service.reviewsCount})
                </span>
              )}
            </div>
          )}
        </div>
      </Link>
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

        {/* Mobile */}
        <div className="grid grid-cols-2 gap-3 md:hidden">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-[205px] animate-pulse rounded-xl bg-gray-100"
            />
          ))}
        </div>

        {/* Desktop */}
        <div className="hidden grid-cols-6 gap-4 md:grid">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-[220px] animate-pulse rounded-xl bg-gray-100"
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
            <p className="text-sm text-red-600">{error}</p>
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
            <h2 className="text-xl font-bold text-slate-950 dark:text-white md:text-2xl">
              Popular Services
            </h2>

            <p className="mt-1 hidden text-sm text-slate-500 md:block">
              Book trusted professionals for your everyday needs.
            </p>
          </div>

          <Link
            href="/services"
            className="flex items-center gap-1 whitespace-nowrap text-sm font-semibold text-violet-700 transition hover:text-violet-900"
          >
            <span className="md:hidden">View all</span>
            <span className="hidden md:inline">View all services</span>
            <ChevronRight size={17} />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-6">
            {visibleServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
        </div>
      </div>
    </section>
  );
}
