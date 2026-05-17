"use client";

import { useLanguage } from "@/components/LanguageProvider";
import type { ScheduleItem } from "@/types";

interface Props {
  schedule: ScheduleItem[];
}

export default function EventSchedule({ schedule }: Props) {
  const { t, lang } = useLanguage();
  if (!schedule || schedule.length === 0) return null;

  return (
    <section id="schedule" className="py-16 px-4 bg-[var(--color-cream-dark)]">
      <div className="max-w-2xl mx-auto text-center">
        <p className="text-sm uppercase tracking-widest text-[var(--color-gold)] mb-3 font-[family-name:var(--font-lato)]">
          {t("schedule_eyebrow")}
        </p>
        <h2 className="text-3xl sm:text-4xl font-[family-name:var(--font-wedding)] text-[#3a3028] mb-10">
          Schedule
        </h2>

        <ol className="relative border-l border-[var(--color-gold)]/40 ml-4 text-left space-y-8">
          {schedule.map((item, i) => (
            <li key={i} className="ml-6">
              <span className="absolute -left-2.5 w-5 h-5 rounded-full bg-[var(--color-gold)] flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-white" />
              </span>
              <p className="text-xs uppercase tracking-widest text-[var(--color-gold)] mb-1 font-[family-name:var(--font-lato)]">
                {item.time}
              </p>
              <p className="text-lg font-[family-name:var(--font-wedding)] text-[#3a3028]">
                {(lang === "en" && item.title_en) ? item.title_en : item.title}
              </p>
              {(item.description || item.description_en) && (
                <p className="text-sm text-[#9a7d5a] mt-1 font-[family-name:var(--font-lato)]">
                  {(lang === "en" && item.description_en) ? item.description_en : item.description}
                </p>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
