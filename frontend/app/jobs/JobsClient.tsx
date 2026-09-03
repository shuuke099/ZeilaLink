"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight, Bell, Bookmark, Briefcase, Building2, CheckCircle2,
  ChevronDown, Clock3, Loader2, MapPin, Navigation, Search, Share2,
  ShieldCheck, Sparkles, Users, X,
} from "lucide-react";
import { formatDistance } from "date-fns";
import Navbar from "@/components/Navbar";
import { useLanguage } from "@/contexts/LanguageContext";
import { cachedApiGet } from "@/lib/api-cache";
import { getLocalizedJobText, parseJobsResponse, type PublicJob } from "./jobTypes";

type SalaryFilter = "all" | "0-500" | "500-1000" | "1000+";
type SortFilter = "newest" | "oldest" | "salary-high" | "salary-low";
type DateFilter = "all" | "day" | "week" | "month";
type ExperienceFilter = "all" | "entry" | "mid" | "senior";

const formatSalary = (job: PublicJob) => {
  if (job.salaryMin != null && job.salaryMax != null) return `$${job.salaryMin.toLocaleString()} – $${job.salaryMax.toLocaleString()}`;
  if (job.salaryMin != null) return `From $${job.salaryMin.toLocaleString()}`;
  if (job.salaryMax != null) return `Up to $${job.salaryMax.toLocaleString()}`;
  return "Salary negotiable";
};

const salaryMidpoint = (job: PublicJob) => {
  if (job.salaryMin != null && job.salaryMax != null) return (job.salaryMin + job.salaryMax) / 2;
  return job.salaryMin ?? job.salaryMax ?? 0;
};

const toListItems = (value?: string | null) => {
  if (!value?.trim()) return [];
  const lines = value.split(/\r?\n|•/).map((item) => item.replace(/^[-*\d.)\s]+/, "").trim()).filter(Boolean);
  if (lines.length > 1) return lines;
  return value.split(/(?<=[.!?])\s+/).map((item) => item.trim()).filter(Boolean);
};

const experienceMatches = (job: PublicJob, level: ExperienceFilter) => {
  if (level === "all") return true;
  const text = [job.title, job.description, job.requirements, ...(job.tags || [])].join(" ").toLowerCase();
  if (level === "entry") return /entry|junior|assistant|0.?2 year/.test(text);
  if (level === "senior") return /senior|lead|manager|5\+? year|7\+? year/.test(text);
  return !/entry|junior|senior|lead|manager/.test(text);
};

interface JobsClientProps { initialJobs: PublicJob[]; loadError: boolean; renderedAt: string; }

