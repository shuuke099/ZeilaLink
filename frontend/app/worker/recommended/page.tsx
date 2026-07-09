'use client';

import React from 'react';
import { Bookmark, Briefcase, MapPin, Sparkles } from 'lucide-react';
import WorkerDashboardPage from '@/components/worker/WorkerDashboardPage';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

type RecommendedJob = {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  matchScore: number;
  tags: string[];
};

export default function WorkerRecommendedJobsPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = React.useState<RecommendedJob[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [feedback, setFeedback] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    const loadRecommended = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const response = await api
          .get('/jobs/recommended', {
            params: { userId: user.id },
          })
          .catch(() => ({
            data: {
              jobs: [
                {
                  id: '1',
                  title: 'Warehouse Operations Lead',
                  company: 'SomLogistics',
                  location: 'Mogadishu • Hybrid',
                  salary: '$500 - $650 / month',
                  matchScore: 92,
                  tags: ['Logistics', 'Inventory', 'Leadership'],
                },
                {
                  id: '2',
                  title: 'Supply Chain Coordinator',
                  company: 'Horn of Africa Foods',
                  location: 'Hargeisa • Onsite',
                  salary: '$450 - $520 / month',
                  matchScore: 88,
                  tags: ['Supply Chain', 'Excel', 'Procurement'],
                },
              ],
            },
          }));

        if (!active) return;

        const formatted: RecommendedJob[] = response.data.jobs.map((job: any) => ({
          id: job.id,
          title: job.title,
          company: job.company?.name ?? job.company ?? 'Unknown company',
          location: job.location ?? 'Somalia',
          salary: job.salaryRange ?? job.salary,
          matchScore: job.matchScore ?? 80,
          tags: job.tags ?? [],
        }));
        setJobs(formatted);
      } catch (error) {
        console.error('Failed to load recommended jobs', error);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadRecommended();

    return () => {
      active = false;
    };
  }, [user]);

  const handleApply = async (job: RecommendedJob) => {
    try {
      await api.post(`/jobs/${job.id}/apply`, { coverLetter: '' });
      setFeedback(`Application sent for ${job.title}.`);
    } catch (error) {
      console.error('Failed to apply for job', error);
      setFeedback('Unable to apply right now. Please try again later.');
    }
  };

  const handleSave = async (job: RecommendedJob) => {
    try {
      await api.post(`/jobs/${job.id}/save`);
      setFeedback(`${job.title} saved to your list.`);
    } catch (error) {
      console.error('Failed to save job', error);
      setFeedback('Unable to save job right now.');
    }
  };

  return (
    <WorkerDashboardPage
      title="Recommended Jobs"
      description="Based on your skills and interests. Update your profile to get even better matches."
    >
      {feedback && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-primary">
          {feedback}
        </div>
      )}

      <section className="space-y-4 rounded-2xl border border-primary/10 bg-white p-6 shadow-lg">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-primary-darker">
              <Sparkles className="h-5 w-5 text-primary" />
              Smart matches for you
            </h2>
            <p className="text-sm text-primary-darker/60">
              Powered by your profile, skills, and job history.
            </p>
          </div>
          <a
            href="/worker/settings"
            className="text-sm font-semibold text-primary hover:text-primary/80"
          >
            Update preferences
          </a>
        </header>

        {loading ? (
          <div className="rounded-xl border border-primary/10 bg-primary/5 p-6 text-sm text-primary">
            Fetching job matches for you...
          </div>
        ) : jobs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-primary/20 p-8 text-center text-sm text-primary-darker/60">
            No recommendations yet. Add more skills and experience to your profile for better matches.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {jobs.map((job) => (
              <article
                key={job.id}
                className="flex h-full flex-col justify-between rounded-2xl border border-primary/10 bg-gradient-to-br from-white via-white to-primary/5 p-6 shadow-lg"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
                        <Sparkles className="h-4 w-4" />
                        AI assisted
                      </div>
                      <h3 className="mt-2 text-xl font-semibold text-primary-darker">
                        {job.title}
                      </h3>
                      <p className="mt-1 text-sm text-primary-darker/70">
                        {job.company}
                      </p>
                    </div>
                    <div className="rounded-full bg-primary text-xs font-semibold uppercase text-white">
                      <span className="px-3 py-1">{job.matchScore}% match</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-primary-darker/70">
                    <span className="inline-flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      {job.location}
                    </span>
                    {job.salary && (
                      <span className="inline-flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-primary" />
                        {job.salary}
                      </span>
                    )}
                  </div>

                  {job.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {job.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    className="btn-primary flex-1 sm:flex-none"
                    onClick={() => handleApply(job)}
                  >
                    Apply now
                  </button>
                  <button
                    className="btn-secondary flex items-center gap-2"
                    onClick={() => handleSave(job)}
                  >
                    <Bookmark className="h-4 w-4" />
                    Save job
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </WorkerDashboardPage>
  );
}

