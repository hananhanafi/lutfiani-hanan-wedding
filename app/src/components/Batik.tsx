"use client";

/**
 * Javanese batik ornaments, drawn as original SVG (no copyrighted artwork).
 * Kept low-opacity so they read as a subtle cultural watermark beneath the
 * existing florals/content.
 *
 *  - <BatikPattern>  full-area tiled watermark (place in a `relative` box)
 *  - <BatikBand>     slim horizontal decorative border/separator
 *
 * Motifs:
 *  - "kawung"  — interlocking ovals; one of the oldest Javanese batiks
 *  - "truntum" — scattered small florets/stars; a traditional *wedding* batik
 *                (symbolizing love that keeps growing)
 *  - "parang"  — diagonal repeating blades; classic keraton motif
 */

type Motif = "kawung" | "truntum" | "parang";

function safeId(motif: Motif, color: string, suffix: string) {
  return `batik-${motif}-${color.replace(/[^a-z0-9]/gi, "")}-${suffix}`;
}

/** The repeating <pattern> tile for a motif. */
function MotifTile({ id, motif, color }: { id: string; motif: Motif; color: string }) {
  if (motif === "kawung") {
    return (
      <pattern id={id} width="64" height="64" patternUnits="userSpaceOnUse">
        <g fill="none" stroke={color} strokeWidth="1.2">
          <ellipse cx="32" cy="14" rx="9" ry="15" />
          <ellipse cx="32" cy="50" rx="9" ry="15" />
          <ellipse cx="14" cy="32" rx="15" ry="9" />
          <ellipse cx="50" cy="32" rx="15" ry="9" />
        </g>
        <circle cx="32" cy="32" r="1.6" fill={color} />
        <circle cx="0" cy="0" r="1.6" fill={color} />
        <circle cx="64" cy="0" r="1.6" fill={color} />
        <circle cx="0" cy="64" r="1.6" fill={color} />
        <circle cx="64" cy="64" r="1.6" fill={color} />
      </pattern>
    );
  }
  if (motif === "truntum") {
    // small 8-point floret + surrounding dots on a grid
    const petals = [0, 45, 90, 135, 180, 225, 270, 315];
    return (
      <pattern id={id} width="46" height="46" patternUnits="userSpaceOnUse">
        <g fill={color}>
          {petals.map((a) => (
            <ellipse
              key={a}
              cx="23"
              cy="23"
              rx="1.6"
              ry="7"
              transform={`rotate(${a} 23 23)`}
            />
          ))}
          <circle cx="23" cy="23" r="2.2" />
          {/* corner + edge accent dots for a continuous field */}
          <circle cx="0" cy="0" r="1.4" />
          <circle cx="46" cy="0" r="1.4" />
          <circle cx="0" cy="46" r="1.4" />
          <circle cx="46" cy="46" r="1.4" />
          <circle cx="0" cy="23" r="1" />
          <circle cx="46" cy="23" r="1" />
          <circle cx="23" cy="0" r="1" />
          <circle cx="23" cy="46" r="1" />
        </g>
      </pattern>
    );
  }
  // parang — diagonal blades with a parallel guide line
  return (
    <pattern id={id} width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <g fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round">
        <path d="M8 -4 C 20 8, 20 20, 8 32 C 2 38, 2 44, 8 50" />
      </g>
      <g fill="none" stroke={color} strokeWidth="0.8" opacity="0.7">
        <path d="M26 -4 C 38 8, 38 20, 26 32 C 20 38, 20 44, 26 50" />
      </g>
    </pattern>
  );
}

export function BatikPattern({
  motif = "kawung",
  color = "#c9a96e",
  opacity = 0.07,
  className = "",
}: {
  motif?: Motif;
  color?: string;
  opacity?: number;
  className?: string;
}) {
  const id = safeId(motif, color, "area");
  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ opacity }}
    >
      <svg width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
        <defs>
          <MotifTile id={id} motif={motif} color={color} />
        </defs>
        <rect width="100%" height="100%" fill={`url(#${id})`} />
      </svg>
    </div>
  );
}

/**
 * Scalloped edge — cream "domes" that rise into the image above, with a thin
 * gold batik trim tracing the scallops. Place at the bottom of a photo section
 * (fill should match the section that follows).
 */
export function ScallopEdge({
  fill = "var(--color-cream-dark)",
  trim = "#c9a96e",
  height = 34,
  scallop = 40,
  className = "",
}: {
  fill?: string;
  trim?: string;
  height?: number;
  /** width of one dome in px (fixed, so it never distorts) */
  scallop?: number;
  className?: string;
}) {
  const r = scallop / 2;
  const base = r + 4;            // dome chord baseline; peak rises to y≈4
  const id = `scallop-${scallop}-${height}`;
  // Smooth upward dome (quadratic), tiled at a fixed pixel size via <pattern>.
  const dome = `M0 ${base} Q ${r} ${base - 2 * r} ${scallop} ${base}`;
  return (
    <div
      aria-hidden="true"
      className={`w-full overflow-hidden leading-none pointer-events-none ${className}`}
      style={{ height }}
    >
      <svg width="100%" height={height} className="block">
        <defs>
          <pattern id={id} width={scallop} height={height} patternUnits="userSpaceOnUse">
            <path d={`${dome} L${scallop} ${height} L0 ${height} Z`} fill={fill} />
            <path d={dome} fill="none" stroke={trim} strokeWidth="1.4" opacity="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height={height} fill={`url(#${id})`} />
      </svg>
    </div>
  );
}

export function BatikBand({
  motif = "truntum",
  color = "#c9a96e",
  opacity = 0.55,
  height = 26,
  className = "",
}: {
  motif?: Motif;
  color?: string;
  opacity?: number;
  height?: number;
  className?: string;
}) {
  const id = safeId(motif, color, "band");
  return (
    <div
      aria-hidden="true"
      className={`relative w-full pointer-events-none select-none ${className}`}
      style={{ height, opacity }}
    >
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: color, opacity: 0.5 }} />
      <div className="absolute inset-x-0 bottom-0 h-px" style={{ background: color, opacity: 0.5 }} />
      <svg width="100%" height={height} preserveAspectRatio="xMidYMid slice">
        <defs>
          <MotifTile id={id} motif={motif} color={color} />
        </defs>
        <rect width="100%" height={height} fill={`url(#${id})`} />
      </svg>
    </div>
  );
}
