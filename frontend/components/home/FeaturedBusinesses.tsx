"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Heart,
  MapPin,
  Phone,
  Star,
  ChevronLeft,
  ChevronRight,
  Clock3,
} from "lucide-react";

import api from "@/lib/api";

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

const CARDS_PER_PAGE = 4;

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

const getStatusClasses = (status: BusinessStatus) => {
  switch (status) {
    case "OPEN":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";

    case "CLOSING_SOON":
      return "bg-amber-50 text-amber-700 ring-amber-600/20";

    case "CLOSED":
      return "bg-red-50 text-red-700 ring-red-600/20";

    default:
      return "bg-slate-100 text-slate-500 ring-slate-500/20";
  }
};

export default function FeaturedBusinesses() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [page, setPage] = useState(0);
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

        // Keep the homepage section useful even before an admin has marked
        // directory records as featured.
        if (items.length === 0) {
          const fallback = await api.get<FeaturedBusinessesResponse>(
            "/businesses",
            { params: { page: 1, limit: 12 } },
          );
          items = fallback.data.businesses || [];
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

  const totalPages = Math.ceil(businesses.length / CARDS_PER_PAGE);

  const startIndex = page * CARDS_PER_PAGE;

  const visibleBusinesses = businesses.slice(
    startIndex,
    startIndex + CARDS_PER_PAGE,
  );

  const previousPage = () => {
    setPage((current) =>
      current === 0 ? Math.max(totalPages - 1, 0) : current - 1,
    );
  };

  const nextPage = () => {
    setPage((current) => (totalPages === 0 ? 0 : (current + 1) % totalPages));
  };

  if (loading) {
    return (
      <section className="w-full bg-white py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-6">
            <div className="h-7 w-52 animate-pulse rounded bg-gray-200" />

            <div className="mt-2 h-4 w-72 max-w-full animate-pulse rounded bg-gray-100" />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-[365px] animate-pulse rounded-xl border border-gray-200 bg-gray-100"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="w-full bg-white py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="rounded-xl border border-red-100 bg-red-50 p-5">
            <p className="text-sm font-medium text-red-600">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full bg-white py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Section header */}
        <div className="mb-6 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-slate-950 sm:text-2xl">
              Featured Businesses
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Discover top-rated businesses in your community.
            </p>
          </div>

          <Link
            href="/businesses"
            className="flex shrink-0 items-center gap-1 text-xs font-semibold text-violet-700 transition hover:text-violet-900 sm:gap-2 sm:text-sm"
          >
            <span className="hidden xs:inline">View all businesses</span>

            <span className="xs:hidden">View all</span>

            <ChevronRight size={17} />
          </Link>
        </div>

        {businesses.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
            <p className="text-sm font-semibold text-slate-600">Businesses will appear here as soon as they are published.</p>
            <Link href="/businesses" className="mt-3 inline-flex text-sm font-bold text-violet-700 hover:text-violet-900">Browse the business directory</Link>
          </div>
        ) : (
        /* Business cards */
        <div className="relative">
          {totalPages > 1 && (
            <button
              type="button"
              onClick={previousPage}
              aria-label="Previous businesses"
              className="absolute -left-5 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white shadow-md transition hover:bg-gray-50 lg:flex"
            >
              <ChevronLeft size={20} />
            </button>
          )}

          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {visibleBusinesses.map((business) => {
              const businessUrl = business.slug || business.id;

              const image =
                business.logoUrl ||
                business.bannerUrl ||
                "/images/business-placeholder.jpg";

              const location = [business.city, business.state]
                .filter(Boolean)
                .join(", ");

              const directionsQuery = [
                business.address,
                business.city,
                business.state,
              ]
                .filter(Boolean)
                .join(", ");

              const closingTime = formatBusinessTime(business.closesAt);

              return (
                <article
                  key={business.id}
                  className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.05)] transition duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                >
                  {/* Image */}
                  <div className="relative h-28 overflow-hidden bg-slate-100 sm:h-36">
                    <Link href={`/businesses/${businessUrl}`}>
                      <img
                        src={image}
                        alt={business.name}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    </Link>

                    {business.featured && (
                      <span className="absolute left-3 top-3 rounded-md bg-violet-700 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                        Featured
                      </span>
                    )}

                    <button
                      type="button"
                      aria-label={`Save ${business.name}`}
                      className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 shadow-sm transition hover:bg-white"
                    >
                      <Heart size={17} className="text-slate-700" />
                    </button>
                  </div>

                  {/* Card body */}
                  <div className="p-2.5 sm:p-3.5">
                    {/* Business name */}
                    <Link href={`/businesses/${businessUrl}`}>
                      <h3 className="truncate text-sm font-bold text-slate-950 transition hover:text-violet-700">
                        {business.name}
                      </h3>
                    </Link>

                    {/* Rating */}
                    <div className="mt-1.5 flex items-center gap-1">
                      <Star
                        size={15}
                        className="fill-amber-400 text-amber-400"
                      />

                      <span className="text-sm font-semibold text-amber-500">
                        {Number(business.rating || 0).toFixed(1)}
                      </span>

                      <span className="text-xs text-slate-500">
                        ({business.reviewsCount || 0})
                      </span>
                    </div>

                    {/* Category */}
                    <p className="mt-1.5 truncate text-xs text-slate-600">
                      {business.subcategory || business.category}
                    </p>

                    {/*
                      Location on LEFT

                      Status on RIGHT
                      Closing time directly below status
                    */}
                    <div className="mt-2 flex min-h-[44px] items-start justify-between gap-3">
                      {/* LEFT */}
                      <div className="flex min-w-0 items-center gap-1.5 pt-0.5 text-sm text-slate-600">
                        <MapPin size={14} className="shrink-0" />

                        <span className="truncate">{location || "Online"}</span>
                      </div>

                      {/* RIGHT */}
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        {/* Open / Closing Soon / Closed */}
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${getStatusClasses(
                            business.status,
                          )}`}
                        >
                          {business.statusLabel}
                        </span>

                        {/* Closing time */}
                        {(business.status === "OPEN" ||
                          business.status === "CLOSING_SOON") &&
                          closingTime && (
                            <span className="flex items-center gap-1 whitespace-nowrap text-[10px] font-medium text-slate-500">
                              <Clock3 size={11} className="shrink-0" />

                              <span>Closes {closingTime}</span>
                            </span>
                          )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-3 flex items-center gap-2 border-t border-gray-100 pt-3">
                      {business.phone ? (
                        <a
                          href={`tel:${business.phone}`}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold text-slate-700 transition hover:bg-violet-50 hover:text-violet-700"
                        >
                          <Phone size={14} />
                          Call
                        </a>
                      ) : (
                        <div className="flex-1" />
                      )}

                      {directionsQuery && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            directionsQuery,
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold text-slate-700 transition hover:bg-violet-50 hover:text-violet-700"
                        >
                          <MapPin size={14} />
                          Directions
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {totalPages > 1 && (
            <button
              type="button"
              onClick={nextPage}
              aria-label="Next businesses"
              className="absolute -right-5 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white shadow-md transition hover:bg-gray-50 lg:flex"
            >
              <ChevronRight size={20} />
            </button>
          )}
        </div>
        )}

        {/* Pagination dots */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            {Array.from({
              length: totalPages,
            }).map((_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Go to page ${index + 1}`}
                onClick={() => setPage(index)}
                className={`h-2 rounded-full transition-all ${
                  page === index ? "w-6 bg-violet-700" : "w-2 bg-gray-300"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
