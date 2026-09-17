import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Heart } from "lucide-react";
import Navbar from "@/components/Navbar";
import FavoritesClient from "./FavoritesClient";

export const metadata: Metadata = {
  title: "Favorites | ZeilaLink",
  description: "View the businesses and trainings you saved on ZeilaLink.",
  robots: { index: false, follow: true },
};

export default function FavoritesPage() {
  const isSomali = cookies().get("language")?.value === "so";

  return (
    <div className="min-h-screen bg-background-muted">
      <Navbar />
      <main className="mx-auto max-w-[1440px] px-4 pb-24 pt-24 sm:px-6 lg:px-8">
        <header className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary"><Heart size={21} className="fill-primary/15" /></span>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-heading sm:text-3xl">{isSomali ? "Kuwa aad jeceshahay" : "Favorites"}</h1>
              <p className="mt-1 text-sm text-muted">{isSomali ? "Ganacsiyada iyo tababarada aad kaydsatay hal meel ka eeg." : "See all your saved businesses and trainings in one place."}</p>
            </div>
          </div>
        </header>
        <FavoritesClient />
      </main>
    </div>
  );
}
