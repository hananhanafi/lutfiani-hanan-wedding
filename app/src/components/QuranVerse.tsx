"use client";

import { useLanguage } from "@/components/LanguageProvider";

export default function QuranVerse() {
  const { lang } = useLanguage();

  const translation =
    lang === "en"
      ? "And of His signs is that He created for you from yourselves mates that you may find tranquility in them; and He placed between you affection and mercy. Indeed in that are signs for a people who give thought."
      : "Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang. Sungguh, pada yang demikian itu benar-benar terdapat tanda-tanda (kebesaran Allah) bagi kaum yang berpikir.";

  const source = lang === "en" ? "Q.S. Ar-Rum: 21" : "Q.S. Ar-Rūm: 21";

  return (
    <section className="py-16 px-6 flex justify-center bg-[var(--color-cream-dark)]" aria-label="Qur'an verse">
      <div className="max-w-2xl w-full text-center space-y-6">
        {/* Decorative divider */}
        <div className="flex items-center justify-center gap-3 text-[var(--color-gold)] opacity-60">
          <span className="block h-px w-16 bg-current" />
          <span className="text-lg">✦</span>
          <span className="block h-px w-16 bg-current" />
        </div>

        {/* Arabic text */}
        <p
          dir="rtl"
          lang="ar"
          className="font-serif text-2xl sm:text-3xl leading-loose text-[var(--color-gold)] tracking-wide"
          style={{ fontFamily: "serif" }}
        >
          وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُمْ مِنْ أَنْفُسِكُمْ أَزْوَاجًا لِتَسْكُنُوا إِلَيْهَا وَجَعَلَ بَيْنَكُمْ مَوَدَّةً وَرَحْمَةً ۚ إِنَّ فِي ذَٰلِكَ لَآيَاتٍ لِقَوْمٍ يَتَفَكَّرُونَ
        </p>

        {/* Translation */}
        <p className="text-sm sm:text-base text-[#9a7d5a] leading-relaxed italic max-w-xl mx-auto">
          &ldquo;{translation}&rdquo;
        </p>

        {/* Citation */}
        <p className="text-xs text-[var(--color-gold)] tracking-widest uppercase opacity-80">
          {source}
        </p>

        {/* Decorative divider */}
        <div className="flex items-center justify-center gap-3 text-[var(--color-gold)] opacity-60">
          <span className="block h-px w-16 bg-current" />
          <span className="text-lg">✦</span>
          <span className="block h-px w-16 bg-current" />
        </div>
      </div>
    </section>
  );
}
