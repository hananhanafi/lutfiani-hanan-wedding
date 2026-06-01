"use client";

import { useEffect } from "react";

export default function ForceLightMode({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const html = document.documentElement;
    const prev = html.getAttribute("data-theme");
    html.setAttribute("data-theme", "light");
    return () => {
      if (prev) html.setAttribute("data-theme", prev);
      else html.removeAttribute("data-theme");
    };
  }, []);

  return <>{children}</>;
}
