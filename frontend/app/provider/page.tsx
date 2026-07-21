'use client';

import React from 'react';
import { Award, GraduationCap, Users, MessageSquare, Plus } from 'lucide-react';
import ProviderDashboardPage from '@/components/provider/ProviderDashboardPage';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

type ProviderMetrics = {
  totalCourses: number;
  activeLearners: number;
  certificatesIssued: number;
  newMessages?: number;
};

export default function ProviderOverviewPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [metrics, setMetrics] = React.useState<ProviderMetrics>({
    totalCourses: 0,
    activeLearners: 0,
    certificatesIssued: 0,
    newMessages: 0,
  });
  const [upcomingEvents, setUpcomingEvents] = React.useState<
    { id: string; title: string; date: string; description: string }[]
  >([]);

  React.useEffect(() => {
    let active = true;
    const loadMetrics = async () => {
      if (!user) return;
      try {
        const response = await api.get('/providers/me/metrics');
        if (!active) return;
        setMetrics({
          totalCourses: response.data.totalCourses ?? 0,
          activeLearners: response.data.activeLearners ?? 0,
          certificatesIssued: response.data.certificatesIssued ?? 0,
          newMessages: response.data.newMessages ?? 0,
        });
        setUpcomingEvents(response.data.upcoming ?? []);
      } catch (error) {
        console.error('Failed to load provider metrics', error);
        if (active) {
          setMetrics({
            totalCourses: 0,
            activeLearners: 0,
            certificatesIssued: 0,
            newMessages: 0,
          });
          setUpcomingEvents([]);
        }
      }
    };
    loadMetrics();
    return () => {
      active = false;
    };
  }, [user]);

  return (
    <ProviderDashboardPage
      title={language === 'en' ? 'Provider Dashboard' : 'Dashboard-ka Bixiyaha'}
      description={language === 'en'
        ? 'Monitor course performance, manage cohorts, and keep your programs up to date.'
        : 'Dareenka waxqabadka koorsooyinka, maamul koortada, oo sii wad barnaamijyadaada.'}
      headerActions={
        <a
          href="/provider/programs/new"
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest bg-blue-600 text-white px-6 py-3.5 rounded-2xl shadow-lg shadow-blue-600/20 hover:scale-105 hover:bg-blue-700 transition-all"
        >
          <Plus size={16} />
          {language === 'en' ? 'Add Training' : 'Ku Dar Tababar'}
        </a>
      }
    >
      {/* Prominent Add Training Button for Mobile */}
      <div className="lg:hidden mb-6 mt-8">
        <a
          href="/provider/programs/new"
          className="w-full inline-flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest bg-blue-600 text-white px-6 py-4 rounded-2xl shadow-lg shadow-blue-600/20"
        >
          <Plus size={18} />
          {language === 'en' ? 'Add New Training Program' : 'Ku Dar Barnaamij Tababar Cusub'}
        </a>
      </div>

      {/* Overview Cards */}
      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4 mb-8">
        <div className="group relative rounded-[2rem] border border-slate-100 bg-blue-50/50 p-8 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                {language === 'en' ? 'Active Trainings' : 'Tababarka Firfircoon'}
              </p>
              <p className="text-4xl font-black text-blue-900 tracking-tighter">
                {metrics.totalCourses}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100/80">
              <GraduationCap className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <p className="text-xs font-semibold text-slate-400">
            {language === 'en'
              ? 'Published courses on the marketplace'
              : 'Koorsooyin la daabacay suuqa'}
          </p>
        </div>

        <div className="group relative rounded-[2rem] border border-slate-100 bg-emerald-50/50 p-8 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                {language === 'en' ? 'Enrolled Students' : 'Ardayda Isqortay'}
              </p>
              <p className="text-4xl font-black text-emerald-900 tracking-tighter">
                {metrics.activeLearners}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100/80">
              <Users className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
          <p className="text-xs font-semibold text-slate-400">
            {language === 'en'
              ? 'Learners across all courses'
              : 'Ardayda koorsooyinka oo dhan'}
          </p>
        </div>

        <div className="group relative rounded-[2rem] border border-slate-100 bg-amber-50/50 p-8 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                {language === 'en' ? 'Certificates' : 'Shahaadaha'}
              </p>
              <p className="text-4xl font-black text-amber-900 tracking-tighter">
                {metrics.certificatesIssued}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100/80">
              <Award className="h-6 w-6 text-amber-600" />
            </div>
          </div>
          <p className="text-xs font-semibold text-slate-400">
            {language === 'en'
              ? 'Successfully completed'
              : 'Si guul leh u dhameeyay'}
          </p>
        </div>

        <div className="group relative rounded-[2rem] border border-slate-100 bg-purple-50/50 p-8 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                {language === 'en' ? 'New Messages' : 'Fariimaha Cusub'}
              </p>
              <p className="text-4xl font-black text-purple-900 tracking-tighter">
                {metrics.newMessages || 0}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100/80">
              <MessageSquare className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <p className="text-xs font-semibold text-slate-400">
            {language === 'en'
              ? 'Unread messages from students'
              : 'Fariimaha aan la akhrin ardayda'}
          </p>
        </div>
      </section>

      {/* Quick Actions */}
      <div className="mb-8 flex flex-wrap gap-4">
        <a
          href="/provider/programs/new"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all hover:-translate-y-0.5"
        >
          <Plus size={16} />
          {language === 'en' ? 'Add New Training' : 'Ku Dar Tababar Cusub'}
        </a>
        <a
          href="/provider/courses"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 text-xs font-black uppercase tracking-widest hover:bg-slate-100 hover:text-blue-600 hover:border-blue-200 transition-all"
        >
          <GraduationCap size={16} />
          {language === 'en' ? 'Manage Trainings' : 'Maamul Tababarka'}
        </a>
        <a
          href="/provider/students"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 text-xs font-black uppercase tracking-widest hover:bg-slate-100 hover:text-blue-600 hover:border-blue-200 transition-all"
        >
          <Users size={16} />
          {language === 'en' ? 'View Students' : 'Eeg Ardayda'}
        </a>
      </div>

      <section className="grid gap-8 lg:grid-cols-3">
        <article className="lg:col-span-2 rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-sm">
          <header className="flex items-center justify-between gap-3 mb-6 border-b border-slate-50 pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                {language === 'en' ? 'Recently Published Courses' : 'Koorsooyinka Dhowaan La Daabacay'}
              </h2>
              <p className="text-xs font-semibold text-slate-400 mt-1">
                {language === 'en'
                  ? 'Monitor progress and completion rates'
                  : 'Dareenka horumarka iyo heerka dhammaystirka'}
              </p>
            </div>
            <a
              href="/provider/courses"
              className="text-xs font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 transition-colors bg-blue-50 px-4 py-2 rounded-xl"
            >
              {language === 'en' ? 'Manage All' : 'Maamul Dhammaan'}
            </a>
          </header>
          <div className="mt-6 space-y-4">
            {[
              {
                title: 'Supply Chain Operations Pro',
                learners: 54,
                completion: '68%',
                status: 'Active cohort',
              },
              {
                title: 'Digital Logistics Tools',
                learners: 32,
                completion: '45%',
                status: 'Active cohort',
              },
            ].map((course) => (
              <div
                key={course.title}
                className="group rounded-[1.5rem] border border-slate-100 bg-slate-50/50 p-6 shadow-sm transition-all hover:bg-white hover:border-blue-100 hover:shadow-md"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {course.title}
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mt-1">
                      {course.status}
                    </p>
                  </div>
                  <div className="flex items-center gap-6 text-xs font-bold text-slate-500">
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {course.learners} learners</span>
                    <span className="flex items-center gap-1"><Award className="h-3 w-3" /> {course.completion} completion</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>

        <aside className="space-y-6">
          <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-sm">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 pb-4 border-b border-slate-50 mb-4">
              {language === 'en' ? 'Upcoming Milestones' : 'Milestones-ka Soo Socda'}
            </h3>
            <ul className="mt-4 space-y-4">
              {upcomingEvents.map((event) => (
                <li key={event.id} className="rounded-[1.5rem] border border-slate-100 bg-slate-50/50 p-6 shadow-sm">
                  <div className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1">
                    {event.date}
                  </div>
                  <div className="font-bold text-slate-900 mb-2">
                    {event.title}
                  </div>
                  <p className="text-xs font-medium text-slate-500">{event.description}</p>
                </li>
              ))}
              {upcomingEvents.length === 0 && (
                <li className="rounded-[1.5rem] border-2 border-dashed border-slate-100 bg-slate-50/50 p-8 text-center text-xs font-bold text-slate-500">
                  {language === 'en' ? 'No events scheduled yet.' : 'Wax dhacdo ah lama qorsheeyin.'}
                </li>
              )}
            </ul>
          </div>
        </aside>
      </section>
    </ProviderDashboardPage>
  );
}

