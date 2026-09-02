import type React from "react";
import Link from "next/link";
import {
  Bookmark, Building2, Check, CheckCircle2,
  ExternalLink, Globe2, Mail, MapPin, MessageCircle, Navigation,
  Phone, Share2, Sparkles, Star, Wrench,
} from "lucide-react";
import { getSafeMailtoUrl, getSafeStoredUrl, getSafeTelUrl } from "@/lib/safeUrl";
import type { DirectoryLanguage, PublicBusiness } from "@/lib/publicDirectoryTypes";
import { getLocalizedBusinessText } from "@/lib/publicDirectoryTypes";

const panel = "rounded-xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,.04)]";

export default function BusinessProfileView({ business, language }: { business: PublicBusiness; language: DirectoryLanguage }) {
  const isSo = language === "so";
  const text = getLocalizedBusinessText(business, language);
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

  return <main className="mx-auto max-w-[1440px] px-4 pb-16 pt-20 sm:px-6 lg:px-8">
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0 space-y-4">
        <section className={`${panel} overflow-hidden`}>
          <div className="relative h-[220px] bg-slate-100 sm:h-[330px] lg:h-[370px]">{banner ? <img src={banner} alt={text.name} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-primary"><Building2 size={70}/></div>}{gallery.length > 1 && <span className="absolute bottom-3 right-3 rounded bg-slate-950/75 px-2 py-1 text-[8px] font-bold text-white">1 / {gallery.length}</span>}</div>
          <div className="p-4 sm:p-5"><div className="flex items-start gap-3">{logo && <img src={logo} alt={`${text.name} logo`} className="h-14 w-14 shrink-0 rounded-xl border border-slate-200 bg-white object-contain p-1.5"/>}<div className="min-w-0 flex-1"><h1 className="text-[22px] font-extrabold tracking-[-0.035em] text-slate-950 sm:text-[27px]">{text.name}</h1><p className="mt-1 flex items-center gap-1.5 text-[10px] font-medium text-slate-500">{business.subcategory || business.category || "Local business"}{business.verified && <CheckCircle2 size={13} className="fill-emerald-500 text-white"/>}</p><div className="mt-2 flex flex-wrap items-center gap-3 text-[9px]"><span className="flex items-center gap-1 text-amber-500"><Star size={11} className="fill-amber-400"/>{rating ? rating.toFixed(1) : "New"} {reviews > 0 && `(${reviews} reviews)`}</span><span className="text-slate-500">Open profile</span></div></div></div>
            <div className="mt-4 grid grid-cols-4 gap-2">{phone ? <a href={phone} className="flex h-12 flex-col items-center justify-center gap-1 rounded-lg border border-violet-100 text-[8px] font-semibold text-primary"><Phone size={14}/>Call</a> : <span className="flex h-12 flex-col items-center justify-center gap-1 rounded-lg border border-violet-100 text-[8px] font-semibold text-primary opacity-40"><Phone size={14}/>Call</span>}{directions ? <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(directions)}`} target="_blank" rel="noopener noreferrer" className="flex h-12 flex-col items-center justify-center gap-1 rounded-lg border border-violet-100 text-[8px] font-semibold text-primary"><Navigation size={14}/>Directions</a> : <span className="flex h-12 flex-col items-center justify-center gap-1 rounded-lg border border-violet-100 text-[8px] font-semibold text-primary opacity-40"><Navigation size={14}/>Directions</span>}{email ? <a href={email} className="flex h-12 flex-col items-center justify-center gap-1 rounded-lg border border-violet-100 text-[8px] font-semibold text-primary"><MessageCircle size={14}/>Message</a> : <span className="flex h-12 flex-col items-center justify-center gap-1 rounded-lg border border-violet-100 text-[8px] font-semibold text-primary opacity-40"><MessageCircle size={14}/>Message</span>}<button className="flex h-12 flex-col items-center justify-center gap-1 rounded-lg border border-violet-100 text-[8px] font-semibold text-primary"><Bookmark size={14}/>Save</button></div>
          </div>
          <nav className="grid grid-cols-4 border-t border-slate-100 text-center text-[9px] font-semibold"><span className="border-b-2 border-primary py-3 text-primary">Overview</span><span className="py-3 text-slate-500">Services</span><span className="py-3 text-slate-500">Reviews ({reviews})</span><span className="py-3 text-slate-500">About</span></nav>
        </section>

        <Content title={isSo ? `Ku saabsan ${text.name}` : `About ${text.name}`}><p className="whitespace-pre-line text-[10px] leading-5 text-slate-600">{text.description || "This business has not added a detailed description yet."}</p><div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-[9px] text-slate-600"><p className="flex gap-2"><MapPin size={12} className="text-primary"/>{location}</p>{phone && <a href={phone} className="flex gap-2"><Phone size={12} className="text-primary"/>{business.phone}</a>}{email && <a href={email} className="flex gap-2"><Mail size={12} className="text-primary"/>{business.email}</a>}{website && <a href={website} target="_blank" rel="noopener noreferrer" className="flex gap-2 text-primary"><Globe2 size={12}/>Visit website <ExternalLink size={10}/></a>}</div></Content>

        {gallery.length > 0 && <Content title="Gallery" action={`${gallery.length} photos`}><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{gallery.slice(0,6).map((image,index)=><img key={`${image}-${index}`} src={image} alt={`${text.name} gallery ${index+1}`} className="h-24 w-full rounded-lg object-cover sm:h-32"/>)}</div></Content>}

        <Content title={isSo ? "Saacadaha ganacsiga" : "Business hours"}><div className="grid gap-2 text-[9px] sm:grid-cols-2">{business.openingHours && Object.entries(business.openingHours).length ? Object.entries(business.openingHours).map(([day,hours])=><div key={day} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2"><span className="capitalize text-slate-500">{day}</span><span className="font-semibold text-slate-700">{hours || "Closed"}</span></div>) : <p className="text-slate-500">Contact the business for opening hours.</p>}</div></Content>
      </div>

      <aside className="space-y-3 lg:sticky lg:top-20">
        <Content title={isSo ? "Adeegyadayada" : "Our services"} action="View all"><div className="space-y-1">{[business.subcategory, business.category, ...(business.serviceArea || []).slice(0,2)].filter(Boolean).map((service,index)=><div key={`${service}-${index}`} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50"><span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary"><Wrench size={13}/></span><div className="min-w-0 flex-1"><p className="truncate text-[9px] font-semibold text-slate-700">{service}</p><p className="text-[8px] text-slate-400">Contact for pricing</p></div><span className="text-slate-400">›</span></div>)}</div></Content>
        <Content title="Highlights"><div className="grid grid-cols-2 gap-2">{highlights.map((item)=><p key={item} className="flex items-start gap-1.5 text-[8px] leading-4 text-slate-600"><Check size={11} className="mt-0.5 shrink-0 text-primary"/>{item}</p>)}</div></Content>
        <Content title="Reviews" action={reviews ? "View all" : undefined}><div className="flex items-end gap-3"><strong className="text-4xl font-extrabold tracking-tight text-slate-950">{rating ? rating.toFixed(1) : "—"}</strong><div><div className="flex gap-0.5">{Array.from({length:5}).map((_,i)=><Star key={i} size={11} className={i < Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-slate-200"}/>)}</div><p className="mt-1 text-[8px] text-slate-400">{reviews} verified reviews</p></div></div></Content>
        <section className={`${panel} p-4`}><h2 className="flex items-center gap-2 text-[12px] font-extrabold"><Share2 size={14} className="text-primary"/>Share this business</h2><div className="mt-3 flex gap-2">{["f","x","in","wa"].map(item=><span key={item} className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-[8px] font-bold text-primary">{item}</span>)}</div></section>
        <section className="rounded-xl border border-violet-100 bg-violet-50 p-4"><p className="flex gap-2 text-[9px] leading-4 text-slate-600"><Sparkles size={14} className="shrink-0 text-primary"/>Explore trusted local businesses and services across ZeilaLink.</p><Link href="/businesses" className="mt-3 flex h-9 items-center justify-center rounded-lg bg-primary text-[9px] font-bold text-white">Browse businesses</Link></section>
      </aside>
    </div>
  </main>;
}

function Content({ title, action, children }: { title: string; action?: string; children: React.ReactNode }) { return <section className={`${panel} p-4 sm:p-5`}><div className="mb-3 flex items-center justify-between"><h2 className="text-[12px] font-extrabold text-slate-900">{title}</h2>{action && <span className="text-[8px] font-semibold text-primary">{action}</span>}</div>{children}</section>; }
