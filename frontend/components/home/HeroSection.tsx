"use client";

import Link from "next/link";
import Image, { StaticImageData } from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  Briefcase,
  Building2,
  ChevronDown,
  GraduationCap,
  MapPin,
  Search,
  ShoppingBag,
  Tag,
  Users,
} from "lucide-react";

type HeroSectionProps = {
  heroImage: StaticImageData | string;
};

const quickLinks = [
  {
    label: "Businesses",
    href: "/businesses",
    icon: Building2,
  },
  {
    label: "Services",
    href: "/services",
    icon: Users,
  },
  {
    label: "Jobs",
    href: "/jobs",
    icon: Briefcase,
  },
  {
    label: "Courses",
    href: "/training",
    icon: GraduationCap,
  },
  {
    label: "ZeilaMart",
    href: "/zeilamart",
    icon: ShoppingBag,
    desktopOnly: true,
  },
  {
    label: "Deals",
    href: "/deals",
    icon: Tag,
    desktopOnly: true,
  },
];

export default function HeroSection({ heroImage }: HeroSectionProps) {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("Minneapolis, MN");
  const [category, setCategory] = useState("");

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const params = new URLSearchParams();

    if (search.trim()) {
      params.set("search", search.trim());
    }

    if (location.trim()) {
      params.set("location", location.trim());
    }

    if (category) {
      params.set("category", category);
    }

    router.push(`/search${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <section className="relative w-full overflow-hidden bg-white dark:bg-slate-950 mt-10">
      {/* ============================================================
          DESKTOP HERO
      ============================================================ */}
      <div className="relative hidden min-h-[430px] lg:block">
        {/* RIGHT CITY IMAGE */}
        <div className="absolute inset-y-0 right-0 w-[53%] overflow-hidden">
          <Image
            src={heroImage}
            alt="Minneapolis skyline"
            fill
            priority
            sizes="53vw"
            className="object-cover object-center"
          />

          {/* Fade image naturally into left content */}
          <div
            className="
              absolute
              inset-0
              bg-gradient-to-r
              from-white
              via-white/20
              to-transparent
              dark:from-slate-950
              dark:via-slate-950/20
            "
          />

          {/* Slight bottom fade */}
          <div
            className="
              absolute
              inset-x-0
              bottom-0
              h-24
              bg-gradient-to-t
              from-white/25
              to-transparent
              dark:from-slate-950/20
            "
          />
        </div>

        <div className="relative z-10 mx-auto h-full max-w-[1440px] px-6 lg:px-8 xl:px-12">
          <div className="flex min-h-[430px] items-center">
            {/* LEFT CONTENT */}
            <div className="w-[53%] max-w-[690px] py-9 xl:py-11">
              {/* HEADLINE */}
              <h1
                className="
                  max-w-[600px]
                  text-[38px]
                  font-extrabold
                  leading-[1.08]
                  tracking-[-0.035em]
                  text-[#0b1230]
                  xl:text-[42px]
                  dark:text-white
                "
              >
                Connect. Discover.
                <br />
                <span className="text-primary">Support Somali Businesses.</span>
              </h1>

              {/* DESCRIPTION */}
              <p
                className="
                  mt-4
                  max-w-[500px]
                  text-[14px]
                  font-medium
                  leading-[1.65]
                  text-slate-600
                  dark:text-slate-300
                "
              >
                Your trusted community hub for businesses, services,
                <br className="hidden xl:block" />
                jobs, real estate, cars, electronics, clothes and more.
              </p>

              {/* ====================================================
                  SEARCH BOX
              ==================================================== */}
              <form
                onSubmit={handleSearch}
                className="
                  mt-5
                  w-full
                  max-w-[650px]
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  p-2
                  shadow-[0_8px_30px_rgba(15,23,42,0.08)]
                  dark:border-slate-800
                  dark:bg-slate-900
                "
              >
                {/* SEARCH INPUT */}
                <div
                  className="
                    flex
                    h-[44px]
                    items-center
                    gap-3
                    rounded-lg
                    border
                    border-slate-200
                    bg-white
                    px-4
                    dark:border-slate-700
                    dark:bg-slate-950
                  "
                >
                  <Search
                    size={17}
                    strokeWidth={1.8}
                    className="shrink-0 text-slate-400"
                  />

                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search businesses, services, jobs..."
                    aria-label="Search ZeilaLink"
                    className="
                      h-full
                      min-w-0
                      flex-1
                      bg-transparent
                      text-[13px]
                      text-slate-900
                      outline-none
                      placeholder:text-slate-400
                      dark:text-white
                    "
                  />
                </div>

                {/* LOCATION / CATEGORY / SEARCH */}
                <div className="mt-2 grid grid-cols-[1fr_1fr_140px] gap-2">
                  {/* LOCATION */}
                  <div
                    className="
                      relative
                      flex
                      h-[42px]
                      items-center
                      rounded-lg
                      border
                      border-slate-200
                      bg-white
                      dark:border-slate-700
                      dark:bg-slate-950
                    "
                  >
                    <MapPin
                      size={16}
                      strokeWidth={1.8}
                      className="
                        pointer-events-none
                        absolute
                        left-3
                        z-10
                        text-slate-500
                      "
                    />

                    <select
                      value={location}
                      onChange={(event) => setLocation(event.target.value)}
                      aria-label="Location"
                      className="
                        h-full
                        w-full
                        appearance-none
                        rounded-lg
                        bg-transparent
                        pl-9
                        pr-8
                        text-[12px]
                        font-medium
                        text-slate-700
                        outline-none
                        dark:text-slate-200
                      "
                    >
                      <option value="Minneapolis, MN">Minneapolis, MN</option>
                      <option value="St. Paul, MN">St. Paul, MN</option>
                      <option value="Bloomington, MN">Bloomington, MN</option>
                    </select>

                    <ChevronDown
                      size={14}
                      className="
                        pointer-events-none
                        absolute
                        right-3
                        text-slate-400
                      "
                    />
                  </div>

                  {/* CATEGORY */}
                  <div
                    className="
                      relative
                      flex
                      h-[42px]
                      items-center
                      rounded-lg
                      border
                      border-slate-200
                      bg-white
                      dark:border-slate-700
                      dark:bg-slate-950
                    "
                  >
                    <Tag
                      size={15}
                      strokeWidth={1.8}
                      className="
                        pointer-events-none
                        absolute
                        left-3
                        text-slate-500
                      "
                    />

                    <select
                      value={category}
                      onChange={(event) => setCategory(event.target.value)}
                      aria-label="Category"
                      className="
                        h-full
                        w-full
                        appearance-none
                        rounded-lg
                        bg-transparent
                        pl-9
                        pr-8
                        text-[12px]
                        font-medium
                        text-slate-700
                        outline-none
                        dark:text-slate-200
                      "
                    >
                      <option value="">All Categories</option>
                      <option value="business">Businesses</option>
                      <option value="service">Services</option>
                      <option value="job">Jobs</option>
                      <option value="training">Courses</option>
                      <option value="deal">Deals</option>
                    </select>

                    <ChevronDown
                      size={14}
                      className="
                        pointer-events-none
                        absolute
                        right-3
                        text-slate-400
                      "
                    />
                  </div>

                  {/* SEARCH BUTTON */}
                  <button
                    type="submit"
                    className="
                      h-[42px]
                      rounded-lg
                      bg-primary
                      px-5
                      text-[12px]
                      font-bold
                      text-white
                      shadow-[0_5px_15px_rgb(var(--color-primary)/0.20)]
                      transition
                      hover:bg-primary-dark
                      active:scale-[0.98]
                    "
                  >
                    Search
                  </button>
                </div>
              </form>

              {/* ====================================================
                  QUICK ACTIONS
              ==================================================== */}
              <div className="mt-3 grid max-w-[650px] grid-cols-6 gap-2">
                {quickLinks.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="
                        group
                        flex
                        h-[74px]
                        flex-col
                        items-center
                        justify-center
                        gap-2
                        rounded-lg
                        border
                        border-slate-200
                        bg-white/95
                        text-slate-900
                        shadow-[0_3px_12px_rgba(15,23,42,0.04)]
                        transition-all
                        duration-200
                        hover:-translate-y-0.5
                        hover:border-primary/30
                        hover:shadow-[0_8px_20px_rgba(15,23,42,0.08)]
                        dark:border-slate-800
                        dark:bg-slate-900
                        dark:text-white
                      "
                    >
                      <Icon
                        size={22}
                        strokeWidth={2}
                        className="
                          text-primary
                          transition-transform
                          group-hover:scale-105
                        "
                      />

                      <span className="text-[10px] font-bold">
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ==========================================================
            WELCOME FLOATING CARD
        ========================================================== */}
        <div
          className="
            absolute
            bottom-[28px]
            right-[5.5%]
            z-20
            w-[300px]
            rounded-xl
            border
            border-slate-200/90
            bg-white/95
            p-5
            shadow-[0_12px_35px_rgba(15,23,42,0.14)]
            backdrop-blur-md
            dark:border-slate-700
            dark:bg-slate-900/95
          "
        >
          <div className="flex items-start gap-3">
            <div
              className="
                flex
                h-8
                w-8
                shrink-0
                items-center
                justify-center
                rounded-lg
                bg-primary/10
              "
            >
              <Users size={17} strokeWidth={2.1} className="text-primary" />
            </div>

            <div>
              <h2
                className="
                  text-[13px]
                  font-extrabold
                  text-slate-950
                  dark:text-white
                "
              >
                Welcome to ZeilaLink
              </h2>

              <p
                className="
                  mt-2
                  text-[11px]
                  font-medium
                  leading-[1.6]
                  text-slate-600
                  dark:text-slate-300
                "
              >
                Empowering our community by connecting people with trusted local
                businesses and great opportunities.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          MOBILE HERO
      ============================================================ */}
      <div className="lg:hidden">
        {/* HERO IMAGE + TEXT */}
        <div className="relative min-h-[260px] overflow-hidden sm:min-h-[300px]">
          <Image
            src={heroImage}
            alt="Minneapolis skyline"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[68%_center]"
          />

          {/* White fade from left */}
          <div
            className="
              absolute
              inset-0
              bg-gradient-to-r
              from-white
              via-white/75
              to-white/5
              dark:from-slate-950
              dark:via-slate-950/75
              dark:to-slate-950/10
            "
          />

          {/* Top/bottom polish */}
          <div
            className="
              absolute
              inset-x-0
              bottom-0
              h-20
              bg-gradient-to-t
              from-white
              to-transparent
              dark:from-slate-950
            "
          />

          <div className="relative z-10 px-5 pb-6 pt-6 sm:px-7 sm:pt-8">
            <h1
              className="
                max-w-[280px]
                text-[29px]
                font-extrabold
                leading-[1.04]
                tracking-[-0.035em]
                text-[#0b1230]
                sm:max-w-[340px]
                sm:text-[34px]
                dark:text-white
              "
            >
              Connect.
              <br />
              Discover.
              <br />
              <span className="text-primary">
                Support Somali
                <br />
                Businesses.
              </span>
            </h1>

            <p
              className="
                mt-4
                max-w-[280px]
                text-[13px]
                font-medium
                leading-[1.65]
                text-slate-700
                sm:max-w-[330px]
                dark:text-slate-200
              "
            >
              Find trusted businesses, services, jobs and more in your
              community.
            </p>
          </div>
        </div>

        {/* ==========================================================
            MOBILE SEARCH + QUICK ACTIONS
        ========================================================== */}
        <div className="relative z-20 bg-white px-4 pb-7 dark:bg-slate-950">
          <form onSubmit={handleSearch} className="-mt-3">
            <div
              className="
                flex
                h-[52px]
                items-center
                gap-3
                rounded-xl
                border
                border-slate-200
                bg-white
                px-4
                shadow-[0_5px_20px_rgba(15,23,42,0.10)]
                dark:border-slate-700
                dark:bg-slate-900
              "
            >
              <Search
                size={20}
                strokeWidth={1.8}
                className="shrink-0 text-slate-500"
              />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search businesses, services..."
                aria-label="Search ZeilaLink"
                className="
                  min-w-0
                  flex-1
                  bg-transparent
                  text-[13px]
                  font-medium
                  text-slate-900
                  outline-none
                  placeholder:text-slate-500
                  dark:text-white
                "
              />
            </div>
          </form>

          {/* FOUR MOBILE ACTIONS */}
          <div className="mt-4 grid grid-cols-4 gap-2">
            {quickLinks
              .filter((item) => !item.desktopOnly)
              .map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="
                      flex
                      min-w-0
                      flex-col
                      items-center
                      justify-center
                      gap-2
                      rounded-xl
                      border
                      border-slate-200
                      bg-white
                      px-1
                      py-3
                      shadow-[0_3px_12px_rgba(15,23,42,0.06)]
                      transition
                      active:scale-[0.97]
                      dark:border-slate-800
                      dark:bg-slate-900
                    "
                  >
                    <div
                      className="
                        flex
                        h-8
                        w-8
                        items-center
                        justify-center
                        rounded-lg
                        bg-primary/5
                      "
                    >
                      <Icon
                        size={21}
                        strokeWidth={2.1}
                        className="text-primary"
                      />
                    </div>

                    <span
                      className="
                        w-full
                        truncate
                        text-center
                        text-[10px]
                        font-bold
                        text-slate-900
                        dark:text-white
                      "
                    >
                      {item.label}
                    </span>
                  </Link>
                );
              })}
          </div>
        </div>
      </div>
    </section>
  );
}
