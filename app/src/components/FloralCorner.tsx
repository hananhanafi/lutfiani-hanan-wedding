"use client";

/**
 * Decorative botanical corner ornament (pure inline SVG — no external assets).
 * Drawn for the top-left corner, then mirrored per `position` so a single
 * artwork frames any corner. Palette matches the site (gold / blush / sage)
 * and can be overridden via props.
 *
 * Usage: place inside a `relative` container.
 *   <FloralCorner position="top-left" />
 *   <FloralCorner position="bottom-right" />
 */

type Corner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

interface Props {
  position?: Corner;
  /** rendered width/height in px (square artwork) */
  size?: number;
  className?: string;
  /** 0–1 overall opacity */
  opacity?: number;
}

const MIRROR: Record<Corner, string> = {
  "top-left": "scale(1, 1)",
  "top-right": "scale(-1, 1)",
  "bottom-left": "scale(1, -1)",
  "bottom-right": "scale(-1, -1)",
};

const POS_CLASS: Record<Corner, string> = {
  "top-left": "top-0 left-0",
  "top-right": "top-0 right-0",
  "bottom-left": "bottom-0 left-0",
  "bottom-right": "bottom-0 right-0",
};

// ── palette ──────────────────────────────────────────────
const PETAL_LIGHT = "#fbe6de";
const PETAL_MID = "#f2c9bd";
const PETAL_DEEP = "#e5a898";
const CENTER = "#d9b877";
const CENTER_DOT = "#b8944f";
const LEAF = "#a9bb96";
const LEAF_DEEP = "#8ea176";
const STEM = "#9aad84";

const PETAL_PATH = "M0 0 C -7 -9, -5 -22, 0 -27 C 5 -22, 7 -9, 0 0 Z";
const LEAF_PATH = "M0 0 C 7 -11, 7 -27, 0 -36 C -7 -27, -7 -11, 0 0 Z";

function Blossom({
  cx,
  cy,
  scale = 1,
  rotate = 0,
  petal = PETAL_MID,
  inner = PETAL_LIGHT,
}: {
  cx: number;
  cy: number;
  scale?: number;
  rotate?: number;
  petal?: string;
  inner?: string;
}) {
  const outer = [0, 60, 120, 180, 240, 300];
  const innerRing = [30, 102, 174, 246, 318];
  return (
    <g transform={`translate(${cx} ${cy}) rotate(${rotate}) scale(${scale})`}>
      {outer.map((a) => (
        <path key={`o${a}`} d={PETAL_PATH} fill={petal} transform={`rotate(${a})`} />
      ))}
      {innerRing.map((a) => (
        <path
          key={`i${a}`}
          d={PETAL_PATH}
          fill={inner}
          transform={`rotate(${a}) scale(0.62)`}
        />
      ))}
      <circle r="5.5" fill={CENTER} />
      <circle r="5.5" fill="none" stroke={CENTER_DOT} strokeWidth="0.6" opacity="0.5" />
      {[0, 72, 144, 216, 288].map((a) => (
        <circle
          key={`d${a}`}
          cx={Math.cos((a * Math.PI) / 180) * 2.6}
          cy={Math.sin((a * Math.PI) / 180) * 2.6}
          r="1"
          fill={CENTER_DOT}
        />
      ))}
    </g>
  );
}

function Leaf({
  x,
  y,
  rotate,
  scale = 1,
  fill = LEAF,
}: {
  x: number;
  y: number;
  rotate: number;
  scale?: number;
  fill?: string;
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      <path d={LEAF_PATH} fill={fill} />
      <path d="M0 -2 L0 -33" stroke="#ffffff" strokeWidth="0.7" opacity="0.35" fill="none" />
    </g>
  );
}

export default function FloralCorner({
  position = "top-left",
  size = 150,
  className = "",
  opacity = 0.9,
}: Props) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute z-20 select-none ${POS_CLASS[position]} ${className}`}
      style={{ width: size, height: size, opacity }}
    >
      <svg
        viewBox="0 0 200 200"
        width="100%"
        height="100%"
        fill="none"
        style={{ transform: MIRROR[position], transformOrigin: "center" }}
      >
        {/* stems */}
        <g stroke={STEM} strokeWidth="1.6" fill="none" strokeLinecap="round">
          <path d="M8 8 C 46 26, 78 40, 120 44" />
          <path d="M8 8 C 30 44, 40 78, 44 120" />
          <path d="M20 20 C 44 40, 60 66, 70 96" opacity="0.7" />
        </g>

        {/* leaves along the stems */}
        <Leaf x={64} y={30} rotate={54} scale={0.8} fill={LEAF} />
        <Leaf x={96} y={40} rotate={78} scale={0.7} fill={LEAF_DEEP} />
        <Leaf x={30} y={64} rotate={128} scale={0.8} fill={LEAF} />
        <Leaf x={40} y={96} rotate={150} scale={0.7} fill={LEAF_DEEP} />
        <Leaf x={78} y={78} rotate={104} scale={0.6} fill={LEAF} />
        <Leaf x={116} y={52} rotate={64} scale={0.55} fill={LEAF_DEEP} />

        {/* buds */}
        <g>
          <path d="M126 40 q 6 -8 12 -3 q 1 8 -6 10 q -8 0 -6 -7 Z" fill={PETAL_MID} />
          <path d="M40 128 q -8 6 -3 12 q 8 1 10 -6 q 0 -8 -7 -6 Z" fill={PETAL_MID} />
        </g>

        {/* blossoms — corner cluster, largest at the corner */}
        <Blossom cx={30} cy={30} scale={1.15} rotate={12} petal={PETAL_DEEP} inner={PETAL_MID} />
        <Blossom cx={70} cy={44} scale={0.85} rotate={-18} petal={PETAL_MID} inner={PETAL_LIGHT} />
        <Blossom cx={44} cy={70} scale={0.8} rotate={40} petal={PETAL_MID} inner={PETAL_LIGHT} />
        <Blossom cx={92} cy={82} scale={0.55} rotate={0} petal={PETAL_LIGHT} inner="#ffffff" />
      </svg>
    </div>
  );
}
