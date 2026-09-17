"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  BUSINESS_FAVORITES_EVENT,
  isBusinessFavorite,
  toggleBusinessFavorite,
} from "@/lib/businessFavorites";
import type { PublicBusiness } from "@/lib/publicDirectoryTypes";

interface BusinessFavoriteButtonProps {
  business: PublicBusiness;
  isSomali: boolean;
  className?: string;
}

export default function BusinessFavoriteButton({
  business,
  isSomali,
  className = "",
}: BusinessFavoriteButtonProps) {
  const { user } = useAuth();
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    const syncFavorite = () => {
      setFavorite(isBusinessFavorite(business.id, user?.id));
    };

    syncFavorite();
    window.addEventListener(BUSINESS_FAVORITES_EVENT, syncFavorite);
    window.addEventListener("storage", syncFavorite);
    return () => {
      window.removeEventListener(BUSINESS_FAVORITES_EVENT, syncFavorite);
      window.removeEventListener("storage", syncFavorite);
    };
  }, [business.id, user?.id]);

  const label = favorite
    ? isSomali
      ? "Ka saar kuwa aad jeceshahay"
      : "Remove from favorites"
    : isSomali
      ? "Ku dar kuwa aad jeceshahay"
      : "Add to favorites";

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={favorite}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setFavorite(toggleBusinessFavorite(business, user?.id));
      }}
      className={`grid place-items-center rounded-full bg-slate-900/50 text-white shadow-sm backdrop-blur-sm transition hover:scale-105 hover:bg-slate-900/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${className}`}
    >
      <Heart
        size={15}
        className={favorite ? "fill-rose-500 text-rose-500" : "text-white"}
      />
    </button>
  );
}

