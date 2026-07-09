'use client';

import React from 'react';
import Link from 'next/link';
import { Eye, Users, Briefcase, Calendar, FileText } from 'lucide-react';
import EmployerDashboardPage from '@/components/employer/EmployerDashboardPage';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow, format } from 'date-fns';

type EmployerStats = {
  totalEarnings: number;
  earningsChange: number;
  conversionRate: number;
  conversionChange: number;
  totalViews: number;
  viewsChange: number;
  activeJobs: number;
  draftJobs?: number;
  totalApplicants: number;
  interviewsScheduled: number;
  recentJobs: {
    id: string;
    title: string;
    applicants: number;
    published: boolean;
    createdAt: string;
    updatedAt: string;
  }[];
};

type WeeklySummaryItem = {
  id: string;
  contract: string;
  date: string;
  hours: string;
  amount: string;
  paymentType: string;
};

export default function EmployerOverviewPage() {
  const { user } = useAuth();
  const [stats, setStats] = React.useState<EmployerStats>({
    totalEarnings: 0,
    earningsChange: 0,
    conversionRate: 0,
    conversionChange: 0,
    totalViews: 0,
    viewsChange: 0,
    activeJobs: 0,
    draftJobs: 0,
    totalApplicants: 0,
    interviewsScheduled: 0,
    recentJobs: [],
  });
  const [loading, setLoading] = React.useState(true);
  const [weeklySummary, setWeeklySummary] = React.useState<WeeklySummaryItem[]>([]);

  React.useEffect(() => {
    let active = true;
    const loadOverview = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const response = await api
          .get('/employers/me/dashboard')
          .catch(() => ({
            data: {
              totalEarnings: 62935,
              earningsChange: 12.5,
              conversionRate: 41,
              conversionChange: 8.3,
              totalViews: 82,
              viewsChange: 15.2,
              activeJobs: 4,
              draftJobs: 2,
              totalApplicants: 52,
              interviewsScheduled: 8,
              recentJobs: [
                {
                  id: 'fallback-1',
                  title: 'UI Designer for Dashboard',
                  applicants: 18,
                  published: true,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
                {
                  id: 'fallback-2',
                  title: 'UX/UX Designer to Update Figma',
                  applicants: 12,
                  published: true,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
              ],
            },
          }));
        if (!active) return;
        setStats({
          totalEarnings: response.data.totalEarnings ?? 62935,
          earningsChange: response.data.earningsChange ?? 12.5,
          conversionRate: response.data.conversionRate ?? 41,
          conversionChange: response.data.conversionChange ?? 8.3,
          totalViews: response.data.totalViews ?? 82,
          viewsChange: response.data.viewsChange ?? 15.2,
          activeJobs: response.data.activeJobs ?? 0,
          draftJobs: response.data.draftJobs ?? 0,
          totalApplicants: response.data.totalApplicants ?? 0,
          interviewsScheduled: response.data.interviewsScheduled ?? 0,
          recentJobs: response.data.recentJobs ?? [],
        });

        // Mock weekly summary data
        setWeeklySummary([
          {
            id: '1',
            contract: 'UI Designer for Dashboard',
            date: 'Mon, Oct 10 2023',
            hours: '8.20',
            amount: '$120',
            paymentType: 'Hourly',
          },
          {
            id: '2',
            contract: 'UX/UX Designer to Update Figma',
            date: '-',
            hours: '-',
            amount: '$240',
            paymentType: 'Fixed',
          },
        ]);
      } catch (error: any) {
        console.error('Failed to load employer overview', error);
        if (active) {
          setStats({
            totalEarnings: 0,
            earningsChange: 0,
            conversionRate: 0,
            conversionChange: 0,
            totalViews: 0,
            viewsChange: 0,
            activeJobs: 0,
            draftJobs: 0,
            totalApplicants: 0,
            interviewsScheduled: 0,
            recentJobs: [],
          });
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    loadOverview();
    return () => {
      active = false;
    };
  }, [user]);

  // Chart data for analytics
  const chartData = [
    { month: 'Jan 5', value: 50 },
    { month: 'Jan 8', value: 60 },
    { month: 'Jan 11', value: 75 },
    { month: 'Jan 14', value: 55 },
    { month: 'Jan 17', value: 90 },
    { month: 'Jan 20', value: 80 },
    { month: 'Jan 23', value: 85 },
  ];

  const maxValue = Math.max(...chartData.map(d => d.value));

  return (
    <EmployerDashboardPage
      title="Employer Dashboard"
      description=""
      headerActions={null}
    >
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {/* Total Jobs */}
        <div className="group relative rounded-[2rem] border border-slate-100 bg-blue-50/50 p-8 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Total Jobs</p>
              <p className="text-4xl font-black text-blue-900 tracking-tighter">
                {loading ? '...' : stats.activeJobs + (stats.draftJobs || 0)}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100/80">
              <Briefcase className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <p className="text-xs font-semibold text-slate-400">All job postings</p>
        </div>

        {/* Published Jobs */}
        <div className="group relative rounded-[2rem] border border-slate-100 bg-emerald-50/50 p-8 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Published</p>
              <p className="text-4xl font-black text-emerald-900 tracking-tighter">
                {loading ? '...' : stats.activeJobs}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100/80">
              <Eye className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
          <p className="text-xs font-semibold text-slate-400">Active & visible</p>
        </div>

        {/* Draft Jobs */}
        <div className="group relative rounded-[2rem] border border-slate-100 bg-amber-50/50 p-8 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Draft</p>
              <p className="text-4xl font-black text-amber-900 tracking-tighter">
                {loading ? '...' : stats.draftJobs || 0}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100/80">
              <FileText className="h-6 w-6 text-amber-600" />
            </div>
          </div>
          <p className="text-xs font-semibold text-slate-400">Unpublished jobs</p>
        </div>

        {/* Total Applications */}
        <div className="group relative rounded-[2rem] border border-slate-100 bg-purple-50/50 p-8 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Applications</p>
              <p className="text-4xl font-black text-purple-900 tracking-tighter">
                {loading ? '...' : stats.totalApplicants}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100/80">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <p className="text-xs font-semibold text-slate-400">Total applicants</p>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
        {/* Left Column */}
        <div className="space-y-8">
          {/* Analytics Chart */}
          <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-50 pb-6 mb-6">
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">Analytics Overview</h2>
                <p className="text-xs font-semibold text-slate-400 mt-1">
                  Updated on: Monday at 11:30 AM
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <select className="px-4 py-2.5 text-xs font-bold uppercase tracking-widest border border-slate-200 rounded-xl bg-slate-50 text-slate-700 focus:outline-none focus:border-blue-500 hover:bg-slate-100 transition-colors">
                  <option>Week</option>
                  <option>Month</option>
                  <option>Year</option>
                </select>
                <select className="px-4 py-2.5 text-xs font-bold uppercase tracking-widest border border-slate-200 rounded-xl bg-slate-50 text-slate-700 focus:outline-none focus:border-blue-500 hover:bg-slate-100 transition-colors">
                  <option>Last 7 Days</option>
                  <option>Last 30 Days</option>
                  <option>Last 90 Days</option>
                </select>
              </div>
            </div>

            {/* Chart */}
            <div className="relative h-64 mt-4">
              <div className="absolute inset-0 flex items-end justify-between gap-3 px-2">
                {chartData.map((item, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center group cursor-pointer">
                    <div className="w-full flex items-end justify-center h-48">
                      <div
                        className="w-full max-w-[40px] bg-blue-100 rounded-xl relative overflow-hidden transition-all duration-300 group-hover:bg-blue-200"
                        style={{ height: `${(item.value / maxValue) * 100}%` }}
                      >
                        <div className="absolute inset-0 bg-blue-500 rounded-xl h-full w-full transform origin-bottom scale-y-0 group-hover:scale-y-100 transition-transform duration-500 ease-out"></div>
                        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-xl pointer-events-none">
                          {item.value} Views
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mt-4 group-hover:text-blue-600 transition-colors">{item.month}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Weekly Summary */}
          <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Weekly Summary</h2>
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                <span className="text-xs font-bold uppercase tracking-widest">Current Week</span>
                <Calendar className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-4 px-4 text-xs font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">
                      Contract
                    </th>
                    <th className="text-left py-4 px-4 text-xs font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">
                      Date
                    </th>
                    <th className="text-left py-4 px-4 text-xs font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">
                      Hours
                    </th>
                    <th className="text-left py-4 px-4 text-xs font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">
                      Amount
                    </th>
                    <th className="text-left py-4 px-4 text-xs font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">
                      Payment Type
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-xs font-bold uppercase tracking-widest text-slate-400">
                        <div className="animate-pulse space-y-4">
                          <div className="h-4 bg-slate-100 rounded w-full"></div>
                          <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                        </div>
                      </td>
                    </tr>
                  ) : weeklySummary.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-10">
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">No contracts this week</p>
                      </td>
                    </tr>
                  ) : (
                    weeklySummary.map((item) => (
                      <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-4 min-w-[200px]">
                          <p className="text-sm font-bold text-slate-900">{item.contract}</p>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <p className="text-xs font-semibold text-slate-500">{item.date}</p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-sm font-bold text-slate-700">{item.hours}</p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-sm font-black text-slate-900">{item.amount}</p>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${item.paymentType === 'Hourly'
                              ? 'bg-blue-50 text-blue-600'
                              : 'bg-emerald-50 text-emerald-600'
                            }`}>
                            {item.paymentType}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-8">
          {/* Profile Card */}
          <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-6">
                <div className="w-24 h-24 rounded-full bg-blue-50 border-4 border-slate-50 flex items-center justify-center overflow-hidden">
                  {user?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatarUrl}
                      alt={user.name || 'User'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-black text-blue-300">
                      {user?.name?.charAt(0).toUpperCase() || 'E'}
                    </span>
                  )}
                </div>
                <div className="absolute bottom-1 right-1 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full"></div>
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight mb-1">
                {user?.name || 'Company Name'}
              </h3>
              <p className="text-xs font-bold text-slate-400 mb-8 uppercase tracking-widest">@{user?.email?.split('@')[0] || 'employer'}</p>

              {/* Stats */}
              <div className="w-full mb-6">
                <div className="flex items-center justify-between mb-3 text-xs font-black uppercase tracking-widest">
                  <span className="text-slate-500">Profile Score</span>
                  <span className="text-blue-600">90%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-blue-600 h-2 rounded-full transition-all duration-1000" style={{ width: '90%' }}></div>
                </div>
              </div>

              <div className="w-full mb-8">
                <div className="flex items-center justify-between mb-3 text-xs font-black uppercase tracking-widest">
                  <span className="text-slate-500">Success Rate</span>
                  <span className="text-emerald-500">88%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-emerald-500 h-2 rounded-full transition-all duration-1000" style={{ width: '88%' }}></div>
                </div>
              </div>

              <button className="w-full bg-slate-50 text-slate-700 border border-slate-200 font-black text-xs uppercase tracking-widest py-3 px-4 rounded-xl hover:bg-slate-100 hover:text-blue-600 hover:border-blue-200 transition-all">
                View Profile
              </button>
            </div>
          </div>

          {/* Communication Card */}
          <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-sm">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 border-b border-slate-50 pb-4 mb-4">Communication</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-blue-50/50 border border-blue-50/80 rounded-2xl">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 shrink-0"></div>
                <div className="flex-1">
                  <p className="text-sm text-blue-900 font-bold">
                    You received 1 of 3 milestones
                  </p>
                  <p className="text-xs font-semibold text-slate-500 mt-1">
                    to display in the next 90 days.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <div className="h-6 w-6 rounded-full bg-emerald-50 flex items-center justify-center shrink-0"><svg className="h-3 w-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>
                <span className="text-xs font-bold text-slate-600">You reply within a day</span>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <div className="h-6 w-6 rounded-full bg-emerald-50 flex items-center justify-center shrink-0"><svg className="h-3 w-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>
                <span className="text-xs font-bold text-slate-600">You reply every time</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-sm">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 border-b border-slate-50 pb-4 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                href="/employer/post-job"
                className="block w-full bg-blue-600 text-white text-center font-black text-xs uppercase tracking-widest py-4 px-4 rounded-xl hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-600/20 transition-all"
              >
                Post a New Job
              </Link>
              <Link
                href="/employer/jobs"
                className="block w-full bg-slate-50 border border-slate-100 text-slate-600 text-center font-black text-xs uppercase tracking-widest py-4 px-4 rounded-xl hover:bg-slate-100 hover:text-blue-600 transition-colors"
              >
                View All Jobs
              </Link>
              <Link
                href="/employer/applicants"
                className="block w-full bg-slate-50 border border-slate-100 text-slate-600 text-center font-black text-xs uppercase tracking-widest py-4 px-4 rounded-xl hover:bg-slate-100 hover:text-blue-600 transition-colors"
              >
                View Applicants
              </Link>
            </div>
          </div>
        </div>
      </div>
    </EmployerDashboardPage>
  );
}
