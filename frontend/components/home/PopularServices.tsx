"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
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
    <article className="group w-[145px] min-w-[145px] overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-200 hover:-translate-y-1 hover:shadow-md sm:w-[165px] sm:min-w-[165px] md:w-auto md:min-w-0">
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
          <h3 className="truncate text-sm font-bold text-slate-950 transition-colors group-hover:text-violet-700">
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
    <section className="w-full bg-white  ">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header */}
        <div className="mb-5 flex items-end justify-between">
          <div>
            <div className="h-6 w-40 animate-pulse rounded bg-gray-200" />
            <div className="mt-2 hidden h-4 w-72 animate-pulse rounded bg-gray-100 md:block" />
          </div>

          <div className="h-4 w-16 animate-pulse rounded bg-gray-100" />
        </div>

        {/* Mobile */}
        <div className="flex gap-3 overflow-hidden md:hidden">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-[205px] w-[145px] min-w-[145px] animate-pulse rounded-xl bg-gray-100"
            />
          ))}
        </div>

        {/* Desktop */}
        <div className="hidden grid-cols-3 gap-4 md:grid lg:grid-cols-6">
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
  const [page, setPage] = useState(0);
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

  const totalPages = Math.ceil(services.length / CARDS_PER_PAGE);

  const visibleServices = useMemo(() => {
    const startIndex = page * CARDS_PER_PAGE;
    return services.slice(startIndex, startIndex + CARDS_PER_PAGE);
  }, [services, page]);

  const previousPage = () => {
    setPage((current) => {
      if (totalPages <= 1) return 0;
      return current === 0 ? totalPages - 1 : current - 1;
    });
  };

  const nextPage = () => {
    setPage((current) => {
      if (totalPages <= 1) return 0;
      return (current + 1) % totalPages;
    });
  };

  /* ============================================================
     STATES
  ============================================================ */

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <section className="w-full bg-white py-8 md:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
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
    <section className="w-full bg-white pb-5 md:pb-5">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header */}
        <div className="mb-5 flex items-end justify-between md:mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-950 md:text-2xl">
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

        {/* ====================================================
            MOBILE VERSION
        ==================================================== */}

        <div className="md:hidden">
          <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {services.map((service) => (
              <div key={service.id} className="snap-start">
                <ServiceCard service={service} />
              </div>
            ))}
          </div>

          {services.length > 3 && (
            <div className="mt-3 flex justify-center gap-1.5">
              <span className="h-2 w-5 rounded-full bg-violet-700" />
              <span className="h-2 w-2 rounded-full bg-gray-200" />
              <span className="h-2 w-2 rounded-full bg-gray-200" />
              <span className="h-2 w-2 rounded-full bg-gray-200" />
            </div>
          )}
        </div>

        {/* ====================================================
            DESKTOP VERSION
        ==================================================== */}

        <div className="relative hidden md:block">
          {totalPages > 1 && (
            <button
              type="button"
              onClick={previousPage}
              aria-label="Previous services"
              className="absolute -left-5 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white shadow-md transition hover:bg-gray-50 hover:text-violet-700"
            >
              <ChevronLeft size={20} />
            </button>
          )}

          <div className="grid grid-cols-3 gap-4 lg:grid-cols-6">
            {visibleServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>

          {totalPages > 1 && (
            <button
              type="button"
              onClick={nextPage}
              aria-label="Next services"
              className="absolute -right-5 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white shadow-md transition hover:bg-gray-50 hover:text-violet-700"
            >
              <ChevronRight size={20} />
            </button>
          )}
        </div>

        {/* Desktop Carousel Dots */}
        {totalPages > 1 && (
          <div className="mt-6 hidden justify-center gap-2 md:flex">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Go to services page ${index + 1}`}
                onClick={() => setPage(index)}
                className={`h-2 rounded-full transition-all ${
                  page === index
                    ? "w-6 bg-violet-700"
                    : "w-2 bg-gray-300 hover:bg-gray-400"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
