'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function ProviderCertificatesPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'provider') {
      load();
    }
  }, [user]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get('/trainings/provider/enrollments');
      const withCertificates = (res.data.enrollments || []).filter((r: any) => !!r.certificateUrl);
      setRows(withCertificates);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'provider') {
    return <div className="min-h-screen bg-background"><Navbar /><div className="p-8">Access denied</div></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-primary-darker mb-6">Certificates</h1>
        {loading ? (
          <div className="text-primary-darker/70">Loading...</div>
        ) : rows.length === 0 ? (
          <div className="text-primary-darker/70">No certificates issued yet.</div>
        ) : (
          <div className="overflow-x-auto card">
            <table className="w-full text-left">
              <thead>
                <tr className="text-sm text-primary-darker/70">
                  <th className="py-2">Learner</th>
                  <th className="py-2">Program</th>
                  <th className="py-2">Certificate URL</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="py-2">{r.user?.name} ({r.user?.email})</td>
                    <td className="py-2">{r.training?.name}</td>
                    <td className="py-2 text-primary-darker/80 break-all">
                      {r.certificateUrl ? (
                        <a href={r.certificateUrl} target="_blank" rel="noreferrer" className="text-primary underline">Open</a>
                      ) : (
                        '-'
                      )}
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


