"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, Navigation, Phone, Star, ChevronRight } from "lucide-react";

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

const CARDS_PER_PAGE = 6;

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

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-[165px] animate-pulse rounded-lg border border-gray-200 bg-gray-100 sm:h-[195px]"
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
            <p className="text-sm font-medium text-red-600">{error}</p>
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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-6">
            {visibleBusinesses.map((business) => {
              const businessUrl = business.slug || business.id;

              const image =
                business.bannerUrl ||
                business.logoUrl ||
                "/images/business-placeholder.jpg";

              const location = [business.city, business.state]
                .filter(Boolean)
                .join(", ");
              const directionsQuery = [business.address, business.city, business.state]
                .filter(Boolean)
                .join(", ");

              return (
                <article
                  key={business.id}
                  className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.05)] transition duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
                >
                  <Link href={`/businesses/${businessUrl}`} className="block h-[105px] overflow-hidden bg-slate-100 sm:h-[135px]">
                    <img src={image} alt={business.name} className="h-full w-full object-cover object-center transition duration-300 group-hover:scale-[1.03]" />
                  </Link>
                  <Link href={`/businesses/${businessUrl}`} className="block p-2.5 sm:p-3">
                    <h3 className="truncate text-[11px] font-extrabold text-slate-950 transition group-hover:text-primary sm:text-[13px]">{business.name}</h3>
                    <div className="mt-1.5 flex min-w-0 items-center justify-between gap-2 text-[9px] font-medium text-slate-500 sm:text-[10px]"><p className="flex min-w-0 items-center gap-1"><MapPin size={12} className="shrink-0 text-primary" /><span className="truncate">{location || "Online"}</span></p><span className="flex shrink-0 items-center gap-1 font-semibold text-amber-500"><Star size={11} className="fill-amber-400" />{Number(business.rating || 0).toFixed(1)}</span></div>
                  </Link>
                  <div className="grid grid-cols-2 divide-x divide-slate-100 border-t border-slate-100 py-2 text-[8px] font-semibold text-slate-600 dark:divide-slate-800 dark:border-slate-800 sm:text-[9px]">
                    {business.phone ? <a href={`tel:${business.phone}`} className="flex items-center justify-center gap-1.5 transition hover:text-primary"><Phone size={11} />Call</a> : <span className="flex items-center justify-center gap-1.5 text-slate-300"><Phone size={11} />Call</span>}
                    {directionsQuery ? <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(directionsQuery)}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 transition hover:text-primary"><Navigation size={11} />Directions</a> : <span className="flex items-center justify-center gap-1.5 text-slate-300"><Navigation size={11} />Directions</span>}
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
