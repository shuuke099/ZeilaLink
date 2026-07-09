'use client';

import React from 'react';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { adminNavItems } from '@/components/dashboard/navItems';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Lock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type AdminDashboardPageProps = {
  title: string;
  description?: string;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
};

export default function AdminDashboardPage({
  title,
  description,
  headerActions,
  children,
}: AdminDashboardPageProps) {
  const { user, loading } = useAuth();
  const isAdmin = user?.role?.toLowerCase() === 'admin';

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-muted px-4 font-sans">
        <div className="text-sm font-semibold text-muted">Checking admin access...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-muted px-4 font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full rounded-[2.5rem] border border-border bg-surface p-12 text-center shadow-2xl"
        >
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-3xl border border-rose-100 bg-rose-50">
            <Lock className="h-10 w-10 text-rose-500" />
          </div>
          <h2 className="text-heading text-3xl font-black tracking-tight">
            Administrative Access Only
          </h2>
          <p className="text-muted mb-10 mt-4 text-sm font-medium leading-relaxed">
            This sector of the JobPlatform is restricted. Verify your credentials or return to the public marketplace.
          </p>
          <Link
            href="/"
            className="group inline-flex items-center gap-3 rounded-2xl bg-slate-900 px-8 py-4 text-sm font-black text-white shadow-xl transition-all hover:bg-slate-800"
          >
            <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
            Back to Marketplace
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <DashboardShell
      title={title}
      description={description}
      navItems={adminNavItems}
      headerActions={headerActions}
      userPanel={null}
    >
      {children}
    </DashboardShell>
  );
}
