"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Briefcase, ChevronRight, MapPin } from "lucide-react";
import api from "@/lib/api";

type Job = {
  id: string;
  slug: string | null;
  title: string;
  location: string;
  employmentType: string;
  remote: boolean;
  createdAt: string;
  employer: {
    id: string;
    slug: string | null;
    name: string;
    logoUrl: string | null;
  };
};

type JobsResponse = {
  jobs: Job[];
};

const formatEmploymentType = (value: string) => {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const formatPostedTime = (createdAt: string) => {
  const created = new Date(createdAt);

  if (Number.isNaN(created.getTime())) return "";

  const difference = Date.now() - created.getTime();
  const minutes = Math.floor(difference / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);

  if (days === 1) return "1d ago";
  if (days < 7) return `${days}d ago`;

  return created.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

export default function JobsNearYou() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadJobs = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get<JobsResponse>("/jobs", {
          params: {
            page: 1,
            limit: 6,
          },
        });

        setJobs(response.data.jobs ?? []);
      } catch (error) {
        console.error("Failed to load jobs:", error);
        setError("Unable to load jobs.");
      } finally {
        setLoading(false);
      }
    };

    void loadJobs();
  }, []);

  return (
    <section className="w-full bg-white">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div><h2 className="text-xl font-bold text-slate-950 sm:text-2xl">
          Jobs Near You
        </h2><p className="mt-1 text-sm text-slate-500">Discover fresh opportunities from trusted employers.</p></div>

        <Link
          href="/jobs"
          className="flex items-center gap-1 text-xs font-semibold text-violet-700 transition hover:text-violet-900 sm:text-sm"
        >
          View all jobs
          <ChevronRight size={16} />
        </Link>
      </div>

      {loading && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div
              key={item}
              className="h-[190px] animate-pulse rounded-lg border border-slate-200 bg-slate-100"
            />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-red-100 bg-red-50 p-5 text-center">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      {!loading && !error && jobs.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
          <Briefcase className="mb-3 h-8 w-8 text-violet-500" />

          <p className="text-sm font-semibold text-slate-800">
            No jobs available right now.
          </p>

          <Link
            href="/jobs"
            className="mt-2 text-sm font-semibold text-violet-700 hover:text-violet-900"
          >
            Browse all jobs
          </Link>
        </div>
      )}

      {!loading && !error && jobs.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-6">
          {jobs.map((job) => {
            const jobUrl = job.slug || job.id;
            const posted = formatPostedTime(job.createdAt);

            return (
              <Link
                key={job.id}
                href={`/jobs/${jobUrl}`}
                className="group flex h-[190px] min-w-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white p-3 shadow-[0_2px_8px_rgba(15,23,42,.05)] transition hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lg"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
                  {job.employer.logoUrl ? (
                    <img
                      src={job.employer.logoUrl}
                      alt={job.employer.name}
                      className="h-full w-full object-contain p-1"
                    />
                  ) : (
                    <Briefcase className="h-5 w-5 text-violet-600" />
                  )}
                </div>

                <div className="mt-3 min-w-0 flex-1">
                  <h3 className="line-clamp-2 text-[12px] font-extrabold leading-tight text-slate-950 transition group-hover:text-violet-700">
                    {job.title}
                  </h3>

                  <p className="mt-1 truncate text-[9px] font-medium text-slate-500">
                    {job.employer.name}
                  </p>

                  <div className="mt-2 flex items-center gap-1 text-[9px] text-slate-500">
                    <MapPin size={11} className="shrink-0" />

                    <span className="truncate">
                      {job.remote ? `${job.location} · Remote` : job.location}
                    </span>
                  </div>

                  <p className="mt-1 text-[9px] font-semibold text-primary">
                    {formatEmploymentType(job.employmentType)}
                  </p>
                </div>

                {posted && <span className="mt-auto text-[8px] font-medium text-slate-400">{posted}</span>}
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
