import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Star } from "lucide-react";
import type { Language } from "@/lib/translations";
import aboutTeamImage from "../../../photo-1522071820081-009f0129c71c.jpeg";
import { HOME_STATS } from "./homeData";
import {
  SECTION_EYEBROW_CLASS,
  SECTION_EYEBROW_TEXT_CLASS,
} from "./homeStyles";

interface AboutSectionProps {
  language: Language;
}

export default function AboutSection({ language }: AboutSectionProps) {
  const isEn = language === "en";

  return (
    <section className="home-about-section relative w-full max-w-full bg-white px-4 pb-8 pt-16 sm:pb-12 sm:pt-20 lg:overflow-hidden lg:py-28">
      <div className="home-section-content mx-auto w-full min-w-0 max-w-7xl">
        <div className="grid min-w-0 items-center gap-10 sm:gap-14 lg:grid-cols-2 lg:gap-20">
          <div className="home-about-content relative min-w-0 max-w-full text-center lg:text-left">
            <div className={`${SECTION_EYEBROW_CLASS} mb-6 sm:mb-8`}>
              <Star size={14} className="shrink-0 fill-current" />
              <span className={SECTION_EYEBROW_TEXT_CLASS}>
                {isEn
                  ? "Since 2026 • Our Purpose"
                  : "Laga soo bilaabo 2026 • Ujeedadayada"}
              </span>
            </div>

            <h2 className="mb-5 max-w-full whitespace-normal break-words text-3xl font-black leading-tight tracking-tight text-slate-900 sm:mb-6 sm:text-4xl lg:text-5xl">
              {isEn ? (
                <>
                  We're Building the <br />
                  <span className="text-primary italic">
                    Professional Future
                  </span>{" "}
                  Together
                </>
              ) : (
                <>
                  Waxaan Dhiseynaa <br />
                  <span className="text-primary italic">
                    Mustaqbalka Xirfadaha
                  </span>{" "}
                  Si Wadajir ah
                </>
              )}
            </h2>

            <div className="mb-8 min-w-0 max-w-full space-y-5 text-center text-base leading-relaxed text-slate-600 sm:mb-10 sm:space-y-6 sm:text-lg lg:text-left">
              <p className="max-w-full whitespace-normal break-words text-left">
                {isEn
                  ? "ZeilaLink is more than a platform — it is a growing ecosystem built to connect people with opportunities, empower individuals to develop their potential, and enable businesses to find the talent and services they need. We are committed to bridging gaps, unlocking possibilities, and supporting communities to thrive in a modern, digital economy."
                  : "  ZeilaLink ma aha oo kaliya madal — waa nidaam sii kobcaya oo loogu talagalay isku xirka bulshada  iyo fursadaha jira ,  awoodsiinta xirfadlayaasha si ay u horumariyaan xirfadooda, iyo ka caawinta ganacsiyada inay helaan hibada iyo adeegyada iyo shaqaalaha ay u baahan yihiin. Waxaan u heellan nahay inaan yareyno kala fogaanshaha, furno fursado cusub, oo aan taageerno bulshada si ay ula jaan-qaado dhaqaalaha casriga ah ee danabaysan."}
              </p>
              <Link
                href="/about"
                className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-7 py-4 text-base font-bold text-white shadow-xl shadow-slate-900/10 transition-all duration-300 hover:-translate-y-1 hover:bg-primary hover:shadow-primary/25 sm:px-10 sm:py-5 sm:text-lg"
              >
                {isEn
                  ? "Learn More About Us"
                  : "Wax badan oo nagu saabsan ogow"}
                <ArrowRight
                  size={22}
                  className="transition-transform duration-300 group-hover:translate-x-2"
                />
              </Link>
              <div className="grid min-w-0 grid-cols-1 gap-3 pt-4 sm:grid-cols-2 sm:gap-4">
                <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 sm:px-5">
                  <CheckCircle2 size={18} className="text-primary" />
                  <span className="min-w-0 whitespace-normal break-words text-sm font-bold text-slate-700">
                    {isEn
                      ? "Verified Employers"
                      : "Loo-shaqeeyayaal la Hubiyay"}
                  </span>
                </div>
                <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 sm:px-5">
                  <CheckCircle2 size={18} className="text-primary" />
                  <span className="min-w-0 whitespace-normal break-words text-sm font-bold text-slate-700">
                    {isEn ? "Skill Training" : "Tababar Xirfadeed"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div
            className="relative"
          >
            {/* Main Image */}
            <div className="relative rounded-[3rem] overflow-hidden shadow-2xl z-20">
              <Image
                src={aboutTeamImage}
                alt="Team working together"
                sizes="(max-width: 1023px) 100vw, 50vw"
                priority
                placeholder="blur"
                className="aspect-square h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent" />
            </div>

            {/* Floating Element */}
            <div
              className="absolute -bottom-8 -left-8 bg-white p-8 rounded-3xl shadow-2xl border border-slate-100 z-30 hidden md:block"
            >
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <div className="text-white text-3xl font-black">
                    {HOME_STATS.workers}
                  </div>
                </div>
                <div>
                  <div className="text-lg font-black text-slate-900">
                    {isEn ? "Active Users" : "Isticmaalayaal Firfircoon"}
                  </div>
                  <div className="text-sm text-slate-500 font-bold uppercase tracking-wider">
                    {isEn ? "Monthly growth" : "Kobaca bisha"}
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative Background Blob */}
            <div className="home-mobile-decoration absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/5 rounded-full blur-[120px] -z-10" />
          </div>
        </div>
      </div>
    </section>
  );
}
