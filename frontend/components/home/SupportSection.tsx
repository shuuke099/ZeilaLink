import Link from "next/link";
import type { Language } from "@/lib/translations";

interface SupportSectionProps {
  language: Language;
}

export default function SupportSection({ language }: SupportSectionProps) {
  const isEn = language === "en";

  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-r from-background via-primary/5 to-amber-50 px-4 py-14 font-sans dark:from-background dark:via-primary/10 dark:to-background sm:px-6 sm:py-20 lg:py-24">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden opacity-40 dark:opacity-20">
        <div className="absolute -left-40 -top-72 h-[44rem] w-[62rem] rounded-[50%] border border-primary/30" />
        <div className="absolute -left-16 -top-64 h-[42rem] w-[76rem] rounded-[50%] border border-primary/20" />
        <div className="absolute left-36 -top-72 h-[46rem] w-[92rem] rounded-[50%] border border-primary/15" />
      </div>

      <div className="relative mx-auto max-w-5xl rounded-3xl border border-border/80 bg-surface/95 px-6 py-14 text-center shadow-xl shadow-slate-900/10 backdrop-blur-sm sm:px-12 sm:py-16 lg:px-20 lg:py-20">
        <h2 className="font-sans text-3xl font-bold leading-tight tracking-tight text-heading sm:text-4xl lg:text-5xl">
          {isEn
            ? "Ready to grow with ZeilaLink?"
            : "Diyaar ma u tahay inaad la kobocdo ZeilaLink?"}
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-foreground/70 sm:text-lg">
          {isEn
            ? "Fast onboarding, secure infrastructure, and real human support—24/7."
            : "Bilow degdeg ah, nidaam ammaan ah, iyo taageero qof dhab ah—24/7."}
        </p>
        <Link
          href="/contact"
          className="mt-8 inline-flex min-h-14 items-center justify-center rounded-xl bg-primary px-8 py-3 font-sans text-base font-bold text-primary-foreground shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:text-lg"
        >
          {isEn ? "Get Started" : "Bilow Hadda"}
        </Link>
      </div>
    </section>
  );
}
