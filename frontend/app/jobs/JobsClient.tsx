"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Briefcase,
  Building2,
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { formatDistance } from "date-fns";
import Navbar from "@/components/Navbar";
import { useLanguage } from "@/contexts/LanguageContext";
import { cachedApiGet } from "@/lib/api-cache";
import {
  getLocalizedJobText,
  parseJobsResponse,
  type PublicJob,
} from "./jobTypes";

type SalaryFilter = "all" | "0-500" | "500-1000" | "1000+";
type SortFilter = "newest" | "oldest" | "salary-high" | "salary-low";

const formatSalary = (job: PublicJob) => {
  const { salaryMin, salaryMax } = job;
  if (salaryMin != null && salaryMax != null) {
    return `$${salaryMin.toLocaleString()} - $${salaryMax.toLocaleString()}`;
  }
  if (salaryMin != null) return `From $${salaryMin.toLocaleString()}`;
  if (salaryMax != null) return `Up to $${salaryMax.toLocaleString()}`;
  return "Salary negotiable";
};

const salaryMidpoint = (job: PublicJob) => {
  const { salaryMin, salaryMax } = job;
  if (salaryMin != null && salaryMax != null)
    return (salaryMin + salaryMax) / 2;
  if (salaryMin != null) return salaryMin;
  if (salaryMax != null) return salaryMax;
  return 0;
};

interface JobsClientProps {
  initialJobs: PublicJob[];
  loadError: boolean;
  renderedAt: string;
}

