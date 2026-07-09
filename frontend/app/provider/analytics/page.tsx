'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import LineChart from '@/components/admin/LineChart';
import PieChart from '@/components/admin/PieChart';

export default function ProviderAnalyticsPage() {
  const [metrics, setMetrics] = useState<any>({ totalCourses: 0, activeTrainees: 0, certificatesIssued: 0, averageRating: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get('/providers/me/metrics').catch(() => ({ data: {} }));
        setMetrics(res.data || {});
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-primary-darker mb-6">Analytics</h1>

        {loading ? (
          <div className="text-primary-darker/70">Loading...</div>
        ) : (
          <>
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              {[{ label: 'Total Courses', value: metrics.totalCourses }, { label: 'Active Trainees', value: metrics.activeTrainees }, { label: 'Certificates Issued', value: metrics.certificatesIssued }, { label: 'Avg Rating', value: metrics.averageRating ?? '-' }].map((c) => (
                <div key={c.label} className="rounded-xl p-6 text-center card">
                  <div className="text-3xl font-bold text-primary">{c.value}</div>
                  <p className="text-primary-darker/70">{c.label}</p>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="md:col-span-2">
                <LineChart
                  title="Enrollments over time"
                  data={[{ name: 'W1', value: 3 }, { name: 'W2', value: 6 }, { name: 'W3', value: 4 }, { name: 'W4', value: 7 }]}
                />
              </div>
              <PieChart
                title="Completion rate"
                data={[{ name: 'Completed', value: 65 }, { name: 'Active', value: 25 }, { name: 'Dropped', value: 10 }]}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}


