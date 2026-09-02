'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useLanguage } from '@/contexts/LanguageContext';
import { cachedApiGet } from '@/lib/api-cache';
import { BookOpen, Briefcase, CalendarDays, ChevronDown, ChevronUp, Clock3, Grid2X2, Heart, Languages, Laptop, List, MapPin, MoreHorizontal, Palette, Search, SlidersHorizontal, Stethoscope, Wrench, X } from 'lucide-react';

export interface Training {
  id: string; slug?: string | null; name: string; nameSo?: string | null;
  description: string; descriptionSo?: string | null; duration: string; durationSo?: string | null;
  cost: number; currency?: string; imageUrl?: string | null; providesCertificate?: boolean;
  featured?: boolean; category?: string | null; level?: string | null; deliveryMode?: string | null;
  city?: string | null; state?: string | null; startDate?: string | null; endDate?: string | null;
  schedule?: string | null; scheduleSo?: string | null;
  provider: { id: string; slug?: string | null; name: string; nameSo?: string | null; logoUrl?: string | null; description?: string | null; descriptionSo?: string | null; rating?: number | null; verified?: boolean | null };
  skills?: Array<{ id?: string; name: string }>;
}

type Props = { initialTrainings: Training[]; loadError?: boolean };
type ViewMode = 'grid' | 'list';

const categories = [
  { value: '', label: 'All', icon: Grid2X2 }, { value: 'Technology', label: 'Technology', icon: Laptop },
  { value: 'Business', label: 'Business', icon: Briefcase }, { value: 'Health', label: 'Health', icon: Stethoscope },
  { value: 'Trades', label: 'Trades', icon: Wrench }, { value: 'Languages', label: 'Languages', icon: Languages },
  { value: 'Arts', label: 'Arts', icon: Palette },
];
const dateOptions = [['any', 'Any time'], ['week', 'This week'], ['month', 'This month'], ['three', 'Next 3 months'], ['six', 'Next 6 months']];
const fieldClass = 'h-10 min-w-0 rounded-lg border border-slate-200 bg-white text-[10px] font-medium text-slate-700 shadow-sm outline-none transition hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-violet-600 dark:focus:border-violet-500 dark:focus:ring-violet-500/20 sm:h-11 sm:text-[12px]';

