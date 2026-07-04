"use client";

import Image from "next/image";

/**
 * Decorative corner ornament built from the vintage watercolor flower assets
 * in /public/vintage-flowers. The bouquet is composed for the top-left corner
 * and mirrored per `position` so one arrangement frames any corner. Images are
 * served through next/image so the large source PNGs are optimized/resized.
 *
 * Place inside a `relative` container (ideally `overflow-hidden`).
 *   <FloralCorner position="top-left" />
 */

type Corner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

interface Props {
  position?: Corner;
  /** rendered width/height in px (square artwork box) */
  size?: number;
  className?: string;
  /** 0–1 overall opacity */
  opacity?: number;
  /** gentle breeze motion (default true; honors prefers-reduced-motion) */
  animate?: boolean;
}

const MIRROR: Record<Corner, string> = {
  "top-left": "scaleX(1)",
  "top-right": "scaleX(-1)",
  "bottom-left": "scaleY(-1)",
  "bottom-right": "scale(-1, -1)",
};

const POS_CLASS: Record<Corner, string> = {
  "top-left": "top-0 left-0",
  "top-right": "top-0 right-0",
  "bottom-left": "bottom-0 left-0",
  "bottom-right": "bottom-0 right-0",
};

const TRANSFORM_ORIGIN: Record<Corner, string> = {
  "top-left": "top left",
  "top-right": "top right",
  "bottom-left": "bottom left",
  "bottom-right": "bottom right",
};

const DIR = "/vintage-flowers";

/** Bouquet layers, drawn for the TOP-LEFT corner (back → front). */
type Layer = {
  src: string;
  /** width as % of the box */
  w: number;
  /** aspect ratio (w/h) — only sets the box; object-contain keeps the flower */
  ar: number;
  top: number;   // % offset
  left: number;  // % offset
  rot: number;   // base rotation, deg
  delay: number; // bob stagger, s
};

const LAYERS: Layer[] = [
  // greenery backdrop
  { src: `${DIR}/12_green_leaves_1.png`, w: 62, ar: 0.79, top: -10, left: -8, rot: 12, delay: 0 },
  { src: `${DIR}/15_green_leaf_sprig.png`, w: 46, ar: 0.8, top: -4, left: 32, rot: 52, delay: 0.9 },
  { src: `${DIR}/13_green_leaves_2.png`, w: 40, ar: 0.9, top: 30, left: -6, rot: -18, delay: 0.5 },
  // focal blooms, largest hugging the corner
  { src: `${DIR}/02_burgundy_rose.png`, w: 50, ar: 1.09, top: -6, left: -2, rot: -6, delay: 0.3 },
  { src: `${DIR}/04_pink_peony.png`, w: 42, ar: 1.27, top: 24, left: 24, rot: 8, delay: 1.1 },
  { src: `${DIR}/06_pink_rose.png`, w: 30, ar: 1.0, top: 38, left: 2, rot: -12, delay: 0.6 },
  // small accent
  { src: `${DIR}/09_burgundy_rosebud.png`, w: 24, ar: 0.9, top: 6, left: 46, rot: 28, delay: 1.4 },
];

export default function FloralCorner({
  position = "top-left",
  size = 150,
  className = "",
  opacity = 1,
  animate = true,
}: Props) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute z-20 select-none ${POS_CLASS[position]} ${
        animate ? "vfloral-anim" : ""
      } ${className}`}
      style={{ width: size, height: size, opacity, transformOrigin: TRANSFORM_ORIGIN[position] }}
    >
      <div className="relative w-full h-full" style={{ transform: MIRROR[position] }}>
        {LAYERS.map((l, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: `${l.w}%`,
              aspectRatio: String(l.ar),
              top: `${l.top}%`,
              left: `${l.left}%`,
              transform: `rotate(${l.rot}deg)`,
            }}
          >
            <div
              className={animate ? "vfloral-item" : undefined}
              style={{ position: "relative", width: "100%", height: "100%", animationDelay: `${l.delay}s` }}
            >
              <Image
                src={l.src}
                alt=""
                fill
                sizes="200px"
                draggable={false}
                style={{ objectFit: "contain" }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Small centered flower for section dividers (pair with rules on either side).
 * Uses a single watercolor bloom so it matches the corner bouquets.
 */
export function FloralSprig({
  size = 54,
  className = "",
  opacity = 1,
}: {
  size?: number;
  className?: string;
  opacity?: number;
}) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block align-middle select-none ${className}`}
      style={{ width: size, height: size, opacity, position: "relative" }}
    >
      <Image
        src={`${DIR}/03_white_blossom_sprig.png`}
        alt=""
        fill
        sizes="72px"
        draggable={false}
        style={{ objectFit: "contain" }}
      />
    </span>
  );
}
