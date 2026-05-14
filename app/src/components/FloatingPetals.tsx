"use client";

import { useState, useEffect } from "react";

// Two petal SVG shapes for variety
const PETAL_PATHS = [
  // Rounded teardrop petal
  "M10 0 C18 4, 22 14, 10 22 C-2 14, 2 4, 10 0 Z",
  // Elongated petal
  "M8 0 C16 6, 16 16, 8 24 C0 16, 0 6, 8 0 Z",
];

const COLORS = [
  "rgba(255, 182, 193, 0.75)", // light pink
  "rgba(255, 218, 185, 0.70)", // peach
  "rgba(255, 192, 203, 0.65)", // pink
  "rgba(201, 169, 110, 0.45)", // gold
  "rgba(255, 240, 245, 0.80)", // lavender blush
];

interface Petal {
  id: number;
  left: string;
  size: number;
  color: string;
  path: string;
  fallDur: string;
  fallDelay: string;
  swayDur: string;
  drift: string;
  spin: string;
  sway: string;
}

function seededRandom(seed: number) {
  // Simple deterministic pseudo-random so server/client match
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

function generatePetals(count: number): Petal[] {
  return Array.from({ length: count }, (_, i) => {
    const r = (offset: number) => seededRandom(i * 17 + offset);
    const size = 10 + r(1) * 14; // 10–24px
    return {
      id: i,
      left: `${r(2) * 100}%`,
      size,
      color: COLORS[Math.floor(r(3) * COLORS.length)],
      path: PETAL_PATHS[Math.floor(r(4) * PETAL_PATHS.length)],
      fallDur: `${7 + r(5) * 8}s`,      // 7–15s
      fallDelay: `${r(6) * 12}s`,        // 0–12s stagger
      swayDur: `${3 + r(7) * 4}s`,       // 3–7s sway cycle
      drift: `${(r(8) - 0.5) * 120}px`,  // ±60px horizontal drift
      spin: `${180 + r(9) * 360}deg`,     // 180–540deg rotation
      sway: `${(r(10) - 0.5) * 60}px`,   // ±30px sway amplitude
    };
  });
}

interface Props {
  count?: number;
  className?: string;
}

export default function FloatingPetals({ count = 18, className = "" }: Props) {
  const [petals, setPetals] = useState<Petal[]>([]);

  useEffect(() => {
    setPetals(generatePetals(count));
  }, [count]);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`} aria-hidden="true">
      {petals.map((p) => (
        <div
          key={p.id}
          className="petal"
          style={{
            left: p.left,
            "--fall-dur": p.fallDur,
            "--fall-delay": p.fallDelay,
            "--sway-dur": p.swayDur,
            "--drift": p.drift,
            "--spin": p.spin,
            "--sway": p.sway,
          } as React.CSSProperties}
        >
          <svg
            width={p.size}
            height={p.size * 1.4}
            viewBox="0 0 20 28"
            fill={p.color}
            style={{ filter: "blur(0.3px)" }}
          >
            <path d={p.path} />
          </svg>
        </div>
      ))}
    </div>
  );
}
