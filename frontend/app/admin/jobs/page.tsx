'use client';

import React from 'react';
import { Briefcase, Activity, CheckCircle2 } from 'lucide-react';
import AdminDashboardPage from '@/components/admin/AdminDashboardPage';
import JobManagement from '@/components/admin/JobManagement';
import { motion } from 'framer-motion';

export default function AdminJobsPage() {
  const [totalJobs, setTotalJobs] = React.useState(0);

  return (
    <AdminDashboardPage
      title="Platform Pipeline"
      description="Professional oversight of active opportunities and organizational growth."
      headerActions={
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-end px-8 py-3 rounded-2xl border border-slate-100 bg-white shadow-sm"
        >
          <div className="flex items-center gap-2 mb-1">
            <Activity size={12} className="text-primary animate-pulse" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Active Listings</p>
          </div>
          <p className="text-4xl font-black leading-none text-slate-900 tracking-tighter">
            {new Intl.NumberFormat('en-US').format(totalJobs)}
          </p>
        </motion.div>
      }
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-[2.5rem] border border-slate-100 bg-white shadow-sm overflow-hidden mb-12"
      >
        <div className="p-10 border-b border-slate-50 bg-slate-50/5 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-black text-[#0b213f] tracking-tight">Active Opportunities</h3>
            <p className="text-sm font-medium text-slate-400 mt-1">Manage and oversee all job listings currently active on the platform.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-full border border-emerald-100">
              <CheckCircle2 size={14} className="text-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-widest leading-none">Verified Pipeline</span>
            </div>
          </div>
        </div>
        <JobManagement onSummaryChange={(summary) => setTotalJobs(summary.totalJobs)} />
      </motion.div>
    </AdminDashboardPage>
  );
}
