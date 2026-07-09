'use client';

import React from 'react';
import Link from 'next/link';
import EmployerDashboardPage from '@/components/employer/EmployerDashboardPage';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { BarChart3, FileText, ToggleLeft, Trash2 } from 'lucide-react';

type JobStatus = 'active' | 'draft';

type EmployerJob = {
  id: string;
  title: string;
  status: JobStatus;
  applicants: number;
  createdAt: string;
  published: boolean;
};

const statusLabels: Record<JobStatus, string> = {
  active: 'Active',
  draft: 'Draft',
};

export default function EmployerJobsPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = React.useState<EmployerJob[]>([]);
  const [filter, setFilter] = React.useState<'all' | JobStatus>('all');
  const [loading, setLoading] = React.useState(true);
  const [feedback, setFeedback] = React.useState<string | null>(null);

  const fetchJobs = React.useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setFeedback(null);
      // Ensure we're getting only the current employer's jobs
      const response = await api.get('/jobs', { 
        params: { 
          mine: 'true', // Send as string to ensure proper parsing
        } 
      });

      // The backend returns { jobs: [...], pagination: {...} }
      const jobsData = response.data?.jobs ?? [];
      
      if (!Array.isArray(jobsData)) {
        console.error('Invalid jobs response format:', response.data);
        setFeedback('Invalid response format from server.');
        setJobs([]);
        return;
      }

      const formatted: EmployerJob[] = jobsData.map((job: any) => {
        const published = Boolean(job.published);
        return {
          id: job.id,
          title: job.title,
          status: published ? 'active' : 'draft',
          applicants: job._count?.applications ?? job.applicantsCount ?? 0,
          createdAt: job.createdAt ?? new Date().toISOString(),
          published,
        };
      });
      setJobs(formatted);
    } catch (error: any) {
      console.error('Failed to load jobs', error);
      let errorMessage = 'Unable to load job posts right now.';
      
      // Check for 429 rate limit error
      if (error?.response?.status === 429) {
        errorMessage = 'Too many requests. Please wait a moment and try again.';
        setFeedback(errorMessage);
        setJobs([]);
        return;
      }
      
      // Check for connection errors more thoroughly
      const isConnectionError = 
        error?.isConnectionError ||
        error?.code === 'ERR_NETWORK' ||
        error?.code === 'ECONNREFUSED' ||
        error?.code === 'ERR_CONNECTION_REFUSED' ||
        error?.message?.includes('Network Error') ||
        error?.message?.includes('ERR_CONNECTION_REFUSED') ||
        error?.message?.includes('Failed to fetch') ||
        (!error?.response && error?.request);
      
      if (isConnectionError) {
        errorMessage = 'Network Error: Cannot connect to server. Please ensure the backend server is running on port 7000.';
      } else if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      setFeedback(errorMessage);
      setJobs([]); // Clear jobs on error
    } finally {
      setLoading(false);
    }
  }, [user]);

  React.useEffect(() => {
    let mounted = true;
    
    const loadJobs = async () => {
      if (mounted && user) {
        await fetchJobs();
      }
    };
    
    loadJobs();
    
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Only depend on user.id to prevent excessive re-renders

  const handleStatusChange = async (jobId: string, published: boolean) => {
    try {
      await api.put(`/jobs/${jobId}`, { published });
      setFeedback(`Job status updated to ${published ? statusLabels.active : statusLabels.draft}.`);
      fetchJobs();
    } catch (error: any) {
      console.error('Failed to update job status', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Unable to update job status.';
      setFeedback(errorMessage);
    }
  };

  const filteredJobs = jobs.filter((job) =>
    filter === 'all' ? true : job.status === filter,
  );

  const summary = React.useMemo(
    () => ({
      total: jobs.length,
      active: jobs.filter((job) => job.status === 'active').length,
      draft: jobs.filter((job) => job.status === 'draft').length,
    }),
    [jobs],
  );

  return (
    <EmployerDashboardPage
      title="My job posts"
      description="Manage all the roles you have published and track applicant activity."
    >
      {feedback && (
        <div className={`rounded-xl border p-4 text-sm font-medium ${
          feedback.includes('Network Error') || 
          feedback.includes('Cannot connect') ||
          feedback.includes('connection refused') ||
          feedback.includes('ERR_CONNECTION_REFUSED')
            ? 'border-red-400/50 bg-red-100/80 text-red-800 dark:border-red-500/50 dark:bg-red-900/30 dark:text-red-300'
            : 'border-primary/30 bg-primary/10 text-primary-dark'
        }`}>
          <div className="flex items-start gap-2">
            {(feedback.includes('Network Error') || feedback.includes('Cannot connect')) && (
              <span className="text-lg">⚠️</span>
            )}
            <span>{feedback}</span>
          </div>
        </div>
      )}

      <section className="card bg-surface border border-border p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Total posts', value: summary.total, icon: BarChart3 },
            { label: 'Active', value: summary.active, icon: ToggleLeft },
            { label: 'Drafts', value: summary.draft, icon: FileText },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-border bg-surface-muted p-4 text-sm shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                {card.label}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-2xl font-semibold text-heading">{card.value}</p>
                <card.icon className="h-5 w-5 text-primary" />
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-heading">
              Job posts
            </h2>
            <p className="text-sm text-muted">
              Filter by status to review published roles or drafts in progress.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <label className="text-foreground" htmlFor="job-status-filter">
              Filter status
            </label>
            <select
              id="job-status-filter"
              className="input-field"
              value={filter}
              onChange={(event) => setFilter(event.target.value as any)}
            >
              <option value="all">All jobs</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-muted">
                <th className="px-4 py-3">Job title</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Applicants</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm text-foreground">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted">
                    Loading job posts...
                  </td>
                </tr>
              ) : filteredJobs.length > 0 ? (
                filteredJobs.map((job) => (
                  <tr key={job.id}>
                    <td className="px-4 py-4 font-medium">{job.title}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                          job.status === 'active'
                            ? 'bg-primary/20 text-primary-dark'
                            : 'bg-amber-100/50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}
                      >
                        {statusLabels[job.status]}
                      </span>
                    </td>
                    <td className="px-4 py-4">{job.applicants}</td>
                    <td className="px-4 py-4">
                      {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/employer/post-job?edit=${job.id}`}
                          className="btn-secondary inline-flex items-center gap-1"
                        >
                          <FileText className="h-4 w-4" />
                          Edit
                        </Link>
                        <button
                          className="inline-flex items-center gap-1 rounded-lg border border-amber-300/50 bg-amber-50/50 px-3 py-1.5 text-sm font-semibold text-amber-700 hover:bg-amber-500 hover:text-white dark:border-amber-500/30 dark:bg-amber-900/20 dark:text-amber-400"
                          onClick={() => handleStatusChange(job.id, !job.published)}
                        >
                          <ToggleLeft className="h-4 w-4" />
                          {job.published ? 'Unpublish' : 'Publish'}
                        </button>
                        <button
                          className="inline-flex items-center gap-1 rounded-lg border border-red-300/50 bg-red-50/50 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-600 hover:text-white dark:border-red-500/30 dark:bg-red-900/20 dark:text-red-400"
                          onClick={async () => {
                            try {
                              await api.delete(`/jobs/${job.id}`);
                              setFeedback('Job deleted successfully.');
                              fetchJobs();
                            } catch (error: any) {
                              console.error('Failed to delete job', error);
                              const errorMessage = error?.response?.data?.error || error?.message || 'Unable to delete job post right now.';
                              setFeedback(errorMessage);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted">
                    No job posts found. Create one to start hiring.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </EmployerDashboardPage>
  );
}

