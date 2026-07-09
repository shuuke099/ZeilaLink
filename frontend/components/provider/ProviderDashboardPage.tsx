'use client';

import React from 'react';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { providerNavItems } from '@/components/dashboard/navItems';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import BackendConnectionError from '@/components/BackendConnectionError';

type ProviderDashboardPageProps = {
  title: string;
  description?: string;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
};

export default function ProviderDashboardPage({
  title,
  description,
  headerActions,
  children,
}: ProviderDashboardPageProps) {
  const { user } = useAuth();
  const [providerSummary, setProviderSummary] = React.useState<{
    name?: string | null;
    avatarUrl?: string | null;
  }>({
    name: user?.name,
    avatarUrl: user?.avatarUrl ?? null,
  });
  const [connectionError, setConnectionError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!user || user.role !== 'provider') {
      setProviderSummary({
        name: user?.name,
        avatarUrl: user?.avatarUrl ?? null,
      });
      return;
    }

    let cancelled = false;
    const loadProviderProfile = async () => {
      try {
        const response = await api.get('/providers/me/profile');
        if (cancelled) return;
        const provider = response.data;
        setProviderSummary({
          name: provider?.name ?? user.name,
          avatarUrl: provider?.logoUrl ?? user.avatarUrl ?? null,
        });
        setConnectionError(null);
      } catch (error: any) {
        if (cancelled) return;
        setProviderSummary({
          name: user.name,
          avatarUrl: user.avatarUrl ?? null,
        });
        
        // Check if it's a connection error
        if (error.isConnectionError || error.code === 'ERR_NETWORK' || error.code === 'ERR_CONNECTION_REFUSED') {
          setConnectionError(error.connectionErrorMessage || error.message || 'Cannot connect to backend server');
        }
      }
    };

    loadProviderProfile();

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user || user.role !== 'provider') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md rounded-2xl border border-primary/20 bg-white p-8 text-center shadow-lg">
          <h2 className="text-xl font-semibold text-primary-darker">
            Provider access required
          </h2>
          <p className="mt-3 text-sm text-primary-darker/70">
            Please sign in as a training provider to view this dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {connectionError && <BackendConnectionError message={connectionError} />}
      <DashboardShell
        title={title}
        description={description}
        navItems={providerNavItems}
        headerActions={headerActions}
        userPanel={null}
      >
        {children}
      </DashboardShell>
    </>
  );
}

