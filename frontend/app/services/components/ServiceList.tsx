'use client';

import { useEffect, useMemo, useState } from 'react';
import { Star } from 'lucide-react';
import Link from 'next/link';
import { cachedApiGet } from '@/lib/api-cache';
import { serviceCategories, services as fallbackServices } from '../data/services';
import type { ServiceItem } from '../data/services';

type ServiceListProps = {
  isEn: boolean;
};

export default function ServiceList({ isEn }: ServiceListProps) {
  const [activeCategory, setActiveCategory] = useState('All Services');
  const [services, setServices] = useState<ServiceItem[]>(fallbackServices);
  const [categories, setCategories] = useState<string[]>(serviceCategories);

  useEffect(() => {
    const loadServices = async () => {
      try {
        const data = await cachedApiGet<any>('/services', undefined, 60_000);
        const apiServices = Array.isArray(data?.services) ? data.services : [];
        const apiCategories = Array.isArray(data?.categories) ? data.categories : [];

        if (apiServices.length > 0) {
          setServices(apiServices);
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
    if (activeCategory === 'All Services') return services;
    return services.filter((item) => item.category === activeCategory);
  }, [activeCategory, services]);

  return (
    <section className="pt-28 pb-16 px-4 sm:px-6 lg:px-8 bg-background min-h-screen transition-colors">
      <div className="max-w-[1320px] mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {filteredServices.map((item) => (
            <Link
              key={item.id}
              href={`/services/${item.id}`}
              className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-300/40"
            >
              <div className="relative h-36 overflow-hidden">
                <img src={item.image} alt={item.title} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/25 via-transparent to-transparent" />
                <span className="absolute top-2 left-2 px-2.5 py-1 rounded-full text-[9px] tracking-wide font-bold uppercase bg-white/95 text-[#2d7df6] border border-slate-200">
                  {item.badge}
                </span>
              </div>

              <div className="p-3">
                <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-800" />
                  <span className="font-medium truncate">{item.provider}</span>
                </div>

                <div className="flex items-start justify-between gap-3 min-h-[70px]">
                  <div>
                    <h3 className="font-bold text-[14px] text-slate-900 leading-[1.2] mb-1">{item.title}</h3>
                    <p className="text-[11px] text-slate-500 leading-[1.3] max-h-8 overflow-hidden">{item.description}</p>
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
                  {isEn ? 'View Details' : 'Faahfaahin Eeg'}
                </div>
              </div>
            </Link>
          ))}
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
