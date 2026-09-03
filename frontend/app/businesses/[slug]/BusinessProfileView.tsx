"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Bookmark, Building2, Check, CheckCircle2,
  ExternalLink, Globe2, Mail, MapPin, MessageCircle, Navigation,
  Phone, Share2, Sparkles, Star, Wrench,
} from "lucide-react";
import { getSafeMailtoUrl, getSafeStoredUrl, getSafeTelUrl } from "@/lib/safeUrl";
import type { DirectoryLanguage, PublicBusiness } from "@/lib/publicDirectoryTypes";
import { getLocalizedBusinessText } from "@/lib/publicDirectoryTypes";
import ImagePreviewModal from "@/components/ImagePreviewModal";

const panel = "rounded-xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,.04)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_8px_24px_rgba(0,0,0,.28)]";

export default function BusinessProfileView({ business, language }: { business: PublicBusiness; language: DirectoryLanguage }) {
  const isSo = language === "so";
  const [activeImage, setActiveImage] = useState<number | null>(null);
  const localizedText = getLocalizedBusinessText(business, language);
  const text = { ...localizedText, name: business.name.trim() };
  const banner = getSafeStoredUrl(business.bannerUrl) || getSafeStoredUrl(business.logoUrl);
  const logo = getSafeStoredUrl(business.logoUrl);
  const website = getSafeStoredUrl(business.website);
  const phone = getSafeTelUrl(business.phone || undefined);
  const email = getSafeMailtoUrl(business.email || undefined);
  const location = business.location || [business.address, business.city, business.region, business.postalCode].filter(Boolean).join(", ") || "Location unavailable";
  const directions = [business.address, business.city, business.region].filter(Boolean).join(", ");
  const gallery = Array.from(new Set([banner, ...(business.gallery || [])].filter((item): item is string => Boolean(item))));
  const rating = business.rating || 0;
  const reviews = business.reviewsCount || 0;
  const highlights = [business.verified ? "Verified business" : null, business.remoteAvailable ? "Remote services available" : null, business.category, business.subcategory].filter((item): item is string => Boolean(item));

  return <><main className="detail-readable mx-auto max-w-[1440px] px-4 pb-16 pt-20 font-sans sm:px-6 lg:px-8">
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0 space-y-4">
        <section className={`${panel} overflow-hidden`}>
          <button type="button" onClick={() => banner && setActiveImage(0)} aria-label={`Preview ${text.name} image`} className="relative block h-[220px] w-full bg-slate-100 text-left dark:bg-slate-800 sm:h-[330px] lg:h-[370px]">{banner ? <img src={banner} alt={text.name} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-primary"><Building2 size={70}/></div>}</button>
          <div className="p-4 sm:p-5"><div className="flex items-start gap-3">{logo && <img src={logo} alt={`${text.name} logo`} className="h-14 w-14 shrink-0 rounded-xl border border-slate-200 bg-white object-contain p-1.5"/>}<div className="min-w-0 flex-1"><h1 className="text-[22px] font-extrabold tracking-[-0.035em] text-heading sm:text-[27px]">{text.name}</h1><p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-muted">{business.subcategory || business.category || "Local business"}{business.verified && <CheckCircle2 size={15} className="fill-emerald-500 text-white"/>}</p><div className="mt-2 flex flex-wrap items-center gap-3 text-[13px]"><span className="flex items-center gap-1 text-amber-500"><Star size={14} className="fill-amber-400"/>{rating ? rating.toFixed(1) : "New"} {reviews > 0 && `(${reviews} reviews)`}</span><span className="text-muted">Open profile</span></div></div></div>
            <div className="mt-4 grid grid-cols-4 gap-2">{phone ? <a href={phone} className="flex h-14 flex-col items-center justify-center gap-1 rounded-lg border border-violet-100 text-xs font-semibold text-primary"><Phone size={16}/>Call</a> : <span className="flex h-14 flex-col items-center justify-center gap-1 rounded-lg border border-violet-100 text-xs font-semibold text-primary opacity-40"><Phone size={16}/>Call</span>}{directions ? <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(directions)}`} target="_blank" rel="noopener noreferrer" className="flex h-14 flex-col items-center justify-center gap-1 rounded-lg border border-violet-100 text-xs font-semibold text-primary"><Navigation size={16}/>Directions</a> : <span className="flex h-14 flex-col items-center justify-center gap-1 rounded-lg border border-violet-100 text-xs font-semibold text-primary opacity-40"><Navigation size={16}/>Directions</span>}{email ? <a href={email} className="flex h-14 flex-col items-center justify-center gap-1 rounded-lg border border-violet-100 text-xs font-semibold text-primary"><MessageCircle size={16}/>Message</a> : <span className="flex h-14 flex-col items-center justify-center gap-1 rounded-lg border border-violet-100 text-xs font-semibold text-primary opacity-40"><MessageCircle size={16}/>Message</span>}<button className="flex h-14 flex-col items-center justify-center gap-1 rounded-lg border border-violet-100 text-xs font-semibold text-primary"><Bookmark size={16}/>Save</button></div>
          </div>
        </section>

        <Content title={isSo ? `Ku saabsan ${text.name}` : `About ${text.name}`}><p className="whitespace-pre-line text-sm leading-6 text-muted">{text.description || "This business has not added a detailed description yet."}</p><div className="mt-4 space-y-3 border-t border-border pt-4 text-[13px] text-muted"><p className="flex gap-2"><MapPin size={16} className="text-primary"/>{location}</p>{phone && <a href={phone} className="flex gap-2"><Phone size={16} className="text-primary"/>{business.phone}</a>}{email && <a href={email} className="flex gap-2"><Mail size={16} className="text-primary"/>{business.email}</a>}{website && <a href={website} target="_blank" rel="noopener noreferrer" className="flex gap-2 text-primary"><Globe2 size={16}/>Visit website <ExternalLink size={14}/></a>}</div></Content>

        {gallery.length > 0 && <Content title="Gallery" action={`${gallery.length} photos`}><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{gallery.slice(0,6).map((image,index)=><button type="button" key={`${image}-${index}`} onClick={() => setActiveImage(index)} aria-label={`Preview ${text.name} image ${index + 1}`} className="h-24 overflow-hidden rounded-lg sm:h-32"><img src={image} alt={`${text.name} gallery ${index+1}`} className="h-full w-full object-cover"/></button>)}</div></Content>}

        <Content title={isSo ? "Saacadaha ganacsiga" : "Business hours"}><div className="grid gap-2 text-[13px] sm:grid-cols-2">{business.openingHours && Object.entries(business.openingHours).length ? Object.entries(business.openingHours).map(([day,hours])=><div key={day} className="flex justify-between rounded-lg bg-surface-muted px-3 py-2"><span className="capitalize text-muted">{day}</span><span className="font-semibold text-foreground">{hours || "Closed"}</span></div>) : <p className="text-muted">Contact the business for opening hours.</p>}</div></Content>
      </div>

      <aside className="space-y-3 text-[13px] lg:sticky lg:top-20">
        <Content title={isSo ? "Adeegyadayada" : "Our services"} action="View all"><div className="space-y-1">{[business.subcategory, business.category, ...(business.serviceArea || []).slice(0,2)].filter(Boolean).map((service,index)=><div key={`${service}-${index}`} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50"><span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary"><Wrench size={13}/></span><div className="min-w-0 flex-1"><p className="truncate text-[9px] font-semibold text-slate-700">{service}</p><p className="text-[8px] text-slate-400">Contact for pricing</p></div><span className="text-slate-400">›</span></div>)}</div></Content>
        <Content title="Highlights"><div className="grid grid-cols-2 gap-2">{highlights.map((item)=><p key={item} className="flex items-start gap-1.5 text-xs leading-5 text-muted"><Check size={14} className="mt-0.5 shrink-0 text-primary"/>{item}</p>)}</div></Content>
        <Content title="Reviews" action={reviews ? "View all" : undefined}><div className="flex items-end gap-3"><strong className="text-4xl font-extrabold tracking-tight text-slate-950">{rating ? rating.toFixed(1) : "—"}</strong><div><div className="flex gap-0.5">{Array.from({length:5}).map((_,i)=><Star key={i} size={11} className={i < Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-slate-200"}/>)}</div><p className="mt-1 text-[8px] text-slate-400">{reviews} verified reviews</p></div></div></Content>
        <section className={`${panel} p-4`}><h2 className="flex items-center gap-2 text-[12px] font-extrabold"><Share2 size={14} className="text-primary"/>Share this business</h2><div className="mt-3 flex gap-2">{["f","x","in","wa"].map(item=><span key={item} className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">{item}</span>)}</div></section>
        <section className="rounded-xl border border-violet-100 bg-violet-50 p-4 dark:border-violet-900/60 dark:bg-violet-950/30"><p className="flex gap-2 text-[13px] leading-5 text-slate-600 dark:text-slate-300"><Sparkles size={16} className="shrink-0 text-primary"/>Explore trusted local businesses and services across ZeilaLink.</p><Link href="/businesses" className="mt-3 flex h-10 items-center justify-center rounded-lg bg-primary text-[13px] font-bold text-white">Browse businesses</Link></section>
      </aside>
    </div>
  </main><ImagePreviewModal images={gallery} activeIndex={activeImage} title={text.name} onChange={setActiveImage} onClose={() => setActiveImage(null)}/></>;
}

function Content({ title, action, children }: { title: string; action?: string; children: ReactNode }) { return <section className={`${panel} p-4 sm:p-5`}><div className="mb-3 flex items-center justify-between"><h2 className="text-[12px] font-extrabold text-heading">{title}</h2>{action && <span className="text-xs font-semibold text-primary">{action}</span>}</div>{children}</section>; }
