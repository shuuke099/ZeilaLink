"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import api from "@/lib/api";

type DealBusiness = {
  id: string;
  slug: string | null;
  name: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  city: string | null;
  state: string | null;
};

type Deal = {
  id: string;
  slug: string | null;
  title: string;
  description: string | null;
  discountText: string;
  promoCode: string | null;
  imageUrl: string | null;
  validUntil: string | null;
  featured: boolean;
  business: DealBusiness;
};

type FeaturedDealsResponse = {
  deals: Deal[];
};

const CARDS_PER_PAGE = 6;

const formatExpirationDate = (value: string | null) => {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

export default function DealsAndPromotions() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDeals = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get<FeaturedDealsResponse>(
          "/deals/featured?limit=18",
        );

        setDeals(response.data.deals ?? []);
      } catch (error) {
        console.error("Failed to load featured deals:", error);
        setError("Unable to load deals and promotions.");
      } finally {
        setLoading(false);
      }
    };

    void loadDeals();
  }, []);

  const totalPages = Math.ceil(deals.length / CARDS_PER_PAGE);
  const startIndex = page * CARDS_PER_PAGE;
  const visibleDeals = deals.slice(startIndex, startIndex + CARDS_PER_PAGE);

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
      <section className="w-full bg-white py-6">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-8 xl:px-12">
          <div className="mb-4">
            <div className="h-6 w-48 animate-pulse rounded bg-slate-200" />
            <div className="mt-2 h-3 w-64 animate-pulse rounded bg-slate-100" />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-[240px] animate-pulse rounded-lg border border-slate-200 bg-slate-100"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="w-full bg-white py-6">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-8 xl:px-12">
          <p className="text-sm font-medium text-red-500">{error}</p>
        </div>
      </section>
    );
  }

  if (deals.length === 0) return null;

  return (
    <section className="w-full bg-white py-6">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-8 xl:px-12">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-950 sm:text-xl">
              Deals & Promotions
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
              Special offers from businesses in your community.
            </p>
          </div>

          <Link
            href="/deals"
            className="flex shrink-0 items-center gap-1 text-xs font-semibold text-violet-700 transition hover:text-violet-900 sm:text-sm"
          >
            View all deals
            <ChevronRight size={15} />
          </Link>
        </div>

        <div className="relative">
          {totalPages > 1 && (
            <button
              type="button"
              onClick={previousPage}
              aria-label="Previous deals"
              className="absolute -left-4 top-[90px] z-20 hidden h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white shadow-md transition hover:bg-slate-50 lg:flex"
            >
              <ChevronLeft size={17} />
            </button>
          )}

          <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:grid lg:grid-cols-6 lg:overflow-visible lg:pb-0">
            {visibleDeals.map((deal) => {
              const dealIdentifier = deal.slug || deal.id;
              const image =
                deal.imageUrl ||
                deal.business.bannerUrl ||
                deal.business.logoUrl ||
                "/images/business-placeholder.jpg";
              const expirationDate = formatExpirationDate(deal.validUntil);

              return (
                <article
                  key={deal.id}
                  className="group min-w-[165px] max-w-[165px] snap-start overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:min-w-[185px] sm:max-w-[185px] lg:min-w-0 lg:max-w-none"
                >
                  <Link href={`/deals/${dealIdentifier}`} className="block">
                    <div className="relative h-28 overflow-hidden bg-slate-100">
                      <img
                        src={image}
                        alt={deal.title}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />

                      <span className="absolute left-2 top-2 rounded bg-violet-700 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-white shadow-sm">
                        {deal.discountText}
                      </span>
                    </div>
                  </Link>

                  <div className="p-3">
                    <Link href={`/deals/${dealIdentifier}`}>
                      <h3 className="truncate text-sm font-bold text-slate-950 transition hover:text-violet-700">
                        {deal.business.name}
                      </h3>
                    </Link>

                    <p className="mt-1 line-clamp-1 text-xs text-slate-600">
                      {deal.title}
                    </p>

                    {expirationDate ? (
                      <p className="mt-2 truncate text-[11px] text-slate-400">
                        Valid till {expirationDate}
                      </p>
                    ) : (
                      <p className="mt-2 text-[11px] text-slate-400">
                        Limited time offer
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {totalPages > 1 && (
            <button
              type="button"
              onClick={nextPage}
              aria-label="Next deals"
              className="absolute -right-4 top-[90px] z-20 hidden h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white shadow-md transition hover:bg-slate-50 lg:flex"
            >
              <ChevronRight size={17} />
            </button>
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-4 hidden justify-center gap-1.5 lg:flex">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setPage(index)}
                aria-label={`Go to deals page ${index + 1}`}
                className={`h-1.5 rounded-full transition-all ${page === index ? "w-5 bg-violet-700" : "w-1.5 bg-slate-300"}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
