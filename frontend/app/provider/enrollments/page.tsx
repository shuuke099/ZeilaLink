'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { getSafeStoredUrl } from '@/lib/safeUrl';

type EnrollmentRow = {
  id: string;
  userId: string;
  trainingId: string;
  enrolledAt: string;
  status: 'enrolled' | 'certificate_issued';
  certificateIssued: boolean;
  certificateUrl: string | null;
  user?: { name?: string; email?: string };
  training?: { name?: string };
};

export default function ProviderEnrollmentsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<EnrollmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState<string | null>(null);
  const [certificateUrls, setCertificateUrls] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<string>('');

  useEffect(() => {
    if (user?.role === 'provider') {
      load();
    }
  }, [user]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get('/trainings/provider/enrollments');
      setRows(res.data.enrollments || []);
    } finally {
      setLoading(false);
    }
  };

  const issue = async (row: EnrollmentRow) => {
    const certificateUrl = getSafeStoredUrl(certificateUrls[row.id]);
    if (!certificateUrl) {
      setFeedback('Enter a root-relative or HTTPS certificate URL.');
      return;
    }

    try {
      setFeedback('');
      setIssuing(row.id);
      await api.post(`/trainings/${row.trainingId}/issue-certificate`, {
        userId: row.userId,
        certificateUrl,
      });
      setCertificateUrls((current) => ({ ...current, [row.id]: '' }));
      await load();
      setFeedback('Certificate issued successfully.');
    } catch (error: any) {
      setFeedback(error?.response?.data?.error || 'Failed to issue certificate.');
    } finally {
      setIssuing(null);
    }
  };

  if (!user || user.role !== 'provider') {
    return <div className="min-h-screen bg-background"><Navbar /><div className="p-8">Access denied</div></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-primary-darker mb-6">Enrollments</h1>
        {feedback && (
          <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm text-primary-darker">
            {feedback}
          </div>
        )}
        {loading ? (
          <div className="text-primary-darker/70">Loading...</div>
        ) : rows.length === 0 ? (
          <div className="text-primary-darker/70">No enrollments yet.</div>
        ) : (
          <div className="overflow-x-auto card">
            <table className="w-full text-left">
              <thead>
                <tr className="text-sm text-primary-darker/70">
                  <th className="py-2">Learner</th>
                  <th className="py-2">Program</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Certificate</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="py-2">{r.user?.name} ({r.user?.email})</td>
                    <td className="py-2">{r.training?.name}</td>
                    <td className="py-2">
                      {r.certificateIssued ? 'Certificate issued' : 'Enrolled'}
                    </td>
                    <td className="py-2 text-primary-darker/80 break-all">
                      {getSafeStoredUrl(r.certificateUrl) ? (
                        <a
                          href={getSafeStoredUrl(r.certificateUrl)!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline"
                        >
                          Open
                        </a>
                      ) : '-'}
                    </td>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="url"
                          placeholder={r.certificateIssued ? 'Replacement certificate URL' : 'Certificate URL'}
                          className="input-field"
                          value={certificateUrls[r.id] || ''}
                          onChange={(e) => setCertificateUrls((current) => ({
                            ...current,
                            [r.id]: e.target.value,
                          }))}
                        />
                        <button
                          className="btn-primary"
                          onClick={() => issue(r)}
                          disabled={issuing === r.id || !certificateUrls[r.id]?.trim()}
                        >
                          {issuing === r.id
                            ? 'Issuing...'
                            : r.certificateIssued
                              ? 'Replace'
                              : 'Issue'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


