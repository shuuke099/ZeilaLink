import {
  Briefcase,
  GraduationCap,
  TrendingUp,
  Users,
} from "lucide-react";
import type { Language } from "@/lib/translations";
import { HOME_STATS } from "./homeData";

interface StatsSectionProps {
  language: Language;
}

export default function StatsSection({ language }: StatsSectionProps) {
  const isEn = language === "en";

  return (
    <section className="home-stats-section relative overflow-hidden border-y border-white/5 bg-slate-900 py-10 sm:py-14 lg:py-16">
      <div className="home-mobile-decoration absolute inset-0 bg-[radial-gradient(circle_at_50%_0,rgba(var(--color-primary-rgb),0.15),transparent_50%)]" />
      <div className="home-section-content max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4 lg:gap-8">
          {[
            {
              label: isEn ? "Jobs Posted" : "Shaqooyin la soo dhigay",
              value: HOME_STATS.jobs,
              icon: Briefcase,
            },
            {
              label: isEn ? "Skill Trainings" : "Tababaro Xirfadeed",
              value: HOME_STATS.trainings,
              icon: GraduationCap,
            },
            {
              label: isEn ? "Talented Workers" : "Shaqaale Hibo leh",
              value: HOME_STATS.workers,
              icon: Users,
            },
            {
              label: isEn ? "Success Rate" : "Heerka Guusha",
              value: HOME_STATS.successRate,
              icon: TrendingUp,
            },
          ].map((stat, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-4 sm:gap-4 sm:rounded-3xl sm:px-6 sm:py-5 lg:rounded-none lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:pl-8 lg:border-l lg:border-white/10 first:lg:border-0 first:lg:pl-0"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 shadow-inner sm:h-14 sm:w-14 sm:rounded-2xl">
                <stat.icon className="h-5 w-5 text-primary-light sm:h-7 sm:w-7" />
              </div>
              <div className="min-w-0">
                <div className="mb-1 text-2xl font-black leading-none text-white sm:text-3xl">
                  {stat.value}
                </div>
                <div className="text-[8px] font-bold uppercase leading-tight tracking-[0.14em] text-slate-400 sm:text-[10px] sm:tracking-[0.2em]">
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
