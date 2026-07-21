'use client';

import React from 'react';
import Link from 'next/link';
import EmployerDashboardPage from '@/components/employer/EmployerDashboardPage';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { getSafeMailtoUrl, getSafeStoredUrl } from '@/lib/safeUrl';
import { Download, Mail, Users, CheckCircle2, Clock4, BarChart3 } from 'lucide-react';

type ApplicantStatus = 'applied' | 'reviewed' | 'accepted' | 'rejected';

type ApplicantRecord = {
  id: string;
  name: string;
  skills: string[];
  resumeUrl?: string;
  status: ApplicantStatus;
  jobTitle: string;
  email?: string;
  appliedAt?: string;
  jobId?: string;
  avatarUrl?: string | null;
};

const statusBadgeClasses: Record<ApplicantStatus, string> = {
  applied: 'bg-amber-100 text-amber-700',
  reviewed: 'bg-sky-100 text-sky-700',
  accepted: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-600',
};

const statusLabels: Record<ApplicantStatus, string> = {
  applied: 'Applied',
  reviewed: 'In review',
  accepted: 'Accepted',
  rejected: 'Rejected',
};

export default function EmployerApplicantsPage() {
  const { user } = useAuth();
  const [applicants, setApplicants] = React.useState<ApplicantRecord[]>([]);
  const [filter, setFilter] = React.useState<'all' | ApplicantStatus>('all');
  const [feedback, setFeedback] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    const loadApplicants = async () => {
      if (!user) return;
      try {
        const response = await api.get('/applications');
        if (!active) return;
        const applicationsData = response.data.applications ?? response.data ?? [];
        const formatted = (Array.isArray(applicationsData) ? applicationsData : []).map((record: any) => ({
          id: record.id,
          name: record.user?.name ?? 'Anonymous candidate',
          email: record.user?.email,
          avatarUrl: record.user?.avatarUrl,
          skills: record.resume?.skillsExtracted ?? record.skills ?? [],
          resumeUrl: record.resume?.s3Url ?? record.resumeUrl,
          status: (record.status ?? 'applied') as ApplicantStatus,
          jobTitle: record.job?.title ?? 'Untitled job',
          appliedAt: record.appliedAt ? (typeof record.appliedAt === 'string' ? record.appliedAt : new Date(record.appliedAt).toISOString()) : undefined,
          jobId: record.job?.id,
        }));
        setApplicants(formatted);
      } catch (error: any) {
        console.error('Failed to load applicants', error);
        if (active) {
          let errorMessage = 'Unable to load applicants right now.';
          
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
            errorMessage = 'The applicant service is temporarily unavailable.';
          } else if (error?.response?.data?.error) {
            errorMessage = error.response.data.error;
          } else if (error?.message) {
            errorMessage = error.message;
          }
          
          setFeedback(errorMessage);
        }
      }
    };
    loadApplicants();
    return () => {
      active = false;
    };
  }, [user]);

  const filteredApplicants = applicants.filter((item) =>
    filter === 'all' ? true : item.status === filter,
  );

  const summary = React.useMemo(
    () => ({
      total: applicants.length,
      applied: applicants.filter((item) => item.status === 'applied').length,
      reviewed: applicants.filter((item) => item.status === 'reviewed').length,
      accepted: applicants.filter((item) => item.status === 'accepted').length,
    }),
    [applicants],
  );

  const handleStatusUpdate = async (id: string, status: ApplicantStatus) => {
    try {
      await api.put(`/applications/${id}/status`, { status });
      setApplicants((prev) =>
        prev.map((applicant) =>
          applicant.id === id ? { ...applicant, status } : applicant,
        ),
      );
      setFeedback(`Applicant status updated to ${status}.`);
    } catch (error: any) {
      console.error('Failed to update status', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Unable to update applicant status.';
      setFeedback(errorMessage);
    }
  };

  const handleEmail = (record: ApplicantRecord) => {
    const safeEmailUrl = getSafeMailtoUrl(
      record.email,
      `Regarding your application for ${record.jobTitle}`,
    );
    if (!safeEmailUrl) {
      setFeedback('This applicant email address is not valid.');
      return;
    }
    window.location.href = safeEmailUrl;
  };

  return (
    <EmployerDashboardPage
      title="Applicants"
      description="Review candidates for your open roles and take action faster."
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
        <div className="mb-6 grid gap-4 sm:grid-cols-4">
          {[
            { label: 'Total', value: summary.total, icon: Users },
            { label: 'New', value: summary.applied, icon: Clock4 },
            { label: 'In review', value: summary.reviewed, icon: BarChart3 },
            { label: 'Accepted', value: summary.accepted, icon: CheckCircle2 },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="rounded-2xl border border-border bg-surface-muted p-4 text-sm shadow-sm"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  {card.label}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-2xl font-semibold text-heading">{card.value}</p>
                  <Icon className="h-5 w-5 text-primary" />
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-heading">
              Candidates
            </h2>
            <p className="text-sm text-muted">
              Filter applicants by status and review their resumes.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <label className="text-foreground" htmlFor="applicant-filter">
              Status filter
            </label>
            <select
              id="applicant-filter"
              className="input-field"
              value={filter}
              onChange={(event) => setFilter(event.target.value as any)}
            >
              <option value="all">All applicants</option>
              <option value="applied">Applied</option>
              <option value="reviewed">In review</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {filteredApplicants.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-surface-muted p-8 text-center text-sm text-muted">
              No applicants yet. Share your job post to attract more candidates.
            </div>
          ) : (
            filteredApplicants.map((applicant) => {
              const safeResumeUrl = getSafeStoredUrl(applicant.resumeUrl);
              return (
                <article
                  key={applicant.id}
                  className="rounded-xl border border-border bg-surface-muted p-5 shadow-sm"
                >
                <header className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary overflow-hidden flex-shrink-0">
                        {applicant.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={applicant.avatarUrl}
                            alt={applicant.name}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                const fallback = document.createElement('span');
                                fallback.className = 'text-sm font-semibold text-primary';
                                fallback.textContent = applicant.name.charAt(0).toUpperCase();
                                parent.appendChild(fallback);
                              }
                            }}
                          />
                        ) : (
                          <span>{applicant.name.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-heading">{applicant.name}</h3>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          applicant.status === 'applied'
                            ? 'bg-amber-100/50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                            : applicant.status === 'reviewed'
                            ? 'bg-sky-100/50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400'
                            : applicant.status === 'accepted'
                            ? 'bg-primary/20 text-primary-dark'
                            : 'bg-red-100/50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                      >
                        {statusLabels[applicant.status]}
                      </span>
                    </div>
                    <p className="text-sm text-muted">
                      Applied for{' '}
                      {applicant.jobId ? (
                        <Link
                          href={`/jobs/${applicant.jobId}`}
                          className="font-medium text-primary hover:text-primary/80"
                        >
                          {applicant.jobTitle}
                        </Link>
                      ) : (
                        <span className="font-medium text-heading">
                          {applicant.jobTitle}
                        </span>
                      )}
                      {applicant.appliedAt && (
                        <>
                          {' · '}
                          <span className="text-xs text-muted">
                            {new Date(applicant.appliedAt).toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {safeResumeUrl && (
                      <a
                        href={safeResumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Resume
                      </a>
                    )}
                    {applicant.email && (
                      <button
                        className="btn-secondary flex items-center gap-2"
                        onClick={() => handleEmail(applicant)}
                      >
                        <Mail className="h-4 w-4" />
                        Email
                      </button>
                    )}
                  </div>
                </header>

                {applicant.skills.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-primary">
                    {applicant.skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-primary/10 px-3 py-1"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                <footer className="mt-6 flex flex-wrap gap-2">
                  <button
                    className="btn-primary"
                    onClick={() => handleStatusUpdate(applicant.id, 'reviewed')}
                  >
                    Move to review
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => handleStatusUpdate(applicant.id, 'accepted')}
                  >
                    Accept
                  </button>
                  <button
                    className="rounded-lg border border-red-300/50 bg-red-50/50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-600 hover:text-white dark:border-red-500/30 dark:bg-red-900/20 dark:text-red-400"
                    onClick={() => handleStatusUpdate(applicant.id, 'rejected')}
                  >
                    Reject
                  </button>
                </footer>
                </article>
              );
            })
          )}
        </div>
      </section>
    </EmployerDashboardPage>
  );
}

