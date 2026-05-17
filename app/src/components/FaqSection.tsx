"use client";

import { useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import type { FaqItem } from "@/types";

interface Props {
  items: FaqItem[];
}

export default function FaqSection({ items }: Props) {
  const { lang } = useLanguage();
  const [open, setOpen] = useState<number | null>(null);

  if (!items || items.length === 0) return null;

  return (
    <section id="faq" className="bg-[var(--color-cream-dark)] py-20 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-gold)] mb-3 font-[family-name:var(--font-lato)]">
            FAQ
          </p>
          <h2 className="text-3xl sm:text-4xl font-[family-name:var(--font-wedding)] text-[#3a3028]">
            Frequently Asked Questions
          </h2>
          <div className="w-12 h-px bg-[var(--color-gold)] mx-auto mt-4" />
        </div>

        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="glass rounded-xl overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left text-[#3a3028] font-[family-name:var(--font-lato)] font-medium hover:bg-[#fffbf5] transition-colors"
              >
                <span>{(lang === "en" && item.question_en) ? item.question_en : item.question}</span>
                <span className="ml-4 text-[var(--color-gold)] text-xl leading-none flex-shrink-0">
                  {open === i ? "−" : "+"}
                </span>
              </button>
              {open === i && (
                <div className="px-5 pb-4 text-[#9a7d5a] text-sm leading-relaxed font-[family-name:var(--font-lato)]">
                  {(lang === "en" && item.answer_en) ? item.answer_en : item.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
