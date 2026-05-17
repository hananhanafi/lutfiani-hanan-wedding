"use client";

import { useLanguage } from "@/components/LanguageProvider";

interface Props {
  partnerOneName: string;
  partnerTwoName: string;
  weddingDate?: string;
}

function formatYear(dateStr: string) {
  return new Date(dateStr).getFullYear();
}

export default function Footer({ partnerOneName, partnerTwoName, weddingDate }: Props) {
  const { t } = useLanguage();
  return (
    <footer className="bg-[var(--color-cream-dark)] py-12 px-4 text-center border-t border-[#e0d5c5]/60">
      <div className="max-w-xl mx-auto space-y-4">
        {/* Decorative divider */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="h-px w-12 bg-[var(--color-gold)]" />
          <span className="text-[var(--color-gold)] text-base">✦</span>
          <div className="h-px w-12 bg-[var(--color-gold)]" />
        </div>

        <p className="text-2xl font-[family-name:var(--font-wedding)] text-[#3a3028]">
          {partnerOneName} &amp; {partnerTwoName}
        </p>

        {weddingDate && (
          <p className="text-sm text-[#9a7d5a] font-[family-name:var(--font-lato)] tracking-widest uppercase">
            {formatYear(weddingDate)}
          </p>
        )}

        <p className="text-xs text-[#c9b99a] font-[family-name:var(--font-lato)] italic mt-4">
          {t("footer_made")}
        </p>
      </div>
    </footer>
  );
}
