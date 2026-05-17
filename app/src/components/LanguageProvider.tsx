"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { translate, type Lang, type TKey } from "@/lib/i18n";

interface LangCtxValue {
  lang: Lang;
  toggle: () => void;
  t: (key: TKey) => string;
}

const LangCtx = createContext<LangCtxValue>({
  lang: "id",
  toggle: () => {},
  t: (key) => translate("id", key),
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("id");

  useEffect(() => {
    const saved = localStorage.getItem("lang") as Lang | null;
    if (saved === "id" || saved === "en") setLang(saved);
  }, []);

  const toggle = () => {
    setLang((prev) => {
      const next: Lang = prev === "id" ? "en" : "id";
      try { localStorage.setItem("lang", next); } catch {}
      return next;
    });
  };

  const t = (key: TKey) => translate(lang, key);

  return <LangCtx.Provider value={{ lang, toggle, t }}>{children}</LangCtx.Provider>;
}

export function useLanguage() {
  return useContext(LangCtx);
}