export default function TrainingsClient({ initialTrainings, loadError = false }: Props) {
  const [trainings, setTrainings] = useState(initialTrainings);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState('all');
  const [date, setDate] = useState('any');
  const [delivery, setDelivery] = useState('all');
  const [sort, setSort] = useState('upcoming');
  const [view, setView] = useState<ViewMode>('grid');
  const [mobileFilters, setMobileFilters] = useState(false);
  const skippedInitialFetch = useRef(false);
  const { language } = useLanguage();

  useEffect(() => { const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 250); return () => window.clearTimeout(timer); }, [search]);
  useEffect(() => {
    if (!skippedInitialFetch.current && !debouncedSearch) { skippedInitialFetch.current = true; return; }
    const fetchTrainings = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({ limit: '100' });
        if (debouncedSearch) params.set('search', debouncedSearch);
        const data = await cachedApiGet<{ courses?: Training[] }>(`/courses?${params}`, undefined, 30_000);
        setTrainings(Array.from(new Map((data.courses || []).map((item) => [item.id, item])).values()));
      } catch { setTrainings([]); } finally { setLoading(false); }
    };
    void fetchTrainings();
  }, [debouncedSearch]);

  const locations = useMemo(() => Array.from(new Set(trainings.map((item) => [item.city, item.state].filter(Boolean).join(', ')).filter(Boolean))).sort(), [trainings]);
  const visibleTrainings = useMemo(() => {
    const now = Date.now();
    const dateLimit = date === 'week' ? 7 : date === 'month' ? 31 : date === 'three' ? 90 : date === 'six' ? 180 : 0;
    return trainings.filter((item) => {
      const itemCategory = `${item.category || ''} ${(item.skills || []).map((skill) => skill.name).join(' ')}`.toLowerCase();
      const itemLocation = [item.city, item.state].filter(Boolean).join(', ');
      if (category && !itemCategory.includes(category.toLowerCase())) return false;
      if (location && itemLocation !== location) return false;
      if (price === 'free' && item.cost !== 0) return false;
      if (price === 'under100' && (item.cost <= 0 || item.cost >= 100)) return false;
      if (price === '100to500' && (item.cost < 100 || item.cost > 500)) return false;
      if (price === 'over500' && item.cost <= 500) return false;
      if (delivery !== 'all' && item.deliveryMode !== delivery) return false;
      if (dateLimit && item.startDate) { const distance = new Date(item.startDate).getTime() - now; if (distance < 0 || distance > dateLimit * 86400000) return false; }
      return true;
    }).sort((a, b) => {
      if (sort === 'price-low') return a.cost - b.cost;
      if (sort === 'price-high') return b.cost - a.cost;
      if (sort === 'name') return a.name.localeCompare(b.name);
      return new Date(a.startDate || 8640000000000000).getTime() - new Date(b.startDate || 8640000000000000).getTime();
    });
  }, [category, date, delivery, location, price, sort, trainings]);

  const resetFilters = () => { setCategory(''); setLocation(''); setPrice('all'); setDate('any'); setDelivery('all'); setSearch(''); };
  const activeFilterCount = [category, location, price !== 'all' ? price : '', date !== 'any' ? date : '', delivery !== 'all' ? delivery : ''].filter(Boolean).length;

  return <div className="min-h-screen bg-[#fbfbfe] text-slate-900 dark:bg-slate-950 dark:text-slate-100"><Navbar /><main className="pb-16 pt-16">
    <section className="relative overflow-hidden border-b border-violet-100 bg-gradient-to-r from-white via-[#fbfaff] to-[#f4f0ff] dark:border-slate-800 dark:from-slate-950 dark:via-slate-950 dark:to-violet-950/60">
      <div className="mx-auto flex min-h-[150px] max-w-[1440px] items-center justify-between gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <div><h1 className="text-[28px] font-extrabold tracking-[-0.035em] text-slate-950 dark:text-white sm:text-[32px]">{language === 'en' ? 'Courses & Training' : 'Koorsooyin & Tababar'}</h1><p className="mt-2 max-w-xl text-[13px] font-medium leading-5 text-slate-600 dark:text-slate-300">{language === 'en' ? 'Discover local courses and training opportunities from trusted providers.' : 'Ka hel koorsooyin iyo fursado tababar bixiyeyaasha lagu kalsoon yahay.'}</p></div>
        <div aria-hidden="true" className="relative hidden h-24 w-44 shrink-0 sm:block"><div className="absolute bottom-2 right-4 h-7 w-28 rounded-lg bg-emerald-500 shadow-md" /><div className="absolute bottom-8 right-1 h-7 w-32 -rotate-2 rounded-lg bg-violet-500 shadow-md" /><div className="absolute bottom-[54px] right-6 h-5 w-24 rotate-2 rounded-md bg-white shadow-md dark:bg-slate-200" /><div className="absolute right-11 top-0 h-0 w-0 border-x-[43px] border-b-[18px] border-x-transparent border-b-slate-800 dark:border-b-slate-200" /><div className="absolute right-[60px] top-3 h-5 w-12 bg-slate-900 [clip-path:polygon(0_0,100%_0,82%_100%,16%_100%)] dark:bg-slate-300" /><div className="absolute bottom-1 left-3 text-emerald-600 dark:text-emerald-400"><BookOpen size={31} strokeWidth={2.4} /></div></div>
      </div>
    </section>
    <div className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 lg:px-8">
      {loadError && <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-900 dark:border-amber-800/70 dark:bg-amber-950/40 dark:text-amber-200">Training programs are temporarily unavailable. Please try again shortly.</div>}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5 md:grid-cols-[minmax(260px,1fr)_160px_160px_145px_auto]">
        <label className="relative col-span-4 block min-w-0 md:col-span-1"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={language === 'en' ? 'Search courses or programs...' : 'Raadi koorsooyin...'} className={`${fieldClass} w-full pl-10 pr-9 placeholder:text-slate-400 dark:placeholder:text-slate-500`} />{search && <button onClick={() => setSearch('')} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200"><X size={15} /></button>}</label>
        <Select value={category} onChange={setCategory} label="Category" options={categories.slice(1).map((item) => [item.value, item.label])} />
        <Select value={location} onChange={setLocation} label="Location" options={locations.map((item) => [item, item])} />
        <Select value={date === 'any' ? '' : date} onChange={(value) => setDate(value || 'any')} label="Date" options={dateOptions.slice(1)} />
        <button onClick={() => setMobileFilters(!mobileFilters)} className={`${fieldClass} flex w-full items-center justify-center gap-1 px-1 text-primary lg:pointer-events-none sm:gap-2 sm:px-4`}><SlidersHorizontal size={13} /> <span className="truncate">Filters</span>{activeFilterCount > 0 && <span className="rounded-full bg-primary px-1.5 py-0.5 text-[8px] text-white">{activeFilterCount}</span>}</button>
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">{categories.map(({ value, label, icon: Icon }) => <button key={label} onClick={() => setCategory(value)} className={`flex h-10 shrink-0 items-center gap-2 rounded-lg border px-4 text-[11px] font-semibold transition ${category === value ? 'border-violet-500 bg-violet-50 text-violet-700 shadow-sm dark:border-violet-500 dark:bg-violet-950/60 dark:text-violet-300' : 'border-slate-200 bg-white text-slate-600 hover:border-violet-200 hover:text-violet-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-violet-700 dark:hover:text-violet-300'}`}><Icon size={14} /> {label}</button>)}<button className="flex h-10 shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-[11px] font-semibold text-slate-600 transition hover:border-violet-200 hover:text-violet-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-violet-700 dark:hover:text-violet-300"><MoreHorizontal size={15} /> More</button></div>
      <div className="mt-5 flex items-center justify-between"><p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{loading ? 'Loading programs…' : `${visibleTrainings.length} ${visibleTrainings.length === 1 ? 'opportunity' : 'opportunities'} found`}</p><div className="flex items-center gap-2"><select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort courses" className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-600 outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"><option value="upcoming">Sort by: Upcoming</option><option value="price-low">Price: Low to high</option><option value="price-high">Price: High to low</option><option value="name">Name: A–Z</option></select><div className="flex overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"><button onClick={() => setView('grid')} aria-label="Grid view" className={`grid h-9 w-9 place-items-center transition ${view === 'grid' ? 'bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300' : 'text-slate-400 hover:text-violet-600 dark:text-slate-500 dark:hover:text-violet-300'}`}><Grid2X2 size={15} /></button><button onClick={() => setView('list')} aria-label="List view" className={`grid h-9 w-9 place-items-center border-l border-slate-200 transition dark:border-slate-700 ${view === 'list' ? 'bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300' : 'text-slate-400 hover:text-violet-600 dark:text-slate-500 dark:hover:text-violet-300'}`}><List size={16} /></button></div></div></div>
      <div className="mt-3 grid items-start gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className={`${mobileFilters ? 'block' : 'hidden'} space-y-3 lg:block`}><FilterSection title="Category"><RadioList name="sidebar-category" value={category} onChange={setCategory} options={[['', 'All Categories'], ...categories.slice(1).map((item) => [item.value, item.label])]} /></FilterSection><FilterSection title="Date"><RadioList name="date" value={date} onChange={setDate} options={dateOptions} /></FilterSection><FilterSection title="Location"><RadioList name="location" value={location} onChange={setLocation} options={[['', 'All Locations'], ...locations.slice(0, 5).map((item) => [item, item])]} /></FilterSection><FilterSection title="Format"><RadioList name="delivery" value={delivery} onChange={setDelivery} options={[['all', 'Any format'], ['in_person', 'In person'], ['online', 'Online'], ['hybrid', 'Hybrid']]} /></FilterSection><FilterSection title="Price"><RadioList name="price" value={price} onChange={setPrice} options={[['all', 'Any price'], ['free', 'Free'], ['under100', 'Under $100'], ['100to500', '$100 – $500'], ['over500', 'Over $500']]} /></FilterSection>{activeFilterCount > 0 && <button onClick={resetFilters} className="w-full rounded-lg border border-violet-200 bg-violet-50 py-2.5 text-[11px] font-bold text-violet-700 transition hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-300 dark:hover:bg-violet-950">Clear all filters</button>}</aside>
        <section>{visibleTrainings.length === 0 && !loading ? <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-20 text-center dark:border-slate-700 dark:bg-slate-900"><BookOpen className="mx-auto text-violet-300 dark:text-violet-500" size={40} /><h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">No programs found</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Try changing your search or filters.</p><button onClick={resetFilters} className="mt-5 rounded-lg bg-violet-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-violet-700">Reset filters</button></div> : <div className={view === 'grid' ? 'grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4' : 'grid gap-3'}>{visibleTrainings.map((training) => <CourseCard key={training.id} training={training} language={language} list={view === 'list'} />)}</div>}</section>
      </div>
    </div>
  </main></div>;
}

function Select({ value, onChange, label, options }: { value: string; onChange: (value: string) => void; label: string; options: string[][] }) {
  return <div className="relative min-w-0"><select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} className={`${fieldClass} w-full appearance-none truncate px-2 pr-5 accent-primary sm:px-3 sm:pr-8`}><option value="">{label}</option>{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select><ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-muted sm:right-3" size={12} /></div>;
}
function FilterSection({ title, children }: { title: string; children: React.ReactNode }) { const [open, setOpen] = useState(true); return <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-[0_1px_3px_rgba(15,23,42,.03)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-none"><button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between text-[11px] font-extrabold text-slate-800 dark:text-slate-100">{title}{open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}</button>{open && <div className="mt-3">{children}</div>}</div>; }
function RadioList({ name, value, onChange, options }: { name: string; value: string; onChange: (value: string) => void; options: string[][] }) { return <div className="space-y-2.5">{options.map(([optionValue, label]) => <label key={`${name}-${optionValue}`} className="flex cursor-pointer items-center gap-2.5 text-[10px] font-medium text-slate-600 dark:text-slate-300"><input type="radio" name={name} checked={value === optionValue} onChange={() => onChange(optionValue)} className="h-3.5 w-3.5 accent-violet-600" />{label}</label>)}</div>; }

function CourseCard({ training, language, list }: { training: Training; language: string; list: boolean }) {
  // Identifying source data stays canonical when the interface language changes.
  const name = training.name;
  const provider = training.provider.name;
  const duration = language === 'so' && training.durationSo?.trim() ? training.durationSo : training.duration;
  const schedule = language === 'so' && training.scheduleSo?.trim() ? training.scheduleSo : training.schedule;
  const place = training.deliveryMode === 'online' ? 'Online' : [training.city, training.state].filter(Boolean).join(', ') || 'Location provided on enrollment';
  const start = training.startDate ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(training.startDate)) : 'Flexible start';
  const end = training.endDate ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(training.endDate)) : '';
  const level = training.level || 'All levels';
  const formatLabel = (training.deliveryMode || 'in_person').replace('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  const categoryTone = training.category?.toLowerCase().includes('health') ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300' : training.category?.toLowerCase().includes('trade') ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300' : 'bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300';
  const priceLabel = training.cost === 0 ? 'FREE' : new Intl.NumberFormat('en-US', { style: 'currency', currency: training.currency || 'USD', maximumFractionDigits: 0 }).format(training.cost);
  return <Link href={`/training/${training.slug || training.id}`} className={`group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,.05)] transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-[0_10px_26px_rgba(91,33,209,.12)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-none dark:hover:border-violet-700 dark:hover:shadow-[0_10px_26px_rgba(0,0,0,.3)] ${list ? 'grid sm:h-[190px] sm:grid-cols-[260px_minmax(0,1fr)]' : 'flex flex-col'}`}>
    <div className={`relative w-full shrink-0 overflow-hidden bg-gradient-to-br from-violet-100 via-slate-100 to-emerald-100 dark:from-violet-950 dark:via-slate-800 dark:to-emerald-950 ${list ? 'h-[160px] min-h-0 sm:h-[190px]' : 'h-[96px] sm:h-[112px] xl:h-[120px]'}`}>{training.imageUrl ? <img src={training.imageUrl} alt={name} loading="lazy" decoding="async" className="absolute inset-0 block h-full w-full object-cover object-center transition duration-500 group-hover:scale-[1.03]" /> : <div className="grid h-full place-items-center"><div className="grid h-12 w-12 place-items-center rounded-xl bg-white/80 text-violet-600 shadow-sm dark:bg-slate-900/80 dark:text-violet-300"><BookOpen size={27} /></div></div>}{training.featured && <span className="absolute left-2 top-2 rounded bg-violet-600 px-1.5 py-0.5 text-[7px] font-extrabold uppercase tracking-wide text-white sm:px-2 sm:py-1 sm:text-[8px]">Featured</span>}</div>
    <div className="flex flex-1 flex-col p-2.5 sm:p-3"><h3 className="line-clamp-2 text-[11px] font-extrabold leading-[1.25] tracking-[-0.015em] text-slate-900 group-hover:text-violet-700 dark:text-slate-100 dark:group-hover:text-violet-300 sm:text-[13px] xl:text-[14px]">{name}</h3><p className="mt-1 flex min-w-0 items-center gap-1 truncate text-[8px] font-semibold text-slate-500 dark:text-slate-400 sm:text-[9px] xl:text-[10px]"><span className="truncate">{provider}</span>{training.provider.verified && <span title="Verified provider" className="grid h-3 w-3 shrink-0 place-items-center rounded-full bg-emerald-500 text-[7px] text-white">✓</span>}</p><div className="mt-2 space-y-1 text-[8px] font-medium leading-3 text-slate-600 dark:text-slate-300 sm:text-[9px] sm:leading-4 xl:text-[10px]"><p className="flex items-start gap-1.5"><CalendarDays className="mt-0.5 shrink-0 text-slate-500 dark:text-slate-400" size={11} /><span className="line-clamp-1">{start}{end && ` – ${end}`}</span></p><p className="flex items-start gap-1.5"><Clock3 className="mt-0.5 shrink-0 text-slate-500 dark:text-slate-400" size={11} /><span className="line-clamp-1">{schedule || duration}</span></p><p className="flex items-start gap-1.5"><MapPin className="mt-0.5 shrink-0 text-slate-500 dark:text-slate-400" size={11} /><span className="line-clamp-1">{place}</span></p></div><div className="mt-2 flex flex-wrap gap-1"><span className={`rounded px-1.5 py-0.5 text-[7px] font-bold sm:text-[8px] ${categoryTone}`}>{level}</span><span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[7px] font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 sm:text-[8px]">{formatLabel}</span>{training.providesCertificate && <span className="hidden rounded bg-blue-50 px-1.5 py-0.5 text-[7px] font-bold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 sm:inline sm:text-[8px]">Certificate</span>}</div><div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 dark:border-slate-800"><strong className={`text-[11px] sm:text-[13px] ${training.cost === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-violet-700 dark:text-violet-300'}`}>{priceLabel}</strong><Heart size={15} className="text-slate-400 transition group-hover:text-violet-600 dark:text-slate-500 dark:group-hover:text-violet-300" /></div></div>
  </Link>;
}
