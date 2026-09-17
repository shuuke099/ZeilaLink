"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Clock3,
  GraduationCap,
  Heart,
  MapPin,
  Navigation,
  Phone,
  Star,
} from "lucide-react";
import BusinessFavoriteButton from "@/components/businesses/BusinessFavoriteButton";
import TrainingFavoriteButton from "@/components/trainings/TrainingFavoriteButton";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  BUSINESS_FAVORITES_EVENT,
  getBusinessFavorites,
} from "@/lib/businessFavorites";
import {
  TRAINING_FAVORITES_EVENT,
  getTrainingFavorites,
  type TrainingFavorite,
} from "@/lib/trainingFavorites";
import {
  getLocalizedBusinessText,
  type PublicBusiness,
} from "@/lib/publicDirectoryTypes";
import { getSafeStoredUrl } from "@/lib/safeUrl";
import {
  getBusinessCategoryLabel,
  getCanonicalBusinessName,
} from "@/app/businesses/businessUi";

export default function FavoritesClient() {
  const { user, loading } = useAuth();
  const { language } = useLanguage();
  const isSomali = language === "so";
  const [favorites, setFavorites] = useState<PublicBusiness[]>([]);
  const [trainingFavorites, setTrainingFavorites] = useState<TrainingFavorite[]>([]);

  useEffect(() => {
    if (loading) return;
    const syncFavorites = () => {
      setFavorites(getBusinessFavorites(user?.id));
      setTrainingFavorites(getTrainingFavorites(user?.id));
    };
    syncFavorites();
    window.addEventListener(BUSINESS_FAVORITES_EVENT, syncFavorites);
    window.addEventListener(TRAINING_FAVORITES_EVENT, syncFavorites);
    window.addEventListener("storage", syncFavorites);
    return () => {
      window.removeEventListener(BUSINESS_FAVORITES_EVENT, syncFavorites);
      window.removeEventListener(TRAINING_FAVORITES_EVENT, syncFavorites);
      window.removeEventListener("storage", syncFavorites);
    };
  }, [loading, user?.id]);

  if (loading) {
    return <div className="mt-8 h-48 animate-pulse rounded-2xl bg-surface-muted" />;
  }

  if (favorites.length === 0 && trainingFavorites.length === 0) {
    return (
      <div className="mt-8 rounded-2xl border-2 border-dashed border-border bg-surface p-10 text-center sm:p-14">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary"><Heart size={25} /></span>
        <h2 className="mt-4 text-xl font-extrabold text-heading">{isSomali ? "Weli waxba ma kaydsan" : "No favorites yet"}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">{isSomali ? "Taabo astaanta wadnaha ee ganacsi ama tababar si aad halkan ugu kaydsato." : "Tap the heart on a business or training to save it here for quick access."}</p>
        <Link href="/training" className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-white transition hover:bg-primary/90">{isSomali ? "Raadi tababarada" : "Browse trainings"}</Link>
      </div>
    );
  }

  return (
    <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {favorites.map((business) => {
        const localized = getLocalizedBusinessText(business, language);
        const displayName = getCanonicalBusinessName(business);
        const businessPath = `/businesses/${business.slug || business.id}`;
        const image = getSafeStoredUrl(business.bannerUrl) || getSafeStoredUrl(business.logoUrl);
        const location = business.location || business.address;
        const directionsQuery = [business.address, business.city, business.region]
          .filter(Boolean)
          .join(", ");

        return (
          <article key={`business-${business.id}`} className="group relative flex min-h-[355px] min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_4px_16px_rgba(15,23,42,.07)] transition hover:-translate-y-1 hover:border-primary/35 hover:shadow-xl dark:shadow-[0_8px_24px_rgba(0,0,0,.35)]">
            <Link href={businessPath} aria-label={`${isSomali ? "Eeg" : "View"} ${displayName}`} className="absolute inset-0 z-10 rounded-[inherit] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"><span className="sr-only">{isSomali ? "Eeg" : "View"} {displayName}</span></Link>
            <div className="relative h-[155px] shrink-0 overflow-hidden bg-surface-muted">
              {image ? <img src={image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <Building2 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-muted/40" size={42} />}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/30 via-transparent to-transparent" />
              {business.featured && <span className="absolute left-2.5 top-2.5 rounded-md bg-violet-700 px-2 py-1 text-[9px] font-extrabold uppercase tracking-wide text-white">{isSomali ? "La xushay" : "Featured"}</span>}
              <BusinessFavoriteButton business={business} isSomali={isSomali} className="absolute right-2.5 top-2.5 z-20 h-8 w-8" />
            </div>
            <div className="flex min-h-0 flex-1 flex-col p-4">
              {business.category && <span className="w-fit max-w-full truncate rounded-md bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">{getBusinessCategoryLabel(business.category, isSomali)}</span>}
              <h2 className="mt-2.5 line-clamp-2 text-[16px] font-extrabold leading-tight text-heading">{displayName}</h2>
              {location && <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted"><MapPin size={12} className="shrink-0 text-primary" /><span className="truncate">{location}</span></p>}
              {localized.description && <p className="mt-2 line-clamp-2 text-[12px] font-medium leading-5 text-muted">{localized.description}</p>}
              <div className="mt-2 flex items-center justify-between text-[11px]">
                {typeof business.rating === "number" ? <span className="inline-flex items-center gap-1 font-bold text-foreground"><Star size={12} className="fill-amber-400 text-amber-500" />{business.rating.toFixed(1)}</span> : <span />}
                <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${business.statusLabel === "Closed" ? "border-rose-300 text-rose-600" : "border-emerald-300 text-emerald-600"}`}>{business.statusLabel === "Closed" ? (isSomali ? "Xiran" : "Closed") : (isSomali ? "Furan" : "Open")}</span>
              </div>
              <div className="relative z-20 mt-auto grid grid-cols-2 gap-2 border-t border-border pt-3 text-[11px] font-bold">
                {business.phone ? <a href={`tel:${business.phone}`} className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface-muted hover:border-primary/50 hover:text-primary"><Phone size={13} />{isSomali ? "Wac" : "Call"}</a> : <span className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface-muted text-muted/50"><Phone size={13} />{isSomali ? "Wac" : "Call"}</span>}
                {directionsQuery ? <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(directionsQuery)}`} target="_blank" rel="noopener noreferrer" className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 text-primary hover:bg-primary hover:text-white"><Navigation size={13} />{isSomali ? "Tilmaamaha" : "Directions"}</a> : <span className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface-muted text-muted/50"><Navigation size={13} />{isSomali ? "Tilmaamaha" : "Directions"}</span>}
              </div>
            </div>
          </article>
        );
      })}
      {trainingFavorites.map((training) => {
        const trainingPath = `/training/${training.slug || training.id}`;
        const location = [training.city, training.state].filter(Boolean).join(", ");
        return (
          <article key={`training-${training.id}`} className="group relative flex min-h-[320px] min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_4px_16px_rgba(15,23,42,.07)] transition hover:-translate-y-1 hover:border-primary/35 hover:shadow-xl dark:shadow-[0_8px_24px_rgba(0,0,0,.35)]">
            <Link href={trainingPath} aria-label={`${isSomali ? "Eeg" : "View"} ${training.name}`} className="absolute inset-0 z-10 rounded-[inherit] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"><span className="sr-only">{isSomali ? "Eeg" : "View"} {training.name}</span></Link>
            <div className="relative h-[155px] shrink-0 overflow-hidden bg-surface-muted">
              {training.imageUrl ? <img src={training.imageUrl} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <GraduationCap className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-primary/50" size={44} />}
              <span className="absolute left-2.5 top-2.5 rounded-md bg-violet-700 px-2 py-1 text-[9px] font-extrabold uppercase tracking-wide text-white">{isSomali ? "Tababar" : "Training"}</span>
              <TrainingFavoriteButton training={training} isSomali={isSomali} className="absolute right-2.5 top-2.5 z-20 h-8 w-8" />
            </div>
            <div className="flex min-h-0 flex-1 flex-col p-4">
              <h2 className="line-clamp-2 text-[16px] font-extrabold leading-tight text-heading">{training.name}</h2>
              <p className="mt-1.5 truncate text-[11px] font-bold text-primary">{training.provider.name}</p>
              {location && <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted"><MapPin size={12} className="shrink-0 text-primary" /><span className="truncate">{location}</span></p>}
              {training.duration && <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted"><Clock3 size={12} className="shrink-0 text-primary" />{training.duration}</p>}
              <div className="mt-auto flex items-center justify-between border-t border-border pt-3 text-[11px]">
                {typeof training.rating === "number" && training.rating > 0 ? <span className="inline-flex items-center gap-1 font-bold text-foreground"><Star size={12} className="fill-amber-400 text-amber-500" />{training.rating.toFixed(1)}</span> : <span className="text-muted">{isSomali ? "Weli lama qiimeyn" : "Not rated yet"}</span>}
                <span className="font-bold text-primary">{isSomali ? "Eeg tababarka" : "View training"}</span>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
