import React, { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import {
  Activity,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Code2,
  Eye,
  Filter,
  Megaphone,
  MoreHorizontal,
  Search,
  Server,
  ShieldCheck,
} from 'lucide-react';

interface JobRow {
  id: string;
  title: string;
  location?: string | null;
  remote?: boolean;
  viewsCount?: number;
  createdAt?: string;
  published?: boolean;
  employer?: { name?: string };
  _count?: { applications: number };
}

type JobTab = 'all' | 'active' | 'pending' | 'rejected';

type JobSummary = {
  totalJobs: number;
  totalViews: number;
  totalApplications: number;
  activeJobs: number;
};

type JobManagementProps = {
  onSummaryChange?: (summary: JobSummary) => void;
};

const PAGE_SIZE = 4;

function getJobStatus(job: JobRow): Exclude<JobTab, 'all'> {
  const isRejected = !job.published && (job._count?.applications ?? 0) === 0 && !!job.createdAt
    ? Date.now() - new Date(job.createdAt).getTime() > 45 * 24 * 60 * 60 * 1000
    : false;

  if (isRejected) return 'rejected';
  return job.published ? 'active' : 'pending';
}

const statusStyles: Record<Exclude<JobTab, 'all'>, string> = {
  active:
    'inline-flex items-center gap-1.5 rounded-full bg-[#e8fbf1] px-2.5 py-1 text-xs font-medium text-[#16a34a]',
  pending:
    'inline-flex items-center gap-1.5 rounded-full bg-[#fff7e8] px-2.5 py-1 text-xs font-medium text-[#d97706]',
  rejected:
    'inline-flex items-center gap-1.5 rounded-full bg-[#feecec] px-2.5 py-1 text-xs font-medium text-[#dc2626]',
};

const iconOptions = [
  { Icon: Briefcase, wrap: 'bg-[#edf4ff] text-[#3b82f6]' },
  { Icon: Code2, wrap: 'bg-[#f3e8ff] text-[#9333ea]' },
  { Icon: Megaphone, wrap: 'bg-[#fff7ed] text-[#f97316]' },
  { Icon: Server, wrap: 'bg-[#ecfeff] text-[#0e7490]' },
];

export default function JobManagement({ onSummaryChange }: JobManagementProps) {
  const [allJobs, setAllJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<JobTab>('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const first = await api.get('/admin/jobs', { params: { page: 1, limit: 200 } });
        const firstJobs: JobRow[] = first.data.jobs || [];
        const pages = Number(first.data.pagination?.pages || 1);

        if (pages <= 1) {
          setAllJobs(firstJobs);
          return;
        }

        const requests: Promise<any>[] = [];
        for (let p = 2; p <= pages; p += 1) {
          requests.push(api.get('/admin/jobs', { params: { page: p, limit: 200 } }));
        }
        const rest = await Promise.all(requests);
        const merged = [...firstJobs];
        rest.forEach((res) => {
          merged.push(...(res.data.jobs || []));
        });
        setAllJobs(merged);
      } catch (e: any) {
        setError(e?.response?.data?.error || 'Failed to load jobs');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const summary = useMemo<JobSummary>(() => {
    const totalViews = allJobs.reduce((sum, job) => sum + (job.viewsCount || 0), 0);
    const totalApplications = allJobs.reduce((sum, job) => sum + (job._count?.applications || 0), 0);
    const activeJobs = allJobs.filter((job) => job.published).length;
    return {
      totalJobs: allJobs.length,
      totalViews,
      totalApplications,
      activeJobs,
    };
  }, [allJobs]);

  useEffect(() => {
    onSummaryChange?.(summary);
  }, [onSummaryChange, summary]);

  const filteredJobs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allJobs.filter((job) => {
      if (status !== 'all' && getJobStatus(job) !== status) {
        return false;
      }

      if (!q) {
        return true;
      }

      const title = (job.title || '').toLowerCase();
      const employer = (job.employer?.name || '').toLowerCase();
      const location = (job.location || '').toLowerCase();
      return title.includes(q) || employer.includes(q) || location.includes(q);
    });
  }, [allJobs, query, status]);

  useEffect(() => {
    setPage(1);
  }, [status, query]);

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = filteredJobs.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endIndex = Math.min(filteredJobs.length, currentPage * PAGE_SIZE);
  const pageRows = filteredJobs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const tabs: Array<{ id: JobTab; label: string }> = [
    { id: 'all', label: 'All Jobs' },
    { id: 'active', label: 'Active' },
    { id: 'pending', label: 'Pending' },
    { id: 'rejected', label: 'Rejected' },
  ];

  const statCards = [
    {
      id: 'views',
      title: 'Total Views',
      value: new Intl.NumberFormat('en-US').format(summary.totalViews),
      hint: '+8.2% from last month',
      positive: true,
      Icon: Eye,
      iconClass: 'bg-[#eaf2ff] text-[#3b82f6]',
    },
    {
      id: 'applications',
      title: 'Applications',
      value: new Intl.NumberFormat('en-US').format(summary.totalApplications),
      hint: '+4.1% from last month',
      positive: true,
      Icon: Briefcase,
      iconClass: 'bg-[#eaf2ff] text-[#3b82f6]',
    },
    {
      id: 'placements',
      title: 'Active Listings',
      value: new Intl.NumberFormat('en-US').format(summary.activeJobs),
      hint: 'Avg. 18 days to hire',
      positive: false,
      Icon: ShieldCheck,
      iconClass: 'bg-[#eaf2ff] text-[#3b82f6]',
    },
  ];

  return (
    <div className="space-y-5">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="grid gap-4 lg:grid-cols-3">
        {statCards.map((card) => (
          <article
            key={card.id}
            className="rounded-xl border border-[#e3e8ef] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
          >
            <div className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${card.iconClass}`}>
              <card.Icon className="h-4 w-4" />
            </div>
            <p className="mt-3 text-sm font-medium text-[#5a6d8a]">{card.title}</p>
            <p className="mt-1 text-[40px] font-bold leading-none text-[#0f2240]">{card.value}</p>
            <p className={`mt-2 text-sm ${card.positive ? 'text-[#16a34a]' : 'text-[#5a6d8a]'}`}>{card.hint}</p>
          </article>
        ))}
      </section>

      <section className="overflow-hidden rounded-xl border border-[#e3e8ef] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
        <div className="border-b border-[#edf1f6] px-4 py-3 md:px-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="inline-flex rounded-lg bg-[#f3f6fb] p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatus(tab.id)}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                    status === tab.id
                      ? 'bg-white text-[#1f7fe9] shadow-sm'
                      : 'text-[#61758f] hover:text-[#31455f]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <label className="relative block min-w-[260px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8fa0b8]" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search job titles, departments..."
                  className="h-10 w-full rounded-lg border border-[#e2e8f0] bg-[#fbfcff] pl-9 pr-3 text-sm text-[#2a3952] outline-none transition focus:border-[#8ab1ff]"
                />
              </label>
              <button
                type="button"
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#e2e8f0] bg-[#fbfcff] px-3 text-sm font-medium text-[#31455f] transition hover:bg-[#f2f6fb]"
              >
                <Filter className="h-4 w-4" />
                Filters
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[860px] w-full">
            <thead>
              <tr className="bg-[#f8fafd] text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8fa0b8]">
                <th className="px-5 py-3">Job Title &amp; Company</th>
                <th className="px-5 py-3">Date Posted</th>
                <th className="px-5 py-3">Applications</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-[#8fa0b8]">
                    Loading jobs...
                  </td>
                </tr>
              )}

              {!loading && pageRows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-[#8fa0b8]">
                    No jobs found for this filter.
                  </td>
                </tr>
              )}

              {!loading &&
                pageRows.map((job, idx) => {
                  const statusValue = getJobStatus(job);
                  const iconMeta = iconOptions[idx % iconOptions.length];
                  const Icon = iconMeta.Icon;
                  const applications = job._count?.applications ?? 0;
                  const appHint =
                    applications > 60 ? 'Full pipeline' : applications > 20 ? '+12 this week' : '';

                  return (
                    <tr key={job.id} className="border-t border-[#edf1f6] text-sm text-[#273754]">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span
                            className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${iconMeta.wrap}`}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          <div>
                            <p className="font-semibold text-[#152742]">{job.title}</p>
                            <p className="text-xs text-[#7f90a9]">
                              {job.employer?.name || 'Unknown'} -{' '}
                              {job.remote ? 'Remote' : job.location || 'On-site'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-[#4e6584]">
                        {job.createdAt
                          ? new Date(job.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : '-'}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#152742]">{applications}</span>
                          {appHint && <span className="text-xs text-[#16a34a]">{appHint}</span>}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={statusStyles[statusValue]}>
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              statusValue === 'active'
                                ? 'bg-[#22c55e]'
                                : statusValue === 'pending'
                                  ? 'bg-[#f59e0b]'
                                  : 'bg-[#ef4444]'
                            }`}
                          />
                          {statusValue === 'pending'
                            ? 'Pending Approval'
                            : statusValue.charAt(0).toUpperCase() + statusValue.slice(1)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#667b98] transition hover:bg-[#f1f5fb] hover:text-[#2e4464]"
                          aria-label="More actions"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-[#edf1f6] px-4 py-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-[#6f83a1]">
            Showing {startIndex}-{endIndex} of {filteredJobs.length} results
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#dfe6f0] text-[#7a8ea8] transition hover:bg-[#f5f8fc] disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="inline-flex items-center gap-1 rounded-lg border border-[#dfe6f0] px-3 py-1.5 text-sm text-[#4b627f]">
              <Activity className="h-3.5 w-3.5" />
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#dfe6f0] text-[#7a8ea8] transition hover:bg-[#f5f8fc] disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
