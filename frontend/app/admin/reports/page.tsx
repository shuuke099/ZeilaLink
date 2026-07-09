'use client';

import React from 'react';
import { motion } from 'framer-motion';
import AdminDashboardPage from '@/components/admin/AdminDashboardPage';
import { Download, FileSpreadsheet, FileText, ChevronRight, BarChart3, PieChart, Activity } from 'lucide-react';
import api from '@/lib/api';

export default function AdminReportsPage() {
  const [generating, setGenerating] = React.useState<string | null>(null);

  const reports = [
    {
      id: 'users',
      title: 'User Ecosystem',
      description: 'Comprehensive directory of all registered talent, employers, and providers.',
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      id: 'jobs',
      title: 'Marketplace Velocity',
      description: 'Analysis of job postings, category trends, and employer engagement rates.',
      icon: Briefcase,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      id: 'applications',
      title: 'Application Funnel',
      description: 'Critical data on hiring pipelines and success rates across industries.',
      icon: BarChart3,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      id: 'providers',
      title: 'Skill Development',
      description: 'Audit of training providers, course enrollments, and learner impact.',
      icon: PieChart,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ];

  const downloadReport = async (type: string, format: 'csv' | 'pdf') => {
    try {
      setGenerating(`${type}-${format}`);
      const response = await api.get(`/admin/reports/${type}`, {
        params: { format },
        responseType: 'blob',
      });
      const blob = new Blob([response.data], {
        type: format === 'csv' ? 'text/csv' : 'application/pdf',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}-report.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download report', error);
      alert('Unable to download report right now. Please try again later.');
    } finally {
      setGenerating(null);
    }
  };

  return (
    <AdminDashboardPage
      title="Reports & Analytics"
      description="Access high-fidelity data exports and platform performance audits."
    >
      <div className="grid gap-8 lg:grid-cols-2">
        {reports.map((report, idx) => (
          <motion.article
            key={report.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="group relative rounded-[2rem] border border-slate-100 bg-white p-8 shadow-sm hover:shadow-2xl transition-all duration-500"
          >
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center gap-5">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${report.bg} ${report.color} group-hover:scale-110 transition-transform duration-500`}>
                  <Download className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-[#0b213f] tracking-tight">
                    {report.title}
                  </h2>
                  <p className="mt-1 text-sm font-medium text-slate-400">
                    System Audit Report
                  </p>
                </div>
              </div>
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <p className="text-slate-500 font-medium leading-relaxed mb-8">
              {report.description}
            </p>

            <div className="flex flex-wrap gap-4">
              <button
                className="group/btn flex items-center gap-3 rounded-xl bg-[#0b213f] px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-[#0b213f]/10 transition-all hover:bg-slate-800 disabled:opacity-50"
                onClick={() => downloadReport(report.id, 'csv')}
                disabled={generating === `${report.id}-csv`}
              >
                <FileSpreadsheet className="h-4 w-4" />
                {generating === `${report.id}-csv` ? 'Generating...' : 'Export CSV'}
                <ChevronRight className="h-4 w-4 opacity-0 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all" />
              </button>
              <button
                className="group/btn flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-black text-slate-700 shadow-sm transition-all hover:bg-slate-50 disabled:opacity-50"
                onClick={() => downloadReport(report.id, 'pdf')}
                disabled={generating === `${report.id}-pdf`}
              >
                <FileText className="h-4 w-4 text-rose-500" />
                {generating === `${report.id}-pdf` ? 'Generating...' : 'Export PDF'}
                <ChevronRight className="h-4 w-4 opacity-0 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all" />
              </button>
            </div>

            {/* Background Decoration */}
            <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-slate-50 rounded-full -z-10 group-hover:scale-110 transition-transform duration-500 opacity-50" />
          </motion.article>
        ))}
      </div>

      {/* Analytics Preview Placeholder */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-12 rounded-[2.5rem] bg-[#0b213f] p-12 text-white overflow-hidden relative"
      >
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full mb-6 border border-white/10">
            <Activity size={14} className="text-emerald-400" />
            <span className="text-[10px] font-black uppercase tracking-widest">Global Insights Ready</span>
          </div>
          <h2 className="text-4xl font-black tracking-tight mb-4">Deep Analytics Coming Soon</h2>
          <p className="text-lg text-white/60 font-medium">
            We're building an advanced business intelligence engine to help you visualize platform growth like never before.
          </p>
        </div>

        {/* Abstract Shapes */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[100px] -mr-32 -mt-32" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-emerald-400/10 rounded-full blur-[80px]" />
      </motion.div>
    </AdminDashboardPage>
  );
}

// Fixed missing icons from imports
import { Users, Briefcase } from 'lucide-react';
