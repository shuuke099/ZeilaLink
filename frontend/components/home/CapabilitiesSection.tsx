import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  Building2,
  FileText,
  GraduationCap,
  Star,
  Users,
  Wrench,
} from "lucide-react";
import type { Language } from "@/lib/translations";
import {
  SECTION_EYEBROW_CLASS,
  SECTION_EYEBROW_TEXT_CLASS,
} from "./homeStyles";

interface CapabilitiesSectionProps {
  language: Language;
}

export default function CapabilitiesSection({
  language,
}: CapabilitiesSectionProps) {
  const isEn = language === "en";

  return (
    <section className="home-capabilities-section relative bg-white px-4 pb-10 pt-6 sm:pb-20 sm:pt-12 lg:py-28">
      <div className="home-section-content max-w-7xl mx-auto">
        <div className="home-capabilities-content mb-10 text-center sm:mb-14 lg:mb-16">
          <div className={`${SECTION_EYEBROW_CLASS} mb-4`}>
            <Star size={14} className="shrink-0 fill-current" />
            <span className={SECTION_EYEBROW_TEXT_CLASS}>
              {isEn ? "Our Capabilities" : "Awoodahayada"}
            </span>
          </div>
          <h2 className="mb-5 text-3xl font-black leading-tight tracking-tight text-slate-900 sm:mb-6 sm:text-4xl lg:text-5xl">
            {isEn ? "Empowering Your Success" : "Awoodsiinta Guushaada"}
          </h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg">
              {isEn
                ? "We provide the specialized tools and networks needed to navigate the evolving job market with confidence."
                : "Waxaan bixinaa agabka gaarka ah iyo shabakadaha loo baahan yahay si loogu dhex maro suuqa shaqada ee Soomaaliya ee isbeddelaya si kalsooni leh."}
            </p>
        </div>

        <div
          className="grid grid-cols-2 gap-2.5 sm:gap-5 md:grid-cols-3 lg:gap-10"
        >
          {[
            {
              icon: Briefcase,
              title: isEn ? "Jobs & Opportunities" : "Shaqooyin & Fursado",
              description: isEn
                ? "Discover job opportunities that match your skills and apply easily through a modern, mobile-friendly platform."
                : "Hel fursado shaqo oo ku habboon xirfadahaaga oo si fudud uga dalbo madal casri ah oo ku habboon moobaylka.",
              color: "text-blue-600",
              bg: "bg-blue-50",
              linkTextEn: "Explore Jobs",
              linkTextSo: "Hel Shaqooyin",
              href: "/jobs",
            },

            {
              icon: GraduationCap,
              title: isEn ? "Skills & Training" : "Xirfado & Tababar",
              description: isEn
                ? "Learn in-demand skills and access training programs designed to grow your career and future opportunities."
                : "Baro xirfadaha suuqa looga baahan yahay oo hel tababaro kaa caawinaya horumarinta xirfaddaada iyo mustaqbalkaaga.",
              color: "text-emerald-600",
              bg: "bg-emerald-50",
              linkTextEn: "Browse Programs",
              linkTextSo: "Baro Xirfado",
              href: "/trainings",
            },

            {
              icon: Wrench,
              title: isEn ? "Offer Services" : "Bixi Adeegyadaada",
              description: isEn
                ? "Showcase your services, reach more clients, and grow your income by connecting with people who need your expertise."
                : "Soo bandhig adeegyadaada, gaarsi macaamiil badan, oo kordhi dakhligaaga adigoo la xiriiraya dadka u baahan xirfaddaada.",
              color: "text-purple-600",
              bg: "bg-purple-50",
              linkTextEn: "Offer Services",
              linkTextSo: "Bixi Adeegyadaada",
              href: "/services",
            },

            {
              icon: FileText,
              title: isEn ? "Career Support" : "Taageero Shaqo",
              description: isEn
                ? "Get help with your resume, job applications, and career preparation to increase your chances of success."
                : "Hel caawimaad CV-gaaga, codsiyada shaqada, iyo diyaarinta xirfaddaada si aad u kordhiso fursadahaaga guusha.",
              color: "text-indigo-600",
              bg: "bg-indigo-50",
              linkTextEn: "Get Support",
              linkTextSo: "Hel Taageero",
              href: "/contact",
            },

            {
              icon: Building2,
              title: isEn ? "For Employers" : "Ganacsiyo & Shaqo-bixiyeyaal",
              description: isEn
                ? "Post jobs, find qualified candidates, and connect with skilled professionals ready to work."
                : "Ku dar shaqooyin, hel shaqaale xirfad leh, oo la xiriir xirfadlayaal diyaar u ah shaqo.",
              color: "text-rose-600",
              bg: "bg-rose-50",
              linkTextEn: "Post a Job",
              linkTextSo: "Ku Dar Shaqo",
              href: "/register?role=employer",
            },

            {
              icon: Users,
              title: isEn ? "Community & Network" : "Bulsho & Shabakad",
              description: isEn
                ? "Connect with people, build meaningful relationships, and grow together in one powerful platform."
                : "La xiriir dadka, dhis xiriirro macno leh, oo si wadajir ah ugu kora hal madal oo awood leh.",
              color: "text-amber-600",
              bg: "bg-amber-50",
              linkTextEn: "Join Network",
              linkTextSo: "Ku Biir Shabakada",
              href: "/register",
            },
          ].map((feature, index) => (
            <div
              key={index}
              className="h-full"
            >
              <Link
                href={feature.href}
                prefetch
                className="group block h-full rounded-xl border border-slate-100 bg-white p-3 transition-all duration-500 hover:border-primary/20 hover:shadow-2xl sm:rounded-[2rem] sm:p-6 lg:rounded-[2.5rem] lg:p-10"
              >
                <div
                  className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${feature.bg} shadow-sm transition-transform duration-500 group-hover:scale-110 sm:mb-6 sm:h-16 sm:w-16 sm:rounded-2xl lg:mb-8 lg:h-20 lg:w-20 lg:rounded-3xl`}
                >
                  <feature.icon className={`h-5 w-5 sm:h-8 sm:w-8 lg:h-9 lg:w-9 ${feature.color}`} />
                </div>
                <h3 className="mb-1.5 text-[15px] font-black leading-tight text-slate-900 sm:mb-3 sm:text-xl lg:mb-4 lg:text-2xl">
                  {feature.title}
                </h3>
                <p className="mb-3 line-clamp-5 text-[11px] leading-[1.45] text-slate-500 sm:mb-6 sm:line-clamp-none sm:text-sm sm:leading-relaxed lg:mb-8 lg:text-lg">
                  {feature.description}
                </p>
                <div className="flex items-center text-[11px] font-black text-primary transition-all group-hover:gap-3 sm:text-sm lg:text-base">
                  <span className="truncate">{isEn ? feature.linkTextEn : feature.linkTextSo}</span>
                  <ArrowRight className="ml-1 h-3.5 w-3.5 shrink-0 sm:h-5 sm:w-5" />
                </div>
              </Link>
            </div>
          ))}
            </div>
      </div>
    </section>
  );
}
