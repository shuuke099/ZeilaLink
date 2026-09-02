"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { MapPin, Search, X } from "lucide-react";
import { FormEvent, useCallback, useEffect, useRef } from "react";
import { getBusinessCategoryLabel } from "./businessUi";

const categories = ["Retail", "Restaurant", "Health", "Education", "Technology", "Construction", "Professional Services", "Transport", "Hospitality", "Other"];
const filterNames = ["q", "type", "category", "city", "radius"] as const;

export default function BusinessDirectoryControls({ isSomali }: { isSomali: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const formRef = useRef<HTMLFormElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const requestedLocation = useRef(false);

  const applyFilters = useCallback((form = formRef.current) => {
    if (!form) return;
    const values = new FormData(form);
    const params = new URLSearchParams(searchParams.toString());
    for (const name of filterNames) {
      const value = String(values.get(name) || "").trim();
      if (value) params.set(name, value);
      else params.delete(name);
    }
    params.delete("page");
    router.replace(`/businesses${params.size ? `?${params.toString()}` : ""}`, { scroll: false });
  }, [router, searchParams]);

  const scheduleFilters = () => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => applyFilters(), 450);
  };

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  useEffect(() => {
    if (requestedLocation.current || searchParams.has("lat") || searchParams.has("lng") || !navigator.geolocation) return;
    requestedLocation.current = true;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("lat", coords.latitude.toFixed(6));
        params.set("lng", coords.longitude.toFixed(6));
        params.set("radius", params.get("radius") || "50");
        params.delete("page");
        router.replace(`/businesses?${params.toString()}`, { scroll: false });
      },
      () => undefined,
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 300000 },
    );
  }, [router, searchParams]);

  const clearFilters = () => {
    const params = new URLSearchParams();
    if (searchParams.get("lat")) params.set("lat", searchParams.get("lat")!);
    if (searchParams.get("lng")) params.set("lng", searchParams.get("lng")!);
    params.set("radius", "50");
    router.replace(`/businesses?${params.toString()}`, { scroll: false });
  };

  return (
    <section className="rounded-xl border border-border bg-surface p-2.5 shadow-[0_2px_8px_rgba(15,23,42,.04)] transition-colors dark:bg-surface dark:shadow-[0_10px_30px_rgba(0,0,0,.28)]">
      <form
        ref={formRef}
        action="/businesses"
        onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); applyFilters(event.currentTarget); }}
        className="grid grid-cols-2 items-center gap-2 md:grid-cols-[minmax(280px,1fr)_180px_180px_110px_auto]"
      >
        <label className="relative col-span-2 min-w-0 md:col-span-1"><span className="sr-only">{isSomali ? "Raadi ganacsi" : "Search businesses"}</span><button type="button" aria-label={isSomali ? "Diiradda saar raadinta" : "Focus business search"} onClick={(event) => { event.preventDefault(); searchInputRef.current?.focus(); }} className="absolute left-2 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center text-muted transition hover:text-primary"><Search size={15}/></button><input ref={searchInputRef} type="search" name="q" defaultValue={searchParams.get("q") || ""} onChange={scheduleFilters} placeholder={isSomali ? "Raadi ganacsi ama adeeg..." : "Search businesses..."} className="h-10 w-full rounded-lg border border-border bg-surface-muted pl-9 pr-3 text-[11px] font-medium text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-surface-muted"/></label>
        <select name="type" defaultValue={searchParams.get("type") || ""} onChange={() => applyFilters()} className="hidden h-10 min-w-0 rounded-lg border border-border bg-surface-muted px-3 text-[11px] font-medium text-foreground outline-none focus:border-primary dark:bg-surface-muted md:block">
          <option value="">{isSomali ? "Dhammaan noocyada" : "All types"}</option>
          <option value="business">{isSomali ? "Ganacsiyada deegaanka" : "Local businesses"}</option>
          <option value="employer">{isSomali ? "Shaqeeyayaasha" : "Employers"}</option>
          <option value="provider">{isSomali ? "Bixiyeyaasha tababarka" : "Training providers"}</option>
        </select>
        <select name="category" defaultValue={searchParams.get("category") || ""} onChange={() => applyFilters()} className="h-10 min-w-0 rounded-lg border border-border bg-surface-muted px-2 text-[10px] font-medium text-foreground outline-none focus:border-primary dark:bg-surface-muted md:px-3 md:text-[11px]">
          <option value="">{isSomali ? "Dhammaan qaybaha" : "All categories"}</option>
          {categories.map((category) => <option key={category} value={category}>{getBusinessCategoryLabel(category, isSomali)}</option>)}
        </select>
        <label className="relative min-w-0"><MapPin className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted" size={13}/><input name="city" defaultValue={searchParams.get("city") || ""} onChange={scheduleFilters} placeholder={isSomali ? "Magaalada" : "City or location"} className="h-10 w-full min-w-0 rounded-lg border border-border bg-surface-muted pl-7 pr-2 text-[10px] font-medium text-foreground outline-none placeholder:text-muted focus:border-primary dark:bg-surface-muted md:text-[11px]" /></label>
        <select name="radius" defaultValue={searchParams.get("radius") || "50"} onChange={() => applyFilters()} className="hidden h-10 min-w-0 rounded-lg border border-border bg-surface-muted px-2 text-[10px] font-medium text-foreground outline-none focus:border-primary dark:bg-surface-muted md:block">
          <option value="10">10 km</option><option value="25">25 km</option><option value="50">50 km</option><option value="100">100 km</option>
        </select>
        {(searchParams.get("q") || searchParams.get("type") || searchParams.get("category") || searchParams.get("city")) && <button type="button" onClick={clearFilters} className="hidden h-10 shrink-0 items-center gap-1 rounded-lg px-2 text-[10px] font-bold text-muted transition hover:bg-surface-muted hover:text-heading md:inline-flex"><X size={14}/>{isSomali ? "Nadiifi" : "Clear"}</button>}
      </form>
    </section>
  );
}
