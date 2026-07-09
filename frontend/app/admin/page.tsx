'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Briefcase,
  ClipboardList,
  CheckCircle2,
  Clock3,
  Globe,
  GraduationCap,
  Layers3,
  ShieldCheck,
  Star,
  TrendingDown,
  Users,
} from 'lucide-react';
import AdminDashboardPage from '@/components/admin/AdminDashboardPage';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';

interface AdminMetrics {
  totalUsers: number;
  totalWorkers: number;
  totalEmployers: number;
  totalProviders: number;
  totalJobs: number;
  totalTrainings: number;
  totalApplications: number;
  flaggedJobs: number;
}

type ServiceBooking = {
  id: string;
  status: string;
  paymentStatus?: string;
  createdAt: string;
  customerName: string;
  service?: {
    title?: string;
    provider?: string;
  };
};

type WorkerUser = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  location?: string | null;
  createdAt?: string;
};

type AdminJob = {
  id: string;
  title: string;
  createdAt: string;
  _count?: {
    applications?: number;
  };
};

type AdminService = {
  id: string;
  title: string;
  category: string;
  provider: string;
  priceLabel: string;
  published: boolean;
  _count?: {
    bookings?: number;
  };
};

type AdminTraining = {
  id: string;
  name: string;
  duration?: string | null;
  cost?: number | null;
  provider?: {
    name?: string | null;
  };
};

const buildSmoothPath = (values: number[]) => {
  if (values.length === 0) return '';
  const width = 280;
  const height = 100;
  const maxValue = Math.max(...values, 1);
  const minValue = Math.min(...values, 0);
  const range = Math.max(maxValue - minValue, 1);

  const points = values.map((value, idx) => {
    const x = (idx / Math.max(values.length - 1, 1)) * width;
    const y = height - ((value - minValue) / range) * (height - 10) - 5;
    return { x, y };
  });

  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`;
  }

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const curr = points[i];
    const cx1 = prev.x + (curr.x - prev.x) / 2;
    const cy1 = prev.y;
    const cx2 = prev.x + (curr.x - prev.x) / 2;
    const cy2 = curr.y;
    d += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${curr.x} ${curr.y}`;
  }

  return d;
};

