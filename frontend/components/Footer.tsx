"use client";

import React, { useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Briefcase,
  Facebook,
  Linkedin,
  ShieldCheck,
  Twitter,
  Youtube,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { prefetchPublicRouteData } from "@/lib/api-cache";

const FOOTER_ROUTES = [
  "/",
  "/jobs",
  "/trainings",
  "/services",
  "/about",
  "/contact",
] as const;

export default function Footer() {
  const { language } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const isEn = language === "en";

  const prefetchRoute = useCallback((href: string) => {
    router.prefetch(href);
    prefetchPublicRouteData(href);
  }, [router]);

  useEffect(() => {
    FOOTER_ROUTES.forEach((href) => router.prefetch(href));
  }, [router]);

  const isDashboard =
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/employer") ||
    pathname?.startsWith("/worker") ||
    pathname?.startsWith("/provider");
  const isAuthPage = pathname === "/login" || pathname === "/register";

  if (isDashboard || isAuthPage) return null;

  const platformLinks = [
    {
      label: isEn ? "Browse Jobs" : "Raadi Shaqooyin",
      href: "/jobs",
    },
    {
      label: isEn ? "Skill Training" : "Tababar Xirfado",
      href: "/trainings",
    },
    {
      label: isEn ? "Find Services" : "Raadi Adeegyo",
      href: "/services",
    },
  ];

  const companyLinks = [
    { label: isEn ? "About Us" : "Nagu Saabsan", href: "/about" },
    {
      label: isEn ? "Contact Support" : "La Xiriir Taageerada",
      href: "/contact",
    },
    {
      label: isEn ? "Privacy Policy" : "Qaanuunka Asturnaanta",
      href: "/about",
    },
  ];

  const socialLinks = [
    { label: "Facebook", href: "#", icon: Facebook },
    { label: "Twitter", href: "#", icon: Twitter },
    { label: "LinkedIn", href: "#", icon: Linkedin },
    { label: "YouTube", href: "#", icon: Youtube },
  ];

  return (
    <footer className="relative overflow-hidden bg-[#071426] text-slate-300">
      {/* Subtle ambient detail keeps the dark footer dimensional without noise. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -right-32 -top-44 h-[30rem] w-[30rem] rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -bottom-52 -left-36 h-[28rem] w-[28rem] rounded-full bg-cyan-400/5 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.8)_1px,transparent_1px)] [background-size:64px_64px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-28 pt-10 sm:px-6 sm:pt-14 md:pb-10 lg:px-8 lg:pt-16">
        {/* Conversion-focused footer header */}
        <div className="relative isolate overflow-hidden rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-[#1478e8] via-[#1f7fe9] to-[#0866cf] px-5 py-7 shadow-[0_24px_70px_rgba(0,80,180,0.28)] sm:px-8 sm:py-9 lg:flex lg:items-center lg:justify-between lg:gap-10 lg:px-12 lg:py-11">
          <div
            aria-hidden="true"
            className="absolute -right-20 -top-36 -z-10 h-80 w-80 rounded-full border-[44px] border-white/[0.06]"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-40 right-40 -z-10 h-72 w-72 rounded-full bg-cyan-300/10 blur-2xl"
          />

          <div className="max-w-2xl text-center lg:text-left">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-blue-50 backdrop-blur-sm sm:text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_0_4px_rgba(103,232,249,0.12)]" />
              {isEn ? "Opportunity starts here" : "Fursaddu halkan ayay ka bilaabataa"}
            </div>
            <h2 className="text-balance text-2xl font-black leading-tight text-white sm:text-3xl lg:text-[2.35rem]">
              {isEn
                ? "Ready to take the next step in your professional journey?"
                : "Diyaar ma u tahay tallaabada xigta ee safarkaaga xirfadeed?"}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-blue-50/85 sm:text-base lg:mx-0">
              {isEn
                ? "Discover trusted opportunities, practical training, and the support you need to move forward."
                : "Hel fursado lagu kalsoon yahay, tababar wax ku ool ah, iyo taageerada aad u baahan tahay."}
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center lg:mt-0 lg:flex-none">
            <Link
              href="/jobs"
              prefetch
              onPointerEnter={() => prefetchRoute("/jobs")}
              onTouchStart={() => prefetchRoute("/jobs")}
              onFocus={() => prefetchRoute("/jobs")}
              className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-[#0d64bf] shadow-lg shadow-blue-950/15 transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-50 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-600"
            >
              <Briefcase size={18} />
              {isEn ? "Explore Jobs" : "Raadi Shaqooyin"}
              <ArrowUpRight
                size={16}
                className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </Link>
            <Link
              href="/contact"
              prefetch
              onPointerEnter={() => prefetchRoute("/contact")}
              onTouchStart={() => prefetchRoute("/contact")}
              onFocus={() => prefetchRoute("/contact")}
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-white/45 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              {isEn ? "Talk to Support" : "La Hadal Taageerada"}
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-5 gap-y-10 py-12 sm:gap-x-8 sm:py-14 md:grid-cols-2 lg:grid-cols-12 lg:gap-8 lg:py-16">
          {/* Brand and mission */}
          <div className="col-span-2 md:col-span-2 lg:col-span-6 lg:pr-12">
            <Link
              href="/"
              prefetch
              onPointerEnter={() => prefetchRoute("/")}
              onTouchStart={() => prefetchRoute("/")}
              onFocus={() => prefetchRoute("/")}
              className="group inline-flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              aria-label="ZeilaLink home"
            >
              <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white shadow-lg shadow-black/20 transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105">
                <Image
                  src="/icon.png"
                  alt=""
                  width={44}
                  height={44}
                  className="h-full w-full object-contain"
                />
              </span>
              <span className="text-2xl font-black tracking-tight text-white">
                Zeila<span className="text-blue-400">Link</span>
              </span>
            </Link>

            <p className="mt-5 max-w-md text-sm leading-7 text-slate-400 sm:text-[15px]">
              {isEn
                ? "A professional platform connecting talented people with meaningful work, trusted services, and career-building skills."
                : "Madal xirfadeed oo dadka kartida leh ku xirta shaqo macno leh, adeegyo lagu kalsoon yahay, iyo xirfado kobciya mustaqbalka."}
            </p>

            <div className="mt-6 flex items-center gap-2.5">
              {socialLinks.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.045] text-slate-400 transition-all duration-300 hover:-translate-y-1 hover:border-blue-400/50 hover:bg-blue-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                >
                  <Icon size={17} aria-hidden="true" />
                </a>
              ))}
            </div>

            <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-300">
              <ShieldCheck size={15} />
              {isEn ? "Secure & trusted platform" : "Madal ammaan ah oo lagu kalsoon yahay"}
            </div>
          </div>

          {/* Navigation groups */}
          <div className="min-w-0 lg:col-span-3">
            <h3 className="text-xs font-extrabold uppercase tracking-[0.18em] text-white">
              {isEn ? "Platform" : "Madasha"}
            </h3>
            <ul className="mt-5 space-y-3.5">
              {platformLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    prefetch
                    onPointerEnter={() => prefetchRoute(link.href)}
                    onTouchStart={() => prefetchRoute(link.href)}
                    onFocus={() => prefetchRoute(link.href)}
                    className="group inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                  >
                    <span className="h-1 w-1 rounded-full bg-slate-600 transition-all duration-300 group-hover:w-3 group-hover:bg-blue-400" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="min-w-0 lg:col-span-3">
            <h3 className="text-xs font-extrabold uppercase tracking-[0.18em] text-white">
              {isEn ? "Company" : "Shirkadda"}
            </h3>
            <ul className="mt-5 space-y-3.5">
              {companyLinks.map((link) => (
                <li key={`${link.href}-${link.label}`}>
                  <Link
                    href={link.href}
                    prefetch
                    onPointerEnter={() => prefetchRoute(link.href)}
                    onTouchStart={() => prefetchRoute(link.href)}
                    onFocus={() => prefetchRoute(link.href)}
                    className="group inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                  >
                    <span className="h-1 w-1 rounded-full bg-slate-600 transition-all duration-300 group-hover:w-3 group-hover:bg-blue-400" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Legal bar */}
        <div className="flex flex-col gap-5 border-t border-white/10 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {new Date().getFullYear()} ZeilaLink Platform. {" "}
            {isEn
              ? "All rights reserved."
              : "Dhammaan xuquuqdu waa dhowran yihiin."}
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {[
              { label: isEn ? "Terms" : "Shuruudaha", href: "/about" },
              { label: isEn ? "Privacy" : "Asturnaanta", href: "/about" },
              { label: isEn ? "Cookies" : "Kukiyada", href: "/about" },
            ].map((link) => (
              <Link
                key={link.label}
                href={link.href}
                prefetch
                onPointerEnter={() => prefetchRoute(link.href)}
                onTouchStart={() => prefetchRoute(link.href)}
                onFocus={() => prefetchRoute(link.href)}
                className="transition-colors hover:text-white focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
