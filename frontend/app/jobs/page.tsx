"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Briefcase,
  Building2,
  DollarSign,
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Navbar from "@/components/Navbar";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/translations";
import { cachedApiGet } from "@/lib/api-cache";

interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  employmentType: string;
  remote: boolean;
  createdAt: string;
  employer: {
    name: string;
    logoUrl?: string;
    avatarUrl?: string | null;
  };
  _count?: {
    applications: number;
  };
}

type SalaryFilter = "all" | "0-500" | "500-1000" | "1000+";
type SortFilter = "newest" | "oldest" | "salary-high" | "salary-low";

const formatSalary = (job: Job) => {
  const { salaryMin, salaryMax } = job;
  if (salaryMin != null && salaryMax != null) {
    return `$${salaryMin.toLocaleString()} - $${salaryMax.toLocaleString()}`;
  }
  if (salaryMin != null) return `From $${salaryMin.toLocaleString()}`;
  if (salaryMax != null) return `Up to $${salaryMax.toLocaleString()}`;
  return "Salary negotiable";
};

const salaryMidpoint = (job: Job) => {
  const { salaryMin, salaryMax } = job;
  if (salaryMin != null && salaryMax != null)
    return (salaryMin + salaryMax) / 2;
  if (salaryMin != null) return salaryMin;
  if (salaryMax != null) return salaryMax;
  return 0;
};

