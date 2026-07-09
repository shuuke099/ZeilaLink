'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function ProviderEnrollmentsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState<string | null>(null);
  const [certificateUrl, setCertificateUrl] = useState<string>('');

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

  const issue = async (trainingId: string, userId: string) => {
    try {
      setIssuing(userId + ':' + trainingId);
      await api.post(`/trainings/${trainingId}/issue-certificate`, { userId, certificateUrl });
      await load();
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
                  <th className="py-2">Certificate</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="py-2">{r.user?.name} ({r.user?.email})</td>
                    <td className="py-2">{r.training?.name}</td>
                    <td className="py-2 text-primary-darker/80 break-all">{r.certificateUrl || '-'}</td>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="url"
                          placeholder="Certificate URL"
                          className="input-field"
                          value={certificateUrl}
                          onChange={(e) => setCertificateUrl(e.target.value)}
                        />
                        <button
                          className="btn-primary"
                          onClick={() => issue(r.trainingId, r.userId)}
                          disabled={issuing === r.userId + ':' + r.trainingId}
                        >
                          {issuing === r.userId + ':' + r.trainingId ? 'Issuing...' : 'Issue'}
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


