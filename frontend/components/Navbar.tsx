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
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Briefcase,
  Globe,
  User as UserIcon,
  Sun,
  Moon,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
            className="flex items-center group flex-shrink-0 min-w-[250px]"
          >
            <Image
              src={logoSrc}
              alt="ZeilaLink logo"
              width={800}
              height={300}
              className="w-40 md:w-50 h-auto object-contain transition-transform duration-300 group-hover:scale-105"
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

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors ${scrolled ? "hover:bg-surface-muted text-foreground/70" : isDarkHeroPage ? "hover:bg-white/10 text-white/80" : "hover:bg-surface-muted text-foreground/70"}`}
            >
              {isDark ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2 rounded-lg transition-all hover:scale-105 active:scale-95 ${scrolled ? "bg-surface-muted text-foreground" : isDarkHeroPage ? "bg-white/10 text-white" : "bg-surface-muted text-foreground"}`}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-surface border-t border-border overflow-hidden"
          >
            <div className="px-4 py-6 space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-lg font-medium text-foreground py-2 border-b border-border/50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}

              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
                  Language
                </span>
                <button
                  onClick={() => {
                    toggleLanguage();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary font-bold"
                >
                  <Globe size={18} />
                  {language === "en" ? "English" : "Soomaali"}
                </button>
              </div>

              {user ? (
                <div className="pt-4 space-y-3">
                  <Link
                    href={`/${user.role}`}
                    className="flex items-center justify-center w-full py-3 rounded-xl bg-surface-muted text-foreground font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <UserIcon size={18} className="mr-2" />
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full py-3 rounded-xl bg-red-50 text-red-600 font-medium"
                  >
                    {getT("logout")}
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex w-full items-center justify-center gap-2 py-4 btn-primary text-center rounded-xl shadow-lg shadow-primary/20 text-lg font-bold"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>{language === "en" ? "Sign In" : "Soo gal"}</span>
                  <UserIcon size={18} />
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
