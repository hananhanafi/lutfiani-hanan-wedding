"use client";

/**
 * Gunungan / Kayon — the "tree of life / mountain" motif from wayang that opens
 * and closes a performance (a fitting symbol for the start of a new chapter).
 * Drawn as original symmetric line-art; use as a small ornament above headings
 * or as a divider centerpiece.
 */
export default function Gunungan({
  size = 44,
  color = "var(--color-gold)",
  opacity = 0.9,
  className = "",
}: {
  size?: number;
  color?: string;
  opacity?: number;
  className?: string;
}) {
  // Right half of the silhouette (apex at x=60 down to the base centre);
  // mirrored to guarantee perfect symmetry.
  const halfOutline =
    "M60 6 C 78 26, 96 44, 96 66 C 96 88, 84 100, 88 116 C 90 128, 100 134, 98 140 L 72 140 L 72 152 L 60 152 Z";

  return (
    <span
      aria-hidden="true"
      className={`inline-block align-middle select-none ${className}`}
      style={{ width: size, height: size * (160 / 120), opacity }}
    >
      <svg viewBox="0 0 120 160" width="100%" height="100%" fill="none">
        {/* silhouette outline (both halves) */}
        <g stroke={color} strokeWidth="2" strokeLinejoin="round">
          <path d={halfOutline} />
          <g transform="translate(120,0) scale(-1,1)">
            <path d={halfOutline} />
          </g>
        </g>

        {/* inner "tree of life" — central stem + symmetric sprigs */}
        <g stroke={color} strokeWidth="1.3" strokeLinecap="round" fill="none" opacity="0.85">
          <path d="M60 150 L60 52" />
          <path d="M60 78 C 70 74, 76 66, 78 56" />
          <path d="M60 78 C 50 74, 44 66, 42 56" />
          <path d="M60 104 C 72 100, 80 92, 82 82" />
          <path d="M60 104 C 48 100, 40 92, 38 82" />
          <circle cx="60" cy="40" r="5" />
        </g>

        {/* small base */}
        <g stroke={color} strokeWidth="2" strokeLinecap="round">
          <path d="M46 152 L74 152" />
        </g>
      </svg>
    </span>
  );
}
