"use client";

import { useEffect, useRef } from "react";

interface Props {
  /** 0.1 = subtle, 0.3 = strong. Default 0.2 */
  speed?: number;
  style?: React.CSSProperties;
  className?: string;
}

/**
 * Absolutely-positioned parallax background layer.
 * Place as the first child of a `relative overflow-hidden` section.
 * Content inside that section should have `relative z-10`.
 */
export default function ParallaxLayer({ speed = 0.2, style, className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ticking = false;

    const update = () => {
      const el = ref.current;
      if (!el) return;
      const parent = el.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const centerOffset = rect.top + rect.height / 2 - window.innerHeight / 2;
      el.style.transform = `translateY(${centerOffset * speed}px)`;
      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    // Set initial position without waiting for first scroll
    requestAnimationFrame(update);
    return () => window.removeEventListener("scroll", onScroll);
  }, [speed]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={className}
      style={{
        position: "absolute",
        // Oversized vertically so edges never show during movement
        inset: "-30% 0",
        zIndex: 0,
        pointerEvents: "none",
        willChange: "transform",
        ...style,
      }}
    />
  );
}
