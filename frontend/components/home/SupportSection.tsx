import Link from "next/link";
import {
  ArrowRight,
  Clock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Star,
} from "lucide-react";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import type { Language } from "@/lib/translations";
import {
  SECTION_EYEBROW_CLASS,
  SECTION_EYEBROW_TEXT_CLASS,
} from "./homeStyles";

interface SupportSectionProps {
  language: Language;
}

const SUPPORT_CARD_CLASS =
  "group rounded-2xl border border-border/80 bg-gradient-to-br from-surface-muted to-background-muted p-4 no-underline shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:from-primary/10 hover:to-surface hover:shadow-lg hover:shadow-primary/10 sm:p-5";

const SUPPORT_ICON_CLASS =
  "mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-surface text-primary shadow-md shadow-slate-900/5 ring-1 ring-border/80 transition-transform group-hover:scale-105";

export default function SupportSection({ language }: SupportSectionProps) {
  const isEn = language === "en";

  return (
    <section className="home-support-section relative overflow-hidden bg-background-muted px-4 py-14 sm:py-16 lg:py-20">
      <div className="home-mobile-decoration pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-8 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-64 w-64 rounded-full bg-sky-400/10 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_0%,rgba(var(--color-primary-rgb),0.035)_50%,transparent_100%)]" />
      </div>

      <div className="home-section-content relative mx-auto max-w-7xl">
        <div
          className="mx-auto mb-8 max-w-2xl text-center sm:mb-10"
        >
          <div className={`${SECTION_EYEBROW_CLASS} mb-4`}>
            <Star size={14} className="shrink-0 fill-current" />
            <span className={SECTION_EYEBROW_TEXT_CLASS}>
              {isEn
                ? "Global Support Center"
                : "Xarunta Taageerada Caalamiga"}
            </span>
          </div>
          <h2 className="mb-4 text-3xl font-black leading-tight tracking-tight text-heading sm:text-4xl lg:text-5xl">
            {isEn ? (
              <>
                Support that keeps you{" "}
                <span className="text-primary">moving</span>
              </>
            ) : (
              <>
                Taageero ku sii wada{" "}
                <span className="text-primary">horumarka</span>
              </>
            )}
          </h2>
          <p className="mx-auto max-w-xl text-base leading-relaxed text-foreground/70 sm:text-lg">
            {isEn
              ? "Speak with a real person whenever you need help finding work, building skills, or using ZeilaLink."
              : "La hadal qof dhab ah marka aad u baahan tahay caawimaad shaqo raadinta, horumarinta xirfadaha, ama isticmaalka ZeilaLink."}
          </p>
        </div>

        <div className="grid overflow-hidden rounded-[1.75rem] border border-border/80 bg-surface/95 shadow-2xl shadow-slate-900/10 backdrop-blur-xl lg:grid-cols-12 lg:rounded-[2.25rem]">
          <div
            className="relative overflow-hidden bg-gradient-to-br from-[#0c2859] via-[#081d42] to-[#06142e] p-6 text-white sm:p-9 lg:col-span-5 lg:p-10"
          >
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full border border-white/10" />
            <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full border border-white/5" />
            <div className="relative">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/15 text-blue-300 sm:h-14 sm:w-14">
                <MessageCircle className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-blue-300">
                {isEn ? "Direct assistance" : "Caawimaad toos ah"}
              </p>
              <h3 className="mb-4 text-2xl font-black leading-tight text-white sm:text-3xl">
                {isEn
                  ? "Talk to our support team"
                  : "La hadal kooxdayada taageerada"}
              </h3>
              <p className="mb-7 max-w-md text-sm leading-relaxed text-slate-300 sm:text-base">
                {isEn
                  ? "Get fast, practical guidance from the people who know the platform best."
                  : "Ka hel hagitaan degdeg ah oo wax ku ool ah dadka sida fiican u yaqaan madasha."}
              </p>

              <a
                href="https://wa.me/19522288655"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#25D366] px-5 py-4 text-sm font-black text-white no-underline shadow-lg shadow-emerald-950/20 transition-all hover:-translate-y-0.5 hover:bg-[#20bd5a] hover:shadow-xl sm:w-auto sm:px-7"
              >
                <WhatsAppIcon size={20} fill="white" />
                {isEn ? "Message on WhatsApp" : "Nagala soo xiriir WhatsApp"}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>

              <div className="mt-5 flex items-center gap-2.5 text-xs font-bold text-slate-300">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </span>
                {isEn
                  ? "Usually replies in under 5 minutes"
                  : "Badanaa waxay ku jawaabaan 5 daqiiqo gudahood"}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-surface via-surface to-surface-muted p-5 sm:p-8 lg:col-span-7 lg:p-10">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 sm:mb-7">
              <div>
                <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                  {isEn ? "Talent support desk" : "Miiska taageerada"}
                </p>
                <h3 className="text-xl font-black text-heading sm:text-2xl">
                  {isEn ? "Choose how to reach us" : "Dooro sida aad nala soo xiriirayso"}
                </h3>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                {isEn ? "Available 24/7" : "Furan 24/7"}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
              <a
                href="tel:+19522288655"
                className={SUPPORT_CARD_CLASS}
              >
                <div className={SUPPORT_ICON_CLASS}>
                  <Phone size={19} />
                </div>
                <p className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-muted">
                  {isEn ? "Call support" : "Wac taageerada"}
                </p>
                <p className="text-base font-black text-heading sm:text-lg">
                  +1 (952) 228-8655
                </p>
              </a>

              <a
                href="mailto:Koryaal6@gmail.com"
                className={`${SUPPORT_CARD_CLASS} min-w-0`}
              >
                <div className={SUPPORT_ICON_CLASS}>
                  <Mail size={19} />
                </div>
                <p className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-muted">
                  {isEn ? "Email inquiries" : "Su'aalaha iimaylka"}
                </p>
                <p className="break-all text-base font-black text-heading sm:text-lg">
                  Koryaal6@gmail.com
                </p>
              </a>

              <div className={SUPPORT_CARD_CLASS}>
                <div className={SUPPORT_ICON_CLASS}>
                  <MapPin size={19} />
                </div>
                <p className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-muted">
                  {isEn ? "Support location" : "Goobta taageerada"}
                </p>
                <p className="text-base font-black text-heading sm:text-lg">
                  Minnesota, USA
                </p>
              </div>

              <div className={SUPPORT_CARD_CLASS}>
                <div className={SUPPORT_ICON_CLASS}>
                  <Clock size={19} />
                </div>
                <p className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-muted">
                  {isEn ? "Availability" : "Waqtiga la heli karo"}
                </p>
                <p className="text-base font-black text-heading sm:text-lg">
                  {isEn ? "Every day, 24 hours" : "Maalin kasta, 24 saac"}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 border-t border-border/70 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm leading-relaxed text-foreground/65">
                {isEn
                  ? "Need to share more details with our team?"
                  : "Ma u baahan tahay inaad faahfaahin dheeraad ah nala wadaagto?"}
              </p>
              <Link
                href="/contact"
                className="group inline-flex items-center justify-center gap-2 rounded-xl border border-primary/25 bg-primary/10 px-5 py-3 text-sm font-black text-primary transition-all hover:border-primary hover:bg-primary hover:text-white"
              >
                {isEn ? "Open contact page" : "Fur bogga xiriirka"}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
