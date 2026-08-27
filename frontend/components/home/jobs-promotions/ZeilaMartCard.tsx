"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";

export default function ZeilaMartCard() {
  return (
    <section className="flex h-full min-h-[300px] w-full flex-col items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-600 px-6 py-8 text-center text-white shadow-sm sm:px-8">
      <div className="mb-3 flex h-12 w-12 items-center justify-center">
        <ShoppingCart className="h-10 w-10 stroke-[2.2]" />
      </div>

      <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
        ZeilaMart Marketplace
      </h2>

      <p className="mt-4 max-w-[270px] text-sm font-medium leading-6 text-white/95">
        Buy & sell real estate, cars,
        <br className="hidden sm:block" />
        electronics, clothes and more.
      </p>

      <Link
        href="/zeilamart"
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-white px-7 py-2.5 text-sm font-bold text-emerald-600 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-white/70"
      >
        Explore ZeilaMart
      </Link>

      <p className="mt-6 text-sm font-semibold text-white/90">
        Shop. Sell. Succeed.
      </p>
    </section>
  );
}
