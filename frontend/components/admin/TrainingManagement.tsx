import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import {
  BookOpen,
  GraduationCap,
  Award,
  MoreVertical,
  CheckCircle2,
  Clock,
  Users,
  Search,
  Plus,
  Eye,
  Pencil,
  Trash2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TrainingRow {
  id: string;
  name: string;
  category?: string | null;
  cost?: number | null;
  published?: boolean;
  provider?: { name?: string };
  _count?: { userCertifications: number };
}

export default function TrainingManagement() {
  const [trainings, setTrainings] = useState<TrainingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleEdit = async (training: TrainingRow) => {
    const name = window.prompt('Training name', training.name);
    if (name === null || !name.trim()) return;
    const category = window.prompt('Category', training.category || 'Professional');
    if (category === null) return;
    const costInput = window.prompt('Cost', String(training.cost ?? 0));
    if (costInput === null || Number.isNaN(Number(costInput))) return;
    try {
      setBusyId(training.id);
      const response = await api.put(`/admin/trainings/${training.id}`, { name: name.trim(), category: category.trim(), cost: Number(costInput) });
      setTrainings((current) => current.map((item) => item.id === training.id ? { ...item, ...response.data } : item));
      setError(null);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to update training');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (training: TrainingRow) => {
    if (!window.confirm(`Delete ${training.name}? This cannot be undone.`)) return;
    try {
      setBusyId(training.id);
      await api.delete(`/admin/trainings/${training.id}`);
      setTrainings((current) => current.filter((item) => item.id !== training.id));
      setError(null);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to delete training');
    } finally {
      setBusyId(null);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        // all=true lets admin view both published/unpublished
        const res = await api.get('/trainings', { params: { all: true } });
        setTrainings(res.data.trainings || []);
      } catch (e: any) {
        setError(e?.response?.data?.error || 'Failed to load trainings');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredTrainings = trainings.filter(t => {
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && t.published) ||
      (statusFilter === 'pending' && !t.published);
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.provider?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* Top Controls */}
      <div className="flex flex-col xl:flex-row gap-6 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2 p-1 bg-slate-50 rounded-2xl border border-slate-100">
          {[
            { id: 'all', label: 'ALL PROGRAMS', icon: BookOpen },
            { id: 'active', label: 'ACTIVE', icon: CheckCircle2 },
            { id: 'pending', label: 'PENDING', icon: Clock },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all duration-300 ${statusFilter === tab.id
                  ? 'bg-white text-blue-600 shadow-sm border border-blue-50'
                  : 'text-slate-400 hover:text-slate-600'
                }`}
            >
              <tab.icon className={`h-3.5 w-3.5 ${statusFilter === tab.id ? 'text-blue-500' : 'opacity-40'}`} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 w-full xl:w-auto">
          <div className="relative flex-1 xl:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
            <input
              type="text"
              placeholder="Filter courses or providers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-11 pr-4 rounded-xl bg-slate-50 border border-slate-50 text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-100 placeholder:text-slate-300 placeholder:font-medium transition-all"
            />
          </div>
          <button className="h-12 w-12 flex items-center justify-center rounded-xl bg-slate-900 text-white shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95">
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="overflow-hidden rounded-[2.5rem] border border-slate-50 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50/30 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                <th className="px-10 py-5">Curriculum & Provider</th>
                <th className="px-8 py-5">Category</th>
                <th className="px-8 py-5">Engagement</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-10 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={5} className="px-10 py-20 text-center text-sm font-bold text-slate-300">Cataloging educational assets...</td></tr>
              ) : filteredTrainings.length === 0 ? (
                <tr><td colSpan={5} className="px-10 py-20 text-center text-sm font-bold text-slate-300">No matching training programs found.</td></tr>
              ) : (
                filteredTrainings.map((t) => (
                  <tr key={t.id} className="group transition-colors hover:bg-slate-50/50">
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shadow-sm">
                          <BookOpen size={20} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-900 tracking-tight">{t.name}</span>
                          <span className="text-xs font-bold text-slate-400">{t.provider?.name || 'Institutional Provider'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="inline-flex rounded-lg border border-slate-100 bg-white px-3 py-1.5 text-[10px] font-black tracking-widest uppercase text-slate-500 shadow-sm">
                        {t.category || 'Professional'}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <Users size={14} className="text-slate-300" />
                        <span className="text-sm font-black text-slate-900">{t._count?.userCertifications || 0}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Certified</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-[10px] font-black tracking-widest uppercase transition-all ${t.published
                          ? 'border-emerald-100 bg-emerald-50 text-emerald-600'
                          : 'border-amber-100 bg-amber-50 text-amber-600'
                        }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${t.published ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                        {t.published ? 'Live' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-10 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/trainings/${t.id}`} title="View" className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600"><Eye size={16} /></Link>
                        <button type="button" title="Edit" disabled={busyId === t.id} onClick={() => handleEdit(t)} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-amber-50 hover:text-amber-600 disabled:opacity-50"><Pencil size={16} /></button>
                        <button type="button" title="Delete" disabled={busyId === t.id} onClick={() => handleDelete(t)} className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
