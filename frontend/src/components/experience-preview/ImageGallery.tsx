"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type GalleryImage = {
  id: string;
  url: string;
  alt?: string;
};

export default function ImageGallery({
  images,
  initialIndex = 0,
  aspectClassName = "aspect-[21/9]",
}: {
  images: GalleryImage[];
  initialIndex?: number;
  aspectClassName?: string;
}) {
  const safeImages = useMemo(() => images.filter((img) => !!img.url), [images]);
  const [index, setIndex] = useState(() => {
    if (!safeImages.length) return 0;
    return Math.max(0, Math.min(initialIndex, safeImages.length - 1));
  });

  const goPrev = useCallback(() => {
    setIndex((prev) => (prev - 1 + safeImages.length) % safeImages.length);
  }, [safeImages.length]);

  const goNext = useCallback(() => {
    setIndex((prev) => (prev + 1) % safeImages.length);
  }, [safeImages.length]);

  useEffect(() => {
    if (!safeImages.length) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goNext, goPrev, safeImages.length]);

  if (!safeImages.length) {
    return (
      <div
        className={`relative w-full ${aspectClassName} overflow-hidden rounded-3xl border border-border bg-muted`}
      />
    );
  }

  const current = safeImages[index];

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-card group">
      <div className={`relative w-full ${aspectClassName}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.url}
          alt={current.alt ?? "Experience photo"}
          className="h-full w-full object-cover"
          loading="eager"
        />

        {safeImages.length > 1 ? (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous photo"
              className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/90 backdrop-blur-sm border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-background hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Next photo"
              className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/90 backdrop-blur-sm border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-background hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {safeImages.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  aria-label={`Go to photo ${i + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === index ? "w-8 bg-background" : "w-2 bg-background/60"
                  }`}
                  onClick={() => setIndex(i)}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}


