'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/translations';
import { cachedApiGet } from '@/lib/api-cache';
import {
  Search,
  Clock,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  Monitor,
  User as UserIcon,
  Star,
  Award,
  ArrowRight,
  DollarSign,
  Filter,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Training {
  id: string;
  name: string;
  description: string;
  duration: string;
  cost: number;
  imageUrl?: string | null;
  providesCertificate?: boolean;
  provider: {
    id: string;
    name: string;
    logoUrl?: string | null;
    description?: string | null;
    rating?: number | null;
    verified?: boolean | null;
  };
  skill?: {
    name: string;
  };
}

export default function TrainingsPage() {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    location: '',
    price: 'all', // 'all', 'free', 'paid'
    provider: '',
    format: '',
  });
  const [selectedProvider, setSelectedProvider] = useState<Training['provider'] | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const { language } = useLanguage();
  const getT = (key: string) => t(key, language);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 250);

    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchTrainings();
  }, [debouncedSearch]);

  const fetchTrainings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);

      const queryString = params.toString();
      const endpoint = queryString ? `/trainings?${queryString}` : '/trainings';
      const data = await cachedApiGet<{ trainings?: Training[] }>(endpoint, undefined, 30_000);
      const trainingsData: Training[] = data.trainings || [];

      // Deduplicate trainings by ID
      const uniqueTrainingsMap = new Map();
      trainingsData.forEach(t => uniqueTrainingsMap.set(t.id, t));
      const uniqueTrainings = Array.from(uniqueTrainingsMap.values());

      setTrainings(uniqueTrainings);
    } catch (error: any) {
      console.error('[TrainingsPage] Error fetching trainings:', error);
      console.error('[TrainingsPage] Error response:', error.response?.data);
      setTrainings([]);
      // Show error message to user if needed
      if (error.response?.status !== 401) {
        // Don't show error for auth issues as they're handled by interceptor
        console.error('Failed to load trainings:', error.response?.data?.error || error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 pt-28 pb-12">
        {/* Header */}
        <div className="mb-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 inline-flex items-center space-x-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-blue-600"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">
              {language === 'en' ? 'Professional Development' : 'Horumarinta Xirfadaha'}
            </span>
          </motion.div>
          <h1 className="text-5xl lg:text-6xl font-black text-slate-900 mb-4 tracking-tighter leading-tight">
            {language === 'en' ? (
              <>Skills & <span className="text-primary relative inline-block">Training <div className="absolute -bottom-2 left-0 w-full h-3 bg-primary/10 -z-10" /></span> Programs</>
            ) : (
              <>Barnaamijyada <span className="text-primary relative inline-block">Tababarka <div className="absolute -bottom-2 left-0 w-full h-3 bg-primary/10 -z-10" /></span></>
            )}
          </h1>
          <p className="text-slate-500 text-xl font-medium max-w-2xl leading-relaxed">
            {language === 'en' ? 'Find the right program to advance your career and develop industry-standard expertise.' : 'Raadi barnaamijka saxda ah si aad u horumariiso shaqadaada iyo xirfadaada.'}
          </p>
        </div>

        {/* Search Bar at Top */}
        <div className="mb-12">
          <div className="relative group max-w-3xl">
            <div className="absolute inset-0 bg-primary/5 rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={24} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={language === 'en' ? 'Search trainings by keyword, provider, or category...' : 'Raadi tababarka adigoo adeegsanaya kalimada...'}
                className="w-full bg-white border border-slate-100 rounded-[2rem] pl-16 pr-8 py-6 text-lg font-medium focus:outline-none focus:border-primary/30 transition-all shadow-sm group-hover:shadow-md"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Mobile Filter Toggle */}
          <div className="lg:hidden flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-4">
            <span className="font-black text-slate-900 uppercase tracking-widest text-xs">
              {trainings.length} {language === 'en' ? 'Programs Found' : 'Barnaamijyo la helay'}
            </span>
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest"
            >
              <Filter size={16} />
              {language === 'en' ? 'Filters' : 'Filter'}
            </button>
          </div>
          {/* Left Sidebar - Filters */}
          <div className={`${showMobileFilters ? 'block' : 'hidden'} lg:block lg:w-1/4 flex-shrink-0`}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-[2rem] border border-slate-100 p-8 sticky top-28 shadow-sm"
            >
              <h2 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <GraduationCap size={18} />
                </div>
                {language === 'en' ? 'Refine' : 'Shaandhee'}
              </h2>

              <div className="space-y-8">
                {/* Category */}
                <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-4">
                    {language === 'en' ? 'Category' : 'Qaybta'}
                  </h3>
                  <div className="space-y-3">
                    {['Technology', 'Healthcare', 'Trades', 'Business', 'Education'].map((cat) => (
                      <label key={cat} className="flex items-center group cursor-pointer">
                        <input
                          type="radio"
                          name="category"
                          checked={filters.category === cat}
                          onChange={() => setFilters({ ...filters, category: cat })}
                          className="w-4 h-4 text-primary border-slate-200 focus:ring-primary/20 transition-all cursor-pointer"
                        />
                        <span className="ml-3 text-[13px] font-bold text-slate-600 group-hover:text-primary transition-colors">{cat}</span>
                      </label>
                    ))}
                    <label className="flex items-center group cursor-pointer">
                      <input
                        type="radio"
                        name="category"
                        checked={filters.category === ''}
                        onChange={() => setFilters({ ...filters, category: '' })}
                        className="w-4 h-4 text-primary border-slate-200 focus:ring-primary/20 transition-all cursor-pointer"
                      />
                      <span className="ml-3 text-[13px] font-bold text-slate-600 group-hover:text-primary transition-colors">{language === 'en' ? 'All Categories' : 'Dhammaan'}</span>
                    </label>
                  </div>
                </div>

                {/* Price Filter */}
                <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-4">
                    {getT('cost')}
                  </h3>
                  <div className="space-y-3">
                    {[
                      { value: 'all', label: language === 'en' ? 'All Prices' : 'Dhammaan' },
                      { value: 'free', label: language === 'en' ? 'Free Course' : 'Bilaash' },
                      { value: 'paid', label: language === 'en' ? 'Paid Program' : 'Lacag leh' },
                    ].map((price) => (
                      <label key={price.value} className="flex items-center group cursor-pointer">
                        <input
                          type="radio"
                          name="price"
                          checked={filters.price === price.value}
                          onChange={() => setFilters({ ...filters, price: price.value })}
                          className="w-4 h-4 text-primary border-slate-200 focus:ring-primary/20 transition-all cursor-pointer"
                        />
                        <span className="ml-3 text-[13px] font-bold text-slate-600 group-hover:text-primary transition-colors">{price.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSearch('');
                    setFilters({ category: '', location: '', price: 'all', provider: '', format: '' });
                  }}
                  className="w-full py-3 px-4 rounded-xl border border-slate-100 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-primary hover:border-primary/20 hover:bg-primary/5 transition-all"
                >
                  {language === 'en' ? 'Reset Filters' : 'Nadiifi'}
                </button>
              </div>
            </motion.div>
          </div>

          {/* Main Content */}
          <div className="flex-grow">
            <div className="flex justify-end items-center mb-12">
              <select className="input-field text-sm">
                <option>{language === 'en' ? 'Sort by: Relevance' : 'U kala saar: La xiriira'}</option>
              </select>
            </div>

            {loading ? (
              <div className="text-center py-20">
                <p className="text-slate-400 font-black uppercase tracking-widest animate-pulse">{getT('loading')}</p>
              </div>
            ) : trainings.length === 0 ? (
              <div className="text-center py-32 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                <div className="w-20 h-20 bg-slate-100 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-slate-300">
                  <GraduationCap size={44} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">
                  {language === 'en' ? 'No Programs Available' : 'Barnaamijyo lama helin'}
                </h3>
                <p className="text-slate-500 font-medium">
                  {language === 'en'
                    ? 'Try adjusting your filters or check back later for new enrollments.'
                    : 'Isku day inaad bedesho filtarrada ama dib u soo noqo mar kale.'}
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6">
                {trainings.map((training, index) => (
                  <motion.div
                    key={training.id}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link href={`/trainings/${training.id}`} className="block group h-full">
                      <div className="bg-white rounded-[2rem] border border-slate-100 group-hover:border-primary/20 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 overflow-hidden relative flex flex-col h-full text-center p-6">
                        {/* Image/Icon */}
                        <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-50 p-2.5 mx-auto mb-4 group-hover:scale-110 transition-transform duration-500 overflow-hidden flex items-center justify-center">
                          {training.imageUrl ? (
                            <img src={training.imageUrl} alt={training.name} loading="lazy" decoding="async" className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            <div className="w-full h-full rounded-xl text-primary flex items-center justify-center">
                              <GraduationCap size={32} strokeWidth={2.5} />
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 flex flex-col">
                          <div className="mb-4">
                            <div className="flex items-center justify-center gap-1 cursor-pointer hover:text-primary mb-1 text-[10px] font-black uppercase tracking-widest text-primary/60" onClick={(e) => { e.preventDefault(); setSelectedProvider(training.provider); }}>
                              {training.provider.name}
                              <span className="mx-1 text-slate-300">•</span>
                              <Star size={10} className="text-amber-400 fill-amber-400" />
                              {training.provider.rating ? training.provider.rating.toFixed(1) : 'New'}
                            </div>
                            <h3 className="text-lg font-black text-slate-900 tracking-tight leading-tight group-hover:text-primary transition-colors line-clamp-2 min-h-[2.5rem]">
                              {training.name}
                            </h3>
                          </div>

                          <div className="flex justify-center gap-2 mb-4">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${training.cost === 0
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                              : 'bg-primary/5 text-primary border-primary/10'
                              }`}>
                              {training.cost === 0 ? 'Free' : `$${training.cost}`}
                            </span>
                            {training.providesCertificate && (
                              <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-amber-100">
                                Certified
                              </span>
                            )}
                          </div>

                          <div className="mt-auto pt-4 border-t border-slate-50 flex flex-col items-center gap-3">
                            <div className="flex items-center justify-center gap-3 w-full">
                              <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                <Clock size={12} className="text-primary/60" />
                                {training.duration}
                              </div>
                              {training.skill && (
                                <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                  <Award size={12} className="text-primary/60" />
                                  {training.skill.name}
                                </div>
                              )}
                            </div>

                            <div className="mt-2 bg-primary/5 text-primary px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] group-hover:bg-primary group-hover:text-white transition-all w-full flex items-center justify-center gap-2">
                              {language === 'en' ? 'Enroll Now' : 'Isqori Hadda'}
                              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform border-l border-current pl-2 ml-1" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedProvider && (
        <ProviderProfileModal
          provider={selectedProvider}
          onClose={() => setSelectedProvider(null)}
          language={language}
        />
      )}
    </div>
  );
}

function ProviderProfileModal({
  provider,
  onClose,
  language,
}: {
  provider: Training['provider'];
  onClose: () => void;
  language: string;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          ✕
        </button>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-white overflow-hidden flex items-center justify-center">
            {provider.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={provider.logoUrl}
                alt={`${provider.name} logo`}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-contain p-1"
              />
            ) : (
              <span className="text-primary text-xl font-semibold">
                {provider.name.charAt(0)}
              </span>
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-primary-darker">{provider.name}</h2>
            <div className="flex items-center gap-2 text-sm text-yellow-500">
              <Star className="w-4 h-4" fill="currentColor" />
              <span>
                {provider.rating && provider.rating > 0
                  ? provider.rating.toFixed(1)
                  : language === 'en'
                    ? 'No ratings yet'
                    : 'Qiimeyn lama hayo'}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-primary-darker/70 mb-1">
              {language === 'en' ? 'About this provider' : 'Ku saabsan bixiyaha'}
            </p>
            <p className="text-primary-darker/85 whitespace-pre-line">
              {provider.description
                ? provider.description
                : language === 'en'
                  ? 'No description provided yet.'
                  : 'Sharaxaad lama hayo.'}
            </p>
          </div>
          <div className="text-xs text-primary-darker/60">
            {language === 'en'
              ? 'Providers are verified by the admin team before their courses are published.'
              : 'Bixiyeyaasha waxaa hubiya maamulka ka hor inta koorsooyinkoodu la daabicin.'}
          </div>
        </div>
      </div>
    </div>
  );
}