export default function JobsClient({
  initialJobs,
  loadError,
  renderedAt,
}: JobsClientProps) {
  const { language } = useLanguage();

  const [jobs, setJobs] = useState(initialJobs);
  const [search, setSearch] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [locationDraft, setLocationDraft] = useState("");
  const [filters, setFilters] = useState({
    location: "",
    employmentType: "",
    remote: "",
  });

  const [salaryRange, setSalaryRange] = useState<SalaryFilter>("all");
  const [sortBy, setSortBy] = useState<SortFilter>("newest");
  const [searching, setSearching] = useState(false);
  const [searchLoadError, setSearchLoadError] = useState(false);

  const filteredAndSortedJobs = useMemo(() => {
    const query = search.trim().toLowerCase();
    const locationQuery = filters.location.trim().toLowerCase();

    const filtered = jobs.filter((job) => {
      if (query) {
        const searchable = [
          job.title,
          job.titleSo || "",
          job.description,
          job.descriptionSo || "",
          job.requirements || "",
          job.requirementsSo || "",
          job.benefits || "",
          job.benefitsSo || "",
          job.employer?.name || "",
          job.employer?.nameSo || "",
          job.location || "",
          job.employmentType || "",
          ...(job.tags || []),
        ]
          .join(" ")
          .toLowerCase();

        const categoryTokens = (job.employmentType || "")
          .toLowerCase()
          .split(/[\s/_-]+/)
          .filter(Boolean);
        const categoryStartsWith = categoryTokens.some((token) =>
          token.startsWith(query),
        );

        if (!searchable.includes(query) && !categoryStartsWith) {
          return false;
        }
      }

      if (locationQuery) {
        const normalizedLocation = (job.location || "").toLowerCase();
        const remoteMatch = locationQuery.includes("remote") && job.remote;
        if (!normalizedLocation.includes(locationQuery) && !remoteMatch) {
          return false;
        }
      }

      if (
        filters.employmentType &&
        job.employmentType.toLowerCase() !==
          filters.employmentType.toLowerCase()
      ) {
        return false;
      }

      if (salaryRange === "all") return true;

      const midpoint = salaryMidpoint(job);
      if (salaryRange === "0-500") return midpoint > 0 && midpoint < 500;
      if (salaryRange === "500-1000") return midpoint >= 500 && midpoint < 1000;
      if (salaryRange === "1000+") return midpoint >= 1000;
      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "newest")
        return +new Date(b.createdAt) - +new Date(a.createdAt);
      if (sortBy === "oldest")
        return +new Date(a.createdAt) - +new Date(b.createdAt);
      if (sortBy === "salary-high")
        return salaryMidpoint(b) - salaryMidpoint(a);
      return salaryMidpoint(a) - salaryMidpoint(b);
    });

    return sorted;
  }, [
    jobs,
    salaryRange,
    sortBy,
    search,
    filters.location,
    filters.employmentType,
  ]);

  const applySearch = async () => {
    const nextSearch = searchDraft.trim();
    const nextLocation = locationDraft.trim();
    setSearch(nextSearch);
    setFilters((prev) => ({ ...prev, location: nextLocation }));
    setSearching(true);
    setSearchLoadError(false);

    try {
      const params = new URLSearchParams({ limit: "100" });
      if (nextSearch) params.set("search", nextSearch);
      if (nextLocation) params.set("location", nextLocation);
      const response = await cachedApiGet<unknown>(
        `/jobs?${params.toString()}`,
        undefined,
        15_000,
      );
      const parsed = parseJobsResponse(response);
      if (!parsed) throw new Error("Invalid jobs response");
      setJobs(parsed);
    } catch {
      // Keep the server-rendered records available as a useful fallback.
      setJobs(initialJobs);
      setSearchLoadError(true);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-[1440px] px-4 pb-14 pt-20 sm:px-6 lg:px-8">
        <section className="relative min-h-[150px] overflow-hidden rounded-xl border border-violet-100 bg-gradient-to-r from-white via-[#f8f7ff] to-[#eeeaff] px-5 py-7 sm:px-7">
          <div className="relative z-10 max-w-xl">
          <h1 className="text-[28px] font-extrabold tracking-[-0.035em] text-slate-950 sm:text-[32px]">
            {language === "en" ? "Jobs & Opportunities" : "Shaqooyin & Fursado"}
          </h1>
          <p className="mt-2 text-[12px] font-medium leading-5 text-slate-600">
            {language === "en"
              ? "Browse curated opportunities from top employers on ZeilaLink and discover your next career move."
              : "Soo eeg fursadaha shaqo ee la kala xulay oo ka socda shirkadaha ugu wanaagsan."}
          </p>
          <p className="mt-5 flex items-center gap-2 text-[10px] font-bold text-slate-700"><Briefcase size={14} className="text-primary"/><span className="text-primary">{jobs.length}</span>{language === "en" ? "jobs available" : "shaqo ayaa diyaar ah"}</p>
          </div>
          <div aria-hidden="true" className="absolute bottom-2 right-8 hidden items-end gap-3 text-violet-300 md:flex"><Briefcase size={68} strokeWidth={1.2}/><Sparkles size={92} strokeWidth={1}/></div>
        </section>

        <section className="mt-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void applySearch();
            }}
            className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm"
          >
            <div className="grid gap-2 md:flex md:items-center">
              <div className="flex h-10 flex-1 items-center gap-2 rounded-lg bg-slate-50 px-3">
                <Search className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  type="text"
                  value={searchDraft}
                  onChange={(e) => setSearchDraft(e.target.value)}
                  placeholder={
                    language === "en"
                      ? "Job title, keywords, or company"
                      : "Magaca shaqada, erayo muhiim ah, ama shirkad"
                  }
                  className="w-full bg-transparent text-[11px] font-medium text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>

              <div className="hidden h-10 w-px bg-slate-300 md:block" />

              <div className="flex h-10 flex-1 items-center gap-2 rounded-lg bg-slate-50 px-3">
                <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  type="text"
                  value={locationDraft}
                  onChange={(e) => setLocationDraft(e.target.value)}
                  placeholder={
                    language === "en"
                      ? 'City, state, or "remote"'
                      : 'Magaalo, gobol, ama "remote"'
                  }
                  className="w-full bg-transparent text-[11px] font-medium text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>

              <button
                type="submit"
                disabled={searching}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 text-[11px] font-bold text-white transition hover:bg-primary-darker md:ml-2 md:w-auto"
              >
                <Search className="h-4 w-4 md:hidden" />
                {searching
                  ? language === "en"
                    ? "Searching..."
                    : "Waa la raadinayaa..."
                  : language === "en"
                    ? "Search"
                    : "Raadi"}
              </button>
            </div>
          </form>
        </section>

        <section className="mt-3 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.15em] text-primary-darker/70">
            <SlidersHorizontal size={14} />
            {language === "en" ? "Filters" : "Shaandhayn"}
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <select
              value={filters.employmentType}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  employmentType: e.target.value,
                }))
              }
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-600 outline-none focus:border-primary"
            >
              <option value="">
                {language === "en" ? "All Job Types" : "Nooc walba"}
              </option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
            </select>

            <select
              value={salaryRange}
              onChange={(e) => setSalaryRange(e.target.value as SalaryFilter)}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-600 outline-none focus:border-primary"
            >
              <option value="all">
                {language === "en" ? "Salary Range" : "Mushahar"}
              </option>
              <option value="0-500">$0 - $500</option>
              <option value="500-1000">$500 - $1,000</option>
              <option value="1000+">$1,000+</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortFilter)}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-600 outline-none focus:border-primary"
            >
              <option value="newest">
                {language === "en" ? "Newest First" : "Ugu Cusub"}
              </option>
              <option value="oldest">
                {language === "en" ? "Oldest First" : "Ugu Horeeyay"}
              </option>
              <option value="salary-high">
                {language === "en" ? "Salary High" : "Mushahar Sare"}
              </option>
              <option value="salary-low">
                {language === "en" ? "Salary Low" : "Mushahar Hoose"}
              </option>
            </select>
          </div>
        </section>

        <section className="mt-5 flex items-center justify-between">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-primary-darker/60">
            {filteredAndSortedJobs.length}{" "}
            {language === "en" ? "results" : "natiijooyin"}
          </p>
          <button
            onClick={() => {
              setSearchDraft("");
              setLocationDraft("");
              setSearch("");
              setJobs(initialJobs);
              setSearchLoadError(false);
              setFilters({ location: "", employmentType: "", remote: "" });
              setSalaryRange("all");
              setSortBy("newest");
            }}
            className="text-xs font-black uppercase tracking-wider text-primary hover:text-primary-darker"
          >
            {language === "en" ? "Reset All" : "Nadiifi Dhammaan"}
          </button>
        </section>

        {(loadError || searchLoadError) && jobs.length > 0 && (
          <p
            role="status"
            className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950"
          >
            {language === "en"
              ? "Live search is temporarily unavailable, so these results use the latest jobs already loaded."
              : "Raadinta tooska ah hadda lama heli karo; natiijooyinkani waxay adeegsanayaan shaqooyinkii ugu dambeeyay ee la soo geliyay."}
          </p>
        )}

        {loadError && jobs.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-10 text-center">
            <p className="text-base font-black text-amber-950">
              {language === "en"
                ? "Job listings are temporarily unavailable."
                : "Liiska shaqooyinka hadda lama heli karo."}
            </p>
            <p className="mt-2 text-sm font-medium text-amber-900/80">
              {language === "en"
                ? "We could not reach the jobs service. Please try again shortly."
                : "Adeegga shaqooyinka lama gaari karin. Fadlan mar kale isku day."}
            </p>
          </div>
        ) : filteredAndSortedJobs.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-dashed border-border bg-white p-16 text-center">
            <p className="text-base font-semibold text-primary-darker">
              {jobs.length === 0
                ? language === "en"
                  ? "There are no published jobs available right now."
                  : "Hadda ma jiraan shaqooyin la daabacay."
                : language === "en"
                  ? "No jobs found for your current filters."
                  : "Shaqooyin lama helin."}
            </p>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {filteredAndSortedJobs.map((job) => {
              const localized = getLocalizedJobText(job, language);
              return (
                <div key={job.id}>
                  <Link
                    href={`/jobs/${job.slug || job.id}`}
                    className="group block h-full"
                  >
                    <article className="flex h-[245px] min-w-0 flex-col rounded-lg border border-slate-200 bg-white p-3 text-slate-900 shadow-[0_2px_8px_rgba(15,23,42,.05)] transition group-hover:-translate-y-0.5 group-hover:border-primary/25 group-hover:shadow-lg">
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                            {job.employer.avatarUrl || job.employer.logoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={
                                  job.employer.avatarUrl ??
                                  job.employer.logoUrl ??
                                  undefined
                                }
                                alt={`${localized.employerName} logo`}
                                loading="lazy"
                                decoding="async"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Building2
                                size={18}
                                className="text-primary-darker"
                              />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-[9px] font-bold text-slate-500">
                              {localized.employerName}
                            </p>
                            <p className="truncate text-[9px] font-medium text-slate-500">
                              {job.remote ? "Remote Friendly" : job.location}
                            </p>
                          </div>
                        </div>

                        <ArrowUpRight
                          size={16}
                          className="text-primary-darker/50"
                        />
                      </div>

                      <h3 className="line-clamp-2 text-[13px] font-extrabold leading-tight text-slate-950">
                        {localized.title}
                      </h3>

                      <p className="mt-2 line-clamp-3 text-[9px] leading-4 text-slate-500">
                        {localized.description}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-1 text-[8px] font-bold text-primary">
                          <Briefcase size={12} />
                          {job.employmentType}
                        </span>
                        <span className="inline-flex min-w-0 items-center gap-1 rounded bg-emerald-50 px-2 py-1 text-[8px] font-bold text-emerald-700">
                          <MapPin size={12} />
                          {job.location}
                        </span>
                      </div>

                      <div className="mt-auto border-t border-slate-100 pt-3">
                        <div className="inline-flex max-w-full items-center gap-1 whitespace-nowrap">
                          <p className="truncate text-[10px] font-extrabold text-primary">
                            {formatSalary(job)}
                          </p>
                          <span aria-hidden="true" className="text-[8px] text-slate-300">•</span>
                          <p className="shrink-0 text-[8px] font-medium text-slate-400">
                            {formatDistance(
                              new Date(job.createdAt),
                              new Date(renderedAt),
                              {
                                addSuffix: true,
                              },
                            )}
                          </p>
                        </div>
                      </div>
                    </article>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
