'use client';

import React from 'react';
import AdminDashboardPage from '@/components/admin/AdminDashboardPage';
import TrainingManagement from '@/components/admin/TrainingManagement';

export default function AdminProvidersPage() {
  return (
    <AdminDashboardPage title="Training Management" description="" headerActions={null}>
      <div className="-mt-6 mb-4 h-[calc(100vh-190px)]">
        <TrainingManagement />
      </div>
    </AdminDashboardPage>
  );
}
