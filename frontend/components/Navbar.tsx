"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Briefcase,
  Building2,
  ChevronDown,
  Globe,
  GraduationCap,
  Heart,
  Home,
  LogOut,
  Moon,
  Sun,
  User as UserIcon,
  Wrench,
} from "lucide-react";

import darLogo from "@/assets/dar.png";
import lightLogo from "@/assets/light-primary.png";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { prefetchPublicRouteData } from "@/lib/api-cache";
import { t } from "@/lib/translations";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const pathname = usePathname();
  const router = useRouter();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const isDark = theme === "dark";
  const logoSrc = isDark ? darLogo : lightLogo;

  const getT = (key: string) => t(key, language);

  /*
   * Keep the same prefetch behavior that already exists in your app.
   */
  const prefetchRoute = useCallback(
    (href: string) => {
      router.prefetch(href);
      prefetchPublicRouteData(href);
    },
    [router],
  );

  /*
   * Mobile bottom navigation should always start the destination
   * page at the top.
   */
  const resetScrollForMobileNavigation = useCallback(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  }, []);

  /*
   * Close the account dropdown when the user clicks outside it.
   */
  useEffect(() => {
    if (!userMenuOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [userMenuOpen]);

  /*
   * Close dropdown automatically after navigation.
   */
  useEffect(() => {
    setUserMenuOpen(false);
  }, [pathname]);

  /*
   * YOUR EXISTING NAVIGATION.
   *
   * Nothing has been renamed or redirected.
   */
  const navLinks = [
    { name: getT("home"), href: "/" },
    { name: getT("jobs"), href: "/jobs" },
    { name: getT("services"), href: "/services" },
    { name: getT("trainings"), href: "/training" },
    { name: getT("businesses"), href: "/businesses" },
    { name: getT("about"), href: "/about" },
    { name: getT("contact"), href: "/contact" },
  ];

  const isRouteActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      {/* ============================================================
          DESKTOP / TABLET HEADER
      ============================================================ */}
      <header
        className="
          fixed
          inset-x-0
          top-0
          z-50
          h-[64px]
          border-b
          border-slate-200/80
          bg-white/95
          shadow-[0_1px_3px_rgba(15,23,42,0.04)]
          backdrop-blur-xl
          dark:border-slate-800/80
          dark:bg-slate-950/95
        "
      >
        <div className="mx-auto h-full w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <div className="grid h-full grid-cols-[1fr_auto_1fr] items-center">
            {/* ======================================================
                LEFT — LOGO
            ====================================================== */}
            <div className="flex min-w-0 items-center justify-start">
              <Link
                href="/"
                prefetch={false}
                onPointerEnter={() => prefetchRoute("/")}
                onFocus={() => prefetchRoute("/")}
                onTouchStart={() => prefetchRoute("/")}
                aria-label="ZeilaLink home"
                className="
                  flex
                  h-11
                  shrink-0
                  items-center
                  rounded-lg
                  outline-none
                  transition-opacity
                  hover:opacity-90
                  focus-visible:ring-2
                  focus-visible:ring-primary/40
                "
              >
                <Image
                  src={logoSrc}
                  alt="ZeilaLink"
                  width={800}
                  height={300}
                  priority
                  className="
                    block
                    h-auto
                    w-[124px]
                    object-contain
                    sm:w-[130px]
                    xl:w-[136px]
                  "
                />
              </Link>
            </div>

            {/* ======================================================
                CENTER — DESKTOP NAVIGATION
            ====================================================== */}
            <nav
              aria-label="Main navigation"
              className="hidden h-full items-center justify-center lg:flex"
            >
              <div className="flex h-full items-center">
                {navLinks.map((link) => {
                  const active = isRouteActive(link.href);

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      prefetch={false}
                      onPointerEnter={() => prefetchRoute(link.href)}
                      onFocus={() => prefetchRoute(link.href)}
                      onTouchStart={() => prefetchRoute(link.href)}
                      aria-current={active ? "page" : undefined}
                      className={`
                        relative
                        flex
                        h-full
                        items-center
                        justify-center
                        whitespace-nowrap
                        px-[9px]
                        text-[12px]
                        font-semibold
                        tracking-[-0.01em]
                        outline-none
                        transition-colors
                        duration-200
                        xl:px-[11px]
                        xl:text-[13px]
                        ${
                          active
                            ? "text-primary"
                            : "text-slate-700 hover:text-primary dark:text-slate-300 dark:hover:text-primary"
                        }
                        focus-visible:text-primary
                      `}
                    >
                      {link.name}

                      {active && (
                        <span
                          aria-hidden="true"
                          className="
                            absolute
                            bottom-[10px]
                            left-[9px]
                            right-[9px]
                            h-[2px]
                            rounded-t-full
                            bg-primary
                            xl:left-[11px]
                            xl:right-[11px]
                          "
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </nav>

            {/* ======================================================
                RIGHT — DESKTOP CONTROLS
            ====================================================== */}
            <div className="hidden min-w-0 items-center justify-end gap-1 lg:flex">
              {/* Language */}
              <button
                type="button"
                onClick={toggleLanguage}
                title={getT("language.toggle")}
                aria-label={getT("language.toggle")}
                className="
                  inline-flex
                  h-9
                  items-center
                  justify-center
                  gap-1.5
                  rounded-lg
                  px-2
                  text-slate-600
                  outline-none
                  transition-colors
                  hover:bg-slate-100/70
                  hover:text-primary
                  focus-visible:ring-2
                  focus-visible:ring-primary/40
                  dark:text-slate-300
                  dark:hover:bg-slate-800
                "
              >
                <Globe size={16} strokeWidth={1.8} />

                <span className="text-[11px] font-bold uppercase">
                  {language}
                </span>
              </button>

              {/* Theme */}
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={
                  isDark ? "Switch to light mode" : "Switch to dark mode"
                }
                className="
                  inline-flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-lg
                  text-slate-600
                  outline-none
                  transition-colors
                  hover:bg-slate-100/70
                  hover:text-primary
                  focus-visible:ring-2
                  focus-visible:ring-primary/40
                  dark:text-slate-300
                  dark:hover:bg-slate-800
                "
              >
                {isDark ? (
                  <Moon size={17} strokeWidth={1.8} />
                ) : (
                  <Sun size={17} strokeWidth={1.8} />
                )}
              </button>

              {/* ====================================================
                  LOGGED-IN USER
              ==================================================== */}
              {user ? (
                <div ref={userMenuRef} className="relative ml-1">
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen((open) => !open)}
                    aria-expanded={userMenuOpen}
                    aria-haspopup="menu"
                    className="
                      flex
                      h-10
                      max-w-[150px]
                      items-center
                      gap-2
                      rounded-lg
                      px-1.5
                      outline-none
                      transition-colors
                      hover:bg-slate-100/70
                      focus-visible:ring-2
                      focus-visible:ring-primary/40
                      dark:hover:bg-slate-800
                    "
                  >
                    <div
                      className="
                        flex
                        h-8
                        w-8
                        shrink-0
                        items-center
                        justify-center
                        rounded-full
                        bg-primary/10
                      "
                    >
                      <UserIcon
                        size={16}
                        strokeWidth={2}
                        className="text-primary"
                      />
                    </div>

                    <span
                      className="
                        hidden
                        max-w-[74px]
                        truncate
                        text-[12px]
                        font-semibold
                        text-slate-800
                        xl:block
                        dark:text-slate-100
                      "
                    >
                      {user.name?.split(" ")[0] || "Account"}
                    </span>

                    <ChevronDown
                      size={14}
                      strokeWidth={2}
                      className={`
                        hidden
                        shrink-0
                        text-slate-400
                        transition-transform
                        duration-200
                        xl:block
                        ${userMenuOpen ? "rotate-180" : ""}
                      `}
                    />
                  </button>

                  {/* ACCOUNT DROPDOWN */}
                  {userMenuOpen && (
                    <div
                      role="menu"
                      className="
                        absolute
                        right-0
                        top-[calc(100%+10px)]
                        w-[230px]
                        overflow-hidden
                        rounded-xl
                        border
                        border-slate-200
                        bg-white
                        py-1.5
                        shadow-[0_16px_45px_rgba(15,23,42,0.14)]
                        dark:border-slate-800
                        dark:bg-slate-950
                      "
                    >
                      <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                        <p className="text-[11px] font-medium text-slate-400">
                          Signed in as
                        </p>

                        <p className="mt-1 truncate text-[13px] font-semibold text-slate-900 dark:text-white">
                          {user.email}
                        </p>
                      </div>

                      <div className="p-1.5">
                        <Link
                          href={`/${user.role}`}
                          role="menuitem"
                          onClick={() => setUserMenuOpen(false)}
                          className="
                            flex
                            items-center
                            gap-2.5
                            rounded-lg
                            px-3
                            py-2.5
                            text-[13px]
                            font-medium
                            text-slate-700
                            transition-colors
                            hover:bg-primary/5
                            hover:text-primary
                            dark:text-slate-200
                          "
                        >
                          <UserIcon size={16} strokeWidth={1.8} />
                          Dashboard
                        </Link>

                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setUserMenuOpen(false);
                            logout();
                          }}
                          className="
                            flex
                            w-full
                            items-center
                            gap-2.5
                            rounded-lg
                            px-3
                            py-2.5
                            text-left
                            text-[13px]
                            font-medium
                            text-red-600
                            transition-colors
                            hover:bg-red-50
                            dark:hover:bg-red-950/30
                          "
                        >
                          <LogOut size={16} strokeWidth={1.8} />
                          {getT("logout")}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* ==================================================
                    SIGN IN
                ================================================== */
                <Link
                  href="/login"
                  className="
                    ml-1
                    inline-flex
                    h-9
                    items-center
                    justify-center
                    gap-1.5
                    rounded-lg
                    border
                    border-primary
                    px-3
                    text-[12px]
                    font-semibold
                    text-primary
                    outline-none
                    transition-colors
                    hover:bg-primary
                    hover:text-white
                    focus-visible:ring-2
                    focus-visible:ring-primary/40
                  "
                >
                  <UserIcon size={15} strokeWidth={1.8} />

                  <span>{language === "en" ? "Sign In" : "Soo gal"}</span>
                </Link>
              )}
            </div>

            {/* ======================================================
                MOBILE / TABLET TOP CONTROLS
            ====================================================== */}
            <div className="col-start-3 flex min-w-0 items-center justify-self-end gap-0.5 lg:hidden">
              <Link
                href={user ? "/worker/recommended" : "/login?redirect=%2Fworker%2Frecommended"}
                aria-label={language === "en" ? "Favorites" : "Kuwa aad jeceshahay"}
                className="flex h-9 w-8 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 hover:text-primary dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Heart size={17} strokeWidth={1.8} />
              </Link>

              <Link
                href={user ? `/${user.role}` : "/login"}
                aria-label={language === "en" ? "Profile" : "Boggaaga"}
                className="flex h-9 w-8 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 hover:text-primary dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <UserIcon size={17} strokeWidth={1.8} />
              </Link>

              <button
                type="button"
                onClick={toggleLanguage}
                title={getT("language.toggle")}
                aria-label={getT("language.toggle")}
                className="
                  flex
                  h-9
                  items-center
                  justify-center
                  gap-1
                  rounded-lg
                  px-2
                  text-[11px]
                  font-bold
                  uppercase
                  text-slate-600
                  transition-colors
                  hover:bg-slate-100
                  hover:text-primary
                  dark:text-slate-300
                  dark:hover:bg-slate-800
                "
              >
                <Globe size={16} strokeWidth={1.8} />
                {language}
              </button>

              <button
                type="button"
                onClick={toggleTheme}
                aria-label={
                  isDark ? "Switch to light mode" : "Switch to dark mode"
                }
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-lg
                  text-slate-600
                  transition-colors
                  hover:bg-slate-100
                  hover:text-primary
                  dark:text-slate-300
                  dark:hover:bg-slate-800
                "
              >
                {isDark ? (
                  <Moon size={17} strokeWidth={1.8} />
                ) : (
                  <Sun size={17} strokeWidth={1.8} />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ============================================================
          MOBILE / TABLET BOTTOM NAVIGATION
      ============================================================ */}
      <nav
        aria-label="Mobile navigation"
        className="
          fixed
          inset-x-0
          bottom-0
          z-[90]
          border-t
          border-slate-200/80
          bg-white/95
          px-2
          pt-1.5
          pb-[max(0.4rem,env(safe-area-inset-bottom))]
          shadow-[0_-4px_20px_rgba(15,23,42,0.08)]
          backdrop-blur-xl
          lg:hidden
          dark:border-slate-800/80
          dark:bg-slate-950/95
        "
      >
        <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
          {[
            {
              name: getT("home"),
              href: "/",
              icon: Home,
            },
            {
              name: getT("jobs"),
              href: "/jobs",
              icon: Briefcase,
            },
            {
              name: getT("services"),
              href: "/services",
              icon: Wrench,
            },
            {
              name: getT("businesses"),
              href: "/businesses",
              icon: Building2,
            },
            {
              name: getT("trainings"),
              href: "/training",
              icon: GraduationCap,
            },
          ].map((item) => {
            const active = isRouteActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                scroll={false}
                onClick={resetScrollForMobileNavigation}
                aria-current={active ? "page" : undefined}
                className={`
                  relative
                  flex
                  h-[52px]
                  min-w-0
                  flex-col
                  items-center
                  justify-center
                  gap-[2px]
                  rounded-xl
                  px-1
                  text-[9px]
                  font-semibold
                  transition-colors
                  duration-150
                  ${
                    active
                      ? "text-primary"
                      : "text-slate-500 hover:bg-primary/5 hover:text-primary dark:text-slate-400"
                  }
                `}
              >
                <span
                  className={`
                    flex
                    h-7
                    w-8
                    items-center
                    justify-center
                    rounded-lg
                    ${active ? "bg-primary/10" : ""}
                  `}
                >
                  <Icon size={18} strokeWidth={active ? 2.3 : 1.9} />
                </span>

                <span className="w-full truncate text-center">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
