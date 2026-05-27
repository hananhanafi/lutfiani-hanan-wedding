"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

interface Props {
  photos: string[];
}

export default function PhotoGallery({ photos }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const close = useCallback(() => setLightboxIndex(null), []);
  const prev = useCallback(() => setLightboxIndex((i) => (i !== null ? (i - 1 + photos.length) % photos.length : null)), [photos.length]);
  const next = useCallback(() => setLightboxIndex((i) => (i !== null ? (i + 1) % photos.length : null)), [photos.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightboxIndex, close, prev, next]);

  if (!photos || photos.length === 0) return null;

  return (
    <>
      <section id="gallery" className="glass-bg py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-gold)] mb-3 font-[family-name:var(--font-lato)]">
              Gallery
            </p>
            <h2 className="text-3xl sm:text-4xl font-[family-name:var(--font-wedding)] text-[#3a3028]">
              Our Moments
            </h2>
            <div className="w-12 h-px bg-[var(--color-gold)] mx-auto mt-4" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {photos.map((url, i) => (
              <button
                key={i}
                onClick={() => setLightboxIndex(i)}
                className={`overflow-hidden rounded-2xl aspect-square focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)] group`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Photo ${i + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90"
          onClick={close}
        >
          {/* Image */}
          <div
            className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photos[lightboxIndex]}
              alt={`Photo ${lightboxIndex + 1}`}
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl shadow-2xl"
            />

            {/* Counter */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 glass px-3 py-1 rounded-full text-xs text-[#3a3028] font-[family-name:var(--font-lato)]">
              {lightboxIndex + 1} / {photos.length}
            </div>
          </div>

          {/* Close */}
          <button
            onClick={close}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors text-xl"
            aria-label="Close"
          >
            ✕
          </button>

          {/* Prev */}
          {photos.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-3 sm:left-6 w-11 h-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors text-xl"
              aria-label="Previous photo"
            >
              ‹
            </button>
          )}

          {/* Next */}
          {photos.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-3 sm:right-6 w-11 h-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors text-xl"
              aria-label="Next photo"
            >
              ›
            </button>
          )}
        </div>
      )}
    </>
  );
}
