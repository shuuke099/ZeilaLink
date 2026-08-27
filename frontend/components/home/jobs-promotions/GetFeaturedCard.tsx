"use client";

import Link from "next/link";
import { Crown } from "lucide-react";

export default function GetFeaturedCard() {
  return (
    <section className="flex h-full min-h-[300px] w-full flex-col items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-800 px-5 py-8 text-center text-white shadow-sm">
      <Crown className="h-11 w-11 stroke-[2.2] text-white" />

      <h2 className="mt-3 text-xl font-bold tracking-tight">Get Featured</h2>

      <p className="mt-3 max-w-[220px] text-sm font-medium leading-6 text-white/95">
        Boost your business visibility
        <br className="hidden sm:block" />
        and get more customers.
      </p>

      <Link
        href="/featured-listing"
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-white px-6 py-2.5 text-sm font-bold text-violet-700 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-violet-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-white/70"
      >
        Become Featured
      </Link>

      <p className="mt-5 text-sm font-semibold text-white/95">$30 / month</p>
    </section>
  );
}
