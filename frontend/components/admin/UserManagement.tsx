import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Plus,
  Upload,
  Eye,
  Pencil,
  Trash2,
} from 'lucide-react';
import api from '@/lib/api';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string | null;
  location?: string | null;
  isVerified?: boolean;
  createdAt?: string;
}

type UserManagementProps = {
  onTotalChange?: (total: number) => void;
};

const tabOptions = [
  { id: 'all', label: 'All Users' },
  { id: 'worker', label: 'Workers' },
  { id: 'employer', label: 'Employers' },
  { id: 'trainer', label: 'Trainers' },
  { id: 'provider', label: 'Providers' },
];

export default function UserManagement({ onTotalChange }: UserManagementProps) {
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [activeTab, setActiveTab] = useState('all');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sortByNameAsc, setSortByNameAsc] = useState(true);
  const [viewingUser, setViewingUser] = useState<UserData | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', role: 'worker', phone: '', location: '', isVerified: true });
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const roleParam = searchParams.get('role');
    const typeParam = searchParams.get('type');

    if (roleParam === 'provider' && typeParam) {
      setActiveTab(typeParam);
    } else if (roleParam) {
      setActiveTab(roleParam);
    } else {
      setActiveTab('all');
    }
  }, [searchParams]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const params: Record<string, string | number> = { page: 1, limit: 100 };
        if (activeTab === 'trainer' || activeTab === 'provider') {
          params.role = 'provider';
          params.type = activeTab;
        } else if (activeTab !== 'all') {
          params.role = activeTab;
        }

        const res = await api.get('/admin/users', { params });
        const list = res.data?.users || [];
        setUsers(list);
        const nextTotal = res.data?.pagination?.total || list.length;
        setTotal(nextTotal);
        onTotalChange?.(nextTotal);
      } catch (e: any) {
        setError(e?.response?.data?.error || 'Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [activeTab, onTotalChange]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const activeLabel = useMemo(() => {
    return tabOptions.find((tab) => tab.id === activeTab)?.label || 'All Users';
  }, [activeTab]);

  const displayUsers = useMemo(() => {
    const list = [...users];
    list.sort((a, b) => {
      const left = (a.name || '').toLowerCase();
      const right = (b.name || '').toLowerCase();
      if (left < right) return sortByNameAsc ? -1 : 1;
      if (left > right) return sortByNameAsc ? 1 : -1;
      return 0;
    });
    return list;
  }, [users, sortByNameAsc]);

  const handleExport = () => {
    const headers = ['Name', 'Email', 'Role', 'Phone', 'Location', 'Status', 'Created'];
    const rows = displayUsers.map((user) => [
      user.name || '',
      user.email || '',
      user.role || '',
      user.phone || '',
      user.location || '',
      user.isVerified ? 'Verified' : 'Unverified',
      user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '',
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'users-export.csv';
    link.click();
    URL.revokeObjectURL(url);
    setMenuOpen(false);
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setBusyId('create');
      const response = await api.post('/admin/users', createForm);
      setUsers((current) => [response.data, ...current]);
      setTotal((current) => current + 1);
      setCreateOpen(false);
      setCreateForm({ name: '', email: '', password: '', role: 'worker', phone: '', location: '', isVerified: true });
      setError(null);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to create user');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (user: UserData) => {
    if (!window.confirm(`Delete ${user.name}? This cannot be undone.`)) return;
    try {
      setBusyId(user.id);
      await api.delete(`/admin/users/${user.id}`);
      setUsers((current) => current.filter((item) => item.id !== user.id));
      setTotal((current) => Math.max(0, current - 1));
      setError(null);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to delete user');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex h-full flex-col bg-transparent rounded-none overflow-hidden">
      <div className="mb-3 flex items-center justify-between px-4 py-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="inline-flex items-center gap-2 text-3xl font-black tracking-tight text-slate-900"
          >
            {activeLabel}
            <ChevronDown className="h-6 w-6 text-blue-600" />
          </button>
          <p className="mt-0.5 text-sm font-semibold text-slate-500">{total} records</p>

          {dropdownOpen && (
            <div className="absolute mt-3 w-56 rounded-xl border border-slate-200 bg-white shadow-xl p-1 z-20">
              {tabOptions.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold ${tab.id === activeTab ? 'bg-slate-100 text-blue-700' : 'text-slate-700 hover:bg-slate-50'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus className="h-5 w-5" />
            New
          </button>
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>

            {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-60 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden z-30">
                <button
                  type="button"
                  onClick={() => {
                    setSortByNameAsc((prev) => !prev);
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 bg-blue-500 text-white hover:bg-blue-600"
                >
                  <span className="inline-flex items-center gap-3 font-semibold">
                    <ArrowUpDown className="h-4 w-4" />
                    Sort by
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={handleExport}
                  className="w-full flex items-center justify-between px-4 py-3 text-slate-700 hover:bg-slate-50 border-t border-slate-100"
                >
                  <span className="inline-flex items-center gap-3 font-medium">
                    <Upload className="h-4 w-4 text-blue-500" />
                    Export
                  </span>
                  <ChevronRight className="h-4 w-4 text-blue-500" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="sticky top-0 z-10 border-y border-slate-200 bg-slate-100 text-left text-xs font-bold text-slate-600 uppercase">
              <th className="px-4 py-4">
                <span className="inline-flex items-center gap-1">NAME <ArrowUpDown className="h-4 w-4" /></span>
              </th>
              <th className="px-4 py-4">EMAIL</th>
              <th className="px-4 py-4">ROLE</th>
              <th className="px-4 py-4">PHONE</th>
              <th className="px-4 py-4">LOCATION</th>
              <th className="px-4 py-4">STATUS</th>
              <th className="px-4 py-4">CREATED</th>
              <th className="px-4 py-4 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-400">Loading users...</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-400">No users found.</td>
              </tr>
            ) : (
              displayUsers.map((user) => {
                return (
                  <tr key={user.id} className="border-b border-slate-200 hover:bg-slate-50/60">
                    <td className="px-4 py-5 text-lg font-semibold text-blue-700">{user.name}</td>
                    <td className="px-4 py-5 text-base text-slate-700">{user.email}</td>
                    <td className="px-4 py-5 text-base text-slate-700 uppercase">{user.role}</td>
                    <td className="px-4 py-5 text-base text-slate-700">{user.phone || '-'}</td>
                    <td className="px-4 py-5 text-base text-slate-700">{user.location || '-'}</td>
                    <td className="px-4 py-5 text-base">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${user.isVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {user.isVerified ? 'Verified' : 'Unverified'}
                      </span>
                    </td>
                    <td className="px-4 py-5 text-base text-slate-700">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</td>
                    <td className="px-4 py-5"><div className="flex justify-end gap-2">
                      <button type="button" title="View" onClick={() => setViewingUser(user)} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-blue-50 hover:text-blue-600"><Eye size={16} /></button>
                      <Link title="Edit" href={`/admin/users/${user.id}/edit`} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-amber-50 hover:text-amber-600"><Pencil size={16} /></Link>
                      <button type="button" title="Delete" disabled={busyId === user.id} onClick={() => handleDelete(user)} className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"><Trash2 size={16} /></button>
                    </div></td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {error && (
        <p className="px-6 py-4 text-sm font-semibold text-red-600">{error}</p>
      )}
      {viewingUser && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4" onClick={() => setViewingUser(null)}>
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
          <div className="mb-5 flex justify-between gap-4"><div><h3 className="text-xl font-black text-slate-900">{viewingUser.name}</h3><p className="text-sm text-slate-500">{viewingUser.email}</p></div><button onClick={() => setViewingUser(null)} className="h-fit rounded-lg px-3 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100">Close</button></div>
          <div className="grid grid-cols-2 gap-4 text-sm"><p><b className="block text-slate-400">Role</b>{viewingUser.role}</p><p><b className="block text-slate-400">Status</b>{viewingUser.isVerified ? 'Verified' : 'Unverified'}</p><p><b className="block text-slate-400">Phone</b>{viewingUser.phone || '-'}</p><p><b className="block text-slate-400">Location</b>{viewingUser.location || '-'}</p></div>
        </div>
      </div>}
      {createOpen && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4" onClick={() => setCreateOpen(false)}>
        <form onSubmit={handleCreate} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
          <div className="mb-5 flex items-center justify-between"><div><h3 className="text-xl font-black text-slate-900">Create User</h3><p className="text-sm text-slate-500">Add a user without leaving the dashboard.</p></div><button type="button" onClick={() => setCreateOpen(false)} className="rounded-lg px-3 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100">Close</button></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">Name<input required value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-blue-500" /></label>
            <label className="text-sm font-semibold text-slate-700">Email<input required type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-blue-500" /></label>
            <label className="text-sm font-semibold text-slate-700">Password<input required minLength={6} type="password" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-blue-500" /></label>
            <label className="text-sm font-semibold text-slate-700">Role<select value={createForm.role} onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-blue-500"><option value="worker">Worker</option><option value="employer">Employer</option><option value="provider">Provider</option><option value="admin">Admin</option></select></label>
            <label className="text-sm font-semibold text-slate-700">Phone<input value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-blue-500" /></label>
            <label className="text-sm font-semibold text-slate-700">Location<input value={createForm.location} onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-blue-500" /></label>
          </div>
          <label className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={createForm.isVerified} onChange={(e) => setCreateForm({ ...createForm, isVerified: e.target.checked })} />Mark account as verified</label>
          <button disabled={busyId === 'create'} className="mt-6 w-full rounded-xl bg-blue-600 px-4 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-50">{busyId === 'create' ? 'Creating...' : 'Create User'}</button>
        </form>
      </div>}
    </div>
  );
}

