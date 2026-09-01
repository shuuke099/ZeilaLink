'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useLanguage } from '@/contexts/LanguageContext';
import { getSafeMailtoUrl, getSafeStoredUrl, getSafeTelUrl } from '@/lib/safeUrl';
import {
  Award, BookOpen, CalendarDays, Check, CheckCircle2, Clock3, Copy, DollarSign,
  ExternalLink, FileCheck2, Globe2, GraduationCap, Heart, Languages, Mail, MapPin,
  Monitor, Phone, Share2, ShieldCheck, Star, UserRound, UsersRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface TrainingDetail {
  id: string; slug?: string | null; name: string; nameSo?: string | null;
  description: string; descriptionSo?: string | null; duration: string; durationSo?: string | null;
  cost: number; currency?: string; imageUrl?: string | null; gallery?: string[];
  providesCertificate?: boolean; certificateUrl?: string | null; featured?: boolean;
  category?: string | null; level?: string | null; deliveryMode?: string | null;
  address?: string | null; city?: string | null; state?: string | null; postalCode?: string | null;
  country?: string | null; onlineUrl?: string | null; enrollmentUrl?: string | null;
  enrollmentOpen?: boolean; startDate?: string | null; endDate?: string | null;
  registrationDeadline?: string | null; schedule?: string | null; scheduleSo?: string | null;
  learningOutcomes?: string[]; requirements?: string[];
  skills?: Array<{ id?: string; name: string }>;
  provider: {
    id: string; slug?: string | null; name: string; nameSo?: string | null;
    logoUrl?: string | null; description?: string | null; descriptionSo?: string | null;
    rating?: number | null; verified?: boolean | null; website?: string | null;
    phone?: string | null; email?: string | null; address?: string | null;
    city?: string | null; state?: string | null; postalCode?: string | null;
  };
}

type Props = { initialTraining: TrainingDetail; publicPath: string };
const panel = 'rounded-xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,.04)]';

export default function TrainingDetailClient({ initialTraining: training, publicPath }: Props) {
  const { language } = useLanguage();
  const isSo = language === 'so';
  const name = isSo && training.nameSo?.trim() ? training.nameSo : training.name;
  const description = isSo && training.descriptionSo?.trim() ? training.descriptionSo : training.description;
  const duration = isSo && training.durationSo?.trim() ? training.durationSo : training.duration;
  const schedule = isSo && training.scheduleSo?.trim() ? training.scheduleSo : training.schedule;
  const providerName = isSo && training.provider.nameSo?.trim() ? training.provider.nameSo : training.provider.name;
  const providerDescription = isSo && training.provider.descriptionSo?.trim() ? training.provider.descriptionSo : training.provider.description;
  const format = (training.deliveryMode || 'in_person').replace('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  const location = training.deliveryMode === 'online' ? 'Online' : [training.address, training.city, training.state, training.postalCode].filter(Boolean).join(', ') || 'Provided during registration';
  const price = training.cost === 0 ? (isSo ? 'Bilaash' : 'Free') : new Intl.NumberFormat('en-US', { style: 'currency', currency: training.currency || 'USD', maximumFractionDigits: 0 }).format(training.cost);
  const formatDate = (value?: string | null) => value ? new Intl.DateTimeFormat(isSo ? 'so-SO' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value)) : 'Flexible';
  const enrollUrl = getSafeStoredUrl(training.enrollmentUrl) || getSafeStoredUrl(training.onlineUrl);
  const websiteUrl = getSafeStoredUrl(training.provider.website);
  const emailUrl = getSafeMailtoUrl(training.provider.email || undefined);
  const phoneUrl = getSafeTelUrl(training.provider.phone || undefined);
  const gallery = Array.from(new Set([training.imageUrl, ...(training.gallery || [])].filter((item): item is string => Boolean(item))));
  const outcomes = training.learningOutcomes?.length ? training.learningOutcomes : (training.skills?.length ? training.skills.map((skill) => `Practical ${skill.name} skills`) : ['Practical, job-ready knowledge', 'Industry-standard tools and workflows', 'Hands-on exercises and guided practice', 'Confidence to apply your new skills']);
  const requirements = training.requirements?.length ? training.requirements : ['No prior professional experience required', 'Basic computer skills recommended', 'Reliable internet access for online sessions', 'Commitment to complete course activities'];

  const registerButton = enrollUrl ? <a href={enrollUrl} target="_blank" rel="noopener noreferrer" className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 text-[11px] font-bold text-white transition hover:bg-violet-700">Visit Registration Page <ExternalLink size={13} /></a> : <span className="flex h-10 w-full items-center justify-center rounded-lg bg-slate-100 px-4 text-[11px] font-bold text-slate-500">Registration link coming soon</span>;

  return <div className="min-h-screen bg-[#fafafe] text-slate-900"><Navbar /><main className="mx-auto max-w-[1440px] px-4 pb-14 pt-20 sm:px-6 lg:px-8">
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_330px]">
      <div className="min-w-0 space-y-4">
        <section className={`${panel} overflow-hidden`}>
          <div className="relative h-[230px] bg-gradient-to-br from-violet-100 to-slate-200 sm:h-[330px] lg:h-[390px]">
            {training.imageUrl ? <img src={training.imageUrl} alt={name} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-violet-500"><GraduationCap size={72} /></div>}
            {training.featured && <span className="absolute left-3 top-3 rounded bg-violet-600 px-2 py-1 text-[8px] font-extrabold uppercase text-white">Featured</span>}
            {gallery.length > 1 && <span className="absolute bottom-3 right-3 rounded bg-slate-950/75 px-2 py-1 text-[9px] font-semibold text-white">1 / {gallery.length}</span>}
          </div>
          <div className="p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4"><div><h1 className="text-[23px] font-extrabold leading-tight tracking-[-0.035em] text-slate-950 sm:text-[28px]">{name}</h1><p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-slate-500">Offered by <span className="text-slate-800">{providerName}</span>{training.provider.verified && <CheckCircle2 size={14} className="fill-emerald-500 text-white" />}</p></div><button aria-label="Save course" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-400 hover:text-violet-600"><Heart size={17} /></button></div>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] font-medium text-slate-600">{training.provider.rating ? <span className="flex items-center gap-1 text-amber-600"><Star size={12} className="fill-amber-400 text-amber-400" />{training.provider.rating.toFixed(1)} rating</span> : null}<span className="flex items-center gap-1"><UsersRound size={12} /> Open enrollment</span></div>
            <div className="mt-4 grid gap-2 border-t border-slate-100 pt-4 text-[10px] font-medium text-slate-600 sm:grid-cols-2 xl:grid-cols-4"><span className="flex items-center gap-2"><CalendarDays size={13} className="text-violet-600" />{formatDate(training.startDate)} – {formatDate(training.endDate)}</span><span className="flex items-center gap-2"><Clock3 size={13} className="text-violet-600" />{schedule || duration}</span><span className="flex items-center gap-2"><MapPin size={13} className="text-violet-600" />{location}</span><span className="flex items-center gap-2"><UserRound size={13} className="text-violet-600" />{training.level || 'All levels'}</span></div>
          </div>
        </section>

        <section className="rounded-xl border border-violet-100 bg-violet-50/70 p-4"><div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-2.5"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-violet-100 text-violet-700"><Globe2 size={14} /></span><div><p className="text-[11px] font-bold text-slate-900">This training is offered by an external provider.</p><p className="mt-1 text-[9px] leading-4 text-slate-500">ZeilaLink lists this opportunity to help you discover it. Registration and course delivery are managed by the provider.</p></div></div><div className="w-full shrink-0 sm:w-52">{registerButton}</div></div></section>

        <ContentPanel title={isSo ? 'Ku saabsan tababarkan' : 'About this training'}><p className="whitespace-pre-line text-[11px] leading-5 text-slate-600">{description}</p></ContentPanel>

        {gallery.length > 1 && <ContentPanel title="Gallery" action={`${gallery.length} photos`}><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{gallery.slice(0, 6).map((image, index) => <img key={`${image}-${index}`} src={image} alt={`${name} gallery ${index + 1}`} className="h-24 w-full rounded-lg object-cover sm:h-32" />)}</div></ContentPanel>}

        <ContentPanel title={isSo ? 'Waxaad baran doontaa' : 'What you will learn'}><div className="grid gap-x-8 gap-y-2 sm:grid-cols-2">{outcomes.slice(0, 10).map((outcome) => <p key={outcome} className="flex items-start gap-2 text-[10px] leading-4 text-slate-600"><CheckCircle2 size={13} className="mt-0.5 shrink-0 text-violet-600" />{outcome}</p>)}</div></ContentPanel>

        <ContentPanel title={isSo ? 'Jadwalka' : 'Schedule'}><div className="grid gap-4 text-[10px] sm:grid-cols-2 lg:grid-cols-4"><Info label="Start date" value={formatDate(training.startDate)} /><Info label="End date" value={formatDate(training.endDate)} /><Info label="Time" value={schedule || 'Contact provider'} /><Info label="Duration" value={duration} /></div></ContentPanel>
      </div>

      <aside className="space-y-3 lg:sticky lg:top-20">
        <section className={`${panel} p-4`}><h2 className="text-[12px] font-extrabold">At a glance</h2><div className="mt-3 divide-y divide-slate-100"><Glance icon={GraduationCap} label="Level" value={training.level || 'All levels'} /><Glance icon={Clock3} label="Duration" value={duration} /><Glance icon={BookOpen} label="Category" value={training.category || 'General'} /><Glance icon={Monitor} label="Format" value={format} /><Glance icon={Languages} label="Language" value={isSo ? 'Somali' : 'English'} /><Glance icon={Award} label="Certificate" value={training.providesCertificate ? 'Yes' : 'No'} /><Glance icon={DollarSign} label="Price" value={price} /></div></section>

        <section className={`${panel} p-4`}><h2 className="text-[12px] font-extrabold">Training provider</h2><div className="mt-3 flex gap-3">{training.provider.logoUrl ? <img src={training.provider.logoUrl} alt={providerName} className="h-12 w-12 rounded-lg object-cover" /> : <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-violet-100 font-bold text-violet-700">{providerName.charAt(0)}</div>}<div className="min-w-0"><p className="flex items-center gap-1 text-[11px] font-bold">{providerName}{training.provider.verified && <CheckCircle2 size={13} className="fill-emerald-500 text-white" />}</p><p className="mt-1 line-clamp-2 text-[9px] leading-4 text-slate-500">{providerDescription || 'Trusted training provider.'}</p></div></div><div className="mt-3 space-y-2">{websiteUrl && <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[9px] font-semibold text-violet-700"><Globe2 size={12} /> Visit website</a>}{phoneUrl && <a href={phoneUrl} className="flex items-center gap-2 text-[9px] text-slate-600"><Phone size={12} />{training.provider.phone}</a>}{emailUrl && <a href={emailUrl} className="flex items-center gap-2 text-[9px] text-slate-600"><Mail size={12} />{training.provider.email}</a>}</div>{training.provider.slug && <Link href={`/businesses/${training.provider.slug}`} className="mt-4 flex h-9 items-center justify-center rounded-lg border border-violet-300 text-[9px] font-bold text-violet-700">View provider profile</Link>}</section>

        <section className={`${panel} p-4`}><h2 className="text-[12px] font-extrabold">How to join</h2><ol className="mt-3 space-y-2">{['Click the registration button', 'Create an account on the provider website', 'Complete registration and payment', 'Receive confirmation from the provider'].map((step, index) => <li key={step} className="flex gap-2 text-[9px] leading-4 text-slate-600"><span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-violet-100 text-[8px] font-bold text-violet-700">{index + 1}</span>{step}</li>)}</ol><div className="mt-4">{registerButton}</div></section>

        <section className={`${panel} p-4`}><h2 className="flex items-center gap-2 text-[12px] font-extrabold"><MapPin size={14} className="text-violet-600" />Location</h2><p className="mt-2 text-[10px] font-semibold text-slate-700">{location}</p><div className="mt-3 grid h-24 place-items-center overflow-hidden rounded-lg bg-[linear-gradient(135deg,#eef2ff_25%,#f8fafc_25%,#f8fafc_50%,#eef2ff_50%,#eef2ff_75%,#f8fafc_75%)] bg-[length:24px_24px]"><span className="grid h-8 w-8 place-items-center rounded-full bg-violet-600 text-white shadow-lg"><MapPin size={15} /></span></div></section>

        <section className={`${panel} p-4`}><h2 className="flex items-center gap-2 text-[12px] font-extrabold"><FileCheck2 size={14} className="text-violet-600" />Eligibility & requirements</h2><div className="mt-3 space-y-2">{requirements.slice(0, 5).map((requirement) => <p key={requirement} className="flex gap-2 text-[9px] leading-4 text-slate-600"><Check size={11} className="mt-0.5 shrink-0 text-emerald-600" />{requirement}</p>)}</div></section>

        <ShareCard publicPath={publicPath} />
        <div className="rounded-xl border border-violet-100 bg-violet-50 p-4"><p className="flex gap-2 text-[9px] leading-4 text-slate-600"><ShieldCheck size={15} className="shrink-0 text-violet-600" />This listing is offered by an external provider. Verify program details directly before registering.</p></div>
      </aside>
    </div>
  </main></div>;
}

function ContentPanel({ title, action, children }: { title: string; action?: string; children: React.ReactNode }) { return <section className={`${panel} p-4 sm:p-5`}><div className="mb-3 flex items-center justify-between"><h2 className="text-[13px] font-extrabold text-slate-900">{title}</h2>{action && <span className="text-[9px] font-semibold text-violet-700">{action}</span>}</div>{children}</section>; }
function Info({ label, value }: { label: string; value: string }) { return <div><p className="text-[8px] font-semibold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 font-semibold text-slate-700">{value}</p></div>; }
function Glance({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) { return <div className="flex items-center justify-between gap-3 py-2 text-[9px]"><span className="flex items-center gap-2 text-slate-500"><Icon size={12} className="text-violet-600" />{label}</span><span className="max-w-[55%] text-right font-semibold text-slate-700">{value}</span></div>; }
function ShareCard({ publicPath }: { publicPath: string }) { const copy = () => void navigator.clipboard?.writeText(window.location.origin + publicPath); return <section className={`${panel} p-4`}><h2 className="flex items-center gap-2 text-[12px] font-extrabold"><Share2 size={14} className="text-violet-600" />Share this training</h2><button onClick={copy} className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-violet-300 text-[9px] font-bold text-violet-700"><Copy size={12} /> Copy link</button></section>; }
