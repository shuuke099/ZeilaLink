"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import darLogo from "@/assets/dar.png";
import lightLogo from "@/assets/light.png";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { t } from "@/lib/translations";
import { prefetchPublicRouteData } from "@/lib/api-cache";
import { usePathname } from "next/navigation";
import {
  X,
  Briefcase,
  Globe,
  User as UserIcon,
  Sun,
  Moon,
  ChevronDown,
  Home,
  Wrench,
  GraduationCap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const getT = (key: string) => t(key, language);

  // Logic to use dar.png for dark theme and light.png for light theme
  const isDark = theme === "dark";
  const logoSrc = isDark ? darLogo : lightLogo;

  const isSomali = language === "so";

  // Pages that have a dark hero section where we need light text when not scrolled
  const isDarkHeroPage = ([] as string[]).includes(pathname);
  const navTextColor = scrolled
    ? "text-slate-600"
    : isDarkHeroPage
      ? "text-white/90"
      : "text-slate-600";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: getT("home"), href: "/" },
    { name: getT("jobs"), href: "/jobs" },
    { name: getT("services"), href: "/services" },
    { name: getT("trainings"), href: "/trainings" },
    { name: getT("about"), href: "/about" },
    { name: getT("contact"), href: "/contact" },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 py-2 transition-all duration-300 ${
          scrolled
            ? "bg-surface/80 backdrop-blur-md shadow-lg border-b border-border"
            : "bg-transparent"
        }`}
      >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo - Left (MAXIMIZED SIZE) */}
          <Link
            href="/"
            prefetch
            onTouchStart={() => prefetchPublicRouteData("/")}
            className="group flex min-w-0 flex-shrink-0 items-center md:min-w-[250px]"
          >
            <Image
              src={logoSrc}
              alt="ZeilaLink logo"
              width={800}
              height={300}
              className="h-auto w-40 object-contain transition-transform duration-300 group-hover:scale-105 md:w-40"
              priority
            />
          </Link>

          {/* Desktop Navigation - Centered */}
          <div className="hidden md:flex flex-grow justify-center">
            <div className="flex items-center space-x-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    prefetch
                    onMouseEnter={() => prefetchPublicRouteData(link.href)}
                    onFocus={() => prefetchPublicRouteData(link.href)}
                    onTouchStart={() => prefetchPublicRouteData(link.href)}
                    className={`px-4 py-2 text-sm font-medium transition-all rounded-lg relative group ${
                      isActive
                        ? "text-primary"
                        : `${navTextColor} hover:text-primary`
                    }`}
                  >
                    {link.name}
                    {isActive && (
                      <motion.div
                        layoutId="nav-active"
                        className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary rounded-full"
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Utilities - Right */}
          <div className="hidden md:flex items-center space-x-2 flex-shrink-0">
            {/* Language Toggle */}
            <div className="flex items-center">
              <span
                className={`text-xs font-bold mr-2 uppercase ${scrolled ? "text-muted-foreground" : isDarkHeroPage ? "text-white/60" : "text-muted-foreground"}`}
              >
                {language}
              </span>
              <button
                onClick={toggleLanguage}
                className={`p-2 rounded-xl transition-colors ${scrolled ? "hover:bg-surface-muted text-foreground/70" : isDarkHeroPage ? "hover:bg-white/10 text-white/80" : "hover:bg-surface-muted text-foreground/70"}`}
                title={getT("language.toggle")}
              >
                <Globe size={18} />
              </button>
            </div>

            <div
              className={`h-4 w-[1px] mx-2 ${scrolled ? "bg-border" : isDarkHeroPage ? "bg-white/20" : "bg-border"}`}
            />

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl transition-colors ${scrolled ? "hover:bg-surface-muted text-foreground/70" : isDarkHeroPage ? "hover:bg-white/10 text-white/80" : "hover:bg-surface-muted text-foreground/70"}`}
            >
              {isDark ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {user ? (
              <div className="relative ml-2">
                <button
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className={`flex items-center space-x-2 pl-2 pr-2 py-1.5 rounded-full border transition-all ${
                    scrolled
                      ? "border-border hover:bg-surface-muted"
                      : isDarkHeroPage
                        ? "border-white/20 hover:bg-white/10"
                        : "border-border hover:bg-surface-muted"
                  }`}
                >
                  <div className="w-7 h-7 bg-primary/20 rounded-full flex items-center justify-center">
                    <UserIcon size={14} className="text-primary" />
                  </div>
                  <span
                    className={`text-sm font-medium ${scrolled ? "text-foreground" : isDarkHeroPage ? "text-white" : "text-foreground"}`}
                  >
                    {user.name?.split(" ")[0]}
                  </span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${userMenuOpen ? "rotate-180" : ""} ${scrolled ? "text-muted-foreground" : isDarkHeroPage ? "text-white/60" : "text-muted-foreground"}`}
                  />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-48 bg-surface shadow-xl rounded-xl border border-border py-2 overflow-hidden ring-1 ring-black/5"
                    >
                      <div className="px-4 py-3 border-b border-border mb-1">
                        <p className="text-xs text-muted-foreground">
                          Signed in as
                        </p>
                        <p className="text-sm font-semibold truncate">
                          {user.email}
                        </p>
                      </div>
                      <Link
                        href={`/${user.role}`}
                        className="flex items-center px-4 py-2.5 text-sm hover:bg-primary/5 text-foreground transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <UserIcon size={16} className="mr-2 text-primary/70" />
                        Dashboard
                      </Link>
                      <button
                        className="flex w-full items-center px-4 py-2.5 text-sm hover:bg-red-50 text-red-600 transition-colors"
                        onClick={() => {
                          setUserMenuOpen(false);
                          logout();
                        }}
                      >
                        <X size={16} className="mr-2" />
                        {getT("logout")}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                href="/login"
                className="ml-2 inline-flex items-center gap-2 btn-primary px-5 py-2.5 rounded-xl shadow-lg shadow-primary/20 text-sm font-bold"
              >
                <span>{language === "en" ? "Sign In" : "Soo gal"}</span>
                <UserIcon size={16} />
              </Link>
            )}
          </div>

          {/* Mobile Utilities */}
          <div className="flex items-center gap-1 md:hidden">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 rounded-lg px-2 py-2 text-xs font-black uppercase text-foreground/70 transition-colors hover:bg-surface-muted"
              title={getT("language.toggle")}
            >
              <Globe size={18} />
              <span>{language}</span>
            </button>
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors ${scrolled ? "hover:bg-surface-muted text-foreground/70" : isDarkHeroPage ? "hover:bg-white/10 text-white/80" : "hover:bg-surface-muted text-foreground/70"}`}
            >
              {isDark ? <Moon size={20} /> : <Sun size={20} />}
            </button>
          </div>
        </div>
      </div>
      </nav>

      {/* Persistent mobile bottom navigation */}
      <div className="fixed inset-x-0 bottom-0 z-[90] rounded-t-2xl border-t border-slate-200/80 bg-surface/95 px-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-10px_30px_rgba(15,23,42,0.14)] backdrop-blur-xl md:hidden">
        <div className="grid grid-cols-5 gap-1">
          {[
            { name: getT("home"), href: "/", icon: Home },
            { name: getT("jobs"), href: "/jobs", icon: Briefcase },
            { name: getT("services"), href: "/services", icon: Wrench },
            { name: getT("trainings"), href: "/trainings", icon: GraduationCap },
            {
              name: user ? "Account" : language === "en" ? "Sign In" : "Soo gal",
              href: user ? `/${user.role}` : "/login",
              icon: UserIcon,
            },
          ].map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                onTouchStart={() => prefetchPublicRouteData(item.href)}
                className={`relative flex h-14 min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[9px] font-bold transition-all duration-300 ${
                  isActive
                    ? "bg-primary text-white shadow-md shadow-primary/25"
                    : "text-muted hover:bg-primary/5 hover:text-primary"
                }`}
              >
                <span
                  className="flex h-6 w-6 items-center justify-center"
                >
                  <Icon size={19} strokeWidth={isActive ? 2.6 : 2} />
                </span>
                <span className="w-full truncate text-center">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
