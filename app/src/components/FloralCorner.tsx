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

/** Bouquet flower mixes, so different sections show different blooms. */
type Variant = "burgundy" | "blush" | "mixed" | "ivory";

interface Props {
  position?: Corner;
  /** rendered width/height in px (square artwork box) */
  size?: number;
  className?: string;
  /** 0–1 overall opacity */
  opacity?: number;
  /** gentle breeze motion (default true; honors prefers-reduced-motion) */
  animate?: boolean;
  /** which flower mix to use */
  variant?: Variant;
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

/**
 * Shared bouquet geometry (drawn for the TOP-LEFT corner, back → front).
 * Slots: 3 greenery, then focal / medium / small / accent blooms.
 */
type Slot = {
  w: number;   // width as % of the box
  ar: number;  // aspect ratio (box only; object-contain keeps the flower)
  top: number; // % offset
  left: number;
  rot: number; // base rotation, deg
  delay: number; // bob stagger, s
};

const SLOTS: Slot[] = [
  { w: 62, ar: 0.79, top: -10, left: -8, rot: 12, delay: 0 },   // greenery (big)
  { w: 46, ar: 0.8, top: -4, left: 32, rot: 52, delay: 0.9 },   // greenery (sprig)
  { w: 40, ar: 0.9, top: 30, left: -6, rot: -18, delay: 0.5 },  // greenery (mid)
  { w: 50, ar: 1.09, top: -6, left: -2, rot: -6, delay: 0.3 },  // focal bloom
  { w: 42, ar: 1.27, top: 24, left: 24, rot: 8, delay: 1.1 },   // medium bloom
  { w: 30, ar: 1.0, top: 38, left: 2, rot: -12, delay: 0.6 },   // small bloom
  { w: 24, ar: 0.9, top: 6, left: 46, rot: 28, delay: 1.4 },    // accent
];

const f = (n: string) => `${DIR}/${n}.png`;

/** Which flower asset fills each slot, per variant. */
const VARIANTS: Record<Variant, string[]> = {
  burgundy: [
    f("12_green_leaves_1"), f("15_green_leaf_sprig"), f("13_green_leaves_2"),
    f("02_burgundy_rose"), f("04_pink_peony"), f("06_pink_rose"), f("09_burgundy_rosebud"),
  ],
  blush: [
    f("13_green_leaves_2"), f("15_green_leaf_sprig"), f("14_green_leaves_3"),
    f("04_pink_peony"), f("05_pink_dahlia"), f("06_pink_rose"), f("11_rosebud_sprig"),
  ],
  mixed: [
    f("12_green_leaves_1"), f("15_green_leaf_sprig"), f("14_green_leaves_3"),
    f("08_white_magnolia"), f("02_burgundy_rose"), f("06_pink_rose"), f("10_white_lace_flower"),
  ],
  ivory: [
    f("13_green_leaves_2"), f("15_green_leaf_sprig"), f("14_green_leaves_3"),
    f("07_white_rose"), f("01_white_dog_rose"), f("10_white_lace_flower"), f("11_rosebud_sprig"),
  ],
};

export default function FloralCorner({
  position = "top-left",
  size = 150,
  className = "",
  opacity = 1,
  animate = true,
  variant = "burgundy",
}: Props) {
  const srcs = VARIANTS[variant];
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute z-20 select-none ${POS_CLASS[position]} ${
        animate ? "vfloral-anim" : ""
      } ${className}`}
      style={{ width: size, height: size, opacity, transformOrigin: TRANSFORM_ORIGIN[position] }}
    >
      <div className="relative w-full h-full" style={{ transform: MIRROR[position] }}>
        {SLOTS.map((l, i) => (
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
                src={srcs[i]}
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
 * Dense, symmetric full-width floral band for the bottom of a section — the
 * "full flowers" frame. One half is composed and mirrored to the other, so it
 * is perfectly symmetric. Place in a `relative overflow-hidden` container,
 * behind the content (content should sit at a higher z-index).
 */
export function FloralGarland({
  variant = "blush",
  height = 150,
  opacity = 1,
  animate = true,
  className = "",
}: {
  variant?: Variant;
  height?: number;
  opacity?: number;
  animate?: boolean;
  className?: string;
}) {
  const s = VARIANTS[variant];
  type GItem = { src: string; w: number; ar: number; left: number; bottom: number; rot: number; delay: number; bob?: boolean };
  // Left half (0–~50%); mirrored to the right for symmetry.
  const items: GItem[] = [
    // greenery (behind)
    { src: s[0], w: 30, ar: 0.79, left: -3, bottom: -8, rot: 16, delay: 0 },
    { src: s[2], w: 24, ar: 0.9, left: 15, bottom: -3, rot: -14, delay: 0.4 },
    { src: s[1], w: 20, ar: 0.8, left: 33, bottom: 1, rot: 26, delay: 0.8 },
    // flowers (front)
    { src: s[3], w: 33, ar: 1.09, left: 0, bottom: -10, rot: -8, delay: 0.3, bob: true },
    { src: s[4], w: 26, ar: 1.27, left: 20, bottom: -2, rot: 8, delay: 0.9, bob: true },
    { src: s[5], w: 20, ar: 1.0, left: 38, bottom: -6, rot: -6, delay: 0.6, bob: true },
    { src: s[6], w: 16, ar: 0.9, left: 30, bottom: 10, rot: 18, delay: 1.2, bob: true },
  ];
  const Half = () => (
    <>
      {items.map((it, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: `${it.w}%`,
            aspectRatio: String(it.ar),
            left: `${it.left}%`,
            bottom: `${it.bottom}%`,
            transform: `rotate(${it.rot}deg)`,
          }}
        >
          <div
            className={animate && it.bob ? "vfloral-item" : undefined}
            style={{ position: "relative", width: "100%", height: "100%", animationDelay: `${it.delay}s` }}
          >
            <Image src={it.src} alt="" fill sizes="180px" draggable={false} style={{ objectFit: "contain" }} />
          </div>
        </div>
      ))}
    </>
  );
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-0 bottom-0 select-none ${className}`}
      style={{ height, opacity }}
    >
      <div className="absolute inset-0">
        <Half />
      </div>
      <div className="absolute inset-0" style={{ transform: "scaleX(-1)" }}>
        <Half />
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
