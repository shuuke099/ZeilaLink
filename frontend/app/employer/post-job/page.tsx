'use client';

import React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import EmployerDashboardPage from '@/components/employer/EmployerDashboardPage';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

type JobFormState = {
  title: string;
  description: string;
  salaryMin: string;
  salaryMax: string;
  jobType: string;
  location: string;
  category: string;
  requirements: string;
  tags: string;
};

function EmployerPostJobContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const editJobId = searchParams.get('edit');
  const isEditMode = Boolean(editJobId);
  
  const [formState, setFormState] = React.useState<JobFormState>({
    title: '',
    description: '',
    salaryMin: '',
    salaryMax: '',
    jobType: 'Full-time',
    location: '',
    category: '',
    requirements: '',
    tags: '',
  });
  const [submitting, setSubmitting] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch job data when in edit mode
  React.useEffect(() => {
    const fetchJobData = async () => {
      if (!editJobId || !user) return;
      
      try {
        setLoading(true);
        setFeedback(null);
        const response = await api.get(`/jobs/${editJobId}`);
        const job = response.data;
        
        if (job) {
          setFormState({
            title: job.title || '',
            description: job.description || '',
            salaryMin: job.salaryMin?.toString() || '',
            salaryMax: job.salaryMax?.toString() || '',
            jobType: job.employmentType || 'Full-time',
            location: job.location || '',
            category: '', // Not stored in backend currently
            requirements: job.requirements || '',
            tags: Array.isArray(job.tags) ? job.tags.join(', ') : job.tags || '',
          });
        }
      } catch (error: any) {
        console.error('Failed to load job data', error);
        const errorMessage = error?.response?.data?.error || error?.message || 'Unable to load job data.';
        setFeedback({
          type: 'error',
          text: errorMessage,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchJobData();
  }, [editJobId, user]);

  const handleSubmit = async (publish: boolean) => {
    if (!user) return;
    try {
      setSubmitting(true);
      setFeedback(null);
      
      const jobData = {
        title: formState.title,
        description: formState.description,
        requirements: formState.requirements,
        location: formState.location,
        salaryMin: formState.salaryMin ? Number(formState.salaryMin) : undefined,
        salaryMax: formState.salaryMax ? Number(formState.salaryMax) : undefined,
        employmentType: formState.jobType,
        tags: formState.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
        published: publish,
      };

      if (isEditMode && editJobId) {
        // Update existing job
        await api.put(`/jobs/${editJobId}`, jobData);
        setFeedback({
          type: 'success',
          text: publish
            ? 'Job updated and published successfully.'
            : 'Job updated successfully.',
        });
        // Redirect to jobs list after a short delay
        setTimeout(() => {
          router.push('/employer/jobs');
        }, 1500);
      } else {
        // Create new job
        await api.post('/jobs', jobData);
        setFeedback({
          type: 'success',
          text: publish
            ? 'Job published successfully. Applicants can now apply.'
            : 'Draft saved successfully. You can publish it later.',
        });
        // Clear form after successful submission
        setFormState({
          title: '',
          description: '',
          salaryMin: '',
          salaryMax: '',
          jobType: 'Full-time',
          location: '',
          category: '',
          requirements: '',
          tags: '',
        });
      }
    } catch (error: any) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} job`, error);
      const errorMessage = error?.response?.data?.error || error?.message || `Unable to ${isEditMode ? 'update' : 'create'} job post right now. Please review the form and try again.`;
      setFeedback({
        type: 'error',
        text: errorMessage,
      });
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <EmployerDashboardPage
      title={isEditMode ? "Edit job" : "Post a job"}
      description={isEditMode ? "Update your job post information." : "Publish a new job post to reach skilled workers across Somalia."}
      headerActions={
        !isEditMode && (
          <button
            className="btn-secondary"
            type="button"
            onClick={() => setFormState({
              title: '',
              description: '',
              salaryMin: '',
              salaryMax: '',
              jobType: 'Full-time',
              location: '',
              category: '',
              requirements: '',
              tags: '',
            })}
          >
            Clear form
          </button>
        )
      }
    >
      {feedback && (
        <div
          className={`rounded-2xl border p-4 text-sm ${
            feedback.type === 'success'
              ? 'border-primary/30 bg-primary/10 text-primary-dark'
              : 'border-red-300/50 bg-red-50/50 text-red-700 dark:border-red-500/30 dark:bg-red-900/20 dark:text-red-400'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {loading && (
        <div className="rounded-2xl border border-border bg-surface p-8 text-center text-muted">
          Loading job data...
        </div>
      )}

      {!loading && (
        <section className="card bg-surface border border-border">
          <form
            className="space-y-6"
            onSubmit={(event) => {
              event.preventDefault();
              handleSubmit(true);
            }}
          >
          <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-heading">
                  Job title
                </label>
                <input
                  className="input-field mt-2"
                  placeholder="Operations Manager"
                  value={formState.title}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, title: event.target.value }))
                  }
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-heading">
                    Location
                  </label>
                  <input
                    className="input-field mt-2"
                    placeholder="Mogadishu, Somalia"
                    value={formState.location}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        location: event.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-heading">
                    Job type
                  </label>
                  <select
                    className="input-field mt-2"
                    value={formState.jobType}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        jobType: event.target.value,
                      }))
                    }
                  >
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Contract</option>
                    <option>Internship</option>
                    <option>Remote</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-heading">
                    Salary range (min)
                  </label>
                  <input
                    className="input-field mt-2"
                    type="number"
                    value={formState.salaryMin}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        salaryMin: event.target.value,
                      }))
                    }
                    placeholder="400"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-heading">
                    Salary range (max)
                  </label>
                  <input
                    className="input-field mt-2"
                    type="number"
                    value={formState.salaryMax}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        salaryMax: event.target.value,
                      }))
                    }
                    placeholder="600"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-heading">
                  Category
                </label>
                <input
                  className="input-field mt-2"
                  placeholder="Logistics & Supply Chain"
                  value={formState.category}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, category: event.target.value }))
                  }
                />
              </div>
          </div>

          <div>
            <label className="text-sm font-medium text-heading">
              Job description
            </label>
            <textarea
              className="input-field mt-2 h-40"
              placeholder="Describe the responsibilities, mission, and working environment."
              value={formState.description}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, description: event.target.value }))
              }
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-heading">
              Requirements
            </label>
            <textarea
              className="input-field mt-2 h-32"
              placeholder="List the essential skills and experience needed for this role."
              value={formState.requirements}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, requirements: event.target.value }))
              }
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-heading">
              Tags (comma separated)
            </label>
            <input
              className="input-field mt-2"
              placeholder="Logistics, Excel, Warehouse"
              value={formState.tags}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, tags: event.target.value }))
              }
            />
            <p className="mt-1 text-xs text-muted">
              Tags improve job visibility in worker dashboards.
            </p>
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => handleSubmit(false)}
              disabled={submitting}
            >
              {isEditMode ? 'Save changes' : 'Save draft'}
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting}
            >
              {submitting 
                ? (isEditMode ? 'Updating...' : 'Publishing...') 
                : (isEditMode ? 'Update job' : 'Publish job')}
            </button>
          </div>
        </form>
      </section>
      )}
    </EmployerDashboardPage>
  );
}

export default function EmployerPostJobPage() {
  return (
    <React.Suspense fallback={null}>
      <EmployerPostJobContent />
    </React.Suspense>
  );
}

