"use client";

import { usePathname } from "next/navigation";
import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const pathname = usePathname();

  if (pathname.startsWith("/admin") || pathname.startsWith("/scanner")) return null;

  return (
    <button
      onClick={toggle}
      aria-label={theme === "dark" ? "Mode Terang" : "Mode Gelap"}
      title={theme === "dark" ? "Mode Terang" : "Mode Gelap"}
      style={{
        position: "fixed",
        bottom: "1.25rem",
        left: "1.25rem",
        zIndex: 210,
        width: 44,
        height: 44,
        borderRadius: "50%",
        background: "rgba(201,169,110,0.25)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(201,169,110,0.5)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "1.15rem",
        transition: "background 0.2s, transform 0.15s",
        boxShadow: "0 2px 16px rgba(0,0,0,0.25)",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = "rgba(201,169,110,0.28)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.background = "rgba(201,169,110,0.15)")
      }
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
