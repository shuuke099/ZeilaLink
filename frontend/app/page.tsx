"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import {
  Briefcase,
  GraduationCap,
  Users,
  ArrowRight,
  CheckCircle2,
  Star,
  TrendingUp,
  Search,
  Mail,
  Phone,
  MapPin,
  Send,
  Globe,
  MessageCircle,
  MessageSquare,
  Clock,
  Smartphone,
  Server,
  Building2,
  FileText,
  Wrench,
} from "lucide-react";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/translations";
import { cachedApiGet, prefetchPublicRouteData } from "@/lib/api-cache";

interface HomeJob {
  id: string;
  title: string;
  location: string;
  employmentType: string;
  createdAt: string;
  employer: { name: string; logoUrl?: string; avatarUrl?: string | null };
}

interface HomeTraining {
  id: string;
  name: string;
  duration: string;
  cost: number;
  provider: { name: string; logoUrl?: string | null };
}

export default function Home() {
  const { language } = useLanguage();
  const getT = (key: string) => t(key, language);
  const [featuredJobs, setFeaturedJobs] = useState<HomeJob[]>([]);
  const [featuredTrainings, setFeaturedTrainings] = useState<HomeTraining[]>(
    [],
  );
  const stats = {
    jobs: "2.5k+",
    trainings: "150+",
    workers: "12k+",
    successRate: "98%",
  };
  const isEn = language === "en";
  const sectionEyebrowClass =
    "inline-flex max-w-full items-center justify-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-blue-600 shadow-sm shadow-blue-100/60";
  const sectionEyebrowTextClass =
    "text-center text-[9px] font-black uppercase leading-relaxed tracking-[0.14em] sm:text-[10px] sm:tracking-[0.2em]";

  useEffect(() => {
    const load = async () => {
      try {
        const [jobsData, trainingsData] = await Promise.all([
          cachedApiGet<{ jobs?: HomeJob[] }>("/jobs?limit=3"),
          cachedApiGet<{ trainings?: HomeTraining[] }>("/trainings?limit=2"),
        ]);
        setFeaturedJobs((jobsData.jobs || []).slice(0, 3));
        setFeaturedTrainings((trainingsData.trainings || []).slice(0, 2));
      } catch (e) {
        // best-effort; ignore
      }
    };

    load();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section - Reverted to Light Design */}
      <section className="relative overflow-hidden bg-white pb-14 pt-28 sm:pb-20 sm:pt-32 lg:pb-28 lg:pt-44">
        {/* Abstract Background Accents */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_20%,rgba(var(--color-primary-rgb),0.05),transparent_70%)]" />
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02]" />

          {/* Decorative Circles - High Visibility on Light */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] border border-slate-200 rounded-[100%] rotate-[15deg] opacity-60" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[500px] border border-slate-200 rounded-[100%] rotate-[-15deg] opacity-60" />
          </div>

          {/* Subtle decorative shapes */}
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-400/5 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className={`${sectionEyebrowClass} mb-6 sm:mb-8`}
            >
              <Star size={15} className="shrink-0 fill-current" />
              <span className={sectionEyebrowTextClass}>
                {isEn
                  ? "Connecting Opportunities & People"
                  : "Isku Xiraha Fursadaha Bulshada"}
              </span>
            </motion.div>

            <motion.h1
              className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 leading-[1.2] mb-8 tracking-tight"
            >
              {isEn ? (
                <>
                  Your Gateway to Jobs,{" "}
                  <span className="text-primary relative inline-block">
                    Skills{" "}
                    <div className="absolute -bottom-2 left-0 w-full h-3 bg-primary/10 -z-10" />
                  </span>{" "}
                  and Services.
                </>
              ) : (
                <>
                  Madasha Shaqooyinka,{" "}
                  <span className="text-primary relative inline-block">
                    Xirfadaha{" "}
                    <div className="absolute -bottom-2 left-0 w-full h-3 bg-primary/10 -z-10" />
                  </span>{" "}
                  iyo Adeegyada.
                </>
              )}
            </motion.h1>

            <motion.p
              className="text-lg text-slate-600 mb-10 max-w-xl mx-auto leading-relaxed"
            >
              {isEn
                ? "Discover job opportunities, gain in-demand skills, get support with your resume and job applications, and offer your services while connecting with employers and clients — all on one powerful platform."
                : "Ka hel fursado shaqo, baro xirfadaha suuqa looga baahan yahay, uhel taageero CV-gaaga iyo codsiyada shaqada, ku soo bandhig adeegyadaada si ay u gaaraan macaamiil badan — hal madal oo awood leh oo kulminaysa dhammaan."}
            </motion.p>

            <motion.div
              className="mx-auto flex w-full max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center sm:gap-4"
            >
              <Link
                href="/jobs"
                prefetch
                onMouseEnter={() => prefetchPublicRouteData("/jobs")}
                onFocus={() => prefetchPublicRouteData("/jobs")}
                onTouchStart={() => prefetchPublicRouteData("/jobs")}
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
                prefetch
                onMouseEnter={() => prefetchPublicRouteData("/trainings")}
                onFocus={() => prefetchPublicRouteData("/trainings")}
                onTouchStart={() => prefetchPublicRouteData("/trainings")}
                className="w-full min-w-0 bg-white border border-slate-200 hover:border-primary/40 hover:-translate-y-0.5 text-slate-700 px-4 py-3.5 rounded-xl text-sm font-bold shadow-sm hover:shadow-md transition-all flex items-center justify-center sm:w-auto sm:px-8 sm:py-4 sm:text-base"
              >
                <GraduationCap className="mr-1.5 h-4 w-4 shrink-0 text-primary sm:mr-2 sm:h-[22px] sm:w-[22px]" />
                <span>{getT("searchTrainings")}</span>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative overflow-hidden border-y border-white/5 bg-slate-900 py-10 sm:py-14 lg:py-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0,rgba(var(--color-primary-rgb),0.15),transparent_50%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4 lg:gap-8">
            {[
              {
                label: isEn ? "Jobs Posted" : "Shaqooyin la soo dhigay",
                value: stats.jobs,
                icon: Briefcase,
              },
              {
                label: isEn ? "Skill Trainings" : "Tababaro Xirfadeed",
                value: stats.trainings,
                icon: GraduationCap,
              },
              {
                label: isEn ? "Talented Workers" : "Shaqaale Hibo leh",
                value: stats.workers,
                icon: Users,
              },
              {
                label: isEn ? "Success Rate" : "Heerka Guusha",
                value: stats.successRate,
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

      {/* About Section - Professional Redesign */}
      <section className="relative overflow-hidden bg-white px-4 pb-8 pt-16 sm:pb-12 sm:pt-20 lg:py-28">
        <div className="max-w-7xl mx-auto">
          <div className="grid items-center gap-10 sm:gap-14 lg:grid-cols-2 lg:gap-20">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative text-center lg:text-left"
            >
              <div className={`${sectionEyebrowClass} mb-6 sm:mb-8`}>
                <Star size={14} className="shrink-0 fill-current" />
                <span className={sectionEyebrowTextClass}>
                  {isEn
                    ? "Since 2026 • Our Purpose"
                    : "Laga soo bilaabo 2026 • Ujeedadayada"}
                </span>
              </div>

              <h2 className="mb-5 text-3xl font-black leading-tight tracking-tight text-slate-900 sm:mb-6 sm:text-4xl lg:text-5xl">
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

              <div className="mb-8 space-y-5 text-center text-base leading-relaxed text-slate-600 sm:mb-10 sm:space-y-6 sm:text-lg lg:text-left">
                <p className="text-left">
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
                <div className="flex flex-wrap gap-4 pt-4">
                  <div className="flex items-center space-x-3 bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100">
                    <CheckCircle2 size={18} className="text-primary" />
                    <span className="text-sm font-bold text-slate-700">
                      {isEn
                        ? "Verified Employers"
                        : "Loo-shaqeeyayaal la Hubiyay"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100">
                    <CheckCircle2 size={18} className="text-primary" />
                    <span className="text-sm font-bold text-slate-700">
                      {isEn ? "Skill Training" : "Tababar Xirfadeed"}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              {/* Main Image */}
              <div className="relative rounded-[3rem] overflow-hidden shadow-2xl z-20">
                <img
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&h=1200&fit=crop"
                  alt="Team working together"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover aspect-square"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent" />
              </div>

              {/* Floating Element */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="absolute -bottom-8 -left-8 bg-white p-8 rounded-3xl shadow-2xl border border-slate-100 z-30 hidden md:block"
              >
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <div className="text-white text-3xl font-black">
                      {stats.workers}
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
              </motion.div>

              {/* Decorative Background Blob */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/5 rounded-full blur-[120px] -z-10" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section - Professional Redesign */}
      <section className="relative bg-white px-4 pb-16 pt-8 sm:pb-20 sm:pt-12 lg:py-28">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10 text-center sm:mb-14 lg:mb-16">
            <div className={`${sectionEyebrowClass} mb-4`}>
              <Star size={14} className="shrink-0 fill-current" />
              <span className={sectionEyebrowTextClass}>
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

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:gap-10"
          >
            {[
              {
                icon: Briefcase,
                title: isEn ? "Jobs & Opportunities" : "Shaqooyin & Fursado",
                description: isEn
                  ? "Discover job opportunities that match your skills and apply بسهولة through a modern, mobile-friendly platform."
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
              <motion.div
                key={index}
                variants={itemVariants}
                className="h-full"
              >
                <Link
                  href={feature.href}
                  prefetch
                  onMouseEnter={() => prefetchPublicRouteData(feature.href)}
                  onFocus={() => prefetchPublicRouteData(feature.href)}
                  onTouchStart={() => prefetchPublicRouteData(feature.href)}
                  className="group block h-full rounded-2xl border border-slate-100 bg-white p-4 transition-all duration-500 hover:border-primary/20 hover:shadow-2xl sm:rounded-[2rem] sm:p-6 lg:rounded-[2.5rem] lg:p-10"
                >
                  <div
                    className={`h-12 w-12 ${feature.bg} mb-4 flex items-center justify-center rounded-2xl shadow-sm transition-transform duration-500 group-hover:scale-110 sm:mb-6 sm:h-16 sm:w-16 lg:mb-8 lg:h-20 lg:w-20 lg:rounded-3xl`}
                  >
                    <feature.icon className={`h-6 w-6 sm:h-8 sm:w-8 lg:h-9 lg:w-9 ${feature.color}`} />
                  </div>
                  <h3 className="mb-2 text-base font-black leading-tight text-slate-900 sm:mb-3 sm:text-xl lg:mb-4 lg:text-2xl">
                    {feature.title}
                  </h3>
                  <p className="mb-4 text-xs leading-relaxed text-slate-500 sm:mb-6 sm:text-sm lg:mb-8 lg:text-lg">
                    {feature.description}
                  </p>
                  <div className="flex items-center text-xs font-black text-primary transition-all group-hover:gap-3 sm:text-sm lg:text-base">
                    <span className="truncate">{isEn ? feature.linkTextEn : feature.linkTextSo}</span>
                    <ArrowRight className="ml-1 h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Jobs Section - Professional Redesign */}
      <section className="relative overflow-hidden bg-[#071633] px-4 py-16 sm:py-20 lg:py-28">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-sky-400/30 to-transparent" />

        <div className="max-w-7xl mx-auto">
          <div className="mb-10 flex flex-col items-start justify-between gap-6 sm:mb-14 md:flex-row md:items-end lg:mb-16 lg:gap-8">
            <div className="max-w-2xl">
              <div className={`${sectionEyebrowClass} mb-4`}>
                <TrendingUp size={14} className="shrink-0" />
                <span className={sectionEyebrowTextClass}>
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
            <Link
              href="/jobs"
              className="group flex items-center gap-3 bg-[#0a1f49] text-sky-200 font-black px-8 py-4 rounded-2xl border border-[#1b3f7a] shadow-lg shadow-black/20 hover:shadow-xl hover:border-sky-400/40 transition-all"
            >
              {isEn ? "Browse All Jobs" : "Eeg dhammaan shaqooyinka"}
              <ArrowRight
                size={20}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>
          </div>

          <div className="space-y-12 sm:space-y-16 lg:space-y-20">
            {/* Jobs Section */}
            <div>
              <div className="flex items-center gap-4 mb-10 max-w-7xl mx-auto">
                <div className="h-px flex-1 bg-slate-600/60" />
                <h3 className="text-sm font-black uppercase tracking-[0.3em] text-sky-300/50">
                  {isEn ? "Professional Job Openings" : "Shaqooyinka Bannaan"}
                </h3>
                <div className="h-px flex-1 bg-slate-600/60" />
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                {featuredJobs.map((job, idx) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Link
                      href={`/jobs/${job.id}`}
                      className="block group h-full"
                    >
                      <div className="bg-[#0a1f49] rounded-[2rem] border border-[#15356a] group-hover:border-sky-400/40 shadow-xl shadow-black/25 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 overflow-hidden relative flex flex-col h-full text-center p-6">
                        <div className="w-20 h-20 rounded-2xl bg-[#0b244f] border border-[#1a3d78] p-3 mx-auto mb-5 group-hover:scale-110 transition-transform duration-500 flex items-center justify-center">
                          {job.employer.avatarUrl || job.employer.logoUrl ? (
                              <img
                                src={
                                  job.employer.avatarUrl || job.employer.logoUrl
                                }
                                alt={job.employer.name}
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-contain"
                              />
                          ) : (
                            <div className="text-2xl font-black text-primary uppercase">
                              {job.employer.name?.charAt(0)}
                            </div>
                          )}
                        </div>

                        <div className="flex-1 flex flex-col">
                          <div className="mb-4">
                            <p className="text-[9px] font-black uppercase tracking-widest text-sky-300/70 mb-1">
                              {job.employer.name}
                            </p>
                            <h3 className="text-lg font-black text-white tracking-tight leading-tight group-hover:text-sky-200 transition-colors line-clamp-2 min-h-[2.5rem]">
                              {job.title}
                            </h3>
                          </div>

                          <div className="mt-auto pt-4 border-t border-slate-700/60 flex flex-col items-center gap-3">
                            <div className="flex items-center justify-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-widest w-full">
                              <MapPin size={12} className="text-sky-300/60" />
                              {job.location}
                            </div>
                            <div className="bg-[#102b5f] text-sky-200 px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] group-hover:bg-sky-500 group-hover:text-white transition-all w-full">
                              {isEn ? "View Details" : "Eeg Faahfaahinta"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Trainings Section */}
            {featuredTrainings.length > 0 && (
              <div>
                <div className="flex items-center gap-4 mb-10 max-w-7xl mx-auto">
                  <div className="h-px flex-1 bg-slate-600/60" />
                  <h3 className="text-sm font-black uppercase tracking-[0.3em] text-emerald-300/60">
                    {isEn
                      ? "Skills & Training Programs"
                      : "Barnaamijyada Tababarka"}
                  </h3>
                  <div className="h-px flex-1 bg-slate-600/60" />
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                  {featuredTrainings.map((training, idx) => (
                    <motion.div
                      key={training.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <Link
                        href={`/trainings/${training.id}`}
                        className="block group h-full"
                      >
                        <div className="bg-[#0a1f49] rounded-[2rem] border border-[#15356a] group-hover:border-emerald-300/40 shadow-xl shadow-black/25 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 overflow-hidden relative flex flex-col h-full text-center p-6">
                          <div className="w-20 h-20 rounded-2xl bg-[#0b244f] border border-[#1a3d78] p-3.5 mx-auto mb-5 group-hover:scale-110 transition-transform duration-500 flex items-center justify-center">
                            {training.provider.logoUrl ? (
                              <img
                                src={training.provider.logoUrl}
                                alt={training.provider.name}
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <div className="text-2xl font-black text-emerald-300 uppercase">
                                {training.provider.name?.charAt(0)}
                              </div>
                            )}
                          </div>

                          <div className="flex-1 flex flex-col">
                            <div className="mb-4">
                              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300/70 mb-1">
                                {training.provider.name}
                              </p>
                              <h3 className="text-lg font-black text-white tracking-tight leading-tight group-hover:text-emerald-200 transition-colors line-clamp-2 min-h-[2.5rem]">
                                {training.name}
                              </h3>
                            </div>

                            <div className="mt-auto pt-4 border-t border-slate-700/60 flex flex-col items-center gap-3">
                              <div className="flex items-center justify-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-widest w-full">
                                <Clock
                                  size={12}
                                  className="text-emerald-300/70"
                                />
                                {training.duration}
                              </div>
                              <div
                                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all w-full ${training.cost === 0 ? "bg-emerald-800/40 text-emerald-200 group-hover:bg-emerald-500 group-hover:text-white" : "bg-[#102b5f] text-slate-200 group-hover:bg-slate-800 group-hover:text-white"}`}
                              >
                                {training.cost === 0
                                  ? isEn
                                    ? "ENROLL FREE"
                                    : "ISQORI BILAASH"
                                  : `$${training.cost}`}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {featuredJobs.length === 0 && featuredTrainings.length === 0 && (
              <div className="py-20 text-center bg-[#0a1f49] border-2 border-dashed border-slate-600 rounded-[3rem] max-w-7xl mx-auto">
                <div className="w-20 h-20 bg-[#0b244f] rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                  <Briefcase size={40} />
                </div>
                <h4 className="text-2xl font-bold text-white mb-2">
                  {isEn
                    ? "No Opportunities Available"
                    : "Ma jiraan fursado banaan"}
                </h4>
                <p className="text-slate-300 max-w-xs mx-auto">
                  {isEn
                    ? "Please check back later for new openings and programs."
                    : "Fadlan dib u hubi mar dambe fursado iyo barnaamijyo cusub."}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Contact Section - Professional Support Hub */}
      <section className="relative overflow-hidden bg-slate-50 px-4 py-14 sm:py-16 lg:py-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 top-8 h-72 w-72 rounded-full bg-blue-100/60 blur-3xl" />
          <div className="absolute -right-24 bottom-0 h-64 w-64 rounded-full bg-sky-100/70 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto mb-8 max-w-2xl text-center sm:mb-10"
          >
            <div className={`${sectionEyebrowClass} mb-4`}>
              <Star size={14} className="shrink-0 fill-current" />
              <span className={sectionEyebrowTextClass}>
                {isEn
                  ? "Global Support Center"
                  : "Xarunta Taageerada Caalamiga"}
              </span>
            </div>
            <h2 className="mb-4 text-3xl font-black leading-tight tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
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
            <p className="mx-auto max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
              {isEn
                ? "Speak with a real person whenever you need help finding work, building skills, or using ZeilaLink."
                : "La hadal qof dhab ah marka aad u baahan tahay caawimaad shaqo raadinta, horumarinta xirfadaha, ama isticmaalka ZeilaLink."}
            </p>
          </motion.div>

          <div className="grid overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-2xl shadow-slate-200/60 lg:grid-cols-12 lg:rounded-[2.25rem]">
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative overflow-hidden bg-[#071633] p-6 text-white sm:p-9 lg:col-span-5 lg:p-10"
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
                <h3 className="mb-4 text-2xl font-black leading-tight sm:text-3xl">
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
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="p-5 sm:p-8 lg:col-span-7 lg:p-10"
            >
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 sm:mb-7">
                <div>
                  <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                    {isEn ? "Talent support desk" : "Miiska taageerada"}
                  </p>
                  <h3 className="text-xl font-black text-slate-900 sm:text-2xl">
                    {isEn ? "Choose how to reach us" : "Dooro sida aad nala soo xiriirayso"}
                  </h3>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  {isEn ? "Available 24/7" : "Furan 24/7"}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                <a
                  href="tel:+19522288655"
                  className="group rounded-2xl border border-slate-200 bg-slate-50/70 p-4 no-underline transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/60 hover:shadow-lg sm:p-5"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-primary shadow-sm ring-1 ring-slate-100 transition-transform group-hover:scale-105">
                    <Phone size={19} />
                  </div>
                  <p className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    {isEn ? "Call support" : "Wac taageerada"}
                  </p>
                  <p className="text-base font-black text-slate-900 sm:text-lg">
                    +1 (952) 228-8655
                  </p>
                </a>

                <a
                  href="mailto:Koryaal6@gmail.com"
                  className="group min-w-0 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 no-underline transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/60 hover:shadow-lg sm:p-5"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-primary shadow-sm ring-1 ring-slate-100 transition-transform group-hover:scale-105">
                    <Mail size={19} />
                  </div>
                  <p className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    {isEn ? "Email inquiries" : "Su'aalaha iimaylka"}
                  </p>
                  <p className="break-all text-base font-black text-slate-900 sm:text-lg">
                    Koryaal6@gmail.com
                  </p>
                </a>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-primary shadow-sm ring-1 ring-slate-100">
                    <MapPin size={19} />
                  </div>
                  <p className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    {isEn ? "Support location" : "Goobta taageerada"}
                  </p>
                  <p className="text-base font-black text-slate-900 sm:text-lg">
                    Minnesota, USA
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-primary shadow-sm ring-1 ring-slate-100">
                    <Clock size={19} />
                  </div>
                  <p className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    {isEn ? "Availability" : "Waqtiga la heli karo"}
                  </p>
                  <p className="text-base font-black text-slate-900 sm:text-lg">
                    {isEn ? "Every day, 24 hours" : "Maalin kasta, 24 saac"}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm leading-relaxed text-slate-500">
                  {isEn
                    ? "Need to share more details with our team?"
                    : "Ma u baahan tahay inaad faahfaahin dheeraad ah nala wadaagto?"}
                </p>
                <Link
                  href="/contact"
                  className="group inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-black text-primary transition-all hover:border-primary hover:bg-primary hover:text-white"
                >
                  {isEn ? "Open contact page" : "Fur bogga xiriirka"}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
