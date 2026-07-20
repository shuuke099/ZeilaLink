import Link from "next/link";
import { ArrowRight, GraduationCap, Search, Star } from "lucide-react";
import { t, type Language } from "@/lib/translations";
import {
  SECTION_EYEBROW_CLASS,
  SECTION_EYEBROW_TEXT_CLASS,
} from "./homeStyles";

interface HeroSectionProps {
  language: Language;
}

export default function HeroSection({ language }: HeroSectionProps) {
  const isEn = language === "en";
  const getT = (key: string) => t(key, language);

  return (
    <section className="home-hero-section relative w-full max-w-full overflow-hidden bg-white pb-14 pt-28 sm:pb-20 sm:pt-32 lg:pb-28 lg:pt-44">
      {/* Abstract Background Accents */}
      <div className="home-mobile-decoration absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_20%,rgba(var(--color-primary-rgb),0.05),transparent_70%)]" />
          <div className="absolute inset-0 opacity-[0.025] [background-image:linear-gradient(rgba(15,23,42,0.35)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.35)_1px,transparent_1px)] [background-size:36px_36px]" />

        {/* Decorative Circles - High Visibility on Light */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] border border-slate-200 rounded-[100%] rotate-[15deg] opacity-60" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[500px] border border-slate-200 rounded-[100%] rotate-[-15deg] opacity-60" />
        </div>

        {/* Subtle decorative shapes */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-400/5 rounded-full blur-[100px]" />
      </div>

      <div className="home-section-content relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto min-w-0 max-w-4xl text-center">
          <div
            className={`${SECTION_EYEBROW_CLASS} mb-6 sm:mb-8`}
          >
            <Star size={15} className="shrink-0 fill-current" />
            <span className={`${SECTION_EYEBROW_TEXT_CLASS} min-w-0 max-w-full whitespace-normal break-words`}>
              {isEn
                ? "Connecting Opportunities & People"
                : "Isku Xiraha Fursadaha Bulshada"}
            </span>
          </div>

          <h1
            className="mb-8 max-w-full whitespace-normal break-words text-3xl font-black leading-[1.2] tracking-tight text-slate-900 md:text-4xl lg:text-5xl"
          >
            {isEn ? (
              <>
                Your Gateway to Jobs,{" "}
                <span className="text-primary relative inline-block">
                  Skills{" "}
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-2 left-0 -z-10 h-3 w-full bg-primary/10"
                  />
                </span>{" "}
                and Services.
              </>
            ) : (
              <>
                Madasha Shaqooyinka,{" "}
                <span className="text-primary relative inline-block">
                  Xirfadaha{" "}
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-2 left-0 -z-10 h-3 w-full bg-primary/10"
                  />
                </span>{" "}
                iyo Adeegyada.
              </>
            )}
          </h1>

          <p
            className="mx-auto mb-10 max-w-xl whitespace-normal break-words text-lg leading-relaxed text-slate-600"
          >
            {isEn
              ? "Discover job opportunities, gain in-demand skills, get support with your resume and job applications, and offer your services while connecting with employers and clients — all on one powerful platform."
              : "Ka hel fursado shaqo, baro xirfadaha suuqa looga baahan yahay, uhel taageero CV-gaaga iyo codsiyada shaqada, ku soo bandhig adeegyadaada si ay u gaaraan macaamiil badan — hal madal oo awood leh oo kulminaysa dhammaan."}
          </p>

          <div
            className="mx-auto flex w-full max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center sm:gap-4"
          >
            <Link
              href="/jobs"
              prefetch={false}
              className="group btn-primary w-full min-w-0 px-4 py-3.5 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 transition-all flex items-center justify-center sm:w-auto sm:px-8 sm:py-4 sm:text-base"
            >
              <Search className="mr-1.5 h-4 w-4 shrink-0 sm:mr-2 sm:h-5 sm:w-5" />
              <span>{getT("searchJobs")}</span>
              <ArrowRight
                className="ml-1 h-4 w-4 shrink-0 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all sm:ml-2 sm:h-[18px] sm:w-[18px]"
                size={18}
              />
            </Link>
            <Link
              href="/trainings"
              prefetch={false}
              className="w-full min-w-0 bg-white border border-slate-200 hover:border-primary/40 hover:-translate-y-0.5 text-slate-700 px-4 py-3.5 rounded-xl text-sm font-bold shadow-sm hover:shadow-md transition-all flex items-center justify-center sm:w-auto sm:px-8 sm:py-4 sm:text-base"
            >
              <GraduationCap className="mr-1.5 h-4 w-4 shrink-0 text-primary sm:mr-2 sm:h-[22px] sm:w-[22px]" />
              <span>{getT("searchTrainings")}</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
