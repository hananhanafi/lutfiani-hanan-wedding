"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "./ThemeProvider";
import { useLanguage } from "./LanguageProvider";

const ALL_NAV_ITEMS = [
  { href: "/admin", label: "Dasbor", icon: "📊", roles: ["admin"] },
  { href: "/admin/guests", label: "Tamu", icon: "👥", roles: ["admin"] },
  { href: "/admin/groups", label: "Grup", icon: "🏷️", roles: ["admin", "sender"] },
  { href: "/admin/rsvp", label: "RSVP", icon: "📋", roles: ["admin"] },
  { href: "/admin/whatsapp", label: "WhatsApp", icon: "💬", roles: ["admin", "sender"] },
  { href: "/admin/whatsapp-contacts", label: "Kontak WA", icon: "📇", roles: ["admin", "sender"] },
  { href: "/admin/kirim", label: "Kirim", icon: "📤", roles: ["admin", "sender"] },
  { href: "/admin/test-invitation", label: "Coba Kirim", icon: "🧪", roles: ["admin"] },
  { href: "/admin/content", label: "Konten", icon: "✏️", roles: ["admin"] },
  { href: "/admin/wishes", label: "Harapan", icon: "💌", roles: ["admin"] },
  { href: "/admin/staff", label: "Staf", icon: "👤", roles: ["admin"] },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, toggle: toggleTheme } = useTheme();
  const { lang, toggle: toggleLang } = useLanguage();
  const { data: session } = useSession();
  const role = (session?.user as { role?: string })?.role ?? "admin";
  const navItems = ALL_NAV_ITEMS.filter((item) => item.roles.includes(role));
  const isSender = role === "sender";

  // Staff (sender) panel is Bahasa Indonesia only — force ID if a stale EN preference is set
  useEffect(() => {
    if (isSender && lang === "en") toggleLang();
  }, [isSender, lang, toggleLang]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top nav */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold text-gray-800">Panel Admin</span>
          <span className="text-xs bg-[var(--color-cream-dark)] text-[var(--color-gold)] px-2 py-0.5 rounded-full">Pernikahan</span>
          {role === "sender" && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Pengirim</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isSender && (
            <button
              onClick={toggleLang}
              title={lang === "id" ? "Ganti ke English" : "Ganti ke Bahasa Indonesia"}
              className="text-xs font-bold tracking-widest uppercase px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-[var(--color-gold)] hover:border-[var(--color-gold)] transition-colors"
            >
              {lang === "id" ? "EN" : "ID"}
            </button>
          )}
          <button
            onClick={toggleTheme}
            title={theme === "dark" ? "Mode Terang" : "Mode Gelap"}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-base hover:border-[var(--color-gold)] transition-colors"
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          {!isSender && (
            <Link href="/" target="_blank" className="text-sm text-gray-500 hover:text-gray-800">
              Lihat Situs ↗
            </Link>
          )}
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
          {navItems.map(({ href, label, icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`relative flex-1 flex flex-col items-center gap-0.5 py-2 text-xs transition-colors ${
                  active
                    ? "text-[var(--color-gold)] font-semibold bg-[var(--color-cream-dark)]"
                    : "text-gray-500"
                }`}
              >
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-10 rounded-full bg-[var(--color-gold)]" />
                )}
                <span className={`text-lg transition-transform ${active ? "scale-110" : ""}`}>{icon}</span>
                {label}
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 p-4 sm:p-6 pb-20 sm:pb-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
