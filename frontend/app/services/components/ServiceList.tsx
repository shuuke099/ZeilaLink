'use client';

import { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, Grid2X2, List, MapPin, Navigation, Phone, Search, Sparkles, Star, Wrench } from 'lucide-react';
import Link from 'next/link';
import ScrollableSelect from '@/components/ScrollableSelect';
import { cachedApiGet } from '@/lib/api-cache';
import { serviceCategories, services as fallbackServices } from '../data/services';
import type { ServiceItem } from '../data/services';

type ServiceListProps = {
  isEn: boolean;
  initialServices?: ServiceItem[];
  initialCategories?: string[];
  loadError?: boolean;
};

type ViewMode = 'grid' | 'list';

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
  const [usingDemoData, setUsingDemoData] = useState(!hasInitialServices);
  const [view, setView] = useState<ViewMode>('grid');
  const [sort, setSort] = useState('recommended');

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

    const matches = services.filter((item) => {
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

    return matches.sort((a, b) => {
      if (sort === 'rating') return b.rating - a.rating;
      if (sort === 'reviews') return b.reviews - a.reviews;
      if (sort === 'name') return a.title.localeCompare(b.title);
      return 0;
    });
  }, [activeCategory, search, services, sort]);


  const categoryLabel = (category: string) => {
    if (isEn) return category;

    const labels: Record<string, string> = {
      'All Services': 'Dhammaan Adeegyada',
      Cleaning: 'Nadaafad',
      'IT & Tech': 'IT iyo Tiknoolajiyad',
      Construction: 'Dhisme',
      Marketing: 'Suuq-geyn',
      'Cleaning & Maintenance': 'Nadaafad iyo Dayactir',
      'Electronic & Mechanical Repair': 'Dayactirka Elektarooniga iyo Makaanikada',
      'Design & Coding': 'Naqshadeyn iyo Koodh',
      Other: 'Kale',
    };

    return labels[category] || category;
  };

  return (
    <section className="min-h-screen bg-background-muted px-4 pb-16 pt-20 text-foreground transition-colors dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <div className="relative mb-4 min-h-[150px] overflow-hidden rounded-xl border border-border bg-gradient-to-r from-surface via-violet-50 to-violet-100 px-5 py-7 dark:border-slate-800 dark:from-slate-900 dark:via-violet-950/40 dark:to-slate-950 sm:px-7">
          <div className="relative z-10 max-w-xl">
          <h1 className="text-[28px] font-extrabold tracking-[-0.035em] text-heading dark:text-white sm:text-[32px]">
            {isEn ? 'Professional Services' : 'Adeegyada Xirfadeed'}
          </h1>
          <p className="mt-2 text-[12px] font-medium leading-5 text-muted dark:text-slate-300">
            {isEn
              ? 'Search trusted local and online services from providers serving Somali communities.'
              : 'Ka raadi adeegyo maxalli ah iyo kuwo online ah oo ay bixiyaan adeeg-bixiyeyaal u adeegaya bulshada Soomaaliyeed.'}
          </p>
          <p className="mt-5 flex items-center gap-2 text-[10px] font-bold text-foreground dark:text-slate-200"><Wrench size={14} className="text-primary" /><span className="text-primary">{services.length}</span>{isEn ? 'services available' : 'adeeg ayaa diyaar ah'}</p>
          </div>
          <div aria-hidden="true" className="absolute bottom-2 right-8 hidden items-end gap-3 text-violet-300 md:flex"><Wrench size={60} strokeWidth={1.2}/><Sparkles size={95} strokeWidth={1}/><Grid2X2 size={70} strokeWidth={1}/></div>
        </div>

        {loadError && !usingDemoData && (
          <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-100">
            {isEn
              ? 'The latest service updates could not be loaded.'
              : 'Cusboonaysiinta adeegyada ugu dambeysay lama soo dejin karin.'}
          </div>
        )}

        {usingDemoData && (
          <div
            role="status"
            className="mb-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold leading-relaxed text-amber-950 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-100"
          >
            {isEn
              ? 'Demo catalog — these example providers, prices, ratings, and reviews are illustrative. Booking is disabled.'
              : 'Buuggan waa tusaale — bixiyeyaasha, qiimayaasha, qiimeynta, iyo faallooyinka waa xog tijaabo ah. Dalabku waa xiran yahay.'}
          </div>
        )}

        <div className="mb-3 grid gap-3 lg:grid-cols-[minmax(220px,1fr)_auto] lg:items-center">
        <div className="relative w-full">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted dark:text-slate-400"
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
            className="h-10 w-full rounded-lg border border-border bg-surface pl-10 pr-3 text-[11px] text-heading shadow-sm outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
          />
        </div>

        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <div className="grid w-full grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-2 sm:w-auto sm:max-w-xl">
            <ScrollableSelect value={activeCategory} onChange={setActiveCategory} label={isEn ? "Category" : "Qaybta"} options={categories.map((category) => ({ value: category, label: categoryLabel(category) }))} />
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              aria-label={isEn ? 'Sort services' : 'Kala sooc adeegyada'}
              className="h-10 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2 text-[10px] font-semibold text-slate-600 outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 sm:flex-none sm:px-3 sm:text-[11px]"
            >
              <option value="recommended">{isEn ? 'Sort: Recommended' : 'Kala sooc: La taliyay'}</option>
              <option value="rating">{isEn ? 'Highest rated' : 'Qiimeynta ugu sarreysa'}</option>
              <option value="reviews">{isEn ? 'Most reviewed' : 'Faallooyinka ugu badan'}</option>
              <option value="name">{isEn ? 'Name: A-Z' : 'Magaca: A-Z'}</option>
            </select>
            <div className="flex overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
              <button type="button" onClick={() => setView('grid')} aria-label={isEn ? 'Grid view' : 'Muuqaal shabaq'} className={`grid h-10 w-10 place-items-center transition ${view === 'grid' ? 'bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300' : 'text-slate-400 hover:text-violet-600 dark:text-slate-500 dark:hover:text-violet-300'}`}><Grid2X2 size={15} /></button>
              <button type="button" onClick={() => setView('list')} aria-label={isEn ? 'List view' : 'Muuqaal liis'} className={`grid h-10 w-10 place-items-center border-l border-slate-200 transition dark:border-slate-700 ${view === 'list' ? 'bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300' : 'text-slate-400 hover:text-violet-600 dark:text-slate-500 dark:hover:text-violet-300'}`}><List size={16} /></button>
            </div>
          </div>
        </div>

        </div>

        <div className="grid items-start gap-4 xl:grid-cols-[220px_minmax(0,1fr)]">
        <div className={`order-2 min-w-0 ${view === 'grid' ? 'grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5' : 'grid gap-3'}`}>
          {filteredServices.map((item) => {
            // Titles and provider names are canonical listing data. The selected
            // language changes descriptive and interface copy only.
            const title = item.title;
            const description =
              !isEn && item.descriptionSo?.trim()
                ? item.descriptionSo
                : item.description;
            const provider = item.provider;
            const phone = item.phone || item.business?.phone;
            const directionsQuery = [
              item.address,
              item.city,
              item.state,
              item.postalCode,
              item.country,
            ]
              .filter(Boolean)
              .join(', ') || item.serviceArea?.filter(Boolean).join(', ')
              || [item.business?.city, item.business?.state].filter(Boolean).join(', ');
            const location = [item.city, item.state]
              .filter(Boolean)
              .join(', ') || item.serviceArea?.[0]
              || [item.business?.city, item.business?.state].filter(Boolean).join(', ');
            const servicePath = `/services/${item.slug || item.id}`;

            if (view === 'list') {
              return (
                <article
                  key={item.id}
                  className="group relative grid min-h-[225px] min-w-0 grid-cols-[138px_minmax(0,1fr)] overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_4px_16px_rgba(15,23,42,.07)] transition duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_8px_24px_rgba(0,0,0,.35)] sm:grid-cols-[245px_minmax(0,1fr)]"
                >
                  <Link href={servicePath} aria-label={`${isEn ? 'View' : 'Eeg'} ${title}`} className="absolute inset-0 z-10 rounded-[inherit] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"><span className="sr-only">{isEn ? 'View' : 'Eeg'} {title}</span></Link>
                  <div className="relative min-h-[225px] overflow-hidden border-r border-border bg-surface-muted dark:bg-slate-800">
                    <img src={item.image} alt={`${title} service`} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/30 via-transparent to-transparent" />
                    {item.badge && <span className="absolute left-2 top-2 max-w-[96px] truncate rounded-md bg-violet-700 px-1.5 py-1 text-[7px] font-extrabold uppercase tracking-wide text-white shadow-sm sm:left-3 sm:top-3 sm:max-w-none sm:px-2 sm:text-[9px]">{!isEn && item.categorySo?.trim() ? item.categorySo : item.badge}</span>}
                  </div>

                  <div className="flex min-w-0 flex-col p-2.5 sm:p-5">
                    <div className="flex flex-wrap items-center gap-1.5 text-[8px] font-bold sm:gap-2 sm:text-[10px]">
                      <span className="rounded-md border border-primary/25 bg-primary/10 px-2 py-1 text-primary">{categoryLabel(item.category)}</span>
                      <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-1 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">● {isEn ? 'Available' : 'La heli karo'}</span>
                    </div>

                    <h2 className="mt-2 line-clamp-2 text-[13px] font-extrabold leading-tight tracking-[-0.02em] text-heading transition-colors group-hover:text-primary dark:text-white sm:line-clamp-1 sm:text-[19px]">{title}</h2>
                    <p className="mt-1 truncate text-[10px] font-bold text-primary sm:text-[12px]">{provider}</p>
                    <p className="mt-1.5 line-clamp-2 text-[9px] font-medium leading-4 text-slate-600 dark:text-slate-300 sm:mt-2 sm:text-[12px] sm:leading-5">{description}</p>

                    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[9px] font-semibold text-foreground dark:text-slate-200 sm:mt-3 sm:gap-x-4 sm:gap-y-2 sm:text-[11px]">
                      <span className="inline-flex items-center gap-1"><Star size={13} className="fill-amber-400 text-amber-500" />{item.rating.toFixed(1)} <span className="font-normal text-muted dark:text-slate-400">({item.reviews} {isEn ? 'reviews' : 'faallo'})</span></span>
                      {location && <span className="inline-flex min-w-0 items-center gap-1 text-muted dark:text-slate-400"><MapPin size={13} className="shrink-0 text-primary" /><span className="truncate">{location}</span></span>}
                      {item.business?.verified && <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400"><BadgeCheck size={13} />{isEn ? 'Verified provider' : 'Bixiye la xaqiijiyey'}</span>}
                    </div>

                    <div className="relative z-20 mt-auto grid grid-cols-2 gap-1.5 border-t border-border pt-2 text-[9px] font-bold sm:flex sm:flex-wrap sm:items-center sm:gap-2 sm:pt-3 sm:text-[11px]">
                      {phone ? <a href={`tel:${phone}`} className="inline-flex h-8 min-w-0 items-center justify-center gap-1 rounded-lg border border-border bg-surface-muted px-1 text-foreground transition hover:border-primary/50 hover:text-primary dark:text-slate-200 sm:h-9 sm:min-w-[88px] sm:gap-1.5 sm:px-3"><Phone size={12} />{isEn ? 'Call' : 'Wac'}</a> : <span className="inline-flex h-8 min-w-0 items-center justify-center gap-1 rounded-lg border border-border bg-surface-muted px-1 text-muted/50 sm:h-9 sm:min-w-[88px] sm:gap-1.5 sm:px-3"><Phone size={12} />{isEn ? 'Call' : 'Wac'}</span>}
                      {directionsQuery ? <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(directionsQuery)}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 min-w-0 items-center justify-center gap-1 rounded-lg border border-primary/40 bg-primary/10 px-1 text-primary transition hover:border-primary hover:bg-primary hover:text-white sm:h-9 sm:min-w-[105px] sm:gap-1.5 sm:px-3"><Navigation size={12} />{isEn ? 'Directions' : 'Tilmaamaha'}</a> : <span className="inline-flex h-8 min-w-0 items-center justify-center gap-1 rounded-lg border border-border bg-surface-muted px-1 text-muted/50 sm:h-9 sm:min-w-[105px] sm:gap-1.5 sm:px-3"><Navigation size={12} />{isEn ? 'Directions' : 'Tilmaamaha'}</span>}
                    </div>
                  </div>
                </article>
              );
            }

            return (
            <article
              key={item.id}
              className="group relative flex min-h-[330px] min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_4px_16px_rgba(15,23,42,.07)] transition duration-200 hover:-translate-y-1 hover:border-primary/35 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_8px_24px_rgba(0,0,0,.35)] sm:min-h-[355px]"
            >
              <Link
                href={servicePath}
                aria-label={`${isEn ? 'View' : 'Eeg'} ${title}`}
                className="absolute inset-0 z-10 rounded-[inherit] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <span className="sr-only">{isEn ? 'View' : 'Eeg'} {title}</span>
              </Link>
              <div className="relative h-[135px] shrink-0 overflow-hidden bg-surface-muted dark:bg-slate-800 sm:h-[155px]">
                <img src={item.image} alt={`${title} service`} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/25 via-transparent to-transparent" />

              </div>

              <div className="flex min-h-0 flex-1 flex-col p-3 sm:p-4">
                <div className="min-h-0 min-w-0">
                  <h2 className="line-clamp-2 text-[13px] font-extrabold leading-[1.25] tracking-[-0.015em] text-heading dark:text-white sm:text-[15px] xl:text-[16px]">{title}</h2>
                  <p className="mt-1.5 truncate text-[10px] font-bold leading-4 text-primary sm:text-[11px]">{provider}</p>
                  <p className="mt-2.5 line-clamp-3 text-[11px] font-medium leading-[1.55] text-slate-600 dark:text-slate-300 sm:text-[12px]">{description}</p>
                </div>

                <div className="relative z-20 mt-auto grid grid-cols-2 gap-2 border-t border-border pt-3 text-[10px] font-bold sm:text-[11px]">
                  {phone ? (
                    <a href={`tel:${phone}`} className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 text-primary transition hover:border-primary hover:bg-primary hover:text-white">
                      <Phone size={13} />{isEn ? 'Call' : 'Wac'}
                    </a>
                  ) : (
                    <span className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface-muted text-muted/50">
                      <Phone size={13} />{isEn ? 'Call' : 'Wac'}
                    </span>
                  )}
                  {directionsQuery ? (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(directionsQuery)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface-muted text-foreground transition hover:border-primary/50 hover:text-primary dark:text-slate-200"
                    >
                      <Navigation size={13} />{isEn ? 'Directions' : 'Tilmaamaha'}
                    </a>
                  ) : (
                    <span className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface-muted text-muted/50">
                      <Navigation size={13} />{isEn ? 'Directions' : 'Tilmaamaha'}
                    </span>
                  )}
                </div>

              </div>
            </article>
            );
          })}
        </div>
        <aside className="order-1 hidden space-y-3 xl:block">
          <div className="rounded-xl border border-border bg-surface p-4 shadow-[0_2px_8px_rgba(15,23,42,.04)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_2px_12px_rgba(0,0,0,.3)]">
            <h3 className="flex items-center gap-2 text-[12px] font-extrabold text-heading dark:text-white"><Grid2X2 size={14} className="text-primary" />{isEn ? 'Categories' : 'Qaybaha'}</h3>
            <div className="mt-3 space-y-1">{categories.map((category) => { const count = category === 'All Services' ? services.length : services.filter((service) => service.category === category).length; return <button key={category} onClick={() => setActiveCategory(category)} className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[9px] ${activeCategory === category ? 'bg-primary/10 font-bold text-primary dark:bg-primary/20' : 'font-medium text-muted hover:bg-surface-muted dark:text-slate-300 dark:hover:bg-slate-800'}`}><span className="truncate">{categoryLabel(category)}</span><span>{count}</span></button>; })}</div>
          </div>
          <div className="rounded-xl border border-violet-100 bg-gradient-to-b from-violet-50 to-surface p-4 text-center dark:border-violet-900/60 dark:from-violet-950/50 dark:to-slate-900"><Sparkles className="mx-auto text-primary" size={20}/><h3 className="mt-2 text-[12px] font-extrabold text-heading dark:text-white">{isEn ? 'Offer a Service' : 'Bixi Adeeg'}</h3><p className="mt-1 text-[9px] leading-4 text-muted dark:text-slate-400">{isEn ? 'Reach customers looking for trusted local professionals.' : 'Gaadh macaamiisha raadinaya xirfadlayaal.'}</p><Link href="/register" className="mt-3 flex h-9 items-center justify-center rounded-lg bg-primary text-[9px] font-bold text-white">{isEn ? 'Get Started' : 'Bilow'}</Link></div>
        </aside>
        </div>

        {filteredServices.length === 0 && (
          <div className="rounded-lg border border-border bg-surface p-8 text-center text-sm font-medium text-muted dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            {isEn ? 'No services found in this category yet.' : 'Weli adeegyo lagama helin qaybtan.'}
          </div>
        )}
      </div>
    </section>
  );
}
