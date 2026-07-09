'use client';

import React from 'react';
import AdminDashboardPage from '@/components/admin/AdminDashboardPage';
import UserManagement from '@/components/admin/UserManagement';

export default function AdminUsersPage() {
  const [totalUsers, setTotalUsers] = React.useState(0);

  return (
    <AdminDashboardPage
      title="User Management"
      description=""
      headerActions={null}
    >
      <div className="-mt-6 mb-4 h-[calc(100vh-190px)]">
        <UserManagement onTotalChange={setTotalUsers} />
      </div>
    </AdminDashboardPage>
  );
}
