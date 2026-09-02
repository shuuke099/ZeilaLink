'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Grid2X2, Heart, Search, Sparkles, Star, Wrench } from 'lucide-react';
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
    <section className="min-h-screen bg-[#fbfbfe] px-4 pb-16 pt-20 transition-colors sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <div className="relative mb-4 min-h-[150px] overflow-hidden rounded-xl border border-violet-100 bg-gradient-to-r from-white via-[#f8f7ff] to-[#eeeaff] px-5 py-7 sm:px-7">
          <div className="relative z-10 max-w-xl">
          <h1 className="text-[28px] font-extrabold tracking-[-0.035em] text-slate-950 sm:text-[32px]">
            {isEn ? 'Professional Services' : 'Adeegyada Xirfadeed'}
          </h1>
          <p className="mt-2 text-[12px] font-medium leading-5 text-slate-600">
            {isEn
              ? 'Search trusted local and online services from providers serving Somali communities.'
              : 'Ka raadi adeegyo maxalli ah iyo kuwo online ah oo ay bixiyaan adeeg-bixiyeyaal u adeegaya bulshada Soomaaliyeed.'}
          </p>
          <p className="mt-5 flex items-center gap-2 text-[10px] font-bold text-slate-700"><Wrench size={14} className="text-primary" /><span className="text-primary">{services.length}</span>{isEn ? 'services available' : 'adeeg ayaa diyaar ah'}</p>
          </div>
          <div aria-hidden="true" className="absolute bottom-2 right-8 hidden items-end gap-3 text-violet-300 md:flex"><Wrench size={60} strokeWidth={1.2}/><Sparkles size={95} strokeWidth={1}/><Grid2X2 size={70} strokeWidth={1}/></div>
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

        <div className="relative mb-3 w-full">
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
            className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-[11px] text-slate-900 shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
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
                  className={`flex h-10 shrink-0 items-center rounded-lg border px-4 text-[11px] font-semibold transition ${
                    active ? 'border-primary bg-primary/5 text-primary shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-primary/30 hover:text-primary'
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
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold text-primary transition hover:bg-slate-100"
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
                    className={`flex h-10 items-center rounded-lg border px-4 text-[11px] font-semibold transition ${
                      active ? 'border-primary bg-primary/5 text-primary shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-primary/30 hover:text-primary'
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

        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_210px]">
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
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
              className="group flex h-[230px] min-w-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,.05)] transition hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:h-[250px]"
            >
              <div className="relative h-[105px] shrink-0 overflow-hidden bg-slate-100 sm:h-[120px]">
                <img src={item.image} alt={`${title} service`} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/25 via-transparent to-transparent" />
                <span className="absolute left-2 top-2 rounded bg-primary px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wide text-white sm:text-[8px]">
                  {item.isDemo || usingDemoData ? `Demo • ${item.badge}` : item.badge}
                </span><Heart size={16} className="absolute right-2 top-2 text-white drop-shadow" />
              </div>

              <div className="flex min-h-0 flex-1 flex-col p-2.5 sm:p-3">
                <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-800" />
                  <span className="font-medium truncate">{provider}</span>
                </div>

                <div className="min-h-0 min-w-0">
                  <h2 className="line-clamp-2 text-[11px] font-extrabold leading-[1.2] text-slate-900 sm:text-[13px]">{title}</h2>
                  <p className="mt-1 line-clamp-2 text-[8px] leading-3 text-slate-500 sm:text-[9px] sm:leading-4">{description}</p>
                </div>

                <div className="mt-auto flex min-w-0 items-end justify-between gap-2 pt-2 text-[11px] text-slate-500">
                  <div className="flex items-center gap-1">
                    <Star size={12} className="text-yellow-500 fill-yellow-500" />
                    <span className="font-semibold text-slate-700">{item.rating.toFixed(1)}</span>
                    <span>({item.reviews})</span>
                  </div>
                  <div className="min-w-0 text-right">
                    <p className="text-[7px] font-bold uppercase leading-none text-slate-400">{isEn ? 'From' : 'Laga bilaabo'}</p>
                    <p className="mt-0.5 truncate text-[11px] font-extrabold leading-tight text-primary sm:text-[12px]">{item.priceLabel}</p>
                  </div>
                </div>

              </div>
            </Link>
            );
          })}
        </div>
        <aside className="hidden space-y-3 lg:block">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,.04)]">
            <h3 className="flex items-center gap-2 text-[12px] font-extrabold"><Grid2X2 size={14} className="text-primary" />{isEn ? 'Categories' : 'Qaybaha'}</h3>
            <div className="mt-3 space-y-1">{categories.map((category) => { const count = category === 'All Services' ? services.length : services.filter((service) => service.category === category).length; return <button key={category} onClick={() => setActiveCategory(category)} className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[9px] ${activeCategory === category ? 'bg-primary/10 font-bold text-primary' : 'font-medium text-slate-600 hover:bg-slate-50'}`}><span className="truncate">{category}</span><span>{count}</span></button>; })}</div>
          </div>
          <div className="rounded-xl border border-violet-100 bg-gradient-to-b from-violet-50 to-white p-4 text-center"><Sparkles className="mx-auto text-primary" size={20}/><h3 className="mt-2 text-[12px] font-extrabold">{isEn ? 'Offer a Service' : 'Bixi Adeeg'}</h3><p className="mt-1 text-[9px] leading-4 text-slate-500">{isEn ? 'Reach customers looking for trusted local professionals.' : 'Gaadh macaamiisha raadinaya xirfadlayaal.'}</p><Link href="/register" className="mt-3 flex h-9 items-center justify-center rounded-lg bg-primary text-[9px] font-bold text-white">{isEn ? 'Get Started' : 'Bilow'}</Link></div>
        </aside>
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
