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
            limit: 3,
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
    <section className="flex h-full min-h-[300px] w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between px-5 pb-3 pt-4">
        <h2 className="text-base font-bold text-slate-950 sm:text-lg">
          Jobs Near You
        </h2>

        <Link
          href="/jobs"
          className="flex items-center gap-1 text-xs font-semibold text-violet-700 transition hover:text-violet-900 sm:text-sm"
        >
          View all jobs
          <ChevronRight size={16} />
        </Link>
      </div>

      {loading && (
        <div className="flex-1 px-5">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="flex min-h-[72px] animate-pulse items-center gap-3 border-b border-slate-100 py-3 last:border-b-0"
            >
              <div className="h-12 w-12 shrink-0 rounded-lg bg-slate-100" />

              <div className="flex-1">
                <div className="h-3.5 w-32 rounded bg-slate-100" />
                <div className="mt-2 h-3 w-24 rounded bg-slate-100" />
                <div className="mt-2 h-3 w-20 rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="flex flex-1 items-center justify-center px-5 text-center">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      {!loading && !error && jobs.length === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center px-5 text-center">
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
        <div className="flex-1 px-5">
          {jobs.map((job) => {
            const jobUrl = job.slug || job.id;
            const posted = formatPostedTime(job.createdAt);

            return (
              <Link
                key={job.id}
                href={`/jobs/${jobUrl}`}
                className="group flex min-h-[72px] items-center gap-3 border-b border-slate-100 py-3 transition last:border-b-0 hover:bg-slate-50"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-50">
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

                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-bold text-slate-950 transition group-hover:text-violet-700">
                    {job.title}
                  </h3>

                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {job.employer.name}
                  </p>

                  <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                    <MapPin size={11} className="shrink-0" />

                    <span className="truncate">
                      {job.remote ? `${job.location} · Remote` : job.location}
                    </span>
                  </div>

                  <p className="mt-0.5 text-xs text-slate-600">
                    {formatEmploymentType(job.employmentType)}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-end self-stretch py-1">
                  <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                    New
                  </span>

                  {posted && (
                    <span className="mt-auto text-[10px] text-slate-400">
                      {posted}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
