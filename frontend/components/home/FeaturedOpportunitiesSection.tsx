import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Clock,
  GraduationCap,
  MapPin,
  TrendingUp,
} from "lucide-react";
import type { Language } from "@/lib/translations";
import { FEATURED_JOBS, FEATURED_TRAININGS } from "./homeData";
import {
  SECTION_EYEBROW_CLASS,
  SECTION_EYEBROW_TEXT_CLASS,
} from "./homeStyles";

interface FeaturedOpportunitiesSectionProps {
  language: Language;
}

export default function FeaturedOpportunitiesSection({
  language,
}: FeaturedOpportunitiesSectionProps) {
  const isEn = language === "en";

  return (
    <section className="home-opportunities-section relative overflow-hidden bg-[#071633] px-4 py-16 sm:py-20 lg:py-28">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-sky-400/30 to-transparent" />
      <div className="home-mobile-decoration pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-sky-500/10 blur-[120px]" />
      <div className="home-mobile-decoration pointer-events-none absolute -right-40 bottom-10 h-96 w-96 rounded-full bg-emerald-400/10 blur-[120px]" />

      <div className="home-section-content relative mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col items-start justify-between gap-6 sm:mb-14 md:flex-row md:items-end lg:mb-16 lg:gap-8">
          <div className="max-w-2xl">
            <div className={`${SECTION_EYEBROW_CLASS} mb-4`}>
              <TrendingUp size={14} className="shrink-0" />
              <span className={SECTION_EYEBROW_TEXT_CLASS}>
                {isEn ? "Trending Careers" : "Shaqooyinka ugu Caansan"}
              </span>
            </div>
            <h2 className="mb-5 text-3xl font-black leading-tight tracking-tight text-white sm:mb-6 sm:text-4xl lg:text-5xl">
              {isEn ? "Latest Opportunities" : "Fursadihii Ugu Dambeeyay"}
            </h2>
            <p className="text-slate-300 text-lg leading-relaxed">
              {isEn
                ? "Discover high-impact roles at leading organizations. Your next professional milestone starts here."
                : "Ka raadi doorarka saameynta weyn leh ee ururrada hormuudka ka ah Soomaaliya. Guushaada xigta waxay halkan ka bilaabataa."}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-300 shadow-lg shadow-black/10 backdrop-blur-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </span>
            {isEn ? "Fresh listings, updated regularly" : "Fursado cusub oo joogto ah"}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-12 lg:items-stretch">
          {/* Jobs collection */}
          <article className="relative flex flex-col overflow-hidden rounded-[2rem] border border-sky-400/20 bg-gradient-to-br from-sky-500/[0.12] via-[#0b2148] to-[#081936] p-5 shadow-2xl shadow-black/20 sm:p-7 lg:col-span-7">
            <div className="home-mobile-decoration pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-sky-400/10 blur-3xl" />

            <div className="relative mb-6 flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-sky-300/20 bg-sky-400/10 text-sky-300 shadow-inner">
                  <Briefcase size={23} />
                </div>
                <div className="min-w-0">
                  <p className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-sky-300/75">
                    {isEn ? "Career marketplace" : "Suuqa shaqada"}
                  </p>
                  <h3 className="text-xl font-black text-white sm:text-2xl">
                    {isEn ? "Jobs & Employment" : "Shaqooyin & Shaqaaleysiin"}
                  </h3>
                </div>
              </div>
              <span className="shrink-0 rounded-full border border-sky-300/15 bg-sky-300/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-sky-200">
                {`${FEATURED_JOBS.length} ${isEn ? "live roles" : "shaqo"}`}
              </span>
            </div>

            <p className="relative mb-6 max-w-xl text-sm leading-relaxed text-slate-300">
              {isEn
                ? "Explore verified opportunities and connect directly with employers ready to hire."
                : "Sahami fursado la hubiyay oo si toos ah ula xiriir shaqo-bixiyeyaasha."}
            </p>

            <div className="relative grid gap-4 sm:grid-cols-2">
              {FEATURED_JOBS.length > 0 ? (
                FEATURED_JOBS.map((job) => (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.id}`}
                    className={`group flex min-h-48 flex-col rounded-2xl border border-sky-300/15 bg-[#0a1f49]/80 p-4 shadow-lg shadow-black/10 transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-300/40 hover:bg-[#0d2858] hover:shadow-sky-950/40 sm:p-5 ${FEATURED_JOBS.length % 2 === 1 ? "sm:last:col-span-2" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-sky-300/15 bg-[#102b5f] p-2 text-lg font-black uppercase text-sky-200">
                        {job.employer.avatarUrl || job.employer.logoUrl ? (
                          <img
                            src={job.employer.avatarUrl || job.employer.logoUrl}
                            alt={job.employer.name}
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          job.employer.name?.charAt(0)
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="mb-1 truncate text-[10px] font-black uppercase tracking-[0.13em] text-sky-300/70">
                          {job.employer.name}
                        </p>
                        <h4 className="line-clamp-2 text-base font-black leading-snug text-white transition-colors group-hover:text-sky-200 sm:text-lg">
                          {job.title}
                        </h4>
                      </div>
                      <ArrowRight className="h-5 w-5 shrink-0 text-sky-300/40 transition-all group-hover:translate-x-1 group-hover:text-sky-300" />
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/5 bg-white/[0.04] px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-300">
                        <MapPin size={12} className="text-sky-300" />
                        {job.location}
                      </span>
                      <span className="inline-flex items-center rounded-lg border border-sky-300/10 bg-sky-300/[0.07] px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider text-sky-200">
                        {job.employmentType || (isEn ? "Flexible" : "Dabacsan")}
                      </span>
                    </div>

                    <div className="mt-auto flex items-center justify-between border-t border-white/[0.07] pt-4 text-[10px] font-black uppercase tracking-[0.14em] text-sky-200">
                      <span>{isEn ? "View role" : "Eeg shaqada"}</span>
                      <span className="text-slate-500">{isEn ? "Details" : "Faahfaahin"}</span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-sky-300/20 bg-sky-300/[0.04] px-5 py-10 text-center sm:col-span-2">
                  <Briefcase className="mx-auto mb-3 text-sky-300/60" size={28} />
                  <p className="font-bold text-white">
                    {isEn ? "No job openings right now" : "Shaqooyin hadda ma jiraan"}
                  </p>
                </div>
              )}
            </div>

            <Link
              href="/jobs"
              className="group relative mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-sky-300/20 bg-sky-400/10 px-5 py-3.5 text-sm font-black text-sky-200 transition-all hover:border-sky-300/40 hover:bg-sky-500 hover:text-white"
            >
              {isEn ? "Explore all jobs" : "Eeg dhammaan shaqooyinka"}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </article>

          {/* Training collection */}
          <article className="relative flex flex-col overflow-hidden rounded-[2rem] border border-emerald-400/20 bg-gradient-to-br from-emerald-500/[0.12] via-[#0a2732] to-[#081c2d] p-5 shadow-2xl shadow-black/20 sm:p-7 lg:col-span-5">
            <div className="home-mobile-decoration pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl" />

            <div className="relative mb-6 flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-400/10 text-emerald-300 shadow-inner">
                  <GraduationCap size={24} />
                </div>
                <div className="min-w-0">
                  <p className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300/75">
                    {isEn ? "Skills academy" : "Akadeemiyada xirfadaha"}
                  </p>
                  <h3 className="text-xl font-black text-white sm:text-2xl">
                    {isEn ? "Learn & Advance" : "Baro & Horumar"}
                  </h3>
                </div>
              </div>
              <span className="shrink-0 rounded-full border border-emerald-300/15 bg-emerald-300/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-emerald-200">
                {`${FEATURED_TRAININGS.length} ${isEn ? "programs" : "tababar"}`}
              </span>
            </div>

            <p className="relative mb-6 text-sm leading-relaxed text-slate-300">
              {isEn
                ? "Build practical, career-ready skills through trusted training providers."
                : "Ka baro xirfado shaqo oo wax ku ool ah bixiyeyaasha tababarka la hubiyay."}
            </p>

            <div className="relative space-y-4">
              {FEATURED_TRAININGS.length > 0 ? (
                FEATURED_TRAININGS.map((training) => (
                  <Link
                    key={training.id}
                    href={`/trainings/${training.id}`}
                    className="group block rounded-2xl border border-emerald-300/15 bg-emerald-950/25 p-4 shadow-lg shadow-black/10 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300/40 hover:bg-emerald-950/40 hover:shadow-emerald-950/30 sm:p-5"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-emerald-300/15 bg-emerald-400/10 p-2 text-lg font-black uppercase text-emerald-300">
                        {training.provider.logoUrl ? (
                          <img
                            src={training.provider.logoUrl}
                            alt={training.provider.name}
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          training.provider.name?.charAt(0)
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="mb-1 truncate text-[10px] font-black uppercase tracking-[0.13em] text-emerald-300/70">
                          {training.provider.name}
                        </p>
                        <h4 className="line-clamp-2 text-base font-black leading-snug text-white transition-colors group-hover:text-emerald-200 sm:text-lg">
                          {training.name}
                        </h4>
                      </div>
                      <ArrowRight className="h-5 w-5 shrink-0 text-emerald-300/40 transition-all group-hover:translate-x-1 group-hover:text-emerald-300" />
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/[0.07] pt-4">
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-300">
                        <Clock size={13} className="text-emerald-300" />
                        {training.duration}
                      </span>
                      <span className={`rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${training.cost === 0 ? "bg-emerald-400/15 text-emerald-200" : "bg-white/[0.06] text-white"}`}>
                        {training.cost === 0
                          ? isEn
                            ? "Free"
                            : "Bilaash"
                          : `$${training.cost}`}
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-emerald-300/20 bg-emerald-300/[0.04] px-5 py-10 text-center">
                  <GraduationCap className="mx-auto mb-3 text-emerald-300/60" size={30} />
                  <p className="font-bold text-white">
                    {isEn ? "No training programs right now" : "Tababaro hadda ma jiraan"}
                  </p>
                </div>
              )}
            </div>

            <div className="relative mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-emerald-300/10 bg-emerald-300/[0.05] p-3 text-[10px] font-bold leading-relaxed text-emerald-100">
                <CheckCircle2 className="mb-2 h-4 w-4 text-emerald-300" />
                {isEn ? "Career-ready skills" : "Xirfado shaqo"}
              </div>
              <div className="rounded-xl border border-emerald-300/10 bg-emerald-300/[0.05] p-3 text-[10px] font-bold leading-relaxed text-emerald-100">
                <Clock className="mb-2 h-4 w-4 text-emerald-300" />
                {isEn ? "Flexible programs" : "Tababaro dabacsan"}
              </div>
            </div>

            <Link
              href="/trainings"
              className="group relative mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-300/20 bg-emerald-400/10 px-5 py-3.5 text-sm font-black text-emerald-200 transition-all hover:border-emerald-300/40 hover:bg-emerald-500 hover:text-white"
            >
              {isEn ? "Explore training programs" : "Eeg barnaamijyada tababarka"}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </article>
        </div>
      </div>
    </section>
  );
}
