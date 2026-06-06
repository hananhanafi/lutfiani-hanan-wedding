"use client";

import { useLanguage } from "@/components/LanguageProvider";
import type { SiteConfig } from "@/types";

interface Props {
  config: SiteConfig;
}

function formatDate(dateStr: string, lang: "id" | "en") {
  return new Date(dateStr).toLocaleDateString(lang === "en" ? "en-US" : "id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function CalendarLinks({ config }: { config: SiteConfig }) {
  if (!config.wedding_date || !config.venue_name) return null;

  const start = config.wedding_date.replace(/-/g, "");
  const title = encodeURIComponent(
    `${config.partner_one_name} & ${config.partner_two_name}'s Wedding`
  );
  const location = encodeURIComponent(
    `${config.venue_name}, ${config.venue_address ?? ""}`
  );

  const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${start}&location=${location}`;
  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `DTSTART:${start}`,
    `SUMMARY:${decodeURIComponent(title)}`,
    `LOCATION:${decodeURIComponent(location)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\n");
  const icsUrl = `data:text/calendar;charset=utf-8,${encodeURIComponent(icsContent)}`;

  return (
    <div className="flex flex-wrap gap-3 justify-center mt-6">
      <a
        href={googleUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="px-5 py-2 border border-[var(--color-gold)] text-[var(--color-gold)] rounded-full text-sm hover:bg-[var(--color-gold)] hover:text-white transition-colors font-[family-name:var(--font-lato)]"
      >
        + Google Calendar
      </a>
      <a
        href={icsUrl}
        download="wedding.ics"
        className="px-5 py-2 border border-[var(--color-gold)] text-[var(--color-gold)] rounded-full text-sm hover:bg-[var(--color-gold)] hover:text-white transition-colors font-[family-name:var(--font-lato)]"
      >
        + Apple / Outlook Calendar
      </a>
    </div>
  );
}

export default function EventDetails({ config }: Props) {
  const { t, lang } = useLanguage();
  return (
    <section id="details" className="py-16 px-4 bg-[var(--color-cream-dark)]">
      <div className="max-w-2xl mx-auto text-center">
      <p className="text-sm uppercase tracking-widest text-[var(--color-gold)] mb-3 font-[family-name:var(--font-lato)]">
        {t("details_eyebrow")}
      </p>
      {/* <h2 className="text-3xl sm:text-4xl font-[family-name:var(--font-wedding)] text-[#3a3028] mb-10">
        Event Details
      </h2> */}

      <div className="grid sm:grid-cols-2 gap-8 text-left">
        {/* Date & Time */}
        <div className="glass rounded-2xl p-6">
          <p className="text-xs uppercase tracking-widest text-[var(--color-gold)] mb-2 font-[family-name:var(--font-lato)]">{t("details_datetime")}</p>
          <p className="text-lg font-[family-name:var(--font-wedding)] text-[#3a3028]">
            {config.wedding_date ? formatDate(config.wedding_date, lang) : t("details_tba")}
          </p>
          {config.wedding_time && (
            <p className="text-[#9a7d5a] mt-1 font-[family-name:var(--font-lato)]">{config.wedding_time}</p>
          )}
        </div>

        {/* Venue */}
        <div className="glass rounded-2xl p-6">
          <p className="text-xs uppercase tracking-widest text-[var(--color-gold)] mb-2 font-[family-name:var(--font-lato)]">{t("details_venue")}</p>
          <p className="text-lg font-[family-name:var(--font-wedding)] text-[#3a3028]">
            {config.venue_name ?? t("details_tba")}
          </p>
          {config.venue_address && (
            <p className="text-[#9a7d5a] mt-1 text-sm font-[family-name:var(--font-lato)]">{config.venue_address}</p>
          )}
        </div>

        {/* RSVP Deadline */}
        {/* {config.rsvp_deadline && (
          <div className="glass rounded-2xl p-6">
            <p className="text-xs uppercase tracking-widest text-[var(--color-gold)] mb-2 font-[family-name:var(--font-lato)]">{t("details_deadline")}</p>
            <p className="text-lg font-[family-name:var(--font-wedding)] text-[#3a3028]">
              {formatDate(config.rsvp_deadline, lang)}
            </p>
          </div>
        )} */}
      </div>

      <CalendarLinks config={config} />
      </div>
    </section>
  );
}
