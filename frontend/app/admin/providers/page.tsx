'use client';

import React from 'react';
import { motion } from 'framer-motion';
import AdminDashboardPage from '@/components/admin/AdminDashboardPage';
import TrainingManagement from '@/components/admin/TrainingManagement';
import { GraduationCap, Award, BookOpen } from 'lucide-react';

export default function AdminProvidersPage() {
  return (
    <AdminDashboardPage
      title="Skills & Educators"
      description="Approve elite training programs, manage institutional providers, and synchronize skills with marketplace demand."
      headerActions={
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-full border border-emerald-100">
            <Award size={14} className="text-emerald-500" />
            <span className="text-[10px] font-black uppercase tracking-widest leading-none">Accredited Pipeline</span>
          </div>
        </div>
      }
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[2.5rem] border border-slate-100 bg-white shadow-sm overflow-hidden"
      >
        <div className="p-8 border-b border-slate-50 flex items-center gap-4">
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-purple-50 text-purple-600">
            <BookOpen size={20} />
          </div>
          <div>
            <h3 className="text-xl font-black text-[#0b213f] tracking-tight">Vocational Oversight</h3>
            <p className="text-xs font-medium text-slate-500">Manage training providers and educational certificates.</p>
          </div>
        </div>

        <div className="p-4">
          <TrainingManagement />
        </div>
      </motion.div>

      {/* Stats Summary - Premium Context */}
      <section className="grid gap-6 sm:grid-cols-3 mt-8">
        {[
          { label: 'Active Academies', val: '42', icon: GraduationCap, color: 'text-blue-500' },
          { label: 'Certified Courses', val: '186', icon: BookOpen, color: 'text-purple-500' },
          { label: 'Skill Endorsements', val: '1,240', icon: Award, color: 'text-emerald-500' },
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 + 0.3 }}
            className="rounded-2xl border border-slate-50 bg-slate-50/30 p-6 flex flex-col items-center text-center"
          >
            <stat.icon className={`h-6 w-6 ${stat.color} mb-3`} />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
            <p className="text-2xl font-black text-[#0b213f]">{stat.val}</p>
          </motion.div>
        ))}
      </section>
    </AdminDashboardPage>
  );
}
