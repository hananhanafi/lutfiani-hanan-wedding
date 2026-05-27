"use client";

import { usePathname } from "next/navigation";
import { useLanguage } from "./LanguageProvider";

export default function LanguageToggle() {
  const { lang, toggle } = useLanguage();
  const pathname = usePathname();

  if (pathname.startsWith("/admin") || pathname.startsWith("/scanner")) return null;

  return (
    <button
      onClick={toggle}
      aria-label={lang === "id" ? "Switch to English" : "Ganti ke Bahasa Indonesia"}
      title={lang === "id" ? "Switch to English" : "Ganti ke Bahasa Indonesia"}
      style={{
        position: "fixed",
        bottom: "1.25rem",
        left: "4.25rem",   /* sits right of the ThemeToggle (44px + 1.25rem gap) */
        zIndex: 210,
        height: 44,
        borderRadius: 999,
        padding: "0 14px",
        background: "rgba(201,169,110,0.25)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(201,169,110,0.5)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "0.65rem",
        fontWeight: 700,
        letterSpacing: "0.12em",
        color: "rgba(201,169,110,0.9)",
        fontFamily: "var(--font-lato)",
        transition: "background 0.2s",
        boxShadow: "0 2px 16px rgba(0,0,0,0.25)",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = "rgba(201,169,110,0.4)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.background = "rgba(201,169,110,0.25)")
      }
    >
      {lang === "id" ? "EN" : "ID"}
    </button>
  );
}
