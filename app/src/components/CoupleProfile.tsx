"use client";

import Image from "next/image";
import { useLanguage } from "@/components/LanguageProvider";
import FloralCorner from "@/components/FloralCorner";

interface Props {
  partnerOneName: string;
  partnerTwoName: string;
  partnerOnePhotoUrl?: string;
  partnerTwoPhotoUrl?: string;
  partnerOneFullName?: string;
  partnerTwoFullName?: string;
  partnerOneParents?: string;
  partnerTwoParents?: string;
}

export default function CoupleProfile({
  partnerOneName,
  partnerTwoName,
  partnerOnePhotoUrl,
  partnerTwoPhotoUrl,
  partnerOneFullName,
  partnerTwoFullName,
  partnerOneParents,
  partnerTwoParents,
}: Props) {
  const { t } = useLanguage();

  // Only render if at least one photo is provided
  if (!partnerOnePhotoUrl && !partnerTwoPhotoUrl) return null;

  return (
    <section id="couple" className="relative py-20 px-4 overflow-hidden">
      {/* Soft background */}
      <div className="absolute inset-0" />

      <div className="relative z-10 max-w-4xl mx-auto text-center glass-bg rounded-2xl px-8 py-12 overflow-hidden">
        <FloralCorner variant="blush" position="top-left" size={130} opacity={0.85} />
        <FloralCorner variant="burgundy" position="bottom-right" size={130} opacity={0.85} />
        <h2 className="relative z-10 text-3xl sm:text-4xl font-[family-name:var(--font-wedding)] text-[#3a3028] mb-4">
          {t("couple_eyebrow")}
        </h2>
        <div className="w-12 h-px bg-[var(--color-gold)] mx-auto mb-12" />

        <div className="flex flex-col sm:flex-row items-center justify-center gap-10 sm:gap-16">
          {/* Partner One */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-52 h-52 sm:w-64 sm:h-64 rounded-full overflow-hidden ring-4 ring-[var(--color-gold)]/40 shadow-xl">
              {partnerOnePhotoUrl ? (
                <Image
                  src={partnerOnePhotoUrl}
                  alt={partnerOneName}
                  fill
                  className="object-cover object-top"
                />
              ) : (
                <div className="w-full h-full bg-[var(--color-gold-light)] flex items-center justify-center">
                  <span className="text-5xl text-[var(--color-gold)]">♡</span>
                </div>
              )}
            </div>
            {partnerOneFullName && (
              <p className="text-3xl text-[#3a3028] font-[family-name:var(--font-great-vibes)] mt-2">
                {partnerOneFullName}
              </p>
            )}
            {partnerOneParents && (
              <p className="text-sm text-[#6b5c4e] italic text-center leading-snug">
                {partnerOneParents}
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="flex flex-row sm:flex-col items-center gap-3 text-[var(--color-gold)]">
            <div className="w-12 h-px sm:w-px sm:h-12 bg-[var(--color-gold)]/40" />
            <span className="font-[family-name:var(--font-wedding)] text-3xl">&amp;</span>
            <div className="w-12 h-px sm:w-px sm:h-12 bg-[var(--color-gold)]/40" />
          </div>

          {/* Partner Two */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-52 h-52 sm:w-64 sm:h-64 rounded-full overflow-hidden ring-4 ring-[var(--color-gold)]/40 shadow-xl">
              {partnerTwoPhotoUrl ? (
                <Image
                  src={partnerTwoPhotoUrl}
                  alt={partnerTwoName}
                  fill
                  className="object-cover object-top"
                />
              ) : (
                <div className="w-full h-full bg-[var(--color-gold-light)] flex items-center justify-center">
                  <span className="text-5xl text-[var(--color-gold)]">♡</span>
                </div>
              )}
            </div>
            {partnerTwoFullName && (
              <p className="text-3xl text-[#3a3028] font-[family-name:var(--font-great-vibes)] mt-2">
                {partnerTwoFullName}
              </p>
            )}
            {partnerTwoParents && (
              <p className="text-sm text-[#6b5c4e] italic text-center leading-snug">
                {partnerTwoParents}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
