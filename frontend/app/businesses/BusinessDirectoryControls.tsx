"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { FormEvent, useCallback, useEffect, useRef } from "react";

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
    <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <form
        ref={formRef}
        action="/businesses"
        onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); applyFilters(event.currentTarget); }}
        className="grid items-center gap-3 lg:grid-cols-[minmax(280px,1fr)_180px_180px_150px_110px_auto]"
      >
        <label className="relative min-w-[260px] flex-[1.6_1_340px]"><span className="sr-only">{isSomali ? "Raadi ganacsi" : "Search businesses"}</span><button type="button" aria-label={isSomali ? "Diiradda saar raadinta" : "Focus business search"} onClick={(event) => { event.preventDefault(); searchInputRef.current?.focus(); }} className="absolute left-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-200 hover:text-primary"><Search size={18}/></button><input ref={searchInputRef} type="search" name="q" defaultValue={searchParams.get("q") || ""} onChange={scheduleFilters} placeholder={isSomali ? "Raadi ganacsi ama adeeg..." : "Search a business or service..."} className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"/></label>
        <select name="type" defaultValue={searchParams.get("type") || ""} onChange={() => applyFilters()} className="h-12 min-w-[150px] rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-primary">
          <option value="">{isSomali ? "Dhammaan noocyada" : "All types"}</option>
          <option value="business">{isSomali ? "Ganacsiyada deegaanka" : "Local businesses"}</option>
          <option value="employer">{isSomali ? "Shaqeeyayaasha" : "Employers"}</option>
          <option value="provider">{isSomali ? "Bixiyeyaasha tababarka" : "Training providers"}</option>
        </select>
        <select name="category" defaultValue={searchParams.get("category") || ""} onChange={() => applyFilters()} className="h-12 min-w-[155px] rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-primary">
          <option value="">{isSomali ? "Dhammaan qaybaha" : "All categories"}</option>
          {categories.map((category) => <option key={category}>{category}</option>)}
        </select>
        <input name="city" defaultValue={searchParams.get("city") || ""} onChange={scheduleFilters} placeholder={isSomali ? "Magaalada" : "City or location"} className="h-12 min-w-[150px] rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-primary" />
        <select name="radius" defaultValue={searchParams.get("radius") || "50"} onChange={() => applyFilters()} className="h-12 min-w-[105px] rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-primary">
          <option value="10">10 km</option><option value="25">25 km</option><option value="50">50 km</option><option value="100">100 km</option>
        </select>
        {(searchParams.get("q") || searchParams.get("type") || searchParams.get("category") || searchParams.get("city")) && <button type="button" onClick={clearFilters} className="inline-flex h-12 shrink-0 items-center gap-2 rounded-2xl px-3 text-xs font-black text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"><X size={16}/>{isSomali ? "Nadiifi" : "Clear"}</button>}
      </form>
    </section>
  );
}
