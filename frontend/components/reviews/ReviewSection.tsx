"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Star } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

type ReviewTargetType = "business" | "service" | "course";

type Review = {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string; avatarUrl?: string | null };
};

type ReviewsResponse = {
  summary: { rating: number; count: number };
  reviews: Review[];
  myReview?: Review | null;
};

interface ReviewSectionProps {
  targetType: ReviewTargetType;
  targetId: string;
  initialRating?: number | null;
  initialCount?: number | null;
}

export default function ReviewSection({
  targetType,
  targetId,
  initialRating = 0,
  initialCount = 0,
}: ReviewSectionProps) {
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const pathname = usePathname();
  const so = language === "so";
  const [data, setData] = useState<ReviewsResponse>({
    summary: { rating: initialRating || 0, count: initialCount || 0 },
    reviews: [],
    myReview: null,
  });
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadReviews = useCallback(async () => {
    try {
      const response = await api.get<ReviewsResponse>(
        `/reviews/${targetType}/${encodeURIComponent(targetId)}`,
      );
      setData(response.data);
      setRating(response.data.myReview?.rating || 0);
      setComment(response.data.myReview?.comment || "");
      setError("");
    } catch (requestError: any) {
      setError(
        requestError?.response?.data?.error ||
          (so ? "Faallooyinka lama soo dejin karin." : "Reviews could not be loaded."),
      );
    } finally {
      setLoading(false);
    }
  }, [so, targetId, targetType]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews, user?.id]);

  const submitReview = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!rating) {
      setError(so ? "Dooro qiimeyn 1 ilaa 5 ah." : "Choose a rating from 1 to 5.");
      return;
    }

    setSaving(true);
    try {
      await api.post(`/reviews/${targetType}/${encodeURIComponent(targetId)}`, {
        rating,
        comment,
      });
      await loadReviews();
      setSuccess(
        data.myReview
          ? so
            ? "Faalladaada waa la cusboonaysiiyey."
            : "Your review was updated."
          : so
            ? "Faalladaada waa la gudbiyey."
            : "Your review was submitted.",
      );
    } catch (requestError: any) {
      setError(
        requestError?.response?.data?.error ||
          (so ? "Faallada lama kaydin karin." : "Your review could not be saved."),
      );
    } finally {
      setSaving(false);
    }
  };

  const displayedRating = hoveredRating || rating;
  const loginHref = `/login?redirect=${encodeURIComponent(pathname)}`;

  return (
    <section className="rounded-xl border border-border bg-surface p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
        <div>
          <h2 className="text-base font-extrabold text-heading dark:text-white">
            {so ? "Qiimeynta iyo faallooyinka" : "Ratings and reviews"}
          </h2>
          <p className="mt-1 text-[11px] text-muted dark:text-slate-400">
            {so ? "La wadaag khibraddaada isticmaalayaasha kale." : "Share your experience with other users."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <strong className="text-3xl font-extrabold text-heading dark:text-white">
            {data.summary.count ? data.summary.rating.toFixed(1) : "—"}
          </strong>
          <div>
            <div className="flex gap-0.5" aria-label={`${data.summary.rating.toFixed(1)} out of 5`}>
              {Array.from({ length: 5 }).map((_, index) => (
                <Star key={index} size={14} className={index < Math.round(data.summary.rating) ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-700"} />
              ))}
            </div>
            <p className="mt-1 text-[10px] text-muted dark:text-slate-400">
              {data.summary.count} {so ? "faallo" : data.summary.count === 1 ? "review" : "reviews"}
            </p>
          </div>
        </div>
      </div>

      {!authLoading && user ? (
        <form onSubmit={submitReview} className="mt-4 rounded-xl bg-surface-muted p-4 dark:bg-slate-950/60">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[12px] font-bold text-heading dark:text-white">
              {data.myReview ? (so ? "Wax ka beddel faalladaada" : "Update your review") : (so ? "Qor faallo" : "Write a review")}
            </p>
            <div className="flex" onMouseLeave={() => setHoveredRating(0)}>
              {Array.from({ length: 5 }).map((_, index) => {
                const value = index + 1;
                return (
                  <button
                    key={value}
                    type="button"
                    onMouseEnter={() => setHoveredRating(value)}
                    onFocus={() => setHoveredRating(value)}
                    onBlur={() => setHoveredRating(0)}
                    onClick={() => setRating(value)}
                    aria-label={`${value} ${so ? "xiddig" : value === 1 ? "star" : "stars"}`}
                    className="rounded p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  >
                    <Star size={23} className={value <= displayedRating ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-700"} />
                  </button>
                );
              })}
            </div>
          </div>
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value.slice(0, 1000))}
            rows={3}
            placeholder={so ? "Nala wadaag faahfaahinta khibraddaada..." : "Tell others about your experience..."}
            className="mt-3 w-full resize-y rounded-lg border border-border bg-surface px-3 py-2.5 text-[12px] leading-5 text-foreground outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-slate-700 dark:bg-slate-900"
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-[9px] text-muted">{comment.length}/1000</span>
            <button type="submit" disabled={saving || !rating} className="h-9 rounded-lg bg-primary px-4 text-[11px] font-bold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50">
              {saving ? (so ? "Waa la kaydinayaa..." : "Saving...") : data.myReview ? (so ? "Cusboonaysii" : "Update review") : (so ? "Gudbi faallada" : "Submit review")}
            </button>
          </div>
        </form>
      ) : !authLoading ? (
        <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
          <p className="text-[12px] font-semibold text-foreground dark:text-slate-200">{so ? "Soo gal si aad qiimeyn iyo faallo uga bixiso." : "Sign in to leave a rating and review."}</p>
          <Link href={loginHref} className="mt-3 inline-flex h-9 items-center rounded-lg bg-primary px-4 text-[11px] font-bold text-white">{so ? "Soo gal" : "Sign in"}</Link>
        </div>
      ) : null}

      {error && <p role="alert" className="mt-3 text-[11px] font-semibold text-rose-600 dark:text-rose-400">{error}</p>}
      {success && <p role="status" className="mt-3 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">{success}</p>}

      <div className="mt-5 space-y-3">
        {loading ? (
          <div className="h-20 animate-pulse rounded-xl bg-surface-muted" />
        ) : data.reviews.length > 0 ? (
          data.reviews.map((review) => (
            <article key={review.id} className="rounded-xl border border-border p-3.5 dark:border-slate-800">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  {review.user.avatarUrl ? <img src={review.user.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" /> : <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-[12px] font-extrabold text-primary">{review.user.name.charAt(0).toUpperCase()}</span>}
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-bold text-heading dark:text-white">{review.user.name}{review.user.id === user?.id ? <span className="ml-1 font-medium text-primary">({so ? "adiga" : "you"})</span> : null}</p>
                    <p className="mt-0.5 text-[9px] text-muted dark:text-slate-400">{new Intl.DateTimeFormat(so ? "so-SO" : "en-US", { year: "numeric", month: "short", day: "numeric" }).format(new Date(review.updatedAt))}</p>
                  </div>
                </div>
                <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, index) => <Star key={index} size={12} className={index < review.rating ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-700"} />)}</div>
              </div>
              {review.comment && <p className="mt-3 whitespace-pre-line text-[11px] leading-5 text-muted dark:text-slate-300">{review.comment}</p>}
            </article>
          ))
        ) : (
          <p className="rounded-xl border border-dashed border-border p-5 text-center text-[11px] text-muted dark:border-slate-800 dark:text-slate-400">{so ? "Noqo qofka ugu horreeya ee faallo bixiya." : "Be the first to leave a review."}</p>
        )}
      </div>
    </section>
  );
}

