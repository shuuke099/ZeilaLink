"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  TRAINING_FAVORITES_EVENT,
  isTrainingFavorite,
  toggleTrainingFavorite,
  type TrainingFavorite,
} from "@/lib/trainingFavorites";

type Props = {
  training: TrainingFavorite;
  isSomali: boolean;
  className?: string;
};

export default function TrainingFavoriteButton({ training, isSomali, className = "" }: Props) {
  const { user, loading } = useAuth();
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    if (loading) return;
    const sync = () => setFavorite(isTrainingFavorite(training.id, user?.id));
    sync();
    window.addEventListener(TRAINING_FAVORITES_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(TRAINING_FAVORITES_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [loading, training.id, user?.id]);

  const label = favorite
    ? (isSomali ? "Ka saar kuwa aad jeceshahay" : "Remove from favorites")
    : (isSomali ? "Ku dar kuwa aad jeceshahay" : "Add to favorites");

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={favorite}
      disabled={loading}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setFavorite(toggleTrainingFavorite(training, user?.id));
      }}
      className={`grid place-items-center rounded-lg border border-slate-200 bg-white/95 text-slate-600 shadow-sm transition hover:border-rose-300 hover:text-rose-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 ${className}`}
    >
      <Heart size={17} className={favorite ? "fill-rose-500 text-rose-500" : ""} />
    </button>
  );
}