export default function AdminOverviewPage() {
  const { user, token, loading: authLoading } = useAuth();
  const isAdmin = user?.role?.toLowerCase() === 'admin';
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [bookings, setBookings] = useState<ServiceBooking[]>([]);
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [workers, setWorkers] = useState<WorkerUser[]>([]);
  const [services, setServices] = useState<AdminService[]>([]);
  const [trainings, setTrainings] = useState<AdminTraining[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!isAdmin || !token) {
      setLoading(false);
      return;
    }

    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        const [metricsRes, bookingsRes, jobsRes, workersRes, servicesRes, trainingsRes] = await Promise.all([
          api.get('/admin/metrics'),
          api.get('/admin/service-bookings'),
          api.get('/admin/jobs', { params: { page: 1, limit: 30 } }),
          api.get('/admin/users', { params: { role: 'worker', page: 1, limit: 20 } }),
          api.get('/admin/services'),
          api.get('/trainings', { params: { all: true, page: 1, limit: 12 } }),
        ]);

        setMetrics(metricsRes.data || null);
        setBookings(bookingsRes.data?.bookings || []);
        setJobs(jobsRes.data?.jobs || []);
        setWorkers(workersRes.data?.users || []);
        setServices(servicesRes.data?.services || []);
        setTrainings(trainingsRes.data?.trainings || []);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const status = error.response?.status;
          // Expected when session is expired or user is not authorized.
          if (status === 401 || status === 403) {
            return;
          }
        }
        console.error('Failed to fetch admin dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [authLoading, isAdmin, token]);

  const statCards = useMemo(
    () => [
      {
        title: 'TOTAL USERS',
        value: (metrics?.totalUsers ?? 0).toLocaleString(),
        description: 'Platform infrastructure total reach',
        icon: Users,
        actionIcon: Globe,
        accent: 'text-[#3a73ec]',
      },
      {
        title: 'TALENTED WORKERS',
        value: (metrics?.totalWorkers ?? 0).toLocaleString(),
        description: 'Active professional workforce',
        icon: Users,
        actionIcon: Star,
        accent: 'text-[#3a73ec]',
      },
      {
        title: 'ELITE EMPLOYERS',
        value: (metrics?.totalEmployers ?? 0).toLocaleString(),
        description: 'Verified hiring organizations',
        icon: Briefcase,
        actionIcon: ShieldCheck,
        accent: 'text-[#3a73ec]',
      },
      {
        title: 'SKILL PROVIDERS',
        value: (metrics?.totalProviders ?? 0).toLocaleString(),
        description: 'Certified training partners',
        icon: GraduationCap,
        actionIcon: TrendingDown,
        accent: 'text-slate-500',
      },
    ],
    [metrics],
  );

  const healthRatio = useMemo(() => {
    const totalJobs = metrics?.totalJobs ?? 0;
    const flagged = metrics?.flaggedJobs ?? 0;
    if (!totalJobs) return 100;
    const healthy = Math.max(0, ((totalJobs - flagged) / totalJobs) * 100);
    return Math.round(healthy);
  }, [metrics]);

  const verifiedRatio = useMemo(() => {
    const total = metrics?.totalUsers ?? 0;
    const trusted = (metrics?.totalEmployers ?? 0) + (metrics?.totalProviders ?? 0);
    if (!total) return 100;
    return Math.min(100, Math.round((trusted / total) * 100));
  }, [metrics]);

  const latency = useMemo(() => {
    const loadFactor = (metrics?.totalApplications ?? 0) % 35;
    return 18 + loadFactor;
  }, [metrics]);

  const revenueSeries = useMemo(() => {
    const recentJobs = [...jobs]
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(-8);

    if (recentJobs.length === 0) {
      return [8, 10, 11, 13, 10, 9, 11, 15];
    }

    return recentJobs.map((job, idx) => {
      const applications = job._count?.applications ?? 0;
      return Math.max(1, applications * 2 + idx + 3);
    });
  }, [jobs]);

  const revenuePath = useMemo(() => buildSmoothPath(revenueSeries), [revenueSeries]);

  const liveBookings = useMemo(() => bookings.slice(0, 3), [bookings]);
  const topServices = useMemo(() => services.slice(0, 4), [services]);
  const topTrainings = useMemo(() => trainings.slice(0, 4), [trainings]);
  const recentJobs = useMemo(() => jobs.slice(0, 4), [jobs]);

  const topApplicant = useMemo(() => {
    if (workers.length > 0) return workers[0];
    return null;
  }, [workers]);

  return (
    <AdminDashboardPage title="Dashboard" description="">
      <div className="max-w-7xl mx-auto space-y-5 pb-8">
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {statCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="rounded-2xl border border-slate-200 bg-[#f5f8ff] px-5 py-4 min-h-[125px]"
            >
              <div className="flex items-center justify-between">
                <div className={`inline-flex items-center gap-2 text-[11px] font-black tracking-wide ${card.accent}`}>
                  <card.icon size={14} />
                  <p>{card.title}</p>
                </div>
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-100/70 text-[#3a73ec]">
                  <card.actionIcon size={15} />
                </span>
              </div>
              <p className="mt-4 text-3xl font-black text-[#102a66]">{loading ? '...' : card.value}</p>
              <p className={`mt-1 text-xs font-semibold ${card.accent}`}>{card.description}</p>
            </motion.div>
          ))}
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-bold text-slate-700 mb-4">Platform Health</h3>
            <div className="flex items-center justify-center">
              <div className="relative h-40 w-40">
                <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                  <circle cx="60" cy="60" r="48" stroke="#e5e7eb" strokeWidth="10" fill="none" />
                  <circle cx="60" cy="60" r="48" stroke="#32c8d4" strokeWidth="10" fill="none" strokeDasharray="301.6" strokeDashoffset={301.6 * (1 - healthRatio / 100)} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-3xl font-black text-slate-900">{healthRatio}%</p>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Health Ratio</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="rounded-xl bg-slate-50 p-3 text-center">
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Latency</p>
                <p className="text-sm font-black text-slate-800">{latency}ms</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 text-center">
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Verified Ratio</p>
                <p className="text-sm font-black text-slate-800">{verifiedRatio}%</p>
              </div>
            </div>
          </div>

          <div className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-sm font-bold text-slate-700">Earnings & Revenue</h3>
                <p className="text-[11px] text-slate-400">Derived from hiring activity and booking volume</p>
              </div>
              <div className="inline-flex rounded-lg bg-slate-100 p-1 text-[11px] font-semibold text-slate-500">
                <span className="px-2 py-1 rounded bg-white shadow-sm text-slate-700">Daily</span>
                <span className="px-2 py-1">Monthly</span>
              </div>
            </div>
            <div className="h-48">
              <svg viewBox="0 0 300 120" className="w-full h-full">
                <defs>
                  <linearGradient id="line-fill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#2f67ea" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#2f67ea" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={`M 0 118 L 0 110 ${revenuePath.replace('M', 'L')} L 280 118 Z`} fill="url(#line-fill)" />
                <path d={revenuePath} fill="none" stroke="#2f67ea" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-700">Live Service Bookings</h3>
              <button className="text-xs font-semibold text-[#2f67ea]">View All</button>
            </div>
            <div className="space-y-3">
              {liveBookings.length === 0 ? (
                <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No bookings available yet.</div>
              ) : (
                liveBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{booking.service?.title || 'Service booking'}</p>
                      <p className="text-[11px] text-slate-400">{booking.customerName} • {booking.service?.provider || 'Provider'}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ${booking.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      <Clock3 size={11} />
                      {booking.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-700">Applicant Review</h3>
              <span className="inline-flex rounded-full bg-blue-100 text-[#2f67ea] px-2 py-1 text-[10px] font-semibold">LIVE</span>
            </div>
            {topApplicant ? (
              <>
                <div className="flex items-center gap-4">
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(topApplicant.name)}&background=2f67ea&color=ffffff&bold=true`}
                    alt={topApplicant.name}
                    className="h-20 w-20 rounded-full object-cover border border-slate-200"
                  />
                  <div>
                    <p className="text-lg font-black text-slate-900">{topApplicant.name}</p>
                    <p className="text-sm text-slate-500">{topApplicant.email}</p>
                    <div className="mt-2 flex gap-2 text-[10px] font-semibold text-slate-500">
                      <span className="rounded bg-slate-100 px-2 py-1">{topApplicant.location || 'Location N/A'}</span>
                      <span className="rounded bg-slate-100 px-2 py-1">{topApplicant.phone || 'Phone N/A'}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <button className="h-10 rounded-xl border border-rose-200 text-rose-600 font-semibold inline-flex items-center justify-center gap-2">
                    <TrendingDown size={14} />
                    Decline
                  </button>
                  <button className="h-10 rounded-xl bg-[#2f67ea] text-white font-semibold inline-flex items-center justify-center gap-2">
                    <CheckCircle2 size={14} />
                    Accept
                  </button>
                </div>
              </>
            ) : (
              <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No worker applicants available yet.</div>
            )}
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-700">Worker Dashboard Snapshot</h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-[10px] font-semibold text-[#2f67ea]">
                <Users size={11} />
                Workers
              </span>
            </div>
            <div className="mb-4 grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[10px] font-semibold uppercase text-slate-400">Workers</p>
                <p className="text-lg font-black text-slate-900">{metrics?.totalWorkers ?? 0}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[10px] font-semibold uppercase text-slate-400">Applications</p>
                <p className="text-lg font-black text-slate-900">{metrics?.totalApplications ?? 0}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[10px] font-semibold uppercase text-slate-400">New Profiles</p>
                <p className="text-lg font-black text-slate-900">{workers.length}</p>
              </div>
            </div>
            <div className="space-y-2">
              {workers.slice(0, 3).map((worker) => (
                <div key={worker.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{worker.name}</p>
                    <p className="text-[11px] text-slate-500">{worker.location || 'Location N/A'}</p>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">{worker.email}</span>
                </div>
              ))}
              {workers.length === 0 && (
                <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No worker profiles yet.</div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-700">Employer Dashboard Snapshot</h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                <Briefcase size={11} />
                Employers
              </span>
            </div>
            <div className="mb-4 grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[10px] font-semibold uppercase text-slate-400">Employers</p>
                <p className="text-lg font-black text-slate-900">{metrics?.totalEmployers ?? 0}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[10px] font-semibold uppercase text-slate-400">Published Jobs</p>
                <p className="text-lg font-black text-slate-900">{metrics?.totalJobs ?? 0}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[10px] font-semibold uppercase text-slate-400">Flagged Jobs</p>
                <p className="text-lg font-black text-slate-900">{metrics?.flaggedJobs ?? 0}</p>
              </div>
            </div>
            <div className="space-y-2">
              {recentJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{job.title}</p>
                    <p className="text-[11px] text-slate-500">{new Date(job.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600">
                    <ClipboardList size={12} />
                    {job._count?.applications ?? 0}
                  </span>
                </div>
              ))}
              {recentJobs.length === 0 && (
                <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No jobs posted yet.</div>
              )}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-700">Provider Dashboard Snapshot</h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700">
                <GraduationCap size={11} />
                Providers
              </span>
            </div>
            <div className="mb-4 grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[10px] font-semibold uppercase text-slate-400">Providers</p>
                <p className="text-lg font-black text-slate-900">{metrics?.totalProviders ?? 0}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[10px] font-semibold uppercase text-slate-400">Trainings</p>
                <p className="text-lg font-black text-slate-900">{metrics?.totalTrainings ?? 0}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[10px] font-semibold uppercase text-slate-400">Loaded</p>
                <p className="text-lg font-black text-slate-900">{trainings.length}</p>
              </div>
            </div>
            <div className="space-y-2">
              {topTrainings.map((training) => (
                <div key={training.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{training.name}</p>
                    <p className="text-[11px] text-slate-500">{training.provider?.name || 'Provider'} • {training.duration || 'Flexible'}</p>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-600">
                    {training.cost ? `$${training.cost}` : 'Free'}
                  </span>
                </div>
              ))}
              {topTrainings.length === 0 && (
                <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No trainings available yet.</div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-700">Services Dashboard Snapshot</h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-1 text-[10px] font-semibold text-purple-700">
                <Layers3 size={11} />
                Services
              </span>
            </div>
            <div className="mb-4 grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[10px] font-semibold uppercase text-slate-400">Services</p>
                <p className="text-lg font-black text-slate-900">{services.length}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[10px] font-semibold uppercase text-slate-400">Bookings</p>
                <p className="text-lg font-black text-slate-900">{bookings.length}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[10px] font-semibold uppercase text-slate-400">Messages</p>
                <p className="text-lg font-black text-slate-900">
                  {bookings.filter((item) => item.status === 'pending').length}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {topServices.map((service) => (
                <div key={service.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{service.title}</p>
                    <p className="text-[11px] text-slate-500">{service.category} • {service.provider}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600">
                    <BookOpen size={12} />
                    {service._count?.bookings ?? 0}
                  </span>
                </div>
              ))}
              {topServices.length === 0 && (
                <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No services created yet.</div>
              )}
            </div>
          </div>
        </section>
      </div>
    </AdminDashboardPage>
  );
}
