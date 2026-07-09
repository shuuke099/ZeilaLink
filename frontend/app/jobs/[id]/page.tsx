"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import {
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  DollarSign,
  Flag,
  Globe,
  MapPin,
  ShieldCheck,
  Truck,
  Users2,
} from "lucide-react";

interface Job {
  id: string;
  title: string;
  description: string;
  requirements?: string;
  benefits?: string | null;
  location: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  employmentType: string;
  remote: boolean;
  tags?: string[];
  createdAt: string;
  applicationDeadline?: string | null;
  employer: {
    name: string;
    logoUrl?: string | null;
    avatarUrl?: string | null;
    description?: string | null;
  };
}

const toListItems = (text?: string | null) => {
  if (!text) return [];

  const trimmed = text.trim();
  if (!trimmed) return [];

  const byLine = trimmed
    .split(/\r?\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
  if (byLine.length > 1) return byLine;

  const bySentence = trimmed
    .split(/(?<=\.|\?|!)\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
  if (bySentence.length > 1) return bySentence;

  const byComma = trimmed
    .split(/[,;•]/)
    .map((item) => item.trim())
    .filter(Boolean);
  if (byComma.length > 1) return byComma;

  return byLine.length === 1 ? byLine : [];
};

const toParagraphs = (text?: string | null) => {
  if (!text) return [];
  const parts = text
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length > 0) return parts;
  return [text.trim()];
};

const formatSalaryRange = (min?: number | null, max?: number | null) => {
  const fmt = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);

  if (min && max) return `${fmt(min)} - ${fmt(max)}`;
  if (min) return `${fmt(min)}+`;
  if (max) return `Up to ${fmt(max)}`;
  return "Salary negotiable";
};

