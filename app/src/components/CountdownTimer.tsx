"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";

interface Props {
  weddingDate: string; // ISO date string e.g. "2026-08-07"
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function CountdownTimer({ weddingDate }: Props) {
  const { t } = useLanguage();
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    const target = new Date(weddingDate).getTime();

    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [weddingDate]);

  if (!timeLeft) return null;

  const units = [
    { label: t("countdown_days"),    value: timeLeft.days },
    { label: t("countdown_hours"),   value: timeLeft.hours },
    { label: t("countdown_minutes"), value: timeLeft.minutes },
    { label: t("countdown_seconds"), value: timeLeft.seconds },
  ];

  return (
    <section className="py-12 bg-[var(--color-cream-dark)]">
      <p className="text-center text-sm uppercase tracking-widest text-[var(--color-gold)] mb-6 font-[family-name:var(--font-lato)]">
        {t("countdown_title")}
      </p>
      <div className="flex justify-center gap-4 sm:gap-8">
        {units.map(({ label, value }) => (
          <div key={label} className="glass flex flex-col items-center rounded-2xl px-4 py-4 sm:px-6 min-w-[72px]">
            <span className="text-4xl sm:text-5xl font-[family-name:var(--font-wedding)] text-[#3a3028] w-16 text-center">
              {String(value).padStart(2, "0")}
            </span>
            <span className="text-xs uppercase tracking-widest text-[#9a7d5a] mt-1 font-[family-name:var(--font-lato)]">
              {label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
