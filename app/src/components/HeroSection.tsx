"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import type { SiteConfig } from "@/types";
import FloatingPetals from "@/components/FloatingPetals";

interface Props {
  config: SiteConfig;
  guestName?: string;
}

function formatWeddingDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function HeroSection({ config, guestName }: Props) {
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!bgRef.current) return;
      bgRef.current.style.transform = `translateY(${window.scrollY * 0.15}px)`;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 overflow-hidden"
    >
      {/* Parallax image wrapper — 30% taller than section to allow movement room */}
      <div
        ref={bgRef}
        className="absolute inset-x-0 -top-[15%] -bottom-[15%] will-change-transform"
      >
        {config.cover_photo_url ? (
          <Image
            src={config.cover_photo_url}
            alt="Wedding cover photo"
            fill
            priority
            className="object-cover object-center"
          />
        ) : (
          <div className="absolute inset-0" style={{ backgroundColor: "var(--color-gold)" }} />
        )}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Floating petals over hero */}
      <FloatingPetals count={40} />

      <div className="relative z-10 text-white">
        {guestName && (
          <p className="text-sm sm:text-base opacity-80 mb-4 font-[family-name:var(--font-lato)] tracking-wide">
            Kepada <span className="font-semibold">{guestName}</span>,
          </p>
        )}

        <h1 className="text-5xl sm:text-7xl font-[family-name:var(--font-wedding)] leading-tight mb-6">
          <span className="shimmer-text">{config.partner_one_name}</span>
          <span className="block text-3xl sm:text-4xl my-3 font-light opacity-80">&amp;</span>
          <span className="shimmer-text">{config.partner_two_name}</span>
        </h1>

        <div className="w-16 h-px bg-white/60 mx-auto mb-6" />

        {config.wedding_date && (
          <p className="text-lg sm:text-xl opacity-90 mb-2 font-[family-name:var(--font-lato)] tracking-wide">
            {formatWeddingDate(config.wedding_date)}
          </p>
        )}

        {/* {config.venue_name && (
          <p className="text-base opacity-75 font-[family-name:var(--font-lato)]">
            {config.venue_name}
          </p>
        )} */}

        <a
          href="#rsvp"
          className="inline-block mt-10 px-8 py-3 border border-white text-white rounded-full text-sm tracking-widest hover:bg-white hover:text-[#3a3028] transition-colors font-[family-name:var(--font-lato)] uppercase"
        >
          RSVP Sekarang
        </a>
      </div>

      {/* Scroll indicator */}
      <a
        href="#story"
        aria-label="Scroll down"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 group"
      >
        <span className="text-[10px] uppercase tracking-[0.25em] text-white/50 font-[family-name:var(--font-lato)] group-hover:text-white/80 transition-colors">
          Scroll
        </span>
        {/* Double chevron arrows */}
        <svg className="w-6 h-6 text-white/60 animate-scroll-dot group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
        <svg className="w-6 h-6 text-white/30 animate-scroll-dot [animation-delay:0.2s] group-hover:text-white/60 transition-colors -mt-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </a>
    </section>
  );
}

