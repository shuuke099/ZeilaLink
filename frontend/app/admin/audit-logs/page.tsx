'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import AdminDashboardPage from '@/components/admin/AdminDashboardPage';
import api from '@/lib/api';
import { History, User, Activity, Clock, Search, Filter } from 'lucide-react';

interface Log { id: string; action: string; actor: string; createdAt: string }

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get('/admin/audit-logs');
        setLogs(res.data.logs || []);
      } catch (err) {
        console.error('Failed to load logs', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <AdminDashboardPage
      title="Audit Infrastructure"
      description="Real-time transparency into system actions, administrative changes, and platform lifecycle events."
      headerActions={
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search logs..."
              className="h-11 w-64 rounded-xl border border-slate-100 bg-white pl-11 pr-4 text-sm font-medium outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all shadow-sm"
            />
          </div>
          <button className="flex h-11 items-center gap-2 rounded-xl border border-slate-100 bg-white px-5 text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50">
            <Filter className="h-4 w-4" />
            Filter
          </button>
        </div>
      }
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[2.5rem] border border-slate-100 bg-white shadow-sm overflow-hidden"
      >
        <div className="p-8 border-b border-slate-50 bg-slate-50/10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-[#0b213f] text-white">
              <History size={20} />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#0b213f] tracking-tight">Immutable Activity Feed</h3>
              <p className="text-xs font-medium text-slate-500">Platform operational footprint across all sessions.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Sync Active
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 border-4 border-slate-100 border-t-primary rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Hydrating Logs...</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <th className="px-8 py-4">TIMESTAMP</th>
                  <th className="px-8 py-4">ACTOR / IDENTITY</th>
                  <th className="px-8 py-4">ACTION EXECUTED</th>
                  <th className="px-8 py-4 text-right">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {logs.length > 0 ? (
                  logs.map((l, idx) => (
                    <motion.tr
                      key={l.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group hover:bg-slate-50/30 transition-colors"
                    >
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <Clock className="h-4 w-4 text-slate-300" />
                          <span className="text-sm font-bold text-slate-500">
                            {new Date(l.createdAt).toLocaleDateString()}
                            <span className="ml-2 text-slate-300 font-medium">
                              {new Date(l.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                            <User size={14} />
                          </div>
                          <span className="text-sm font-black text-[#0b213f]">{l.actor}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <Activity size={14} className="text-primary" />
                          <span className="text-sm font-medium text-slate-600 group-hover:text-[#0b213f] transition-colors">{l.action}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">
                          Verified
                        </span>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-8 py-20 text-center">
                      <div className="max-w-xs mx-auto">
                        <History className="h-12 w-12 text-slate-100 mx-auto mb-4" />
                        <h4 className="text-lg font-black text-slate-900 mb-1">Clear Horizon</h4>
                        <p className="text-sm font-medium text-slate-400">No activity logs recorded in the current timeframe.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Placeholder */}
        <div className="p-6 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between">
          <p className="text-xs font-medium text-slate-400">Showing {logs.length} of {logs.length} historical events</p>
          <div className="flex items-center gap-2">
            <button disabled className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-300 disabled:opacity-50">←</button>
            <button disabled className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-300 disabled:opacity-50">→</button>
          </div>
        </div>
      </motion.div>
    </AdminDashboardPage>
  );
}
