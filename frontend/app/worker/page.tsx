'use client';

import React from 'react';
import { FileText, GraduationCap } from 'lucide-react';
import WorkerDashboardPage from '@/components/worker/WorkerDashboardPage';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { getSafeStoredUrl } from '@/lib/safeUrl';

type ApplicationStatus = 'applied' | 'reviewed' | 'accepted' | 'rejected';

type ApplicationSummary = {
  id: string;
  title: string;
  company: string;
  status: ApplicationStatus;
  appliedAt: string;
};

type TrainingRecommendation = {
  id: string;
  name: string;
  provider: string;
  duration: string;
};

type ResumeRecord = {
  id: string;
  s3Url: string;
  createdAt: string;
};

type DashboardStats = {
  applied: number;
  reviewed: number;
  accepted: number;
  rejected: number;
  profileCompletion: number;
};

const statusStyles: Record<
  ApplicationStatus,
  { label: string; badgeClass: string }
> = {
  applied: {
    label: 'Applied',
    badgeClass: 'bg-amber-100 text-amber-700',
  },
  reviewed: {
    label: 'In Review',
    badgeClass: 'bg-sky-100 text-sky-700',
  },
  accepted: {
    label: 'Accepted',
    badgeClass: 'bg-emerald-100 text-emerald-700',
  },
  rejected: {
    label: 'Rejected',
    badgeClass: 'bg-rose-100 text-rose-700',
  },
};

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

