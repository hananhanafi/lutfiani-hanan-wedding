"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { SiteConfig } from "@/types";
import FloatingPetals from "@/components/FloatingPetals";
import { useLanguage } from "@/components/LanguageProvider";
import Typewriter from "@/components/Typewriter";
import FloralCorner from "@/components/FloralCorner";

interface Props {
  config: SiteConfig;
}

function formatWeddingDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function HeroSection({ config }: Props) {
  const { t } = useLanguage();
  const bgRef = useRef<HTMLDivElement>(null);
  const [firstDone, setFirstDone] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (!bgRef.current) return;
      bgRef.current.style.transform = `translateY(${window.scrollY * 0.35}px)`;
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
        className="absolute inset-x-0 -top-[20%] -bottom-[20%] will-change-transform"
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

      {/* Vintage floral corners framing the hero */}
      <FloralCorner variant="blush" position="top-left" size={190} className="drop-shadow-xl sm:!w-[250px] sm:!h-[250px]" />
      <FloralCorner variant="blush" position="top-right" size={190} className="drop-shadow-xl sm:!w-[250px] sm:!h-[250px]" />
      <FloralCorner variant="blush" position="bottom-left" size={150} className="drop-shadow-xl" />
      <FloralCorner variant="blush" position="bottom-right" size={150} className="drop-shadow-xl" />

      <div className="relative z-10 text-white">
        <h1 className="text-5xl sm:text-7xl font-[family-name:var(--font-wedding)] leading-tight mb-6">
          <Typewriter
            text={config.partner_one_name}
            startDelay={500}
            className="shimmer-text"
            keepCaret={false}
            onDone={() => setFirstDone(true)}
          />
          <span
            className={`block text-3xl sm:text-4xl my-3 font-light opacity-80 transition-opacity duration-700 ${
              firstDone ? "opacity-80" : "opacity-0"
            }`}
          >
            &amp;
          </span>
          {/* Reserve the line height so nothing jumps when the name types in */}
          <span className="block min-h-[1.15em]">
            {firstDone ? (
              <Typewriter
                text={config.partner_two_name}
                startDelay={250}
                className="shimmer-text"
                keepCaret={false}
              />
            ) : (
              <span className="invisible shimmer-text">{config.partner_two_name}</span>
            )}
          </span>
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
          {t("hero_rsvp")}
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

