'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import AdminDashboardPage from '@/components/admin/AdminDashboardPage';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowUpDown, ChevronRight, Eye, MoreHorizontal, Pencil, Plus, Trash2, Upload } from 'lucide-react';

type AdminService = {
  id: string;
  title: string;
  category: string;
  provider: string;
  priceLabel: string;
  published: boolean;
  _count?: { bookings: number };
};

export default function AdminServicesPage() {
  const { user, token, loading: authLoading } = useAuth();
  const [services, setServices] = useState<AdminService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sortByTitleAsc, setSortByTitleAsc] = useState(true);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const loadServices = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/services');
      setServices(response.data?.services || []);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role?.toLowerCase() !== 'admin' || !token) {
      setLoading(false);
      setError('Admin access required');
      return;
    }
    loadServices();
  }, [authLoading, user, token]);

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

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this service?')) return;

    try {
      await api.delete(`/admin/services/${id}`);
      setServices((prev) => prev.filter((service) => service.id !== id));
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to delete service');
    }
  };

  const handleEdit = async (service: AdminService) => {
    const title = window.prompt('Service title', service.title);
    if (title === null || !title.trim()) return;
    const category = window.prompt('Category', service.category);
    if (category === null || !category.trim()) return;
    const priceLabel = window.prompt('Price label', service.priceLabel);
    if (priceLabel === null || !priceLabel.trim()) return;
    try {
      const response = await api.put(`/admin/services/${service.id}`, {
        title: title.trim(),
        category: category.trim(),
        priceLabel: priceLabel.trim(),
      });
      setServices((current) => current.map((item) => item.id === service.id ? { ...item, ...response.data } : item));
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to update service');
    }
  };

  const displayServices = useMemo(() => {
    const list = [...services];
    list.sort((a, b) => {
      const left = (a.title || '').toLowerCase();
      const right = (b.title || '').toLowerCase();
      if (left < right) return sortByTitleAsc ? -1 : 1;
      if (left > right) return sortByTitleAsc ? 1 : -1;
      return 0;
    });
    return list;
  }, [services, sortByTitleAsc]);

  const handleExport = () => {
    const headers = ['Title', 'Category', 'Provider', 'Price', 'Bookings', 'Status'];
    const rows = displayServices.map((service) => [
      service.title || '',
      service.category || '',
      service.provider || '',
      service.priceLabel || '',
      String(service._count?.bookings ?? 0),
      service.published ? 'Published' : 'Draft',
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'services-export.csv';
    link.click();
    URL.revokeObjectURL(url);
    setMenuOpen(false);
  };

  return (
    <AdminDashboardPage title="Services" description="">
      <div className="h-[calc(100vh-190px)]">
        <div className="flex h-full flex-col bg-transparent rounded-none overflow-hidden">
          <div className="mb-3 flex items-center justify-end px-4 py-2">
            <div className="flex items-center gap-3">
              <Link
                href="/admin/services/new"
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
                  <div className="absolute right-0 top-full z-30 mt-2 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setSortByTitleAsc((prev) => !prev);
                        setMenuOpen(false);
                      }}
                      className="flex w-full items-center justify-between bg-blue-500 px-4 py-3 text-white hover:bg-blue-600"
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
                      className="flex w-full items-center justify-between border-t border-slate-100 px-4 py-3 text-slate-700 hover:bg-slate-50"
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
                <tr className="sticky top-0 z-10 border-y border-slate-200 bg-slate-100 text-left text-xs font-bold uppercase text-slate-600">
                  <th className="px-4 py-4">TITLE</th>
                  <th className="px-4 py-4">CATEGORY</th>
                  <th className="px-4 py-4">PROVIDER</th>
                  <th className="px-4 py-4">PRICE</th>
                  <th className="px-4 py-4">BOOKINGS</th>
                  <th className="px-4 py-4">STATUS</th>
                  <th className="px-4 py-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">
                      Loading services...
                    </td>
                  </tr>
                ) : displayServices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">
                      No services found.
                    </td>
                  </tr>
                ) : (
                  displayServices.map((service) => (
                    <tr key={service.id} className="border-b border-slate-200 hover:bg-slate-50/60">
                      <td className="px-4 py-5 text-base font-semibold text-blue-700">{service.title}</td>
                      <td className="px-4 py-5 text-base text-slate-700">{service.category}</td>
                      <td className="px-4 py-5 text-base text-slate-700">{service.provider}</td>
                      <td className="px-4 py-5 text-base text-slate-700">{service.priceLabel}</td>
                      <td className="px-4 py-5 text-base text-slate-700">{service._count?.bookings ?? 0}</td>
                      <td className="px-4 py-5 text-base">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${service.published ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}
                        >
                          {service.published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-4 py-5">
                        <div className="flex justify-end gap-2">
                          <Link href={`/services/${service.id}`} title="View" className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-blue-50 hover:text-blue-600"><Eye size={16} /></Link>
                          <button type="button" title="Edit" onClick={() => handleEdit(service)} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-amber-50 hover:text-amber-600"><Pencil size={16} /></button>
                          <button type="button" title="Delete" onClick={() => handleDelete(service.id)} className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {error && <p className="px-4 py-3 text-sm font-semibold text-red-600">{error}</p>}
        </div>
      </div>
    </AdminDashboardPage>
  );
}
