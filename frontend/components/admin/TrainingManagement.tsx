import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { ArrowUpDown, BookOpen, ChevronDown, ChevronRight, Eye, MoreHorizontal, Pencil, Plus, Search, Trash2, Upload, Users } from 'lucide-react';

interface TrainingRow {
  id: string;
  name: string;
  category?: string | null;
  cost?: number | null;
  imageUrl?: string | null;
  published?: boolean;
  provider?: { name?: string };
  _count?: { userCertifications: number };
}

type StatusFilter = 'all' | 'active' | 'pending';
const filters: Array<{ id: StatusFilter; label: string }> = [
  { id: 'all', label: 'All Programs' },
  { id: 'active', label: 'Active Programs' },
  { id: 'pending', label: 'Pending Programs' },
];

export default function TrainingManagement() {
  const [trainings, setTrainings] = useState<TrainingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sortAscending, setSortAscending] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [deletingTraining, setDeletingTraining] = useState<TrainingRow | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get('/courses', { params: { all: true, limit: 100 } });
        setTrainings(response.data.courses || []);
      } catch (e: any) {
        setError(e?.response?.data?.error || 'Failed to load trainings');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const closeMenu = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', closeMenu);
    return () => document.removeEventListener('mousedown', closeMenu);
  }, []);

  const visibleTrainings = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return trainings
      .filter((training) => {
        const statusMatches = statusFilter === 'all' ||
          (statusFilter === 'active' && training.published) ||
          (statusFilter === 'pending' && !training.published);
        const searchMatches = !query ||
          training.name.toLowerCase().includes(query) ||
          training.provider?.name?.toLowerCase().includes(query) ||
          training.category?.toLowerCase().includes(query);
        return statusMatches && searchMatches;
      })
      .sort((a, b) => (sortAscending ? 1 : -1) * a.name.localeCompare(b.name));
  }, [trainings, statusFilter, searchQuery, sortAscending]);

  const handleExport = () => {
    const rows = visibleTrainings.map((training) => [
      training.name,
      training.provider?.name || 'Institutional Provider',
      training.category || 'Professional',
      training._count?.userCertifications || 0,
      training.published ? 'Live' : 'Draft',
    ]);
    const csv = [['Program', 'Provider', 'Category', 'Certified', 'Status'], ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'training-programs-export.csv';
    link.click();
    URL.revokeObjectURL(url);
    setMenuOpen(false);
  };

  const handleDelete = async (training: TrainingRow) => {
    try {
      setBusyId(training.id);
      await api.delete(`/courses/admin/${training.id}`);
      setTrainings((current) => current.filter((item) => item.id !== training.id));
      setDeletingTraining(null);
      setError(null);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to delete training');
    } finally {
      setBusyId(null);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const allVisibleSelected = visibleTrainings.length > 0 && visibleTrainings.every((training) => selectedIds.includes(training.id));

  const toggleAllVisible = () => {
    const visibleIds = visibleTrainings.map((training) => training.id);
    setSelectedIds((current) => {
      if (allVisibleSelected) return current.filter((id) => !visibleIds.includes(id));
      return Array.from(new Set([...current, ...visibleIds]));
    });
  };

  const updateSelectedStatus = async (published: boolean) => {
    if (selectedIds.length === 0) return;
    try {
      setBulkUpdating(true);
      setError(null);
      await Promise.all(selectedIds.map((id) => api.put(`/courses/admin/${id}`, { published })));
      setTrainings((current) => current.map((training) => selectedIds.includes(training.id) ? { ...training, published } : training));
      setSelectedIds([]);
    } catch (e: any) {
      setError(e?.response?.data?.error || `Failed to ${published ? 'publish' : 'move'} selected training programs`);
    } finally {
      setBulkUpdating(false);
    }
  };

  const activeLabel = filters.find((filter) => filter.id === statusFilter)?.label || 'All Programs';

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-none bg-transparent">
      <div className="mb-3 flex flex-col gap-3 px-4 py-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative">
          <button type="button" onClick={() => setDropdownOpen((open) => !open)} className="inline-flex items-center gap-2 text-3xl font-black tracking-tight text-slate-900">
            {activeLabel}
            <ChevronDown className="h-6 w-6 text-blue-600" />
          </button>
          <p className="mt-0.5 text-sm font-semibold text-slate-500">{visibleTrainings.length} records</p>
          {dropdownOpen && (
            <div className="absolute z-20 mt-3 w-56 rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
              {filters.map((filter) => (
                <button key={filter.id} type="button" onClick={() => { setStatusFilter(filter.id); setDropdownOpen(false); }} className={`w-full rounded-lg px-3 py-2 text-left text-sm font-semibold ${filter.id === statusFilter ? 'bg-slate-100 text-blue-700' : 'text-slate-700 hover:bg-slate-50'}`}>
                  {filter.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search programs..." className="h-10 w-64 rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-blue-500" />
          </div>
          <Link href="/admin/trainings/new" className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700">
            <Plus className="h-5 w-5" /> New
          </Link>
          <div className="relative" ref={menuRef}>
            <button type="button" onClick={() => setMenuOpen((open) => !open)} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50">
              <MoreHorizontal className="h-5 w-5" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full z-30 mt-2 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                <button type="button" onClick={() => { setSortAscending((value) => !value); setMenuOpen(false); }} className="flex w-full items-center justify-between bg-blue-500 px-4 py-3 text-white hover:bg-blue-600">
                  <span className="inline-flex items-center gap-3 font-semibold"><ArrowUpDown className="h-4 w-4" />Sort by name</span><ChevronRight className="h-4 w-4" />
                </button>
                <button type="button" onClick={handleExport} className="flex w-full items-center justify-between border-t border-slate-100 px-4 py-3 text-slate-700 hover:bg-slate-50">
                  <span className="inline-flex items-center gap-3 font-medium"><Upload className="h-4 w-4 text-blue-500" />Export</span><ChevronRight className="h-4 w-4 text-blue-500" />
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="relative md:hidden">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search programs..." className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-blue-500" />
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="mx-4 mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
          <p className="text-sm font-semibold text-blue-900">{selectedIds.length} program{selectedIds.length === 1 ? '' : 's'} selected</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={bulkUpdating} onClick={() => updateSelectedStatus(true)} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">{bulkUpdating ? 'Updating…' : 'Publish selected'}</button>
            <button type="button" disabled={bulkUpdating} onClick={() => updateSelectedStatus(false)} className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50">{bulkUpdating ? 'Updating…' : 'Move to draft'}</button>
            <button type="button" disabled={bulkUpdating} onClick={() => setSelectedIds([])} className="rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Clear</button>
          </div>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="sticky top-0 z-10 border-y border-slate-200 bg-slate-100 text-left text-xs font-bold uppercase text-slate-600">
              <th className="w-12 px-4 py-4"><input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} aria-label="Select all visible training programs" className="h-4 w-4 rounded border-slate-300 accent-blue-600" /></th>
              <th className="px-4 py-4"><span className="inline-flex items-center gap-1">PROGRAM <ArrowUpDown className="h-4 w-4" /></span></th>
              <th className="px-4 py-4">PROVIDER</th>
              <th className="px-4 py-4">CATEGORY</th>
              <th className="px-4 py-4">ENGAGEMENT</th>
              <th className="px-4 py-4">STATUS</th>
              <th className="px-4 py-4 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">Loading training programs...</td></tr>
            ) : visibleTrainings.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">No training programs found.</td></tr>
            ) : visibleTrainings.map((training) => (
              <tr key={training.id} className={`border-b border-slate-200 hover:bg-slate-50/60 ${selectedIds.includes(training.id) ? 'bg-blue-50/60' : ''}`}>
                <td className="w-12 px-4 py-5"><input type="checkbox" checked={selectedIds.includes(training.id)} onChange={() => toggleSelection(training.id)} aria-label={`Select ${training.name}`} className="h-4 w-4 rounded border-slate-300 accent-blue-600" /></td>
                <td className="px-4 py-5">
                  <div className="flex min-w-[280px] items-center gap-3">
                    <span className="inline-flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-blue-100 bg-blue-50 text-blue-600">
                      {training.imageUrl ? <img src={training.imageUrl} alt="" className="h-full w-full object-cover" /> : <BookOpen size={18} />}
                    </span>
                    <span className="text-lg font-semibold text-blue-700">{training.name}</span>
                  </div>
                </td>
                <td className="px-4 py-5 text-base text-slate-700">{training.provider?.name || 'Institutional Provider'}</td>
                <td className="px-4 py-5 text-base text-slate-700">{training.category || 'Professional'}</td>
                <td className="px-4 py-5 text-base text-slate-700"><span className="inline-flex items-center gap-2"><Users size={16} className="text-slate-400" />{training._count?.userCertifications || 0} certified</span></td>
                <td className="px-4 py-5 text-base"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${training.published ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{training.published ? 'Live' : 'Draft'}</span></td>
                <td className="px-4 py-5"><div className="flex justify-end gap-2">
                  <Link href={`/training/${training.id}`} title="View" className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-blue-50 hover:text-blue-600"><Eye size={16} /></Link>
                  <Link href={`/admin/trainings/new?id=${training.id}`} title="Edit" className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-amber-50 hover:text-amber-600"><Pencil size={16} /></Link>
                  <button type="button" title="Delete" disabled={busyId === training.id} onClick={() => setDeletingTraining(training)} className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"><Trash2 size={16} /></button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {error && <p className="px-6 py-4 text-sm font-semibold text-red-600">{error}</p>}
      {deletingTraining && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4" onClick={() => busyId === null && setDeletingTraining(null)}>
          <div role="dialog" aria-modal="true" aria-labelledby="delete-training-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600"><Trash2 size={22} /></div>
            <h2 id="delete-training-title" className="text-xl font-black text-slate-900">Delete training program?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">You are about to permanently delete <strong>{deletingTraining.name}</strong>. This action cannot be undone.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" disabled={busyId !== null} onClick={() => setDeletingTraining(null)} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancel</button>
              <button type="button" disabled={busyId !== null} onClick={() => handleDelete(deletingTraining)} className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">{busyId ? 'Deleting…' : 'Delete training'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
