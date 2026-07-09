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
          <Link
            href="/register"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus className="h-5 w-5" />
            New
          </Link>
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
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">Loading users...</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">No users found.</td>
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
    </div>
  );
}

