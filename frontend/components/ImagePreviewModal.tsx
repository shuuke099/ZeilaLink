"use client";

import { useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type ImagePreviewModalProps = {
  images: string[];
  activeIndex: number | null;
  title: string;
  onChange: (index: number) => void;
  onClose: () => void;
};

export default function ImagePreviewModal({
  images,
  activeIndex,
  title,
  onChange,
  onClose,
}: ImagePreviewModalProps) {
  useEffect(() => {
    if (activeIndex === null) return;
    const bodyOverflow = document.body.style.overflow;
    const htmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") onChange((activeIndex - 1 + images.length) % images.length);
      if (event.key === "ArrowRight") onChange((activeIndex + 1) % images.length);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = bodyOverflow;
      document.documentElement.style.overflow = htmlOverflow;
    };
  }, [activeIndex, images.length, onChange, onClose]);

  if (activeIndex === null || !images[activeIndex]) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${title} image preview`}
      className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-950/95 p-3 backdrop-blur-sm sm:p-8"
      onClick={onClose}
    >
      <button type="button" onClick={onClose} aria-label="Close image preview" className="absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-black/35 text-white backdrop-blur-md sm:right-7 sm:top-7">
        <X size={23}/>
      </button>
      <div className="relative flex h-full w-full max-w-6xl items-center justify-center" onClick={(event) => event.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[activeIndex]} alt={`${title} preview`} className="max-h-[88dvh] max-w-full rounded-xl object-contain shadow-2xl"/>
        {images.length > 1 && (
          <>
            <button type="button" onClick={() => onChange((activeIndex - 1 + images.length) % images.length)} aria-label="Previous image" className="absolute left-1 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur-md sm:left-4">
              <ChevronLeft size={25}/>
            </button>
            <button type="button" onClick={() => onChange((activeIndex + 1) % images.length)} aria-label="Next image" className="absolute right-1 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur-md sm:right-4">
              <ChevronRight size={25}/>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
