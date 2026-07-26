'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Search, Star } from 'lucide-react';
import Link from 'next/link';
import { cachedApiGet } from '@/lib/api-cache';
import { serviceCategories, services as fallbackServices } from '../data/services';
import type { ServiceItem } from '../data/services';

type ServiceListProps = {
  isEn: boolean;
  initialServices?: ServiceItem[];
  initialCategories?: string[];
  loadError?: boolean;
};

export default function ServiceList({
  isEn,
  initialServices = [],
  initialCategories = [],
  loadError = false,
}: ServiceListProps) {
  const [activeCategory, setActiveCategory] = useState('All Services');
  const [search, setSearch] = useState('');
  const hasInitialServices = initialServices.length > 0;
  const [services, setServices] = useState<ServiceItem[]>(
    hasInitialServices ? initialServices : fallbackServices,
  );
  const [categories, setCategories] = useState<string[]>(
    initialCategories.length > 0
      ? [...new Set([...serviceCategories, ...initialCategories])]
      : serviceCategories,
  );
  const [showAllMobileFilters, setShowAllMobileFilters] = useState(false);
  const [usingDemoData, setUsingDemoData] = useState(!hasInitialServices);

  useEffect(() => {
    const loadServices = async () => {
      try {
        const data = await cachedApiGet<any>('/services?limit=100', undefined, 60_000);
        const apiServices = Array.isArray(data?.services) ? data.services : [];
        const apiCategories = Array.isArray(data?.categories) ? data.categories : [];

        if (apiServices.length > 0) {
          setServices(
            apiServices.map((service: ServiceItem) => ({
              ...service,
              isDemo: false,
            })),
          );
          setUsingDemoData(false);
          const normalizedApiCategories = apiCategories.filter(
            (item: unknown): item is string => typeof item === 'string' && item.trim().length > 0,
          );
          const derivedCategories = [...new Set(apiServices.map((item: ServiceItem) => item.category))];
          const nextCategories = [
            ...serviceCategories,
            ...(normalizedApiCategories.length > 0 ? normalizedApiCategories : derivedCategories),
          ];
          setCategories([...new Set(nextCategories)]);
        }
      } catch (error) {
        // Keep fallback static services when API is unavailable
      }
    };

    loadServices();
  }, []);

  const filteredServices = useMemo(() => {
    const query = search.trim().toLowerCase();

    return services.filter((item) => {
      if (
        activeCategory !== 'All Services' &&
        item.category !== activeCategory
      ) {
        return false;
      }
      if (!query) return true;

      return [
        item.title,
        item.titleSo || '',
        item.description,
        item.descriptionSo || '',
        item.provider,
        item.providerSo || '',
        item.category,
        item.categorySo || '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [activeCategory, search, services]);

  const mobileCategories = showAllMobileFilters ? categories : categories.slice(0, 4);
  const hasMoreMobileFilters = categories.length > mobileCategories.length;

  return (
    <section className="pt-28 pb-16 px-4 sm:px-6 lg:px-8 bg-background min-h-screen transition-colors">
      <div className="max-w-[1320px] mx-auto">
        <div className="mb-8 max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">
            {isEn ? 'ZeilaLink Service Marketplace' : 'Suuqa Adeegyada ZeilaLink'}
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
            {isEn ? 'Professional Services' : 'Adeegyada Xirfadeed'}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-slate-600">
            {isEn
              ? 'Search trusted local and online services from providers serving Somali communities.'
              : 'Ka raadi adeegyo maxalli ah iyo kuwo online ah oo ay bixiyaan adeeg-bixiyeyaal u adeegaya bulshada Soomaaliyeed.'}
          </p>
        </div>

        {loadError && !usingDemoData && (
          <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950">
            {isEn
              ? 'The latest service updates could not be loaded.'
              : 'Cusboonaysiinta adeegyada ugu dambeysay lama soo dejin karin.'}
          </div>
        )}

        {usingDemoData && (
          <div
            role="status"
            className="mb-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold leading-relaxed text-amber-950"
          >
            {isEn
              ? 'Demo catalog — these example providers, prices, ratings, and reviews are illustrative. Booking is disabled.'
              : 'Buuggan waa tusaale — bixiyeyaasha, qiimayaasha, qiimeynta, iyo faallooyinka waa xog tijaabo ah. Dalabku waa xiran yahay.'}
          </div>
        )}

        <div className="relative mb-6 max-w-2xl">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={20}
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={
              isEn
                ? 'Search services in English or Somali'
                : 'Ku raadi adeegyada Af-Soomaali ama Ingiriisi'
            }
            aria-label={isEn ? 'Search services' : 'Raadi adeegyada'}
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm text-slate-900 shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </div>

        <div className="mb-6 space-y-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:hidden">
            {mobileCategories.map((category) => {
              const active = category === activeCategory;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                    active ? 'bg-[#2d7df6] text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {category}
                </button>
              );
            })}
            {(hasMoreMobileFilters || showAllMobileFilters) && (
              <button
                type="button"
                onClick={() => setShowAllMobileFilters((prev) => !prev)}
                className="inline-flex shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-[#2d7df6] transition hover:bg-slate-100"
              >
                {showAllMobileFilters ? (isEn ? 'Less' : 'Yaree') : (isEn ? 'More' : 'Dheeraad')}
                <ChevronDown className={`h-3.5 w-3.5 transition ${showAllMobileFilters ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>

          <div className="hidden flex-wrap items-center justify-between gap-4 md:flex">
            <div className="flex flex-wrap gap-2.5">
              {categories.map((category) => {
                const active = category === activeCategory;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setActiveCategory(category)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
                      active ? 'bg-[#2d7df6] text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-slate-500">
              {isEn ? 'Sort by:' : 'Kala sooc:'}{' '}
              <span className="font-semibold text-slate-700">{isEn ? 'Recommended' : 'La taliyay'}</span>
            </p>
          </div>

          <p className="text-xs text-slate-500 md:hidden">
            {isEn ? 'Sort by:' : 'Kala sooc:'}{' '}
            <span className="font-semibold text-slate-700">{isEn ? 'Recommended' : 'La taliyay'}</span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {filteredServices.map((item) => {
            const title = !isEn && item.titleSo?.trim() ? item.titleSo : item.title;
            const description =
              !isEn && item.descriptionSo?.trim()
                ? item.descriptionSo
                : item.description;
            const provider =
              !isEn && item.providerSo?.trim() ? item.providerSo : item.provider;

            return (
            <Link
              key={item.id}
              href={`/services/${item.slug || item.id}`}
              className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-300/40"
            >
              <div className="relative h-36 overflow-hidden">
                <img src={item.image} alt={`${title} service`} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/25 via-transparent to-transparent" />
                <span className="absolute top-2 left-2 px-2.5 py-1 rounded-full text-[9px] tracking-wide font-bold uppercase bg-white/95 text-[#2d7df6] border border-slate-200">
                  {item.isDemo || usingDemoData ? `Demo • ${item.badge}` : item.badge}
                </span>
              </div>

              <div className="p-3">
                <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-800" />
                  <span className="font-medium truncate">{provider}</span>
                </div>

                <div className="flex items-start justify-between gap-3 min-h-[70px]">
                  <div>
                    <h2 className="font-bold text-[14px] text-slate-900 leading-[1.2] mb-1">{title}</h2>
                    <p className="text-[11px] text-slate-500 leading-[1.3] max-h-8 overflow-hidden">{description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] uppercase font-bold text-slate-400">{isEn ? 'Starting' : 'Ka bilaabma'}</p>
                    <p className="text-[18px] font-black text-[#2d7df6] leading-none">{item.priceLabel}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-3">
                  <div className="flex items-center gap-1">
                    <Star size={12} className="text-yellow-500 fill-yellow-500" />
                    <span className="font-semibold text-slate-700">{item.rating.toFixed(1)}</span>
                    <span>({item.reviews})</span>
                  </div>
                </div>

                <div className="mt-3 block w-full text-center py-2 rounded-md bg-primary border border-primary/70 text-white text-[12px] font-semibold">
                  {item.isDemo || usingDemoData
                    ? (isEn ? 'Preview Demo' : 'Eeg Tusaalaha')
                    : (isEn ? 'View Details' : 'Faahfaahin Eeg')}
                </div>
              </div>
            </Link>
            );
          })}
        </div>

        {filteredServices.length === 0 && (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm font-medium text-slate-500">
            {isEn ? 'No services found in this category yet.' : 'Weli adeegyo lagama helin qaybtan.'}
          </div>
        )}
      </div>
    </section>
  );
}