const formatDate = (dateString?: string | null) => {
  if (!dateString) return undefined;
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(dateString));
  } catch {
    return undefined;
  }
};

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/jobs/${params?.id}`);
        const jobData = res.data.job || res.data;
        setJob(jobData || null);
      } catch (e) {
        console.error("[JobDetailPage] Failed to load job:", e);
      } finally {
        setLoading(false);
      }
    };
    if (params?.id) fetchJob();
  }, [params?.id]);

  const handleApplyClick = () => {
    const jobId = params?.id;
    if (!jobId || typeof jobId !== "string") return;

    if (!user) {
      router.push(`/login?redirect=/jobs/${jobId}/apply`);
      return;
    }

    router.push(`/jobs/${jobId}/apply`);
  };

  const descriptionParagraphs = useMemo(
    () => toParagraphs(job?.description),
    [job?.description],
  );
  const keyResponsibilities = useMemo(
    () => toListItems(job?.description),
    [job?.description],
  );
  const requirementItems = useMemo(
    () => toListItems(job?.requirements),
    [job?.requirements],
  );
  const benefitItems = useMemo(
    () => toListItems(job?.benefits),
    [job?.benefits],
  );
  const postedDate = useMemo(
    () => formatDate(job?.createdAt),
    [job?.createdAt],
  );
  const deadlineDate = useMemo(
    () =>
      job?.applicationDeadline
        ? formatDate(job.applicationDeadline)
        : undefined,
    [job?.applicationDeadline],
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 pb-12 pt-28 sm:px-6 lg:px-8">
        {loading ? (
          <div className="rounded-3xl border border-border bg-white p-10">
            <p className="text-primary-darker/70">Loading job details...</p>
          </div>
        ) : !job ? (
          <div className="rounded-3xl border border-border bg-white p-10">
            <p className="text-primary-darker/70">
              Sorry, we could not find that job listing.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <section className="rounded-3xl border border-border bg-white p-6 shadow-soft sm:p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div className="flex-1">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-primary">
                    <MapPin size={13} />
                    {job.location}
                  </div>
                  <h1 className="text-4xl font-black tracking-tight text-primary-darker">
                    {job.title}
                  </h1>
                  <p className="mt-2 text-sm font-semibold text-primary-darker/70">
                    {job.employer?.name}
                    <span className="mx-2 text-primary-darker/40">•</span>
                    {formatSalaryRange(job.salaryMin, job.salaryMax)} / year
                  </p>
                </div>

                <button
                  onClick={handleApplyClick}
                  className="btn-primary rounded-xl px-6 py-3 text-sm font-black uppercase tracking-wider"
                >
                  Apply Now
                </button>
              </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
              <div className="space-y-6">
                <section className="rounded-3xl border border-border bg-white p-6 sm:p-8">
                  <h2 className="mb-4 text-xl font-black text-primary-darker">
                    Job Description
                  </h2>
                  <div className="space-y-4 text-[15px] leading-relaxed text-primary-darker/80">
                    {descriptionParagraphs.map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>
                </section>

                {keyResponsibilities.length > 1 && (
                  <section className="rounded-3xl border border-border bg-white p-6 sm:p-8">
                    <h2 className="mb-4 text-xl font-black text-primary-darker">
                      Key Responsibilities
                    </h2>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {keyResponsibilities.slice(0, 4).map((item, index) => {
                        const icons = [Users2, Truck, ShieldCheck, Flag];
                        const Icon = icons[index % icons.length];
                        return (
                          <div
                            key={index}
                            className="rounded-2xl border border-border bg-surface-muted p-4"
                          >
                            <Icon size={16} className="mb-2 text-primary" />
                            <p className="text-sm font-semibold text-primary-darker/80">
                              {item}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {requirementItems.length > 0 && (
                  <section className="rounded-3xl border border-border bg-white p-6 sm:p-8">
                    <h2 className="mb-4 text-xl font-black text-primary-darker">
                      Qualifications & Skills
                    </h2>
                    <ul className="space-y-3">
                      {requirementItems.map((item, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-3 text-sm font-semibold text-primary-darker/80"
                        >
                          <CheckCircle2
                            size={16}
                            className="mt-0.5 shrink-0 text-primary"
                          />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {benefitItems.length > 0 && (
                  <section className="rounded-3xl border border-primary/20 bg-primary p-6 text-white sm:p-8">
                    <h2 className="mb-4 text-xl font-black text-white">
                      Perks & Benefits
                    </h2>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {benefitItems.slice(0, 6).map((item, index) => (
                        <div
                          key={index}
                          className="rounded-xl border border-white/25 bg-primary-dark/35 p-3"
                        >
                          <p className="text-sm font-semibold text-white/90">
                            {item}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              <aside className="space-y-6">
                <section className="rounded-3xl border border-border bg-white p-6">
                  <h3 className="text-lg font-black text-primary-darker">
                    Job Summary
                  </h3>
                  <div className="mt-5 space-y-4">
                    <div className="flex items-start gap-3 text-sm text-primary-darker/80">
                      <CalendarDays size={16} className="mt-0.5 text-primary" />
                      <div>
                        <p className="font-black text-primary-darker">
                          Posted on
                        </p>
                        <p>{postedDate ?? "Recently"}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 text-sm text-primary-darker/80">
                      <Briefcase size={16} className="mt-0.5 text-primary" />
                      <div>
                        <p className="font-black text-primary-darker">
                          Job Type
                        </p>
                        <p>{job.employmentType}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 text-sm text-primary-darker/80">
                      <DollarSign size={16} className="mt-0.5 text-primary" />
                      <div>
                        <p className="font-black text-primary-darker">
                          Salary Range
                        </p>
                        <p>{formatSalaryRange(job.salaryMin, job.salaryMax)}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 text-sm text-primary-darker/80">
                      <MapPin size={16} className="mt-0.5 text-primary" />
                      <div>
                        <p className="font-black text-primary-darker">
                          Location
                        </p>
                        <p>
                          {job.remote
                            ? `${job.location} (Remote option)`
                            : job.location}
                        </p>
                      </div>
                    </div>

                    {deadlineDate && (
                      <div className="flex items-start gap-3 text-sm text-primary-darker/80">
                        <Clock3 size={16} className="mt-0.5 text-primary" />
                        <div>
                          <p className="font-black text-primary-darker">
                            Deadline
                          </p>
                          <p>{deadlineDate}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                <section className="rounded-3xl border border-border bg-white p-6">
                  <h3 className="mb-4 text-lg font-black text-primary-darker">
                    About {job.employer?.name}
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-border bg-surface-muted">
                        {job.employer?.avatarUrl || job.employer?.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={
                              job.employer.avatarUrl ??
                              job.employer.logoUrl ??
                              undefined
                            }
                            alt={job.employer.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Building2 size={18} className="text-primary" />
                        )}
                      </div>
                      <p className="font-black text-primary-darker">
                        {job.employer?.name}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-sm font-semibold text-primary-darker/80">
                      <Globe size={15} className="text-primary" />
                      {job.remote ? "Remote-friendly employer" : job.location}
                    </div>

                    {job.employer?.description && (
                      <p className="text-sm leading-relaxed text-primary-darker/80">
                        {job.employer.description.length > 220
                          ? `${job.employer.description.slice(0, 220)}...`
                          : job.employer.description}
                      </p>
                    )}
                  </div>
                </section>
              </aside>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
