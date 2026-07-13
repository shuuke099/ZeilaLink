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
  const [stats, setStats] = useState({
    jobs: "2.5k+",
    trainings: "150+",
    workers: "12k+",
    successRate: "98%",
  });
  const isEn = language === "en";

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

    const loadStats = async () => {
      try {
        const data = await cachedApiGet<any>("/public/stats", undefined, 60_000);
        setStats({
          jobs: data.formatted.jobs,
          trainings: data.formatted.trainings,
          workers: data.formatted.workers,
          successRate: data.successRate,
        });
      } catch (e) {
        // keep defaults
      }
    };

    load();
    loadStats();
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
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-white">
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
              className="inline-flex items-center space-x-2 bg-primary/5 text-primary px-4 py-2 rounded-full mb-8 border border-primary/10 backdrop-blur-sm"
            >
              <Star size={16} className="fill-current" />
              <span className="text-xs font-black tracking-[0.2em] uppercase">
                {isEn
                  ? "Connecting Opportunities & People"
                  : "Isku Xiraha Fursadaha Bulshada"}
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="text-lg text-slate-600 mb-10 max-w-xl mx-auto leading-relaxed"
            >
              {isEn
                ? "Discover job opportunities, gain in-demand skills, get support with your resume and job applications, and offer your services while connecting with employers and clients — all on one powerful platform."
                : "Ka hel fursado shaqo, baro xirfadaha suuqa looga baahan yahay, uhel taageero CV-gaaga iyo codsiyada shaqada, ku soo bandhig adeegyadaada si ay u gaaraan macaamiil badan — hal madal oo awood leh oo kulminaysa dhammaan."}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.6 }}
              className="grid grid-cols-2 gap-2 sm:flex sm:flex-row sm:gap-4 sm:justify-center"
            >
              <Link
                href="/jobs"
                prefetch
                onMouseEnter={() => prefetchPublicRouteData("/jobs")}
                onFocus={() => prefetchPublicRouteData("/jobs")}
                onTouchStart={() => prefetchPublicRouteData("/jobs")}
                className="group btn-primary min-w-0 px-3 py-3 rounded-xl text-xs font-bold shadow-lg shadow-primary/20 transition-all flex items-center justify-center sm:px-8 sm:py-4 sm:text-base"
              >
                <Search className="mr-1.5 h-4 w-4 shrink-0 sm:mr-2 sm:h-5 sm:w-5" />
                <span className="truncate">{getT("searchJobs")}</span>
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
                className="min-w-0 bg-white border border-slate-200 hover:border-primary/30 text-slate-700 px-3 py-3 rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all flex items-center justify-center sm:px-8 sm:py-4 sm:text-base"
              >
                <GraduationCap className="mr-1.5 h-4 w-4 shrink-0 text-primary sm:mr-2 sm:h-[22px] sm:w-[22px]" />
                <span className="truncate">{getT("searchTrainings")}</span>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-slate-900 border-y border-white/5 relative overflow-hidden">
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
      <section className="py-32 px-4 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full mb-8 border border-blue-100">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                  {isEn
                    ? "Since 2026 • Our Purpose"
                    : "Laga soo bilaabo 2026 • Ujeedadayada"}
                </span>
              </div>

              <h2 className="text-3xl md:text-4xl font-black text-slate-900 leading-[1.2] mb-8">
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

              <div className="space-y-6 text-slate-600 text-lg leading-relaxed mb-10">
                <p>
                  {isEn
                    ? "ZeilaLink is more than a platform — it is a growing ecosystem built to connect people with opportunities, empower individuals to develop their potential, and enable businesses to find the talent and services they need. We are committed to bridging gaps, unlocking possibilities, and supporting communities to thrive in a modern, digital economy."
                    : "  ZeilaLink ma aha oo kaliya madal — waa nidaam sii kobcaya oo loogu talagalay isku xirka bulshada  iyo fursadaha jira ,  awoodsiinta xirfadlayaasha si ay u horumariyaan xirfadooda, iyo ka caawinta ganacsiyada inay helaan hibada iyo adeegyada iyo shaqaalaha ay u baahan yihiin. Waxaan u heellan nahay inaan yareyno kala fogaanshaha, furno fursado cusub, oo aan taageerno bulshada si ay ula jaan-qaado dhaqaalaha casriga ah ee danabaysan."}
                </p>
                <Link
                  href="/about"
                  className="group inline-flex items-center gap-2 bg-slate-900 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10"
                >
                  {isEn
                    ? "Learn More About Us"
                    : "Wax badan oo nagu saabsan ogow"}
                  <ArrowRight
                    size={22}
                    className="group-hover:translate-x-1 transition-transform"
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
      <section className="py-32 px-4 relative bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center space-x-2 bg-slate-50 text-slate-500 px-4 py-2 rounded-full mb-4 border border-slate-100">
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                {isEn ? "Our Capabilities" : "Awoodahayada"}
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">
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
      <section className="py-32 px-4 bg-[#071633] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-sky-400/30 to-transparent" />

        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center space-x-2 bg-[#0d2a5e] text-sky-200 px-3 py-1 rounded-full mb-4 border border-sky-400/20">
                <TrendingUp size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {isEn ? "Trending Careers" : "Shaqooyinka ugu Caansan"}
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
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

          <div className="space-y-20">
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

      {/* Contact Section - 'Concierge Desk' Layout */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-0">
            {/* Left Column: Direct Assistance */}
            <div className="lg:pr-20 py-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center space-x-2 bg-slate-50 text-slate-500 px-5 py-2.5 rounded-full mb-8 border border-slate-100 shadow-sm"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">
                  {isEn
                    ? "Global Support Center"
                    : "Xarunta Taageerada Caalamiga"}
                </span>
              </motion.div>

              <h2 className="text-5xl lg:text-6xl font-black text-slate-900 mb-6 tracking-tighter leading-tight">
                {isEn ? (
                  <>
                    Get in{" "}
                    <span className="text-primary relative inline-block">
                      Touch{" "}
                      <div className="absolute -bottom-2 left-0 w-full h-3 bg-primary/10 -z-10" />
                    </span>
                  </>
                ) : (
                  <>
                    Nala soo{" "}
                    <span className="text-primary relative inline-block">
                      Xiriir{" "}
                      <div className="absolute -bottom-2 left-0 w-full h-3 bg-primary/10 -z-10" />
                    </span>
                  </>
                )}
              </h2>
              <p className="text-slate-500 text-lg leading-relaxed mb-10 max-w-md">
                {isEn
                  ? "We're building the future of work. Our team is dedicated to providing you with the most seamless career journey imaginable."
                  : "Waxaan dhiseynaa mustaqbalka shaqada ee Soomaaliya. Kooxdayadu waxay u go'an tahay inay ku siiyaan socdaalka shaqo ee ugu wanaagsan ee aad qiyaasi karto."}
              </p>

              <div className="space-y-6">
                <a
                  href="https://wa.me/19522288655"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-[#25D366] text-white px-8 py-4 rounded-xl font-bold text-base shadow-lg hover:shadow-xl transition-all no-underline w-full sm:w-auto"
                >
                  <WhatsAppIcon size={20} fill="white" />
                  {isEn ? "MESSAGE US ON WHATSAPP" : "NAGA SOO QOR WHATSAPP"}
                </a>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
                  <p className="text-[11px] text-slate-400 font-black uppercase tracking-[0.2em]">
                    {isEn
                      ? "Typical response time: Under 5 minutes"
                      : "Waqtiga jawaabta caadiga ah: In ka yar 5 daqiiqo"}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Information Desk */}
            <div className="lg:pl-20 py-10 lg:border-l border-slate-100 space-y-16">
              <div>
                <h3 className="text-[11px] font-black text-primary uppercase tracking-[0.3em] mb-10">
                  {isEn ? "Talent Support Desk" : "Miiska Taageerada Tayada"}
                </h3>

                <div className="space-y-10">
                  {/* Location */}
                  <div className="space-y-3">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">
                      {isEn ? "LOCATION" : "GOOBTA"}
                    </p>
                    <p className="text-xl font-bold text-slate-900 leading-tight">
                      Minnesota
                      <br />
                      USA
                    </p>
                  </div>

                  {/* Connect */}
                  <div className="space-y-6">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">
                      {isEn ? "CONNECT" : "XIRIIRKA"}
                    </p>
                    <div className="space-y-4 max-w-sm">
                      <div className="flex justify-between items-end border-b border-slate-50 pb-4">
                        <span className="text-slate-500 font-medium">
                          {isEn ? "Talent Support" : "Taageerada Tayada"}
                        </span>
                        <a
                          href="tel:+19522288655"
                          className="text-xl font-bold text-slate-900 hover:text-primary transition-colors no-underline"
                        >
                          +1 (952) 228-8655
                        </a>
                      </div>
                      <div className="flex justify-between items-end border-b border-slate-50 pb-4">
                        <span className="text-slate-500 font-medium">
                          {isEn ? "General Inquiry" : "Weydiinta Guud"}
                        </span>
                        <a
                          href="tel:+19522288655"
                          className="text-xl font-bold text-slate-900 hover:text-primary transition-colors no-underline"
                        >
                          +1 (952) 228-8655
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Inquiries */}
                  <div className="space-y-3">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">
                      {isEn ? "INQUIRIES" : "CODSIGA"}
                    </p>
                    <a
                      href="mailto:Koryaal6@gmail.com"
                      className="text-xl font-bold text-primary hover:underline decoration-2 underline-offset-8 transition-all"
                    >
                      Koryaal6@gmail.com
                    </a>
                  </div>

                  {/* Availability */}
                  <div className="space-y-3">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">
                      {isEn ? "AVAILABILITY" : "OOGOLAASHAHA"}
                    </p>
                    <p className="text-slate-500 font-medium leading-relaxed max-w-sm">
                      {isEn
                        ? "Our career consultants are on hand 24 hours a day, 7 days a week, ensuring you never miss an opportunity."
                        : "La-taliyayaashayada shaqada waxay joogaan 24 saac maalintii, 7 maalmood usbuucii, iyagoo hubinaya inaadan marnaba seegin fursad."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
