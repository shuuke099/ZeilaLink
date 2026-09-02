"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, GraduationCap } from "lucide-react";
import api from "@/lib/api";

type Course = { id: string; slug?: string | null; name: string; duration: string; cost: number; imageUrl?: string | null; providesCertificate?: boolean; provider: { name: string; rating?: number | null } };

export default function FeaturedCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ courses?: Course[] }>("/courses", { params: { featured: true, limit: 6 } })
      .then(async ({ data }) => {
        let items = data.courses || [];
        if (items.length < 6) {
          const fallback = await api.get<{ courses?: Course[] }>("/courses", { params: { limit: 12 } });
          items = Array.from(new Map([...items, ...(fallback.data.courses || [])].map((course) => [course.id, course])).values());
        }
        setCourses(items.slice(0, 6));
      })
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, []);

  return <section className="w-full bg-white py-10 dark:bg-slate-950">
    <div className="mx-auto max-w-[1440px] px-6 lg:px-8 xl:px-12">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div><h2 className="text-xl font-bold text-slate-950 sm:text-2xl dark:text-white">Featured Trainings</h2><p className="mt-1 text-sm text-slate-500">Build practical skills with trusted training providers.</p></div>
        <Link href="/training" className="flex shrink-0 items-center gap-1 text-xs font-semibold text-violet-700 hover:text-violet-900 sm:text-sm">View all trainings <ChevronRight size={17} /></Link>
      </div>
      {!loading && courses.length === 0 ? <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center dark:border-slate-800 dark:bg-slate-900"><p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Training programs will appear here as soon as they are published.</p><Link href="/training" className="mt-3 inline-flex text-sm font-bold text-violet-700">Browse all trainings</Link></div> :
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-6">
        {(loading ? Array.from({ length: 6 }) : courses).map((item, index) => {
          if (!item || typeof item !== "object" || !("id" in item)) return <div key={index} className="h-[165px] animate-pulse rounded-lg border border-slate-200 bg-slate-100 sm:h-[195px]" />;
          const course = item as Course;
          return <Link key={course.id} href={`/training/${course.slug || course.id}`} className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <div className="relative flex h-[105px] items-center justify-center overflow-hidden bg-slate-100 sm:h-[135px] dark:bg-slate-800">
              {course.imageUrl ? <img src={course.imageUrl} alt={course.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" /> : <GraduationCap size={42} className="text-violet-600" />}
            </div>
            <div className="p-2.5 sm:p-3"><h3 className="line-clamp-1 text-[11px] font-extrabold text-slate-950 group-hover:text-violet-700 sm:text-[13px] dark:text-white">{course.name}</h3><p className="mt-1.5 truncate text-[9px] font-medium text-slate-500 sm:text-[10px]">{course.provider.name}</p></div>
          </Link>;
        })}
      </div>
      }
    </div>
  </section>;
}
