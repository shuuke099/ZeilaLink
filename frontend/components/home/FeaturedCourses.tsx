"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Award, ChevronRight, Clock3, GraduationCap, Star } from "lucide-react";
import api from "@/lib/api";

type Course = { id: string; slug?: string | null; name: string; duration: string; cost: number; imageUrl?: string | null; providesCertificate?: boolean; provider: { name: string; rating?: number | null } };

export default function FeaturedCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ courses?: Course[] }>("/courses", { params: { featured: true, limit: 4 } })
      .then(async ({ data }) => {
        let items = data.courses || [];
        if (items.length === 0) {
          const fallback = await api.get<{ courses?: Course[] }>("/courses", { params: { limit: 4 } });
          items = fallback.data.courses || [];
        }
        setCourses(items);
      })
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, []);

  return <section className="w-full bg-white py-10 dark:bg-slate-950">
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div><h2 className="text-xl font-bold text-slate-950 sm:text-2xl dark:text-white">Featured Trainings</h2><p className="mt-1 text-sm text-slate-500">Build practical skills with trusted training providers.</p></div>
        <Link href="/training" className="flex shrink-0 items-center gap-1 text-xs font-semibold text-violet-700 hover:text-violet-900 sm:text-sm">View all trainings <ChevronRight size={17} /></Link>
      </div>
      {!loading && courses.length === 0 ? <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center dark:border-slate-800 dark:bg-slate-900"><p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Training programs will appear here as soon as they are published.</p><Link href="/training" className="mt-3 inline-flex text-sm font-bold text-violet-700">Browse all trainings</Link></div> :
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {(loading ? Array.from({ length: 4 }) : courses).map((item, index) => {
          if (!item || typeof item !== "object" || !("id" in item)) return <div key={index} className="h-[276px] animate-pulse rounded-lg border border-slate-200 bg-slate-100" />;
          const course = item as Course;
          return <Link key={course.id} href={`/training/${course.slug || course.id}`} className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <div className="relative flex h-28 items-center justify-center overflow-hidden bg-slate-100 sm:h-32 dark:bg-slate-800">
              {course.imageUrl ? <img src={course.imageUrl} alt={course.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" /> : <GraduationCap size={42} className="text-violet-600" />}
              <span className="absolute left-3 top-3 rounded bg-violet-700 px-2 py-1 text-[9px] font-bold uppercase text-white">Featured</span>
            </div>
            <div className="p-3.5"><h3 className="line-clamp-1 text-sm font-bold text-slate-950 group-hover:text-violet-700 dark:text-white">{course.name}</h3><p className="mt-1.5 truncate text-xs text-slate-500">{course.provider.name}</p><div className="mt-2 flex items-center gap-1 text-xs"><Star size={13} className="fill-amber-400 text-amber-400" /><span className="font-semibold text-amber-500">{course.provider.rating?.toFixed(1) || "New"}</span></div><div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs dark:border-slate-800"><span className="flex items-center gap-1 text-slate-500"><Clock3 size={13} />{course.duration}</span><span className="font-bold text-violet-700">{course.cost === 0 ? "Free" : `$${course.cost}`}</span></div>{course.providesCertificate && <span className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-emerald-700"><Award size={12} /> Certificate included</span>}</div>
          </Link>;
        })}
      </div>
      }
    </div>
  </section>;
}
