"use client";

import { useEffect, useState } from "react";
import ParallaxLayer from "@/components/ParallaxLayer";
import { useLanguage } from "@/components/LanguageProvider";
import Typewriter from "@/components/Typewriter";
import FloralCorner from "@/components/FloralCorner";

interface Props {
  storyText: string;
  storyTextEn?: string;
  partnerOneName: string;
  partnerTwoName: string;
}

export default function OurStory({ storyText, storyTextEn, partnerOneName, partnerTwoName }: Props) {
  const { t, lang } = useLanguage();
  // Type each paragraph one after another; the first starts when scrolled in view.
  const [active, setActive] = useState(0);

  // Re-type from the top when the language (and thus the text) switches.
  useEffect(() => {
    setActive(0);
  }, [lang]);

  if (!storyText) return null;

  const activeText = (lang === "en" && storyTextEn) ? storyTextEn : storyText;
  const paragraphs = activeText.split("\n").filter((p) => p.trim());

  return (
    <section id="story" className="relative overflow-hidden py-20 px-4">
      <ParallaxLayer speed={0.25} className="" />
      <div className="relative z-10 max-w-2xl mx-auto text-center glass-bg rounded-xl p-10 overflow-hidden">
        <FloralCorner position="top-left" size={125} opacity={0.8} />
        <FloralCorner position="bottom-right" size={125} opacity={0.8} />
        <p className="relative z-10 text-xs uppercase tracking-[0.3em] text-[var(--color-gold)] mb-3 font-[family-name:var(--font-lato)]">
          {t("story_eyebrow")}
        </p>
        <h2 className="text-3xl sm:text-4xl font-[family-name:var(--font-wedding)] text-[#3a3028] mb-4">
          {partnerOneName} &amp; {partnerTwoName}
        </h2>
        <div className="w-12 h-px bg-[var(--color-gold)] mx-auto mb-8" />

        <div className="mt-2 space-y-5 text-[#3a3028] leading-relaxed font-[family-name:var(--font-lato)] text-base sm:text-lg text-left">
          {paragraphs.map((para, i) => (
            <p key={`${lang}-${i}`}>
              {i < active ? (
                para
              ) : i === active ? (
                <Typewriter
                  text={para}
                  startOnView
                  speed={18}
                  keepCaret={i === paragraphs.length - 1 ? false : true}
                  onDone={() => setActive((a) => a + 1)}
                />
              ) : (
                // Reserve nothing yet; paragraph types in when its turn comes.
                <span className="invisible">{para}</span>
              )}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
