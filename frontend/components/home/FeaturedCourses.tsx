"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import api from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { CourseCard, type Training } from "@/app/trainings/TrainingsClient";

const CARDS_PER_PAGE = 5;

export default function FeaturedCourses() {
  const { language } = useLanguage();
  const so = language === "so";
  const t = (en: string, somali: string) => so ? somali : en;
  const [courses, setCourses] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ courses?: Training[] }>("/courses", { params: { featured: true, limit: 12 } })
      .then(async ({ data }) => {
        let items = data.courses || [];
        if (items.length < CARDS_PER_PAGE) {
          const fallback = await api.get<{ courses?: Training[] }>("/courses", { params: { limit: 12 } });
          items = Array.from(new Map([...items, ...(fallback.data.courses || [])].map((course) => [course.id, course])).values());
        }
        setCourses(items.slice(0, CARDS_PER_PAGE));
      })
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, []);

  return <section className="w-full bg-white py-10 dark:bg-slate-950">
    <div className="mx-auto max-w-[1440px] px-6 lg:px-8 xl:px-12">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div><h2 className="text-xl font-bold text-slate-950 sm:text-2xl dark:text-white">{t("Featured Trainings", "Tababaro Xul ah")}</h2><p className="mt-1 text-[9px] text-slate-500 sm:text-[10px]">{t("Build practical skills with trusted training providers.", "Ka baro xirfado wax ku ool ah bixiyeyaasha tababarka ee lagu kalsoon yahay.")}</p></div>
        <Link href="/training" className="flex shrink-0 items-center gap-1 text-xs font-semibold text-violet-700 hover:text-violet-900 sm:text-sm">{t("View all trainings", "Arag dhamaan tababarada")} <ChevronRight size={17} /></Link>
      </div>
      {!loading && courses.length === 0 ? <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center dark:border-slate-800 dark:bg-slate-900"><p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{t("Training programs will appear here as soon as they are published.", "Barnaamijyada tababarku waxay halkan ka muuqan doonaan marka la daabaco.")}</p><Link href="/training" className="mt-3 inline-flex text-sm font-bold text-violet-700">{t("Browse all trainings", "Arag dhamaan tababarada")}</Link></div> :
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
        {(loading ? Array.from({ length: CARDS_PER_PAGE }) : courses).map((item, index) => {
          const mobileHidden = index === 4 ? "hidden sm:flex" : "";
          if (!item || typeof item !== "object" || !("id" in item)) return <div key={index} className={`h-[300px] animate-pulse rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900 ${index === 4 ? "hidden sm:block" : ""}`} />;
          const course = item as Training;
          return <CourseCard key={course.id} training={course} language={language} list={false} className={mobileHidden} />;
        })}
      </div>
      }
    </div>
  </section>;
}
