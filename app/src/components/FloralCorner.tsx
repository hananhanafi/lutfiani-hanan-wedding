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

/**
 * Small symmetric floral sprig for section dividers — a central blossom with
 * leaves fanning out to each side. Sits inline; pair with rules on either side.
 */
export function FloralSprig({
  size = 54,
  className = "",
  opacity = 0.9,
}: {
  size?: number;
  className?: string;
  opacity?: number;
}) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block align-middle select-none ${className}`}
      style={{ width: size, height: size * 0.5, opacity }}
    >
      <svg viewBox="0 0 120 60" width="100%" height="100%" fill="none">
        {/* side sprigs */}
        <g stroke={STEM} strokeWidth="1.4" fill="none" strokeLinecap="round">
          <path d="M60 34 C 44 30, 30 30, 16 34" />
          <path d="M60 34 C 76 30, 90 30, 104 34" />
        </g>
        <Leaf x={30} y={32} rotate={-108} scale={0.5} fill={LEAF} />
        <Leaf x={20} y={34} rotate={-96} scale={0.42} fill={LEAF_DEEP} />
        <Leaf x={90} y={32} rotate={108} scale={0.5} fill={LEAF} />
        <Leaf x={100} y={34} rotate={96} scale={0.42} fill={LEAF_DEEP} />
        {/* side buds */}
        <path d="M14 34 q -6 -4 -3 -9 q 6 -1 7 4 q 0 6 -4 5 Z" fill={PETAL_MID} />
        <path d="M106 34 q 6 -4 3 -9 q -6 -1 -7 4 q 0 6 4 5 Z" fill={PETAL_MID} />
        {/* center blossoms */}
        <Blossom cx={60} cy={30} scale={0.92} rotate={0} petal={PETAL_DEEP} inner={PETAL_MID} />
        <Blossom cx={44} cy={34} scale={0.5} rotate={20} petal={PETAL_MID} inner={PETAL_LIGHT} />
        <Blossom cx={76} cy={34} scale={0.5} rotate={-20} petal={PETAL_MID} inner={PETAL_LIGHT} />
      </svg>
    </span>
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
        {/* stems — long trailing arms down both edges */}
        <g stroke={STEM} strokeWidth="1.7" fill="none" strokeLinecap="round">
          <path d="M6 6 C 60 22, 110 34, 170 40" />
          <path d="M6 6 C 22 60, 34 110, 40 170" />
          <path d="M18 18 C 52 40, 78 66, 96 108" opacity="0.75" />
          <path d="M18 18 C 40 52, 66 78, 108 96" opacity="0.75" />
          <path d="M120 36 C 132 46, 140 58, 144 74" opacity="0.6" />
          <path d="M36 120 C 46 132, 58 140, 74 144" opacity="0.6" />
        </g>

        {/* trailing leaves along the stems */}
        <Leaf x={70} y={30} rotate={52} scale={0.85} fill={LEAF} />
        <Leaf x={104} y={38} rotate={70} scale={0.75} fill={LEAF_DEEP} />
        <Leaf x={138} y={40} rotate={82} scale={0.7} fill={LEAF} />
        <Leaf x={166} y={44} rotate={96} scale={0.6} fill={LEAF_DEEP} />
        <Leaf x={30} y={70} rotate={128} scale={0.85} fill={LEAF} />
        <Leaf x={38} y={104} rotate={110} scale={0.75} fill={LEAF_DEEP} />
        <Leaf x={40} y={138} rotate={98} scale={0.7} fill={LEAF} />
        <Leaf x={44} y={166} rotate={84} scale={0.6} fill={LEAF_DEEP} />
        <Leaf x={82} y={82} rotate={135} scale={0.7} fill={LEAF} />
        <Leaf x={112} y={70} rotate={58} scale={0.6} fill={LEAF_DEEP} />
        <Leaf x={70} y={112} rotate={150} scale={0.6} fill={LEAF_DEEP} />
        <Leaf x={128} y={92} rotate={72} scale={0.5} fill={LEAF} />
        <Leaf x={92} y={128} rotate={126} scale={0.5} fill={LEAF} />

        {/* buds at the tips */}
        <g>
          <path d="M170 36 q 7 -9 14 -3 q 1 9 -7 11 q -9 0 -7 -8 Z" fill={PETAL_MID} />
          <path d="M36 170 q -9 7 -3 14 q 9 1 11 -7 q 0 -9 -8 -7 Z" fill={PETAL_MID} />
          <path d="M148 72 q 6 -7 11 -2 q 1 7 -6 8 q -7 0 -5 -6 Z" fill={PETAL_LIGHT} />
          <path d="M72 148 q -7 6 -2 11 q 7 1 8 -6 q 0 -7 -6 -5 Z" fill={PETAL_LIGHT} />
        </g>

        {/* blossoms — a full corner bouquet, largest at the corner */}
        <Blossom cx={28} cy={28} scale={1.35} rotate={12} petal={PETAL_DEEP} inner={PETAL_MID} />
        <Blossom cx={66} cy={40} scale={0.95} rotate={-18} petal={PETAL_MID} inner={PETAL_LIGHT} />
        <Blossom cx={40} cy={66} scale={0.92} rotate={40} petal={PETAL_MID} inner={PETAL_LIGHT} />
        <Blossom cx={62} cy={62} scale={0.7} rotate={22} petal={PETAL_DEEP} inner={PETAL_MID} />
        <Blossom cx={100} cy={52} scale={0.68} rotate={-8} petal={PETAL_MID} inner={PETAL_LIGHT} />
        <Blossom cx={52} cy={100} scale={0.66} rotate={54} petal={PETAL_MID} inner={PETAL_LIGHT} />
        <Blossom cx={92} cy={90} scale={0.52} rotate={0} petal={PETAL_LIGHT} inner="#ffffff" />
        <Blossom cx={128} cy={64} scale={0.44} rotate={-14} petal={PETAL_LIGHT} inner="#ffffff" />
        <Blossom cx={64} cy={128} scale={0.44} rotate={30} petal={PETAL_LIGHT} inner="#ffffff" />
      </svg>
    </div>
  );
}
