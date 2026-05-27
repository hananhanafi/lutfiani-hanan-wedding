"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useTheme } from "./ThemeProvider";
import { useLanguage } from "./LanguageProvider";

const navItems = [
  { href: "/admin", label: "Dasbor", icon: "📊" },
  { href: "/admin/guests", label: "Tamu", icon: "👥" },
  { href: "/admin/checkin", label: "Check-in", icon: "✅" },
  { href: "/admin/content", label: "Konten", icon: "✏️" },
  { href: "/admin/wishes", label: "Harapan", icon: "💌" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, toggle: toggleTheme } = useTheme();
  const { lang, toggle: toggleLang } = useLanguage();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top nav */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold text-gray-800">Panel Admin</span>
          <span className="text-xs bg-[var(--color-cream-dark)] text-[var(--color-gold)] px-2 py-0.5 rounded-full">Wedding</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleLang}
            title={lang === "id" ? "Switch to English" : "Ganti ke Bahasa Indonesia"}
            className="text-xs font-bold tracking-widest uppercase px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-[var(--color-gold)] hover:border-[var(--color-gold)] transition-colors"
          >
            {lang === "id" ? "EN" : "ID"}
          </button>
          <button
            onClick={toggleTheme}
            title={theme === "dark" ? "Mode Terang" : "Mode Gelap"}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-base hover:border-[var(--color-gold)] transition-colors"
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          <Link href="/" target="_blank" className="text-sm text-gray-500 hover:text-gray-800">
            Lihat Situs ↗
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="text-sm text-red-500 hover:text-red-700"
          >
            Keluar
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-48 bg-white border-r border-gray-200 pt-4 hidden sm:block">
          <nav className="space-y-1 px-2">
            {navItems.map(({ href, label, icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  pathname === href
                    ? "bg-[var(--color-cream-dark)] text-[var(--color-gold)] font-medium"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <span>{icon}</span>
                {label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Mobile bottom nav */}
        <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-50">
          {navItems.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center py-2 text-xs transition-colors ${
                pathname === href ? "text-[var(--color-gold)]" : "text-gray-500"
              }`}
            >
              <span className="text-lg">{icon}</span>
              {label}
            </Link>
          ))}
        </nav>

        <main className="flex-1 p-4 sm:p-6 pb-20 sm:pb-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