export default function JobsClient({ initialJobs, loadError, renderedAt }: JobsClientProps) {
  const { language } = useLanguage();
  const isSomali = language === "so";
  const [jobs, setJobs] = useState(initialJobs);
  const [search, setSearch] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [locationDraft, setLocationDraft] = useState("");
  const [location, setLocation] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [benefitsOnly, setBenefitsOnly] = useState(false);
  const [salaryRange, setSalaryRange] = useState<SalaryFilter>("all");
  const [experience, setExperience] = useState<ExperienceFilter>("all");
  const [datePosted, setDatePosted] = useState<DateFilter>("all");
  const [sortBy, setSortBy] = useState<SortFilter>("newest");
  const [searching, setSearching] = useState(false);
  const [searchLoadError, setSearchLoadError] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState(initialJobs[0]?.id ?? "");
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [copied, setCopied] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("zeilalink-job-searches") || "[]");
      if (Array.isArray(stored)) setRecentSearches(stored.filter((item): item is string => typeof item === "string").slice(0, 5));
    } catch { /* Ignore invalid data saved by an older version. */ }
  }, []);

  const searchSuggestions = useMemo(() => {
    const query = searchDraft.trim().toLowerCase();
    const values = [
      ...jobs.map((job) => job.title),
      ...jobs.flatMap((job) => job.tags || []),
      "Hiring immediately", "Work from home", "Customer service", "Part-time",
    ];
    return Array.from(new Set(values))
      .filter((value) => !query || value.toLowerCase().includes(query))
      .filter((value) => !recentSearches.some((recent) => recent.toLowerCase() === value.toLowerCase()))
      .slice(0, 7);
  }, [jobs, recentSearches, searchDraft]);

  const locationSuggestions = useMemo(() => {
    const query = locationDraft.trim().toLowerCase();
    return Array.from(new Set(["Remote", ...jobs.map((job) => job.location).filter(Boolean)]))
      .filter((value) => !query || value.toLowerCase().includes(query))
      .slice(0, 8);
  }, [jobs, locationDraft]);

  const filteredAndSortedJobs = useMemo(() => {
    const query = search.trim().toLowerCase();
    const locationQuery = location.trim().toLowerCase();
    const now = new Date(renderedAt).getTime();
    const dateWindow = datePosted === "day" ? 86_400_000 : datePosted === "week" ? 604_800_000 : datePosted === "month" ? 2_592_000_000 : null;
    const filtered = jobs.filter((job) => {
      const searchable = [job.title, job.titleSo || "", job.description, job.descriptionSo || "", job.requirements || "", job.requirementsSo || "", job.benefits || "", job.benefitsSo || "", job.employer?.name || "", job.employer?.nameSo || "", job.location || "", job.employmentType || "", ...(job.tags || [])].join(" ").toLowerCase();
      if (query && !searchable.includes(query)) return false;
      if (locationQuery && !(job.location || "").toLowerCase().includes(locationQuery) && !(locationQuery.includes("remote") && job.remote)) return false;
      if (employmentType && job.employmentType.toLowerCase() !== employmentType.toLowerCase()) return false;
      if (remoteOnly && !job.remote) return false;
      if (benefitsOnly && !job.benefits?.trim()) return false;
      if (!experienceMatches(job, experience)) return false;
      if (dateWindow && now - new Date(job.createdAt).getTime() > dateWindow) return false;
      if (salaryRange !== "all") {
        const midpoint = salaryMidpoint(job);
        if (salaryRange === "0-500" && !(midpoint > 0 && midpoint < 500)) return false;
        if (salaryRange === "500-1000" && !(midpoint >= 500 && midpoint < 1000)) return false;
        if (salaryRange === "1000+" && midpoint < 1000) return false;
      }
      return true;
    });
    return [...filtered].sort((a, b) => {
      if (sortBy === "newest") return +new Date(b.createdAt) - +new Date(a.createdAt);
      if (sortBy === "oldest") return +new Date(a.createdAt) - +new Date(b.createdAt);
      if (sortBy === "salary-high") return salaryMidpoint(b) - salaryMidpoint(a);
      return salaryMidpoint(a) - salaryMidpoint(b);
    });
  }, [jobs, search, location, employmentType, remoteOnly, benefitsOnly, salaryRange, experience, datePosted, sortBy, renderedAt]);

  useEffect(() => {
    if (!filteredAndSortedJobs.some((job) => job.id === selectedJobId)) setSelectedJobId(filteredAndSortedJobs[0]?.id ?? "");
  }, [filteredAndSortedJobs, selectedJobId]);

  const selectedJob = filteredAndSortedJobs.find((job) => job.id === selectedJobId) ?? filteredAndSortedJobs[0];

  const applySearch = async () => {
    const nextSearch = searchDraft.trim();
    const nextLocation = locationDraft.trim();
    if (!nextSearch && !nextLocation) {
      setSearchOpen(true);
      return;
    }
    if (nextSearch) {
      const nextRecent = [nextSearch, ...recentSearches.filter((item) => item.toLowerCase() !== nextSearch.toLowerCase())].slice(0, 5);
      setRecentSearches(nextRecent);
      localStorage.setItem("zeilalink-job-searches", JSON.stringify(nextRecent));
    }
    setSearchOpen(false); setLocationOpen(false);
    setSearch(nextSearch); setLocation(nextLocation); setSearching(true); setSearchLoadError(false);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (nextSearch) params.set("search", nextSearch);
      if (nextLocation) params.set("location", nextLocation);
      const response = await cachedApiGet<unknown>(`/jobs?${params.toString()}`, undefined, 15_000);
      const parsed = parseJobsResponse(response);
      if (!parsed) throw new Error("Invalid jobs response");
      setJobs(parsed);
    } catch { setJobs(initialJobs); setSearchLoadError(true); }
    finally { setSearching(false); }
  };

  const resetFilters = () => {
    setSearchDraft(""); setLocationDraft(""); setSearch(""); setLocation(""); setJobs(initialJobs); setSearchLoadError(false);
    setEmploymentType(""); setRemoteOnly(false); setBenefitsOnly(false); setSalaryRange("all"); setExperience("all"); setDatePosted("all"); setSortBy("newest");
  };

  const toggleSaved = (id: string) => setSavedJobs((current) => {
    const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next;
  });

  const removeRecentSearch = (value: string) => {
    const nextRecent = recentSearches.filter((item) => item !== value);
    setRecentSearches(nextRecent);
    localStorage.setItem("zeilalink-job-searches", JSON.stringify(nextRecent));
  };

  const useCurrentLocation = () => {
    setLocationError("");
    if (!navigator.geolocation) {
      setLocationError(isSomali ? "Goobta lama heli karo." : "Location is not available in this browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.latitude}&lon=${coords.longitude}&zoom=10`);
        if (!response.ok) throw new Error("Location lookup failed");
        const result = await response.json() as { address?: { city?: string; town?: string; village?: string; county?: string; state?: string; state_code?: string; country?: string } };
        const address = result.address || {};
        const city = address.city || address.town || address.village || address.county;
        const region = address.state_code?.replace(/^US-/, "") || address.state;
        const detected = [city, region || (!city ? address.country : "")].filter(Boolean).join(", ");
        if (!detected) throw new Error("No location name returned");
        setLocationDraft(detected);
        setLocation(detected);
        setLocationOpen(false);
      } catch {
        setLocationError(isSomali ? "Magaca goobta lama helin. Isku day inaad qorto magaalada." : "We could not identify the city. Try entering it manually.");
      } finally { setLocating(false); }
    }, () => {
      setLocating(false);
      setLocationError(isSomali ? "Fadlan oggolow goobta qalabkaaga." : "Allow location access to show jobs near you.");
    }, { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 });
  };

  const shareSelectedJob = async () => {
    if (!selectedJob) return;
    const url = `${window.location.origin}/jobs/${selectedJob.slug || selectedJob.id}`;
    try {
      if (navigator.share) await navigator.share({ title: selectedJob.title, url }); else await navigator.clipboard.writeText(url);
      setCopied(true); window.setTimeout(() => setCopied(false), 1600);
    } catch { /* The visitor may cancel the native share sheet. */ }
  };

  const hasActiveFilters = Boolean(search || location || employmentType || remoteOnly || benefitsOnly || salaryRange !== "all" || experience !== "all" || datePosted !== "all");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="mx-auto max-w-[1440px] px-4 pb-16 pt-20 sm:px-6 lg:px-8">
        <form onSubmit={(event) => { event.preventDefault(); void applySearch(); }} className="grid gap-2 rounded-2xl border border-border bg-surface p-2 shadow-sm md:grid-cols-[1fr_1fr_auto]">
          <div className="relative min-w-0">
            <label className={`flex h-11 min-w-0 items-center gap-2 rounded-xl border px-3 transition ${searchOpen ? "border-primary bg-surface ring-2 ring-primary/15" : "border-transparent bg-surface-muted"}`}>
              <Search size={16} className="shrink-0 text-muted"/><span className="sr-only">{isSomali ? "Raadi shaqo" : "Search jobs"}</span>
              <input value={searchDraft} onFocus={() => { setSearchOpen(true); setLocationOpen(false); }} onBlur={() => window.setTimeout(() => setSearchOpen(false), 150)} onChange={(event) => { setSearchDraft(event.target.value); setSearchOpen(true); }} placeholder={isSomali ? "Magaca shaqada ama shirkadda" : "Job title, skill, or company"} autoComplete="off" className="w-full bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted"/>
              {searchDraft && <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => setSearchDraft("")} className="rounded-md p-1 text-muted hover:text-heading" aria-label="Clear search"><X size={14}/></button>}
            </label>
            {searchOpen && (
              <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-border bg-surface p-2 shadow-[0_18px_50px_rgba(15,23,42,.18)]">
                {recentSearches.length > 0 && <div><p className="px-3 pb-1 pt-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-muted">{isSomali ? "Raadintii dhoweyd" : "Recent searches"}</p>{recentSearches.map((item) => <div key={item} className="flex items-center rounded-lg hover:bg-surface-muted"><button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => { setSearchDraft(item); setSearch(item); setSearchOpen(false); }} className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2 text-left text-xs font-semibold text-foreground"><Clock3 size={14} className="shrink-0 text-muted"/><span className="truncate">{item}</span></button><button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => removeRecentSearch(item)} aria-label={`Remove ${item}`} className="mr-1 rounded-md p-2 text-muted hover:text-heading"><X size={14}/></button></div>)}</div>}
                <p className="px-3 pb-1 pt-3 text-[10px] font-extrabold uppercase tracking-[0.14em] text-muted">{isSomali ? "Talooyinka raadinta" : "Search suggestions"}</p>
                {searchSuggestions.map((item) => <button key={item} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => { setSearchDraft(item); setSearch(item); setSearchOpen(false); }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-foreground hover:bg-surface-muted"><Search size={14} className="shrink-0 text-muted"/><span className="truncate">{item}</span></button>)}
              </div>
            )}
          </div>
          <div className="relative min-w-0">
            <label className={`flex h-11 min-w-0 items-center gap-2 rounded-xl border px-3 transition ${locationOpen ? "border-primary bg-surface ring-2 ring-primary/15" : "border-transparent bg-surface-muted"}`}>
              <MapPin size={16} className="shrink-0 text-muted"/><span className="sr-only">{isSomali ? "Goobta" : "Location"}</span>
              <input value={locationDraft} onFocus={() => { setLocationOpen(true); setSearchOpen(false); }} onBlur={() => window.setTimeout(() => setLocationOpen(false), 150)} onChange={(event) => { setLocationDraft(event.target.value); setLocationOpen(true); }} placeholder={isSomali ? 'Magaalo, gobol, ama "remote"' : 'City, state, zip code, or "Remote"'} autoComplete="off" className="w-full bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted"/>
            </label>
            {locationOpen && (
              <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-border bg-surface p-2 shadow-[0_18px_50px_rgba(15,23,42,.18)]">
                <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={useCurrentLocation} disabled={locating} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-extrabold text-primary hover:bg-primary/10 disabled:opacity-60">{locating ? <Loader2 size={15} className="animate-spin"/> : <Navigation size={15}/>}<span>{locating ? (isSomali ? "Helaya goobta..." : "Finding your location...") : isSomali ? "Isticmaal goobtayda hadda" : "Use my current location"}</span></button>
                {locationError && <p className="px-3 py-2 text-[10px] font-semibold text-red-500">{locationError}</p>}
                <p className="px-3 pb-1 pt-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-muted">{isSomali ? "Goobaha la heli karo" : "Suggested locations"}</p>
                {locationSuggestions.map((item) => <button key={item} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => { setLocationDraft(item); setLocation(item); setLocationOpen(false); }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-foreground hover:bg-surface-muted"><MapPin size={14} className="shrink-0 text-muted"/><span className="truncate">{item}</span></button>)}
              </div>
            )}
          </div>
          <button type="submit" disabled={searching} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-7 text-sm font-bold text-white shadow-[0_8px_22px_rgba(var(--color-primary-rgb),.24)] transition hover:-translate-y-0.5 hover:bg-primary-dark disabled:opacity-60">
            {searching ? (isSomali ? "Raadinaya..." : "Searching...") : isSomali ? "Raadi" : "Search"}<ArrowRight size={15}/>
          </button>
        </form>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <FilterSelect label={isSomali ? "Nooca shaqada" : "Job type"} value={employmentType} onChange={setEmploymentType} options={[["", isSomali ? "Dhammaan noocyada" : "All job types"], ["Full-time", "Full-time"], ["Part-time", "Part-time"], ["Contract", "Contract"]]}/>
          <FilterToggle active={remoteOnly} onClick={() => setRemoteOnly((value) => !value)}>{isSomali ? "Fogaan" : "Remote"}</FilterToggle>
          <FilterSelect label={isSomali ? "Mushahar" : "Salary"} value={salaryRange} onChange={(value) => setSalaryRange(value as SalaryFilter)} options={[["all", isSomali ? "Mushahar kasta" : "Any salary"], ["0-500", "$0 – $500"], ["500-1000", "$500 – $1,000"], ["1000+", "$1,000+"]]}/>
          <FilterSelect label={isSomali ? "Khibrad" : "Experience level"} value={experience} onChange={(value) => setExperience(value as ExperienceFilter)} options={[["all", isSomali ? "Khibrad kasta" : "Any experience"], ["entry", "Entry level"], ["mid", "Mid level"], ["senior", "Senior level"]]}/>
          <FilterToggle active={benefitsOnly} onClick={() => setBenefitsOnly((value) => !value)}>{isSomali ? "Faa'iidooyin" : "Benefits"}</FilterToggle>
          <FilterSelect label={isSomali ? "Taariikhda" : "Date posted"} value={datePosted} onChange={(value) => setDatePosted(value as DateFilter)} options={[["all", isSomali ? "Waqti kasta" : "Any time"], ["day", "Past 24 hours"], ["week", "Past week"], ["month", "Past month"]]}/>
          {hasActiveFilters && <button type="button" onClick={resetFilters} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface px-4 text-xs font-bold text-muted transition hover:border-primary/40 hover:text-primary"><X size={13}/>{isSomali ? "Nadiifi" : "Clear all"}</button>}
        </div>

        <div className="mt-1 flex items-center justify-between gap-3 rounded-xl border border-primary/15 bg-primary/5 px-4 py-2.5 text-xs text-foreground">
          <p className="flex min-w-0 items-center gap-2"><Sparkles size={15} className="shrink-0 text-primary"/><span className="truncate">{isSomali ? "Shaqooyin la xaqiijiyey oo ka socda loo-shaqeeyayaal lagu kalsoon yahay." : "Verified opportunities from trusted employers, updated as new roles are published."}</span></p>
          <button type="button" onClick={() => setAlertsEnabled((value) => !value)} className="hidden shrink-0 font-bold text-primary hover:text-primary-dark sm:block">{alertsEnabled ? (isSomali ? "Digniinadu waa shidan yihiin" : "Alerts enabled") : isSomali ? "Hel digniino" : "Get job alerts"}</button>
        </div>

        {(loadError || searchLoadError) && jobs.length > 0 && <p role="status" className="mt-4 rounded-xl border border-amber-300/40 bg-amber-400/10 px-4 py-3 text-sm font-semibold text-foreground">{isSomali ? "Raadinta tooska ah hadda lama heli karo; natiijooyinkani waxay adeegsanayaan shaqooyinkii ugu dambeeyay." : "Live search is temporarily unavailable, so these results use the latest jobs already loaded."}</p>}

        <section className="mt-5">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2"><h1 className="text-xl font-extrabold tracking-tight text-heading sm:text-2xl">{employmentType || (isSomali ? "Shaqooyinka ugu dambeeyay" : "Latest job opportunities")}</h1><span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-extrabold text-primary">{filteredAndSortedJobs.length}</span></div>
              <p className="mt-1 text-xs text-muted">{isSomali ? "Dooro shaqo si aad u aragto faahfaahinta" : "Select a role to review the full opportunity"}</p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setAlertsEnabled((value) => !value)} aria-pressed={alertsEnabled} className={`hidden h-9 items-center gap-2 rounded-full border px-3 text-xs font-bold transition sm:flex ${alertsEnabled ? "border-primary bg-primary text-white" : "border-border bg-surface text-muted hover:text-primary"}`}><Bell size={14}/>{isSomali ? "Digniin" : "Alerts"}<span className={`h-2 w-2 rounded-full ${alertsEnabled ? "bg-white" : "bg-border"}`}/></button>
              <FilterSelect label={isSomali ? "Kala saar" : "Sort"} value={sortBy} onChange={(value) => setSortBy(value as SortFilter)} options={[["newest", "Newest"], ["oldest", "Oldest"], ["salary-high", "Highest salary"], ["salary-low", "Lowest salary"]]} compact/>
            </div>
          </div>

          {loadError && jobs.length === 0 ? <EmptyState title={isSomali ? "Liiska shaqooyinka hadda lama heli karo." : "Job listings are temporarily unavailable."}/> : filteredAndSortedJobs.length === 0 ? <EmptyState title={isSomali ? "Shaqooyin lama helin." : "No jobs match your current filters."} action={resetFilters}/> : (
            <div className="grid items-start gap-5 lg:grid-cols-[minmax(340px,0.78fr)_minmax(0,1.45fr)] xl:grid-cols-[430px_minmax(0,1fr)]">
              <div className="space-y-3 lg:max-h-[2158px] lg:overflow-y-auto lg:overscroll-contain lg:pr-2 lg:[scrollbar-width:none] lg:[&::-webkit-scrollbar]:hidden">
                {filteredAndSortedJobs.map((job) => <JobListCard key={job.id} job={job} isSomali={isSomali} language={language} renderedAt={renderedAt} selected={job.id === selectedJob?.id} saved={savedJobs.has(job.id)} onSelect={() => setSelectedJobId(job.id)} onSave={() => toggleSaved(job.id)}/>) }
              </div>
              {selectedJob && (
                <JobPreview job={selectedJob} language={language} isSomali={isSomali} saved={savedJobs.has(selectedJob.id)} copied={copied} onSave={() => toggleSaved(selectedJob.id)} onShare={() => void shareSelectedJob()}/>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function FilterToggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return <button type="button" onClick={onClick} aria-pressed={active} className={`h-9 shrink-0 rounded-full border px-4 text-xs font-bold transition ${active ? "border-primary bg-primary text-white shadow-sm" : "border-border bg-surface text-foreground hover:border-primary/40 hover:text-primary"}`}>{children}</button>;
}

function FilterSelect({ label, value, onChange, options, compact = false }: { label: string; value: string; onChange: (value: string) => void; options: string[][]; compact?: boolean }) {
  return <label className="relative shrink-0"><span className="sr-only">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className={`${compact ? "h-9 pl-3 pr-8" : "h-9 pl-4 pr-9"} appearance-none rounded-full border border-border bg-surface text-xs font-bold text-foreground outline-none transition hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/15`}>{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select><ChevronDown size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"/></label>;
}

function JobListCard({ job, language, isSomali, renderedAt, selected, saved, onSelect, onSave }: { job: PublicJob; language: "en" | "so"; isSomali: boolean; renderedAt: string; selected: boolean; saved: boolean; onSelect: () => void; onSave: () => void }) {
  const localized = getLocalizedJobText(job, language);
  const href = `/jobs/${job.slug || job.id}`;
  return <article className={`group relative overflow-hidden rounded-2xl border bg-surface p-4 shadow-[0_3px_12px_rgba(15,23,42,.04)] transition lg:h-[205px] ${selected ? "border-primary ring-2 ring-primary/10" : "border-border hover:border-primary/40 hover:shadow-lg"}`}>
    <button type="button" onClick={onSelect} className="absolute inset-0 z-0 hidden cursor-pointer lg:block" aria-label={`${isSomali ? "Fiiri" : "Preview"} ${localized.title}`}/>
    <Link href={href} className="absolute inset-0 z-0 lg:hidden" aria-label={`${isSomali ? "Fur" : "Open"} ${localized.title}`}/>
    <div className="pointer-events-none relative z-[1]">
      <div className="flex items-start gap-3">
        <Logo job={job}/><div className="min-w-0 flex-1"><p className="truncate text-xs font-extrabold text-heading">{localized.employerName}</p><p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-muted"><MapPin size={11}/>{job.remote ? (isSomali ? "Shaqo fog" : "Remote friendly") : job.location}</p></div>
        <button type="button" onClick={onSave} aria-label={saved ? "Remove saved job" : "Save job"} className="pointer-events-auto rounded-lg p-2 text-muted transition hover:bg-primary/10 hover:text-primary"><Bookmark size={17} className={saved ? "fill-primary text-primary" : ""}/></button>
      </div>
      <h2 className="mt-3 line-clamp-2 text-base font-extrabold leading-snug text-heading transition group-hover:text-primary">{localized.title}</h2>
      <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted">{localized.description}</p>
      <div className="mt-3 flex flex-wrap gap-1.5"><span className="rounded-md bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">{job.employmentType}</span>{job.remote && <span className="rounded-md bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-600">Remote</span>}{(job.tags || []).slice(0, 1).map((tag) => <span key={tag} className="rounded-md bg-surface-muted px-2 py-1 text-[10px] font-semibold text-muted">{tag}</span>)}</div>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3"><p className="truncate text-sm font-extrabold text-primary">{formatSalary(job)}</p><p className="shrink-0 text-[10px] font-medium text-muted">{formatDistance(new Date(job.createdAt), new Date(renderedAt), { addSuffix: true })}</p></div>
    </div>
  </article>;
}

function JobPreview({ job, language, isSomali, saved, copied, onSave, onShare }: { job: PublicJob; language: "en" | "so"; isSomali: boolean; saved: boolean; copied: boolean; onSave: () => void; onShare: () => void }) {
  const localized = getLocalizedJobText(job, language);
  const responsibilities = toListItems(localized.description);
  const requirements = toListItems(localized.requirements);
  const benefits = toListItems(localized.benefits);
  const detailHref = `/jobs/${job.slug || job.id}`;
  const applyHref = `/jobs/${encodeURIComponent(job.id)}/apply`;
  return <aside className="sticky top-20 hidden max-h-[calc(100vh-96px)] overflow-y-auto overscroll-contain rounded-2xl border border-border bg-surface shadow-[0_12px_40px_rgba(15,23,42,.08)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:block">
    <div className="border-b border-border bg-gradient-to-br from-primary/10 via-surface to-surface p-6 xl:p-7">
      <div className="flex items-start justify-between gap-5"><div className="flex min-w-0 gap-3"><Logo job={job} large/><div className="min-w-0"><p className="text-xs font-bold text-primary">{localized.employerName}</p><h2 className="mt-1 text-2xl font-black leading-tight tracking-tight text-heading xl:text-[28px]">{localized.title}</h2></div></div><span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-emerald-600"><ShieldCheck size={13}/>{isSomali ? "La xaqiijiyey" : "Verified role"}</span></div>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs"><Meta icon={<MapPin size={13}/>} value={job.location}/><Meta icon={<Briefcase size={13}/>} value={job.employmentType}/>{job.remote && <Meta icon={<CheckCircle2 size={13}/>} value="Remote"/>}<span className="inline-flex items-center rounded-lg bg-surface px-2.5 py-1.5 font-extrabold text-primary shadow-sm">{formatSalary(job)}</span></div>
      <div className="mt-5 flex items-center gap-2"><Link href={applyHref} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-extrabold text-white shadow-[0_8px_22px_rgba(var(--color-primary-rgb),.25)] transition hover:-translate-y-0.5 hover:bg-primary-dark">{isSomali ? "Codso shaqadan" : "Apply on company site"}<ArrowRight size={15}/></Link><IconButton label="Save job" onClick={onSave}><Bookmark size={17} className={saved ? "fill-primary text-primary" : ""}/></IconButton><div className="relative"><IconButton label="Share job" onClick={onShare}><Share2 size={17}/></IconButton>{copied && <span className="absolute -bottom-7 right-0 whitespace-nowrap rounded bg-heading px-2 py-1 text-[9px] text-background">Copied</span>}</div></div>
    </div>
    <div className="p-6 xl:p-7">
      <PreviewSection title={isSomali ? "Waajibaadka muhiimka ah" : "Key responsibilities"} items={responsibilities} fallback={localized.description}/>
      <PreviewSection title={isSomali ? "Shuruudaha iyo aqoonta" : "Requirements & qualifications"} items={requirements} fallback={isSomali ? "Faahfaahinta shuruudaha kala xiriir loo-shaqeeyaha." : "Contact the employer for complete qualification requirements."}/>
      {benefits.length > 0 && (
        <PreviewSection title={isSomali ? "Faa'iidooyinka" : "Benefits"} items={benefits}/>
      )}
      <div className="mt-6 rounded-2xl border border-border bg-surface-muted p-4"><div className="flex items-start gap-3"><Logo job={job}/><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><h3 className="text-sm font-extrabold text-heading">{isSomali ? "Ku saabsan" : "About"} {localized.employerName}</h3>{job.employer.slug && <Link href={`/businesses/${job.employer.slug}`} className="shrink-0 text-[10px] font-bold text-primary hover:underline">{isSomali ? "Arag bogga" : "View profile"}</Link>}</div><p className="mt-1 line-clamp-3 text-xs leading-5 text-muted">{localized.employerDescription || (isSomali ? "Loo-shaqeeye lagu kalsoon yahay oo ka tirsan bulshada ZeilaLink." : "A trusted employer in the ZeilaLink community.")}</p><div className="mt-3 flex flex-wrap gap-3 text-[10px] font-semibold text-muted"><span className="inline-flex items-center gap-1"><Users size={12} className="text-primary"/>{isSomali ? "Loo-shaqeeye la xaqiijiyey" : "Verified employer"}</span><span className="inline-flex items-center gap-1"><Clock3 size={12} className="text-primary"/>{isSomali ? "Jawaab firfircoon" : "Actively hiring"}</span></div></div></div></div>
    </div>
    <div className="flex items-center justify-between gap-4 border-t border-border bg-surface px-6 py-4 xl:px-7"><Link href={detailHref} className="text-xs font-bold text-muted transition hover:text-primary">{isSomali ? "Arag faahfaahinta buuxda" : "View full job details"}</Link><Link href={applyHref} className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-xs font-extrabold text-white transition hover:bg-primary-dark">{isSomali ? "Hadda codso" : "Apply now"}<ArrowRight size={13}/></Link></div>
  </aside>;
}

function Logo({ job, large = false }: { job: PublicJob; large?: boolean }) {
  return <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-surface-muted ${large ? "h-12 w-12" : "h-11 w-11"}`}>{job.employer.avatarUrl || job.employer.logoUrl ? <img src={job.employer.avatarUrl ?? job.employer.logoUrl ?? undefined} alt="" className="h-full w-full object-cover"/> : <Building2 size={large ? 22 : 19} className="text-primary"/>}</div>;
}

function Meta({ icon, value }: { icon: ReactNode; value: string }) { return <span className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-2.5 py-1.5 font-semibold text-foreground shadow-sm"><span className="text-primary">{icon}</span>{value}</span>; }
function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) { return <button type="button" onClick={onClick} className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-surface text-muted transition hover:border-primary/40 hover:text-primary" aria-label={label}>{children}</button>; }
function PreviewSection({ title, items, fallback }: { title: string; items: string[]; fallback?: string }) { return <section className="mb-6 last:mb-0"><h3 className="text-sm font-extrabold text-heading">{title}</h3>{items.length > 0 ? <ul className="mt-3 space-y-2.5">{items.slice(0, 7).map((item, index) => <li key={`${index}-${item}`} className="flex gap-2.5 text-xs leading-5 text-muted"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"/><span>{item}</span></li>)}</ul> : fallback ? <p className="mt-2 text-xs leading-5 text-muted">{fallback}</p> : null}</section>; }
function EmptyState({ title, action }: { title: string; action?: () => void }) { return <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center"><Briefcase className="mx-auto text-primary" size={28}/><p className="mt-3 text-base font-extrabold text-heading">{title}</p>{action && <button type="button" onClick={action} className="mt-4 text-sm font-bold text-primary hover:underline">Clear filters</button>}</div>; }
