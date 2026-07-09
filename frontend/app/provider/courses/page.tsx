'use client';

import React from 'react';
import ProviderDashboardPage from '@/components/provider/ProviderDashboardPage';
import api from '@/lib/api';
import { Edit, Trash2, Plus, Search, Users, Eye } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

type ProviderCourse = {
  id: string;
  title: string;
  category: string;
  enrolled: number;
  status: 'draft' | 'published';
  updatedAt?: string;
};

export default function ProviderCoursesPage() {
  const { language } = useLanguage();
  const [courses, setCourses] = React.useState<ProviderCourse[]>([]);
  const [filter, setFilter] = React.useState<'all' | 'published' | 'draft'>('all');
  const [query, setQuery] = React.useState('');
  const [feedback, setFeedback] = React.useState<string | null>(null);

  const fetchCourses = React.useCallback(async () => {
    try {
      console.log('[ProviderCourses] Fetching courses with mine=true...');
      const response = await api.get('/trainings', { params: { mine: true } });
      console.log('[ProviderCourses] Response:', response.data);
      
      const trainings = response.data.trainings || [];
      console.log('[ProviderCourses] Found trainings:', trainings.length);
      
      const formatted: ProviderCourse[] = trainings.map((course: any) => ({
        id: course.id,
        title: course.name,
        category: course.skill?.name || course.category || 'General',
        enrolled: course._count?.userCertifications || course.enrolledCount || course.enrolled || 0,
        status: course.published ? 'published' : 'draft',
        updatedAt: course.updatedAt,
      }));
      
      console.log('[ProviderCourses] Formatted courses:', formatted);
      setCourses(formatted);
      
      if (formatted.length === 0) {
        setFeedback('No courses found. Create your first program to begin.');
      } else {
        setFeedback(null);
      }
    } catch (error: any) {
      console.error('[ProviderCourses] Failed to load courses:', error);
      console.error('[ProviderCourses] Error response:', error.response?.data);
      setFeedback(`Unable to load courses: ${error.response?.data?.error || error.message}`);
      setCourses([]);
    }
  }, []);

  React.useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const filteredCourses = courses
    .filter((course) => (filter === 'all' ? true : course.status === filter))
    .filter((course) =>
      !query.trim()
        ? true
        : course.title.toLowerCase().includes(query.trim().toLowerCase()),
    );

  const handleDelete = async (course: ProviderCourse) => {
    const confirmed = window.confirm(`Delete ${course.title}? This cannot be undone.`);
    if (!confirmed) return;
    try {
      await api.delete(`/trainings/${course.id}`);
      setFeedback('Course deleted.');
      fetchCourses();
    } catch (error) {
      console.error('Failed to delete course', error);
      setFeedback('Unable to delete course.');
    }
  };

  const handleToggleStatus = async (course: ProviderCourse) => {
    try {
      await api.put(`/trainings/${course.id}`, {
        published: course.status !== 'published',
      });
      setFeedback(
        course.status === 'published'
          ? 'Course moved to draft.'
          : 'Course is now published.',
      );
      fetchCourses();
    } catch (error) {
      console.error('Failed to update course', error);
      setFeedback('Unable to update course status.');
    }
  };

  return (
    <ProviderDashboardPage
      title={language === 'en' ? 'Manage Training Programs' : 'Maamul Barnaamijyada Tababarka'}
      description={language === 'en' 
        ? 'Manage all your course offerings from this dashboard.' 
        : 'Maamul dhammaan koorsooyinkaada dashboard-kan.'}
      headerActions={
        <button
          className="btn-primary inline-flex items-center gap-2 rounded-xl px-6 py-3"
          onClick={() => (window.location.href = '/provider/programs/new')}
        >
          <Plus className="h-4 w-4" />
          {language === 'en' ? 'Add New Training' : 'Ku Dar Tababar Cusub'}
        </button>
      }
    >
      {feedback && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-primary">
          {feedback}
        </div>
      )}

      <section className="rounded-2xl sm:rounded-3xl border border-primary/10 bg-white p-6 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
            <input
              className="input-field pl-9 rounded-xl"
              placeholder={language === 'en' ? 'Search by program title...' : 'Raadi adigoo adeegsanaya cinwaanka barnaamijka...'}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <select
              id="course-filter"
              className="input-field rounded-xl"
              value={filter}
              onChange={(event) => setFilter(event.target.value as any)}
            >
              <option value="all">{language === 'en' ? 'All' : 'Dhammaan'}</option>
              <option value="published">{language === 'en' ? 'Published' : 'La Daabacay'}</option>
              <option value="draft">{language === 'en' ? 'Draft' : 'Qoraal'}</option>
            </select>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-primary-darker/60 border-b border-border">
                <th className="px-4 py-3">{language === 'en' ? 'Title' : 'Cinwaanka'}</th>
                <th className="px-4 py-3">{language === 'en' ? 'Category' : 'Qaybta'}</th>
                <th className="px-4 py-3">{language === 'en' ? 'Enrolled' : 'Isqortay'}</th>
                <th className="px-4 py-3">{language === 'en' ? 'Status' : 'Xaaladda'}</th>
                <th className="px-4 py-3">{language === 'en' ? 'Last Updated' : 'Ugu Dambayntii La Cusbooneysiiyay'}</th>
                <th className="px-4 py-3 text-right">{language === 'en' ? 'Actions' : 'Ficilada'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-primary-darker">
              {filteredCourses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-primary-darker/60">
                    {language === 'en' 
                      ? 'No courses found. Create your first program to begin.' 
                      : 'Koorsooyin lama helin. Abuur barnaamijkaaga ugu horreeya si aad u bilowdo.'}
                  </td>
                </tr>
              ) : (
                filteredCourses.map((course) => (
                  <tr key={course.id} className="hover:bg-primary-light/20 transition-colors">
                    <td className="px-4 py-4 font-semibold text-primary-darker">{course.title}</td>
                    <td className="px-4 py-4 text-primary-darker/70">{course.category}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-primary" />
                        <span className="font-medium">{course.enrolled}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                          course.status === 'published'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {course.status === 'published' 
                          ? (language === 'en' ? 'Published' : 'La Daabacay') 
                          : (language === 'en' ? 'Draft' : 'Qoraal')}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-primary-darker/70">
                      {course.updatedAt
                        ? new Date(course.updatedAt).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2 flex-wrap">
                        <button
                          className="btn-secondary flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl"
                          onClick={() => (window.location.href = `/trainings/${course.id}`)}
                          title={language === 'en' ? 'View Details' : 'Eeg Faahfaahinta'}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          {language === 'en' ? 'View' : 'Eeg'}
                        </button>
                        <button
                          className="btn-secondary flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl"
                          onClick={() => (window.location.href = `/provider/students?course=${course.id}`)}
                          title={language === 'en' ? 'View Students' : 'Eeg Ardayda'}
                        >
                          <Users className="h-3.5 w-3.5" />
                          {language === 'en' ? 'Students' : 'Ardayda'}
                        </button>
                        <button
                          className="btn-secondary flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl"
                          onClick={() => (window.location.href = `/provider/programs/new?edit=${course.id}`)}
                          title={language === 'en' ? 'Edit' : 'Wax ka beddel'}
                        >
                          <Edit className="h-3.5 w-3.5" />
                          {language === 'en' ? 'Edit' : 'Beddel'}
                        </button>
                        <button
                          className="btn-secondary flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl"
                          onClick={() => handleToggleStatus(course)}
                        >
                          {course.status === 'published' 
                            ? (language === 'en' ? 'Unpublish' : 'Ka Saar') 
                            : (language === 'en' ? 'Publish' : 'Daabac')}
                        </button>
                        <button
                          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-600 hover:text-white transition-colors flex items-center gap-1.5"
                          onClick={() => handleDelete(course)}
                          title={language === 'en' ? 'Delete' : 'Tirtir'}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {language === 'en' ? 'Delete' : 'Tirtir'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="mt-4 flex items-center justify-between text-sm text-primary-darker/60">
            <span>
              {language === 'en' 
                ? `Showing ${filteredCourses.length} result${filteredCourses.length === 1 ? '' : 's'}` 
                : `Waxaa lagu muujinayaa ${filteredCourses.length} natiijo`}
            </span>
            <div className="flex items-center gap-2">
              <button className="btn-secondary px-3 py-2 text-xs rounded-xl" disabled>
                {language === 'en' ? 'Previous' : 'Hore'}
              </button>
              <button className="btn-secondary px-3 py-2 text-xs rounded-xl" disabled>
                {language === 'en' ? 'Next' : 'Xiga'}
              </button>
            </div>
          </div>
        </div>
      </section>
    </ProviderDashboardPage>
  );
}

