"use client";

import Image from "next/image";

/**
 * Gunungan / Kayon — the "tree of life / mountain" motif from wayang that opens
 * and closes a performance (a fitting symbol for the start of a new chapter).
 * Uses the vector artwork in /public/gunungan.
 */
const RATIO = 638 / 393; // source height / width

export default function Gunungan({
  size = 44,
  opacity = 0.9,
  className = "",
  /** optional CSS filter to tint the (black) line-art, e.g. a gold/sogan hue */
  tint,
}: {
  size?: number;
  opacity?: number;
  className?: string;
  tint?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block align-middle select-none ${className}`}
      style={{ width: size, height: size * RATIO, opacity, position: "relative", filter: tint }}
    >
      <Image
        src="/gunungan/wayang-gunungan.png"
        alt=""
        fill
        sizes="120px"
        draggable={false}
        style={{ objectFit: "contain" }}
      />
    </span>
  );
}
