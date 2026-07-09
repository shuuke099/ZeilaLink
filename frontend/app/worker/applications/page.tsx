'use client';

import React from 'react';
import WorkerDashboardPage from '@/components/worker/WorkerDashboardPage';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

type ApplicationStatus = 'applied' | 'reviewed' | 'accepted' | 'rejected';

type ApplicationRecord = {
  id: string;
  jobTitle: string;
  companyName: string;
  appliedAt: string;
  status: ApplicationStatus;
};

const statusLabels: Record<ApplicationStatus, string> = {
  applied: 'Applied',
  reviewed: 'In Review',
  accepted: 'Accepted',
  rejected: 'Rejected',
};

export default function WorkerApplicationsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = React.useState<ApplicationRecord[]>([]);
  const [filterStatus, setFilterStatus] = React.useState<'all' | ApplicationStatus>('all');
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const pageSize = 6;

  React.useEffect(() => {
    let active = true;

    const loadApplications = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const response = await api
          .get(`/users/${user.id}/applications`)
          .catch(() => ({ data: [] }));

        if (!active) return;

        const rawApplications = Array.isArray(response.data)
          ? response.data
          : response.data?.applications ?? [];

        const formatted = rawApplications.map((record: any) => ({
          id: record.id,
          jobTitle: record.job?.title ?? 'Untitled role',
          companyName: record.job?.company?.name ?? 'Unknown company',
          appliedAt: record.createdAt ?? new Date().toISOString(),
          status: (record.status ?? 'applied') as ApplicationStatus,
        }));
        setApplications(formatted);
      } catch (err) {
        console.error('Failed to load applications', err);
        if (active) setError('Unable to load applications.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadApplications();

    return () => {
      active = false;
    };
  }, [user]);

  const filteredApplications = applications.filter((application) =>
    filterStatus === 'all' ? true : application.status === filterStatus,
  );

  const totalPages = Math.max(1, Math.ceil(filteredApplications.length / pageSize));
  const paginatedApplications = filteredApplications.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  const handleWithdraw = async (id: string) => {
    try {
      await api.put(`/applications/${id}/status`, { status: 'withdrawn' });
      setApplications((prev) =>
        prev.map((record) =>
          record.id === id ? { ...record, status: 'rejected' } : record,
        ),
      );
    } catch (err) {
      console.error('Failed to withdraw application', err);
      setError('Failed to withdraw application. Please try again.');
    }
  };

  return (
    <WorkerDashboardPage
      title="My Applications"
      description="Track every job you have applied for and stay on top of next steps."
    >
      <section className="rounded-2xl border border-primary/10 bg-white p-6 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-primary-darker">
              Application history
            </h2>
            <p className="text-sm text-primary-darker/60">
              Use filters to review applications by status.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <label htmlFor="status-filter" className="text-primary-darker/70">
              Filter by status
            </label>
            <select
              id="status-filter"
              className="input-field"
              value={filterStatus}
              onChange={(event) => {
                setFilterStatus(event.target.value as any);
                setPage(1);
              }}
            >
              <option value="all">All applications</option>
              <option value="applied">Applied</option>
              <option value="reviewed">In Review</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-primary-darker/60">
                <th className="px-4 py-3">Job Title</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Date Applied</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-primary-darker">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-primary-darker/60">
                    Loading applications...
                  </td>
                </tr>
              ) : paginatedApplications.length > 0 ? (
                paginatedApplications.map((application) => (
                  <tr key={application.id}>
                    <td className="px-4 py-4 font-medium">{application.jobTitle}</td>
                    <td className="px-4 py-4">{application.companyName}</td>
                    <td className="px-4 py-4">
                      {new Date(application.appliedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          application.status === 'accepted'
                            ? 'bg-emerald-100 text-emerald-700'
                            : application.status === 'rejected'
                            ? 'bg-red-100 text-red-700'
                            : application.status === 'interview'
                            ? 'bg-sky-100 text-sky-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {statusLabels[application.status]}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      {application.status === 'applied' || application.status === 'reviewed' ? (
                        <button
                          className="text-sm font-semibold text-red-600 hover:text-red-700"
                          onClick={() => handleWithdraw(application.id)}
                        >
                          Withdraw
                        </button>
                      ) : (
                        <button className="cursor-not-allowed text-sm text-primary-darker/40" disabled>
                          No action
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-primary-darker/60">
                    No applications found. Start applying for jobs to track them here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-primary-darker/70">
          <span>
            Showing{' '}
            <strong>
              {Math.min(filteredApplications.length, (page - 1) * pageSize + 1)}-
              {Math.min(filteredApplications.length, page * pageSize)}
            </strong>{' '}
            of <strong>{filteredApplications.length}</strong> applications
          </span>
          <div className="flex items-center gap-2">
            <button
              className="btn-secondary px-3 py-2 text-xs font-semibold"
              disabled={page === 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              Previous
            </button>
            <span className="font-semibold text-primary-darker">
              Page {page} of {totalPages}
            </span>
            <button
              className="btn-secondary px-3 py-2 text-xs font-semibold"
              disabled={page === totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </WorkerDashboardPage>
  );
}