export default function WorkerOverviewPage() {
  const { user } = useAuth();
  const [stats, setStats] = React.useState<DashboardStats>({
    applied: 0,
    reviewed: 0,
    accepted: 0,
    rejected: 0,
    profileCompletion: 80,
  });
  const [recentApplications, setRecentApplications] = React.useState<
    ApplicationSummary[]
  >([]);
  const [recommendedTrainings, setRecommendedTrainings] = React.useState<
    TrainingRecommendation[]
  >([]);
  const [resumes, setResumes] = React.useState<ResumeRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;

    const loadOverview = async () => {
      if (!user) return;
      try {
        setLoading(true);
        setError(null);

        const [applicationsRes, trainingsRes, resumesRes] = await Promise.all([
          api
            .get(`/users/${user.id}/applications`)
            .catch(() => ({ data: [] })),
          api
            .get('/trainings', { params: { limit: 4 } })
            .catch(() => ({ data: { trainings: [] } })),
          api.get(`/resumes/users/${user.id}`).catch(() => ({ data: [] })),
        ]);

        if (!active) return;

        const applicationRecords = Array.isArray(applicationsRes.data)
          ? applicationsRes.data
          : applicationsRes.data?.applications ?? [];

        const normalizedApplications: ApplicationSummary[] = applicationRecords
          .map((record: any) => ({
            id: record.id,
            title: record.job?.title ?? 'Untitled role',
            company: record.job?.employer?.name ?? 'Unknown employer',
            status: (record.status ?? 'applied') as ApplicationStatus,
            appliedAt: record.appliedAt ?? record.createdAt ?? new Date().toISOString(),
          }))
          .sort(
            (a: ApplicationSummary, b: ApplicationSummary) =>
              new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime(),
          );

        const statsByStatus = normalizedApplications.reduce(
          (acc, record) => {
            acc[record.status] = (acc[record.status] ?? 0) + 1;
            return acc;
          },
          { applied: 0, reviewed: 0, accepted: 0, rejected: 0 } as Record<
            ApplicationStatus,
            number
          >,
        );

        const trainingRecords = Array.isArray(trainingsRes.data?.trainings)
          ? trainingsRes.data.trainings
          : [];

        const normalizedTrainings: TrainingRecommendation[] = trainingRecords
          .slice(0, 4)
          .map((training: any) => ({
            id: training.id,
            name: training.name,
            provider:
              training.provider?.name ??
              training.provider?.user?.name ??
              'Training provider',
            duration: training.duration ?? 'Flexible schedule',
          }));

        const resumeRecords = Array.isArray(resumesRes.data)
          ? resumesRes.data
          : [];

        setStats({
          applied: statsByStatus.applied,
          reviewed: statsByStatus.reviewed,
          accepted: statsByStatus.accepted,
          rejected: statsByStatus.rejected,
          profileCompletion: 80,
        });
        setRecentApplications(normalizedApplications.slice(0, 4));
        setRecommendedTrainings(normalizedTrainings);
        setResumes(resumeRecords);
      } catch (err) {
        console.error('Failed to load worker overview', err);
        if (active) setError('We could not load your dashboard data.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadOverview();

    return () => {
      active = false;
    };
  }, [user]);

  const latestResume = resumes[0];
  const safeLatestResumeUrl = getSafeStoredUrl(latestResume?.s3Url);
  const totalApplications =
    stats.applied + stats.reviewed + stats.accepted + stats.rejected;

  return (
    <WorkerDashboardPage
      title="Welcome back!"
      description="Review your latest job applications, track progress, and keep your profile up to date."
    >
      {error && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          {error}
        </div>
      )}

      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            title: 'Applications Submitted',
            value: totalApplications,
            caption: 'All time submissions',
            color: 'bg-blue-50/50',
            textColor: 'text-blue-900'
          },
          {
            title: 'In Review',
            value: stats.reviewed,
            caption: 'Awaiting employer feedback',
            color: 'bg-slate-50',
            textColor: 'text-slate-900'
          },
          {
            title: 'Offers Received',
            value: stats.accepted,
            caption: 'Accepted applications',
            color: 'bg-emerald-50/50',
            textColor: 'text-emerald-900'
          },
          {
            title: 'Declined',
            value: stats.rejected,
            caption: 'Closed by employers',
            color: 'bg-red-50/50',
            textColor: 'text-red-900'
          },
        ].map((item, idx) => (
          <div
            key={item.title}
            className={`group relative rounded-[2rem] border border-slate-100 ${item.color} p-8 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}
          >
            <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">{item.title}</div>
            <div className={`mt-4 text-4xl font-black ${item.textColor} tracking-tighter`}>
              {loading ? '...' : item.value}
            </div>
            <div className="mt-3 text-xs font-semibold text-slate-400">{item.caption}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-8 lg:grid-cols-3 mt-8">
        <article className="lg:col-span-2 rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-sm">
          <header className="flex items-center justify-between gap-3 mb-6 border-b border-slate-50 pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Recent Applications
              </h2>
              <p className="text-xs font-semibold text-slate-400 mt-1">
                Track the latest updates on your job search.
              </p>
            </div>
            <a
              href="/worker/applications"
              className="text-xs font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 transition-colors bg-blue-50 px-4 py-2 rounded-xl"
            >
              View All
            </a>
          </header>

          <div className="mt-6 space-y-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={`skeleton-${index}`}
                  className="animate-pulse rounded-[1.5rem] border border-slate-100 bg-slate-50 p-6"
                >
                  <div className="h-4 w-1/3 rounded-full bg-slate-200" />
                  <div className="mt-3 h-3 w-1/2 rounded-full bg-slate-200" />
                </div>
              ))
            ) : recentApplications.length > 0 ? (
              recentApplications.map((application) => {
                const status = statusStyles[application.status];
                return (
                  <div
                    key={application.id}
                    className="rounded-[1.5rem] border border-slate-100 bg-slate-50/50 p-6 shadow-sm transition-all hover:border-blue-200 hover:bg-white hover:shadow-md"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="text-base font-bold text-slate-900">
                            {application.title}
                          </span>
                          <span
                            className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${status.badgeClass}`}
                          >
                            {status.label}
                          </span>
                        </div>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {application.company} • Applied {formatDate(application.appliedAt)}
                        </p>
                      </div>
                      <a
                        href="/worker/applications"
                        className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors"
                      >
                        Details
                      </a>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-[2rem] border-2 border-dashed border-slate-100 bg-slate-50/50 p-12 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm mb-4">
                  <FileText className="h-6 w-6 text-slate-400" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  No applications yet
                </h3>
                <p className="mt-2 text-xs font-medium text-slate-500 max-w-sm mx-auto">
                  Apply to roles that interest you and they will appear here. Start your journey today!
                </p>
                <a
                  href="/jobs"
                  className="mt-6 inline-flex items-center rounded-2xl bg-blue-600 px-6 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-blue-600/20 hover:-translate-y-0.5 hover:bg-blue-700 transition-all"
                >
                  Browse Jobs
                </a>
              </div>
            )}
          </div>
        </article>

        <aside className="space-y-6">
          <div className="rounded-[2.5rem] bg-blue-50/50 border border-blue-100/50 p-8 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/40 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Profile Completion
            </h3>
            <p className="mt-3 text-4xl font-black text-blue-950 tracking-tighter">
              {stats.profileCompletion}%
            </p>
            <div className="mt-6 h-2 rounded-full bg-slate-200/60 overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-1000"
                style={{ width: `${stats.profileCompletion}%` }}
              />
            </div>
            <p className="mt-4 text-xs font-medium text-slate-500">
              Finish your profile to receive more top-tier opportunities.
            </p>
            <a
              href="/worker/profile"
              className="mt-6 inline-flex w-full justify-center items-center rounded-2xl bg-white border border-slate-200 px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-700 transition hover:border-blue-200 hover:text-blue-600 hover:shadow-sm"
            >
              Complete Profile
            </a>
          </div>

          <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-sm">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-900 pb-4 border-b border-slate-50 mb-4">
              <FileText className="h-4 w-4 text-blue-600" />
              Latest Resume
            </h3>
            {loading ? (
              <div className="mt-4 h-4 w-2/3 animate-pulse rounded-full bg-slate-100" />
            ) : latestResume ? (
              <div className="mt-4 space-y-3">
                <p className="text-xs font-bold text-slate-700">
                  Uploaded {formatDate(latestResume.createdAt)}
                </p>
                <p className="text-xs font-medium text-slate-500 pb-2">
                  Keep your CV up to date to improve your matches automatically.
                </p>
                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-50">
                  {safeLatestResumeUrl ? (
                    <a
                      href={safeLatestResumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex flex-1 justify-center items-center rounded-2xl bg-blue-50 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-blue-600 shadow-sm hover:bg-blue-100 transition-colors"
                    >
                      View CV
                    </a>
                  ) : (
                    <span className="text-xs font-semibold text-amber-700">
                      Resume link unavailable
                    </span>
                  )}
                  <a
                    href="/worker/profile"
                    className="inline-flex flex-1 justify-center items-center rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-slate-500 hover:border-slate-300 hover:text-slate-700 transition-all"
                  >
                    Update
                  </a>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-4 text-center py-4">
                <p className="text-xs font-medium text-slate-500">No resume uploaded yet.</p>
                <a
                  href="/worker/profile"
                  className="inline-flex w-full justify-center items-center rounded-2xl bg-blue-600 px-4 py-3 text-xs font-black uppercase tracking-widest text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 hover:-translate-y-0.5 transition-all"
                >
                  Upload Your CV
                </a>
              </div>
            )}
          </div>

          <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-sm">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-900 pb-4 border-b border-slate-50 mb-4">
              <GraduationCap className="h-4 w-4 text-blue-600" />
              Recommended Trainings
            </h3>
            {loading ? (
              <div className="mt-4 space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={`training-skeleton-${index}`} className="h-16 w-full animate-pulse rounded-2xl bg-slate-50" />
                ))}
              </div>
            ) : recommendedTrainings.length > 0 ? (
              <ul className="mt-4 space-y-3">
                {recommendedTrainings.map((training) => (
                  <li key={training.id} className="group rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition-all hover:bg-white hover:border-blue-100 hover:shadow-sm">
                    <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{training.name}</p>
                    <p className="mt-1 pb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {training.provider}
                    </p>
                    <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                      <p className="text-xs font-semibold text-slate-500">
                        {training.duration}
                      </p>
                      <a
                        href={`/trainings/${training.id}`}
                        className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 transition"
                      >
                        Preview
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-4 space-y-4 text-center py-4 text-xs font-medium text-slate-500">
                <p>No specific recommendations.</p>
                <a
                  href="/trainings"
                  className="inline-flex w-full justify-center items-center rounded-2xl bg-blue-50 px-4 py-3 text-xs font-black uppercase tracking-widest text-blue-600 shadow-sm hover:bg-blue-100 transition-colors"
                >
                  Explore Catalog
                </a>
              </div>
            )}
          </div>
        </aside>
      </section>
    </WorkerDashboardPage>
  );
}

