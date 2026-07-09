'use client';

import React from 'react';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { employerNavItems } from '@/components/dashboard/navItems';
import { useAuth } from '@/contexts/AuthContext';

type EmployerDashboardPageProps = {
  title: string;
  description?: string;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
};

export default function EmployerDashboardPage({
  title,
  description,
  headerActions,
  children,
}: EmployerDashboardPageProps) {
  const { user } = useAuth();

  if (!user || user.role !== 'employer') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md rounded-2xl border border-primary/20 bg-white p-8 text-center shadow-lg">
          <h2 className="text-xl font-semibold text-primary-darker">
            Employer access required
          </h2>
          <p className="mt-3 text-sm text-primary-darker/70">
            Please sign in with an employer account to view this dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <DashboardShell
      title={title}
      description={description}
      navItems={employerNavItems}
      headerActions={headerActions}
      userPanel={null}
    >
      {children}
    </DashboardShell>
  );
}