export default function JobsPage() {
  const { language } = useLanguage();
  const getT = (key: string) => t(key, language);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
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

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const data = await cachedApiGet<{ jobs?: Job[] }>("/jobs", undefined, 30_000);
      const jobsData: Job[] = data.jobs || [];

      const uniqueJobsMap = new Map();
      jobsData.forEach((job) => uniqueJobsMap.set(job.id, job));
      setJobs(Array.from(uniqueJobsMap.values()));
    } catch (error: any) {
      setJobs([]);
      if (error.response?.status !== 401) {
        console.error(
          "Failed to load jobs:",
          error.response?.data?.error || error.message,
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const filteredAndSortedJobs = useMemo(() => {
    const query = search.trim().toLowerCase();
    const locationQuery = filters.location.trim().toLowerCase();

    const filtered = jobs.filter((job) => {
      if (query) {
        const searchable = [
          job.title,
          job.description,
          job.employer?.name || "",
          job.location || "",
          job.employmentType || "",
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

  const applySearch = () => {
    setSearch(searchDraft.trim());
    setFilters((prev) => ({ ...prev, location: locationDraft.trim() }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 pb-14 pt-28 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-4xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-primary-darker">
            <Sparkles size={12} />
            {language === "en" ? "Career Marketplace" : "Suuqa Shaqooyinka"}
          </p>
          <h1 className="mt-5 text-4xl font-black leading-none tracking-tight text-primary-darker sm:text-6xl">
            {language === "en" ? "Find Your " : "Hel Shaqadaada "}
            <span className="text-primary">
              {language === "en" ? "Dream Job" : "Riyada"}
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm font-medium text-primary-darker/70 sm:text-base">
            {language === "en"
              ? "Browse curated opportunities from top employers on ZeilaLink and discover your next career move."
              : "Soo eeg fursadaha shaqo ee la kala xulay oo ka socda shirkadaha ugu wanaagsan."}
          </p>
        </section>

        <section className="mx-auto mt-8 max-w-6xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              applySearch();
            }}
            className="rounded-[2rem] border border-slate-300 bg-white p-3 shadow-[0_6px_16px_rgba(15,23,42,0.12)]"
          >
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <div className="flex flex-1 items-center gap-3 rounded-2xl px-4 py-3">
                <Search className="text-slate-600" size={32} />
                <input
                  type="text"
                  value={searchDraft}
                  onChange={(e) => setSearchDraft(e.target.value)}
                  placeholder={
                    language === "en"
                      ? "Job title, keywords, or company"
                      : "Magaca shaqada, erayo muhiim ah, ama shirkad"
                  }
                  className="w-full bg-transparent text-xl font-medium text-slate-700 outline-none placeholder:text-slate-500"
                />
              </div>

              <div className="hidden h-10 w-px bg-slate-300 md:block" />

              <div className="flex flex-1 items-center gap-3 rounded-2xl px-4 py-3">
                <MapPin className="text-slate-600" size={32} />
                <input
                  type="text"
                  value={locationDraft}
                  onChange={(e) => setLocationDraft(e.target.value)}
                  placeholder={
                    language === "en"
                      ? 'City, state, or "remote"'
                      : 'Magaalo, gobol, ama "remote"'
                  }
                  className="w-full bg-transparent text-xl font-medium text-slate-700 outline-none placeholder:text-slate-500"
                />
              </div>

              <button
                type="submit"
                className="rounded-2xl bg-[#1757c8] px-10 py-4 text-xl font-bold text-white transition hover:bg-[#1148a8] md:ml-3"
              >
                {language === "en" ? "Search" : "Raadi"}
              </button>
            </div>
          </form>
        </section>

        <section className="mt-7 flex flex-col gap-3 rounded-2xl border border-border bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
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
              className="rounded-xl border border-border bg-surface-muted px-3 py-2 text-xs font-bold text-primary-darker outline-none"
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
              className="rounded-xl border border-border bg-surface-muted px-3 py-2 text-xs font-bold text-primary-darker outline-none"
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
              className="rounded-xl border border-border bg-surface-muted px-3 py-2 text-xs font-bold text-primary-darker outline-none"
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
              setFilters({ location: "", employmentType: "", remote: "" });
              setSalaryRange("all");
              setSortBy("newest");
            }}
            className="text-xs font-black uppercase tracking-wider text-primary hover:text-primary-darker"
          >
            {language === "en" ? "Reset All" : "Nadiifi Dhammaan"}
          </button>
        </section>

        {loading ? (
          <div className="py-20 text-center">
            <p className="text-sm font-semibold text-primary-darker/70">
              {getT("loading")}
            </p>
          </div>
        ) : filteredAndSortedJobs.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-dashed border-border bg-white p-16 text-center">
            <p className="text-base font-semibold text-primary-darker">
              {language === "en"
                ? "No jobs found for your current filters."
                : "Shaqooyin lama helin."}
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredAndSortedJobs.map((job, index) => {
              return (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: index * 0.03 }}
                >
                  <Link href={`/jobs/${job.id}`} className="group block h-full">
                    <article className="flex h-full flex-col rounded-3xl border border-border bg-white p-5 text-primary-darker shadow-soft transition-all duration-300 group-hover:-translate-y-1">
                      <div className="mb-4 flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-border bg-surface-muted">
                            {job.employer.avatarUrl || job.employer.logoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={
                                  job.employer.avatarUrl ??
                                  job.employer.logoUrl ??
                                  undefined
                                }
                                alt={job.employer.name}
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
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-darker/50">
                              {job.employer.name}
                            </p>
                            <p className="text-xs font-bold text-primary-darker/70">
                              {job.remote ? "Remote Friendly" : job.location}
                            </p>
                          </div>
                        </div>

                        <ArrowUpRight
                          size={16}
                          className="text-primary-darker/50"
                        />
                      </div>

                      <h3 className="text-lg font-black leading-tight text-primary-darker">
                        {job.title}
                      </h3>

                      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-primary-darker/70">
                        {job.description}
                      </p>

                      <div className="mt-5 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-primary">
                          <Briefcase size={12} />
                          {job.employmentType}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-primary">
                          <MapPin size={12} />
                          {job.location}
                        </span>
                      </div>

                      <div className="mt-auto border-t border-border pt-5">
                        <div className="flex items-center justify-between">
                          <p className="flex items-center gap-1 text-sm font-black text-primary-darker">
                            <DollarSign size={14} />
                            {formatSalary(job)}
                          </p>
                          <p className="text-xs font-semibold text-primary-darker/50">
                            {formatDistanceToNow(new Date(job.createdAt), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </div>
                    </article>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
