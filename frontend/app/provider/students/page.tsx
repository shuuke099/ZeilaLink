'use client';

import React from 'react';
import ProviderDashboardPage from '@/components/provider/ProviderDashboardPage';
import api from '@/lib/api';

type EnrollmentRecord = {
  id: string;
  learner: string;
  email: string;
  course: string;
  courseId: string;
  enrolledAt: string;
  progress: number;
};

export default function ProviderStudentsPage() {
  const [enrollments, setEnrollments] = React.useState<EnrollmentRecord[]>([]);
  const [courseFilter, setCourseFilter] = React.useState<string>('all');
  const [query, setQuery] = React.useState('');
  const [feedback, setFeedback] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;
    const loadEnrollments = async () => {
      try {
        setLoading(true);
        setFeedback(null);
        const response = await api.get('/trainings/provider/enrollments');
        
        if (!active) return;
        
        // Transform API response to match our component structure
        const enrollmentData = response.data.enrollments || [];
        const formatted: EnrollmentRecord[] = enrollmentData.map((enrollment: any) => ({
          id: enrollment.id,
          learner: enrollment.user?.name || 'Unknown',
          email: enrollment.user?.email || '',
          course: enrollment.training?.name || 'Unknown Course',
          courseId: enrollment.training?.id || '',
          enrolledAt: enrollment.issuedAt || enrollment.createdAt || new Date().toISOString(),
          progress: 0, // Progress tracking can be added later
        }));
        
        setEnrollments(formatted);
        
        if (formatted.length === 0) {
          setFeedback('No students have enrolled in your courses yet.');
        }
      } catch (error: any) {
        console.error('Failed to load enrollments', error);
        if (active) {
          const errorMsg = error.response?.data?.error || error.message || 'Unable to load enrollments right now.';
          setFeedback(errorMsg);
          setEnrollments([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    loadEnrollments();
    return () => {
      active = false;
    };
  }, []);

  const courses = Array.from(new Set(enrollments.map((record) => record.course)));
  const filtered = enrollments
    .filter((record) => (courseFilter === 'all' ? true : record.course === courseFilter))
    .filter((record) =>
      !query.trim()
        ? true
        : record.learner.toLowerCase().includes(query.trim().toLowerCase()) ||
          record.email.toLowerCase().includes(query.trim().toLowerCase()),
    );

  return (
    <ProviderDashboardPage
      title="Student Enrollments"
      description="View and manage students who have enrolled in your training courses."
    >
      {feedback && (
        <div className={`rounded-xl border p-4 text-sm mb-6 ${
          feedback.includes('No students') 
            ? 'border-blue-200 bg-blue-50 text-blue-700' 
            : 'border-primary/20 bg-primary/5 text-primary'
        }`}>
          {feedback}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-primary-darker/70">Loading enrollments...</p>
        </div>
      ) : (
        <section className="rounded-2xl border border-primary/10 bg-white p-6 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full max-w-sm">
            <input
              className="input-field"
              placeholder="Search by name or email..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <select
              id="course-filter"
              className="input-field"
              value={courseFilter}
              onChange={(event) => setCourseFilter(event.target.value)}
            >
              <option value="all">All courses</option>
              {courses.map((course) => (
                <option key={course} value={course}>
                  {course}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-primary-darker/60">
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Date Enrolled</th>
                <th className="px-4 py-3">Progress</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-primary-darker">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-primary-darker/60">
                    No students enrolled yet.
                  </td>
                </tr>
              ) : (
                filtered.map((record) => (
                  <tr key={record.id}>
                    <td className="px-4 py-4">
                      <div className="font-medium">{record.learner}</div>
                      <div className="text-xs text-primary-darker/50">
                        {record.email}
                      </div>
                    </td>
                    <td className="px-4 py-4">{record.course}</td>
                    <td className="px-4 py-4">
                      {new Date(record.enrolledAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-full rounded-full bg-gray-200">
                          <div
                            className="h-2 rounded-full bg-primary"
                            style={{ width: `${record.progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-primary-darker/70">
                          {record.progress}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        className="btn-secondary text-xs"
                        onClick={() =>
                          alert(`Send message to ${record.learner} coming soon.`)
                        }
                      >
                        Send Reminder
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="mt-4 flex items-center justify-between text-sm text-primary-darker/60">
            <span>Showing {filtered.length} result{filtered.length === 1 ? '' : 's'}</span>
            <div className="flex items-center gap-2">
              <button className="btn-secondary px-3 py-2 text-xs" disabled>
                Previous
              </button>
              <button className="btn-secondary px-3 py-2 text-xs" disabled>
                Next
              </button>
            </div>
          </div>
        </div>
      </section>
      )}
    </ProviderDashboardPage>
  );
}

