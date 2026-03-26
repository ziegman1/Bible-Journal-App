import {
  PROCESS_MAP_EDGES,
  PROCESS_NODES,
  NODE_ANNOTATIONS,
  MAP_CAPTIONS,
  type AnnotationType,
} from "@/lib/process-map/nodes";
import { cn } from "@/lib/utils";
import { ProcessNode } from "./process-node";

/* ═══════════════════════════════════════════════════════════════════════════
 *  Curved path helper
 * ═══════════════════════════════════════════════════════════════════════════ */

/** Same spine as the original cubic edge — used for lightning / organic sampling */
function curvedControlPoints(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  idx: number,
  curveFactor: number,
) {
  const mx = (ax + bx) / 2;
  const my = (ay + by) / 2;
  const dx = bx - ax;
  const dy = by - ay;
  const dist = Math.sqrt(dx * dx + dy * dy);

  const curvature = Math.min(dist * curveFactor, 7);
  const sign = idx % 2 === 0 ? 1 : -1;
  const nx = (-dy / (dist || 1)) * curvature * sign;
  const ny = (dx / (dist || 1)) * curvature * sign;

  return {
    c1x: mx + nx * 0.8,
    c1y: my + ny * 0.8,
    c2x: mx + nx * 1.2,
    c2y: my + ny * 1.2,
  };
}

function cubicBezierPoint(
  t: number,
  ax: number,
  ay: number,
  c1x: number,
  c1y: number,
  c2x: number,
  c2y: number,
  bx: number,
  by: number,
): [number, number] {
  const u = 1 - t;
  const uu = u * u;
  const tt = t * t;
  const x =
    uu * u * ax + 3 * uu * t * c1x + 3 * u * tt * c2x + tt * t * bx;
  const y =
    uu * u * ay + 3 * uu * t * c1y + 3 * u * tt * c2y + tt * t * by;
  return [x, y];
}

function cubicBezierTangent(
  t: number,
  ax: number,
  ay: number,
  c1x: number,
  c1y: number,
  c2x: number,
  c2y: number,
  bx: number,
  by: number,
): [number, number] {
  const u = 1 - t;
  const uu = u * u;
  const tt = t * t;
  const dx =
    3 * uu * (c1x - ax) + 6 * u * t * (c2x - c1x) + 3 * tt * (bx - c2x);
  const dy =
    3 * uu * (c1y - ay) + 6 * u * t * (c2y - c1y) + 3 * tt * (by - c2y);
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  return [dx / len, dy / len];
}

/**
 * Jagged polyline along the same spine as the smooth hub curve — reads as a plasma bolt.
 * Wobble is deterministic (idx) so layout is stable across SSR / hydration.
 */
function electricBoltPath(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  idx: number,
  curveFactor: number,
  segments = 32,
): string {
  const { c1x, c1y, c2x, c2y } = curvedControlPoints(
    ax,
    ay,
    bx,
    by,
    idx,
    curveFactor,
  );
  const amp = 0.62;
  const parts: string[] = [];
  for (let s = 0; s <= segments; s++) {
    const t = s / segments;
    const [px, py] = cubicBezierPoint(
      t,
      ax,
      ay,
      c1x,
      c1y,
      c2x,
      c2y,
      bx,
      by,
    );
    const [tx, ty] = cubicBezierTangent(
      t,
      ax,
      ay,
      c1x,
      c1y,
      c2x,
      c2y,
      bx,
      by,
    );
    const nx = -ty;
    const ny = tx;
    const envelope = Math.sin(t * Math.PI);
    const wobble =
      amp *
      envelope *
      (Math.sin(t * 41 * Math.PI + idx * 2.17) * 0.52 +
        Math.sin(t * 73 * Math.PI + idx * 1.03) * 0.38 +
        Math.sin(t * 17 * Math.PI + idx * 4.2) * 0.22);
    const x = px + nx * wobble;
    const y = py + ny * wobble;
    parts.push(s === 0 ? `M ${x} ${y}` : `L ${x} ${y}`);
  }
  return parts.join(" ");
}

/**
 * Same cubic spine as the map’s original edges, with very gentle perpendicular variation.
 */
function organicFlowPath(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  idx: number,
  curveFactor: number,
  segments = 44,
): string {
  const { c1x, c1y, c2x, c2y } = curvedControlPoints(
    ax,
    ay,
    bx,
    by,
    idx,
    curveFactor,
  );
  const amp = 0.13;
  const parts: string[] = [];
  for (let s = 0; s <= segments; s++) {
    const t = s / segments;
    const [px, py] = cubicBezierPoint(
      t,
      ax,
      ay,
      c1x,
      c1y,
      c2x,
      c2y,
      bx,
      by,
    );
    const [tx, ty] = cubicBezierTangent(
      t,
      ax,
      ay,
      c1x,
      c1y,
      c2x,
      c2y,
      bx,
      by,
    );
    const nx = -ty;
    const ny = tx;
    const envelope = Math.sin(t * Math.PI);
    const wobble =
      amp *
      envelope *
      (Math.sin(t * 7 * Math.PI + idx * 1.41) * 0.48 +
        Math.sin(t * 13 * Math.PI + idx * 0.73) * 0.36 +
        Math.sin(t * 3.5 * Math.PI + idx * 2.05) * 0.2);
    const x = px + nx * wobble;
    const y = py + ny * wobble;
    parts.push(s === 0 ? `M ${x} ${y}` : `L ${x} ${y}`);
  }
  return parts.join(" ");
}

function taperMaskGradientId(from: string, to: string) {
  return `pm-taper-grad-${from}-${to}`;
}

function taperMaskId(from: string, to: string) {
  return `pm-taper-mask-${from}-${to}`;
}

function TaperMaskDefs({
  from,
  to,
  ax,
  ay,
  bx,
  by,
}: {
  from: string;
  to: string;
  ax: number;
  ay: number;
  bx: number;
  by: number;
}) {
  const gid = taperMaskGradientId(from, to);
  const mid = taperMaskId(from, to);
  return (
    <defs>
      <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1={ax} y1={ay} x2={bx} y2={by}>
        <stop offset="0%" stopColor="white" stopOpacity="1" />
        <stop offset="48%" stopColor="white" stopOpacity="0.48" />
        <stop offset="100%" stopColor="white" stopOpacity="0.08" />
      </linearGradient>
      <mask id={mid}>
        <rect width="100" height="100" fill={`url(#${gid})`} />
      </mask>
    </defs>
  );
}

function FlowEnergyPulses({
  pathId,
  d,
  fill,
  durSec,
  staggerSec,
  radius,
  count = 3,
}: {
  pathId: string;
  d: string;
  fill: string;
  durSec: number;
  staggerSec: number;
  radius: number;
  count?: number;
}) {
  const pulses = Array.from({ length: Math.max(2, Math.min(4, count)) }, (_, idx) => {
    const speedVariance = ((idx % 3) - 1) * 0.12; // -12%, 0%, +12%
    const opacityVariance = 0.84 + idx * 0.06;
    const beginJitter = idx * staggerSec + ((idx % 2) * 0.35);
    return {
      dur: durSec * (1 + speedVariance),
      begin: beginJitter,
      opacity: Math.min(1, opacityVariance),
      rx: radius * (1.35 - idx * 0.1),
      ry: radius * (0.72 - idx * 0.08),
    };
  });
  return (
    <>
      <path id={pathId} d={d} fill="none" stroke="none" />
      {pulses.map((p, idx) => (
        <ellipse
          key={`${pathId}-pulse-${idx}`}
          rx={Math.max(0.08, p.rx)}
          ry={Math.max(0.06, p.ry)}
          fill={fill}
          opacity={p.opacity}
          filter="url(#pm-flow-pulse-glow)"
        >
          <animateMotion
            dur={`${p.dur}s`}
            repeatCount="indefinite"
            rotate="auto"
            calcMode="linear"
            begin={`${p.begin}s`}
          >
            <mpath href={`#${pathId}`} />
          </animateMotion>
        </ellipse>
      ))}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  Edge family tinting
 *
 *  Each gradient is a subtle 3-stop linear gradient blending from source
 *  family color through a shared mid-tone to destination family color.
 *  Child edges use a single green with lower opacity.
 * ═══════════════════════════════════════════════════════════════════════════ */

type EdgeTint = {
  id: string;
  c1: string;  // start color
  c2: string;  // mid color
  c3: string;  // end color
  o1: number;  // start opacity
  o2: number;  // mid opacity
  o3: number;  // end opacity
};

const EDGE_TINTS: EdgeTint[] = [
  // Practice (sky-blue / cyan-violet)
  { id: "practice",   c1: "rgb(56,189,248)",  c2: "rgb(99,102,241)",  c3: "rgb(139,92,246)",  o1: 0.35, o2: 0.50, o3: 0.35 },
  // Chat (indigo / violet)
  { id: "chat",       c1: "rgb(167,139,250)", c2: "rgb(124,58,237)",  c3: "rgb(139,92,246)",  o1: 0.35, o2: 0.50, o3: 0.35 },
  // Watch (blue / cyan)
  { id: "watch",      c1: "rgb(96,165,250)",  c2: "rgb(59,130,246)",  c3: "rgb(99,102,241)",  o1: 0.35, o2: 0.50, o3: 0.35 },
  // Model (warm red / magenta)
  { id: "model",      c1: "rgb(248,113,113)", c2: "rgb(217,70,239)",  c3: "rgb(168,85,247)",  o1: 0.32, o2: 0.48, o3: 0.32 },
  // Green / teal (transformed family)
  { id: "green",      c1: "rgb(74,222,128)",  c2: "rgb(45,212,191)",  c3: "rgb(34,197,94)",   o1: 0.32, o2: 0.48, o3: 0.32 },
  // Amber (community / family)
  { id: "amber",      c1: "rgb(251,191,36)",  c2: "rgb(245,158,11)",  c3: "rgb(217,119,6)",   o1: 0.30, o2: 0.44, o3: 0.30 },
  // Model → Transformed crossover (red → green)
  { id: "model-green", c1: "rgb(248,113,113)", c2: "rgb(168,85,247)", c3: "rgb(74,222,128)",  o1: 0.30, o2: 0.42, o3: 0.30 },
  // Watch → Transformed crossover (blue → green)
  { id: "watch-green", c1: "rgb(96,165,250)",  c2: "rgb(99,102,241)", c3: "rgb(74,222,128)",  o1: 0.30, o2: 0.42, o3: 0.30 },
  // Child satellite (soft green, low opacity)
  { id: "child",      c1: "rgb(74,222,128)",  c2: "rgb(52,211,153)",  c3: "rgb(74,222,128)",  o1: 0.22, o2: 0.34, o3: 0.22 },
];

/** Me → SOAP / PRAY / SHARE / CHAT — styled as thick electric-blue hub lines */
function isDailyPracticeHubEdge(from: string, to: string): boolean {
  return from === "me" && ["soap", "pray", "share", "chat"].includes(to);
}

/** Transformed Person → SOAPS / CHAT / SHARE / PRAY satellites — green “electrode” bolts */
function isTransformedPracticeElectrodeEdge(from: string, to: string): boolean {
  return (
    from === "transformed" &&
    ["t_soap", "t_share", "t_chat", "t_pray"].includes(to)
  );
}

const ELECTRODE_GREEN_OUTER = "rgba(52, 211, 153, 0.48)";
const ELECTRODE_GREEN_MAIN = "rgb(34, 197, 94)";
const ELECTRODE_GREEN_CORE = "rgb(220, 252, 231)";
const ELECTRODE_STROKE_PX = 5.25;
const ELECTRODE_HALO_PX = 9.45;
const ELECTRODE_CORE_PX = 1.18;

/* ME-card matched electrodes (warm parchment/bronze energy) */
const HUB_EDGE_BLUE = "rgb(194, 170, 128)";
const HUB_EDGE_GLOW_OUTER = "rgba(220, 198, 156, 0.42)";
const HUB_EDGE_CORE = "rgb(248, 238, 218)";
const HUB_EDGE_STROKE_PX = 5.25;
const HUB_EDGE_HALO_PX = 9.45;
const HUB_EDGE_CORE_PX = 1.18;

/** Me → My 3/3 Family — thick gold flow toward community node */
function isMeToFamilyEdge(from: string, to: string): boolean {
  return from === "me" && to === "family";
}

const FAMILY_EDGE_GOLD = "rgb(250, 204, 21)";
const FAMILY_EDGE_DEEP = "rgb(202, 138, 4)";
const FAMILY_EDGE_HIGHLIGHT = "rgba(255, 251, 235, 0.92)";
const FAMILY_EDGE_STROKE_PX = 10;
const FAMILY_EDGE_HALO_PX = 17;

/** Edges that end at Watch Phase — thick blue flow toward the watch node */
function isFlowToWatchPhaseEdge(from: string, to: string): boolean {
  return to === "watch" && (from === "me" || from === "transformed");
}

const WATCH_EDGE_BLUE = "rgb(59, 130, 246)";
const WATCH_EDGE_DEEP = "rgb(30, 64, 175)";
const WATCH_EDGE_HIGHLIGHT = "rgba(224, 242, 254, 0.92)";
const WATCH_EDGE_STROKE_PX = 10;
const WATCH_EDGE_HALO_PX = 17;

/** Me → Model / Assist — thick warm flow toward the model node */
function isMeToModelEdge(from: string, to: string): boolean {
  return from === "me" && to === "model";
}

const MODEL_EDGE_MAIN = "rgb(244, 114, 182)";
const MODEL_EDGE_DEEP = "rgb(157, 23, 77)";
const MODEL_EDGE_HIGHLIGHT = "rgba(255, 237, 245, 0.92)";
const MODEL_EDGE_STROKE_PX = 10;
const MODEL_EDGE_HALO_PX = 17;

/** Model / Assist → Transformed Person — thick warm flow toward TP */
function isModelToTransformedEdge(from: string, to: string): boolean {
  return from === "model" && to === "transformed";
}

const ASSIST_TO_TP_MAIN = "rgb(251, 113, 133)";
const ASSIST_TO_TP_DEEP = "rgb(190, 18, 60)";
const ASSIST_TO_TP_HIGHLIGHT = "rgba(255, 245, 248, 0.92)";
const ASSIST_TO_TP_STROKE_PX = 10;
const ASSIST_TO_TP_HALO_PX = 17;

/** Transformed Person → New 3/3 — thick green flow toward the new33 node */
function isTransformedToNew33Edge(from: string, to: string): boolean {
  return from === "transformed" && to === "new33";
}

const NEW33_EDGE_GREEN = "rgb(34, 197, 94)";
const NEW33_EDGE_DEEP = "rgb(21, 128, 61)";
const NEW33_EDGE_HIGHLIGHT = "rgba(220, 252, 231, 0.92)";
const NEW33_EDGE_STROKE_PX = 10;
const NEW33_EDGE_HALO_PX = 17;

function edgeTintId(from: string, to: string): string {
  const isChild = to.startsWith("t_");
  if (isChild) return "child";

  if (from === "me" && ["soap", "pray", "share"].includes(to)) return "practice";
  if (from === "me" && to === "chat") return "chat";
  if (from === "me" && to === "watch") return "watch";
  if (from === "me" && to === "model") return "model";
  if (from === "model" && to === "transformed") return "model-green";
  if (from === "transformed" && to === "watch") return "watch-green";
  if (from === "transformed" && to === "new33") return "green";
  if (from === "me" && to === "family") return "amber";

  return "practice"; // fallback
}

/* ═══════════════════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════════════════
 *  Directional flow arrow helpers
 *
 *  Builds SVG chevron arrows along a corridor between two nodes.
 *  Arrows are filled polygons rotated to match the path direction.
 * ═══════════════════════════════════════════════════════════════════════════ */

type FlowArrowDef = {
  from: string;
  to: string;
  color: string;
  glowColor: string;
  count: number;       // how many chevrons
  size: number;        // scale factor
  opacity: number;
  startT: number;      // 0–1, where along the path to start
  endT: number;        // 0–1, where to end
  reverse?: boolean;   // add a faint return arrow
};

const FLOW_ARROWS: FlowArrowDef[] = [
  {
    from: "transformed",
    to: "watch",
    color: "rgba(96, 165, 250, 0.75)",
    glowColor: "rgba(37, 99, 235, 0.28)",
    count: 3,
    size: 1.45,
    opacity: 0.78,
    startT: 0.18,
    endT: 0.88,
  },
  {
    from: "model",
    to: "transformed",
    color: "rgba(251, 113, 133, 0.78)",
    glowColor: "rgba(190, 18, 60, 0.30)",
    count: 3,
    size: 1.45,
    opacity: 0.78,
    startT: 0.18,
    endT: 0.88,
  },
  {
    from: "transformed",
    to: "new33",
    color: "rgba(74, 222, 128, 0.75)",
    glowColor: "rgba(22, 163, 74, 0.28)",
    count: 3,
    size: 1.45,
    opacity: 0.78,
    startT: 0.18,
    endT: 0.88,
  },
  {
    from: "me",
    to: "family",
    color: "rgba(250, 204, 21, 0.72)",
    glowColor: "rgba(202, 138, 4, 0.28)",
    count: 3,
    size: 1.45,
    opacity: 0.78,
    startT: 0.18,
    endT: 0.88,
  },
  {
    from: "me",
    to: "watch",
    color: "rgba(96, 165, 250, 0.75)",
    glowColor: "rgba(37, 99, 235, 0.28)",
    count: 3,
    size: 1.45,
    opacity: 0.78,
    startT: 0.18,
    endT: 0.88,
  },
  {
    from: "me",
    to: "model",
    color: "rgba(244, 114, 182, 0.78)",
    glowColor: "rgba(190, 24, 93, 0.32)",
    count: 3,
    size: 1.45,
    opacity: 0.78,
    startT: 0.18,
    endT: 0.88,
  },
];

function chevronPath(
  cx: number, cy: number,
  angle: number, scale: number,
): string {
  const hw = 1.6 * scale;
  const hh = 2.2 * scale;
  const tip = 1.0 * scale;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const rot = (lx: number, ly: number) => [
    cx + lx * cos - ly * sin,
    cy + lx * sin + ly * cos,
  ];
  const [x1, y1] = rot(-hw, -hh);
  const [x2, y2] = rot(tip, 0);
  const [x3, y3] = rot(-hw, hh);
  const [x4, y4] = rot(-hw * 0.4, 0);
  return `M${x1} ${y1} L${x2} ${y2} L${x3} ${y3} L${x4} ${y4} Z`;
}

function ProcessMapConnections() {
  const byId = new Map(PROCESS_NODES.map((n) => [n.id, n]));

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        {EDGE_TINTS.map((t) => (
          <linearGradient key={t.id} id={`pm-e-${t.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor={t.c1} stopOpacity={t.o1} />
            <stop offset="50%"  stopColor={t.c2} stopOpacity={t.o2} />
            <stop offset="100%" stopColor={t.c3} stopOpacity={t.o3} />
          </linearGradient>
        ))}

        <filter id="pm-edge-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.45" />
        </filter>
        <filter id="pm-hub-blue-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3.2" result="b1" />
          <feMerge>
            <feMergeNode in="b1" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="pm-electric-flicker" x="-100%" y="-100%" width="300%" height="300%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.12"
            numOctaves="2"
            seed="3"
            result="noise"
          >
            <animate
              attributeName="baseFrequency"
              dur="0.45s"
              values="0.09;0.16;0.11;0.14;0.10"
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="2.8"
            xChannelSelector="R"
            yChannelSelector="G"
            result="displaced"
          />
          <feGaussianBlur in="displaced" stdDeviation="0.35" />
        </filter>
        <filter id="pm-child-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.3" />
        </filter>
        <filter id="pm-arrow-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.6" />
        </filter>
        <filter id="pm-flow-pulse-glow" x="-350%" y="-350%" width="800%" height="800%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.26" />
        </filter>
        <filter id="pm-flow-aura-blur" x="-45%" y="-45%" width="190%" height="190%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.05" />
        </filter>
        <filter id="pm-amber-edge-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.8" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="pm-green-edge-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.8" result="bg" />
          <feMerge>
            <feMergeNode in="bg" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="pm-rose-edge-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.8" result="br" />
          <feMerge>
            <feMergeNode in="br" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Edge paths ────────────────────────────────────────────────── */}
      {PROCESS_MAP_EDGES.map(([from, to], i) => {
        const a = byId.get(from);
        const b = byId.get(to);
        if (!a || !b) return null;

        const tint = edgeTintId(from, to);
        const isChild = to.startsWith("t_");
        const gradUrl = `url(#pm-e-${tint})`;
        const curveF = isChild ? 0.12 : 0.18;
        const flowD = organicFlowPath(a.x, a.y, b.x, b.y, i, curveF);
        const hubEdge = isDailyPracticeHubEdge(from, to);
        const pulseDur = 19 + (i % 6) * 1.4;
        const pulseStagger = pulseDur * 0.52;
        const pathId = `pm-flowpath-${from}-${to}`;
        const meOutDim = from === "me" ? 0.78 : 1;

        if (isTransformedPracticeElectrodeEdge(from, to)) {
          const cf = 0.12;
          const electrodeD = electricBoltPath(a.x, a.y, b.x, b.y, i, cf);
          const flickerDur = `${0.11 + (i % 4) * 0.02}s`;
          const tid = taperMaskId(from, to);
          return (
            <g key={`${from}-${to}`}>
              <TaperMaskDefs from={from} to={to} ax={a.x} ay={a.y} bx={b.x} by={b.y} />
              <g filter="url(#pm-electric-flicker)">
                <path
                  d={electrodeD}
                  fill="none"
                  stroke={ELECTRODE_GREEN_OUTER}
                  strokeWidth={ELECTRODE_HALO_PX}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  opacity={0.52}
                  mask={`url(#${tid})`}
                />
                <path
                  d={electrodeD}
                  fill="none"
                  stroke={ELECTRODE_GREEN_MAIN}
                  strokeWidth={ELECTRODE_STROKE_PX}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  opacity={0.88}
                  filter="url(#pm-green-edge-glow)"
                />
                <path
                  d={electrodeD}
                  fill="none"
                  stroke={ELECTRODE_GREEN_CORE}
                  strokeWidth={ELECTRODE_CORE_PX}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                >
                  <animate
                    attributeName="opacity"
                    dur={flickerDur}
                    values="1;0.42;1;0.68;0.92;1;0.48;1"
                    repeatCount="indefinite"
                  />
                </path>
              </g>
              <FlowEnergyPulses
                pathId={pathId}
                d={electrodeD}
                fill="rgba(210,255,230,0.95)"
                durSec={23}
                staggerSec={11.5}
                radius={0.3}
                count={4}
              />
            </g>
          );
        }

        if (isChild) {
          const tid = taperMaskId(from, to);
          return (
            <g key={`${from}-${to}`}>
              <TaperMaskDefs from={from} to={to} ax={a.x} ay={a.y} bx={b.x} by={b.y} />
              <path
                d={flowD}
                fill="none"
                stroke="rgba(167,243,208,0.45)"
                strokeWidth={0.62}
                strokeLinecap="round"
                opacity={0.4}
                mask={`url(#${tid})`}
                filter="url(#pm-flow-aura-blur)"
              />
              <path
                d={flowD}
                fill="none"
                stroke={gradUrl}
                strokeWidth={0.35}
                strokeLinecap="round"
                opacity={0.56}
              />
              <path
                d={flowD}
                fill="none"
                stroke="rgba(236,253,245,0.75)"
                strokeWidth={0.16}
                strokeLinecap="round"
                opacity={0.72}
              />
              <FlowEnergyPulses
                pathId={pathId}
                d={flowD}
                fill="rgba(190,250,215,0.9)"
                durSec={4.6}
                staggerSec={1.15}
                radius={0.21}
                count={3}
              />
            </g>
          );
        }

        if (isMeToFamilyEdge(from, to)) {
          const tid = taperMaskId(from, to);
          return (
            <g key={`${from}-${to}`}>
              <TaperMaskDefs from={from} to={to} ax={a.x} ay={a.y} bx={b.x} by={b.y} />
              <path
                d={flowD}
                fill="none"
                stroke={FAMILY_EDGE_DEEP}
                strokeWidth={FAMILY_EDGE_HALO_PX + 3}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                opacity={0.32 * meOutDim}
                mask={`url(#${tid})`}
                filter="url(#pm-flow-aura-blur)"
              />
              <path
                d={flowD}
                fill="none"
                stroke={FAMILY_EDGE_DEEP}
                strokeWidth={FAMILY_EDGE_HALO_PX}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                opacity={0.44 * meOutDim}
                mask={`url(#${tid})`}
              />
              <path
                d={flowD}
                fill="none"
                stroke={FAMILY_EDGE_GOLD}
                strokeWidth={0.35}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                opacity={0.58 * meOutDim}
                filter="url(#pm-amber-edge-glow)"
              />
              <FlowEnergyPulses
                pathId={pathId}
                d={flowD}
                fill="rgba(255,236,180,0.95)"
                durSec={4.8}
                staggerSec={1.2}
                radius={0.32}
                count={4}
              />
            </g>
          );
        }

        if (isFlowToWatchPhaseEdge(from, to)) {
          const tid = taperMaskId(from, to);
          const transformedRelationBoost = from === "transformed" ? 1.18 : 1;
          const edgeAlpha = meOutDim * transformedRelationBoost;
          return (
            <g key={`${from}-${to}`}>
              <TaperMaskDefs from={from} to={to} ax={a.x} ay={a.y} bx={b.x} by={b.y} />
              <path
                d={flowD}
                fill="none"
                stroke={WATCH_EDGE_DEEP}
                strokeWidth={WATCH_EDGE_HALO_PX + 3}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                opacity={0.28 * edgeAlpha}
                mask={`url(#${tid})`}
                filter="url(#pm-flow-aura-blur)"
              />
              <path
                d={flowD}
                fill="none"
                stroke={WATCH_EDGE_DEEP}
                strokeWidth={WATCH_EDGE_HALO_PX}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                opacity={0.4 * edgeAlpha}
                mask={`url(#${tid})`}
              />
              <path
                d={flowD}
                fill="none"
                stroke={WATCH_EDGE_BLUE}
                strokeWidth={0.35}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                opacity={0.58 * edgeAlpha}
                filter="url(#pm-hub-blue-glow)"
              />
              <FlowEnergyPulses
                pathId={pathId}
                d={flowD}
                fill="rgba(199,220,255,0.95)"
                durSec={4.4}
                staggerSec={1.05}
                radius={0.3}
                count={4}
              />
              {from === "transformed" && (
                <>
                  <circle
                    cx={a.x}
                    cy={a.y}
                    r={2.7}
                    fill="rgba(186,255,222,0.24)"
                    filter="url(#pm-flow-pulse-glow)"
                  />
                  <circle
                    cx={a.x}
                    cy={a.y}
                    r={1.35}
                    fill="rgba(232,255,244,0.34)"
                  />
                </>
              )}
            </g>
          );
        }

        if (isMeToModelEdge(from, to)) {
          const tid = taperMaskId(from, to);
          return (
            <g key={`${from}-${to}`}>
              <TaperMaskDefs from={from} to={to} ax={a.x} ay={a.y} bx={b.x} by={b.y} />
              <path
                d={flowD}
                fill="none"
                stroke={MODEL_EDGE_DEEP}
                strokeWidth={MODEL_EDGE_HALO_PX + 3}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                opacity={0.28 * meOutDim}
                mask={`url(#${tid})`}
                filter="url(#pm-flow-aura-blur)"
              />
              <path
                d={flowD}
                fill="none"
                stroke={MODEL_EDGE_DEEP}
                strokeWidth={MODEL_EDGE_HALO_PX}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                opacity={0.4 * meOutDim}
                mask={`url(#${tid})`}
              />
              <path
                d={flowD}
                fill="none"
                stroke={MODEL_EDGE_MAIN}
                strokeWidth={0.35}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                opacity={0.56 * meOutDim}
                filter="url(#pm-rose-edge-glow)"
              />
              <FlowEnergyPulses
                pathId={pathId}
                d={flowD}
                fill="rgba(255,210,235,0.95)"
                durSec={4.6}
                staggerSec={1.15}
                radius={0.3}
                count={4}
              />
            </g>
          );
        }

        if (isModelToTransformedEdge(from, to)) {
          const tid = taperMaskId(from, to);
          return (
            <g key={`${from}-${to}`}>
              <TaperMaskDefs from={from} to={to} ax={a.x} ay={a.y} bx={b.x} by={b.y} />
              <path
                d={flowD}
                fill="none"
                stroke={ASSIST_TO_TP_DEEP}
                strokeWidth={ASSIST_TO_TP_HALO_PX + 3}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                opacity={0.38}
                mask={`url(#${tid})`}
                filter="url(#pm-flow-aura-blur)"
              />
              <path
                d={flowD}
                fill="none"
                stroke={ASSIST_TO_TP_DEEP}
                strokeWidth={ASSIST_TO_TP_HALO_PX}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                opacity={0.52}
                mask={`url(#${tid})`}
              />
              <path
                d={flowD}
                fill="none"
                stroke={ASSIST_TO_TP_MAIN}
                strokeWidth={0.35}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                opacity={0.58}
                filter="url(#pm-rose-edge-glow)"
              />
              <FlowEnergyPulses
                pathId={pathId}
                d={flowD}
                fill="rgba(255,200,220,0.95)"
                durSec={4.2}
                staggerSec={1.0}
                radius={0.3}
                count={4}
              />
              <circle
                cx={b.x}
                cy={b.y}
                r={3.1}
                fill="rgba(206,255,230,0.22)"
                filter="url(#pm-flow-pulse-glow)"
              />
              <circle
                cx={b.x}
                cy={b.y}
                r={1.55}
                fill="rgba(244,255,248,0.34)"
              />
            </g>
          );
        }

        if (isTransformedToNew33Edge(from, to)) {
          const tid = taperMaskId(from, to);
          return (
            <g key={`${from}-${to}`}>
              <TaperMaskDefs from={from} to={to} ax={a.x} ay={a.y} bx={b.x} by={b.y} />
              <path
                d={flowD}
                fill="none"
                stroke={NEW33_EDGE_DEEP}
                strokeWidth={NEW33_EDGE_HALO_PX + 3}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                opacity={0.28}
                mask={`url(#${tid})`}
                filter="url(#pm-flow-aura-blur)"
              />
              <path
                d={flowD}
                fill="none"
                stroke={NEW33_EDGE_DEEP}
                strokeWidth={NEW33_EDGE_HALO_PX}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                opacity={0.4}
                mask={`url(#${tid})`}
              />
              <path
                d={flowD}
                fill="none"
                stroke={NEW33_EDGE_GREEN}
                strokeWidth={0.35}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                opacity={0.56}
                filter="url(#pm-green-edge-glow)"
              />
              <FlowEnergyPulses
                pathId={pathId}
                d={flowD}
                fill="rgba(200,255,220,0.95)"
                durSec={4.8}
                staggerSec={1.2}
                radius={0.3}
                count={4}
              />
            </g>
          );
        }

        if (hubEdge) {
          const boltD = electricBoltPath(a.x, a.y, b.x, b.y, i, curveF);
          const flickerDur = `${0.11 + (i % 4) * 0.02}s`;
          const tid = taperMaskId(from, to);
          return (
            <g key={`${from}-${to}`}>
              <TaperMaskDefs from={from} to={to} ax={a.x} ay={a.y} bx={b.x} by={b.y} />
              <g filter="url(#pm-electric-flicker)">
                <path
                  d={boltD}
                  fill="none"
                  stroke={HUB_EDGE_GLOW_OUTER}
                  strokeWidth={HUB_EDGE_HALO_PX + 2.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  opacity={0.38 * meOutDim}
                  mask={`url(#${tid})`}
                />
                <path
                  d={boltD}
                  fill="none"
                  stroke={HUB_EDGE_GLOW_OUTER}
                  strokeWidth={HUB_EDGE_HALO_PX}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  opacity={0.52 * meOutDim}
                  mask={`url(#${tid})`}
                />
                <path
                  d={boltD}
                  fill="none"
                  stroke={HUB_EDGE_BLUE}
                  strokeWidth={HUB_EDGE_STROKE_PX}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  opacity={0.88 * meOutDim}
                  filter="url(#pm-hub-blue-glow)"
                />
                <path
                  d={boltD}
                  fill="none"
                  stroke={HUB_EDGE_CORE}
                  strokeWidth={HUB_EDGE_CORE_PX}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                >
                  <animate
                    attributeName="opacity"
                    dur={flickerDur}
                    values="1;0.35;1;0.65;0.9;1;0.5;1"
                    repeatCount="indefinite"
                  />
                </path>
              </g>
              <FlowEnergyPulses
                pathId={pathId}
                d={boltD}
                fill="rgba(248,236,210,0.95)"
                durSec={21}
                staggerSec={10.5}
                radius={0.34}
                count={4}
              />
            </g>
          );
        }

        const tid = taperMaskId(from, to);
        return (
          <g key={`${from}-${to}`}>
            <TaperMaskDefs from={from} to={to} ax={a.x} ay={a.y} bx={b.x} by={b.y} />
            <path
              d={flowD}
              fill="none"
              stroke="rgba(199,210,254,0.55)"
              strokeWidth={1.18}
              strokeLinecap="round"
              opacity={0.38}
              mask={`url(#${tid})`}
              filter="url(#pm-flow-aura-blur)"
            />
            <path
              d={flowD}
              fill="none"
              stroke={gradUrl}
              strokeWidth={0.35}
              strokeLinecap="round"
              opacity={0.56}
            />
            <path
              d={flowD}
              fill="none"
              stroke="rgba(255,255,255,0.72)"
              strokeWidth={0.2}
              strokeLinecap="round"
              opacity={0.78}
            />
            <FlowEnergyPulses
              pathId={pathId}
              d={flowD}
              fill="rgba(230,238,255,0.92)"
              durSec={4.9}
              staggerSec={1.2}
              radius={0.27}
              count={3}
            />
          </g>
        );
      })}

      {/* ── Directional flow arrows ───────────────────────────────────── */}
      {FLOW_ARROWS.map((arrow) => {
        const a = byId.get(arrow.from);
        const b = byId.get(arrow.to);
        if (!a || !b) return null;

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const angle = Math.atan2(dy, dx);

        const chevrons: { cx: number; cy: number; ang: number; op: number }[] = [];
        for (let i = 0; i < arrow.count; i++) {
          const t = arrow.startT + (arrow.endT - arrow.startT) * (i / Math.max(arrow.count - 1, 1));
          const cx = a.x + dx * t;
          const cy = a.y + dy * t;
          const fade = 1 - Math.abs(t - 0.5) * 0.5;
          chevrons.push({ cx, cy, ang: angle, op: arrow.opacity * fade });
        }

        if (arrow.reverse) {
          const revAngle = angle + Math.PI;
          const midT = (arrow.startT + arrow.endT) / 2;
          const offset = (arrow.endT - arrow.startT) * 0.15;
          for (let i = 0; i < Math.max(arrow.count - 1, 1); i++) {
            const t = (midT - offset) + (offset * 2) * (i / Math.max(arrow.count - 2, 1));
            const perpDist = 3.5;
            const px = -Math.sin(angle) * perpDist;
            const py = Math.cos(angle) * perpDist;
            const cx = a.x + dx * t + px;
            const cy = a.y + dy * t + py;
            chevrons.push({ cx, cy, ang: revAngle, op: arrow.opacity * 0.35 });
          }
        }

        return (
          <g key={`arrow-${arrow.from}-${arrow.to}`}>
            {chevrons.map((ch, ci) => {
              const d = chevronPath(ch.cx, ch.cy, ch.ang, arrow.size);
              return (
                <g key={ci}>
                  <path
                    d={d}
                    fill={arrow.glowColor}
                    filter="url(#pm-arrow-glow)"
                  />
                  <path
                    d={d}
                    fill={arrow.color}
                    opacity={ch.op}
                  />
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  Annotation rendering
 * ═══════════════════════════════════════════════════════════════════════════ */

const ANNOTATION_STYLES: Record<
  AnnotationType,
  {
    bg: string;
    border: string;
    shadow: string;
    fontSize: number;
    px: number;
    py: number;
    radius: number;
    color: string;
    letterSpacing: string;
  }
> = {
  plaque: {
    bg: "linear-gradient(180deg, rgba(30,38,62,0.88) 0%, rgba(18,22,40,0.92) 100%)",
    border: "1px solid rgba(148,163,184,0.22)",
    shadow: [
      "inset 0 1px 0 rgba(255,255,255,0.08)",
      "inset 0 -1px 0 rgba(0,0,0,0.18)",
      "0 2px 6px rgba(0,0,0,0.35)",
    ].join(", "),
    fontSize: 9,
    px: 7,
    py: 2.5,
    radius: 4,
    color: "rgba(203,213,225,0.88)",
    letterSpacing: "0.06em",
  },
  callout: {
    bg: "linear-gradient(180deg, rgba(30,38,62,0.85) 0%, rgba(18,22,40,0.90) 100%)",
    border: "1px solid rgba(148,163,184,0.18)",
    shadow: [
      "inset 0 1px 0 rgba(255,255,255,0.06)",
      "0 2px 8px rgba(0,0,0,0.30)",
    ].join(", "),
    fontSize: 9,
    px: 8,
    py: 3,
    radius: 5,
    color: "rgba(203,213,225,0.82)",
    letterSpacing: "0.04em",
  },
  caption: {
    bg: "transparent",
    border: "none",
    shadow: "none",
    fontSize: 8,
    px: 0,
    py: 0,
    radius: 0,
    color: "rgba(148,163,184,0.55)",
    letterSpacing: "0.05em",
  },
};

function ProcessMapAnnotations() {
  const byId = new Map(PROCESS_NODES.map((n) => [n.id, n]));

  return (
    <>
      {Object.entries(NODE_ANNOTATIONS).map(([nodeId, annotations]) => {
        const node = byId.get(nodeId);
        if (!node) return null;

        return annotations.map((ann, i) => {
          const style = ANNOTATION_STYLES[ann.type];
          const ax = node.x + (ann.offsetX ?? 0);
          const ay = node.y + (ann.offsetY ?? 0);

          return (
            <div
              key={`${nodeId}-ann-${i}`}
              className="pointer-events-none absolute z-30"
              style={{
                left: `${ax}%`,
                top: `${ay}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <span
                className="inline-flex items-center whitespace-nowrap font-semibold"
                style={{
                  background: style.bg,
                  border: style.border,
                  boxShadow: style.shadow,
                  fontSize: style.fontSize,
                  paddingLeft: style.px,
                  paddingRight: style.px,
                  paddingTop: style.py,
                  paddingBottom: style.py,
                  borderRadius: style.radius,
                  color: style.color,
                  letterSpacing: style.letterSpacing,
                }}
              >
                {ann.text}
              </span>
            </div>
          );
        });
      })}

      {MAP_CAPTIONS.map((cap, i) => {
        const style = ANNOTATION_STYLES.caption;
        return (
          <div
            key={`caption-${i}`}
            className="pointer-events-none absolute z-30"
            style={{
              left: `${cap.x}%`,
              top: `${cap.y}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <span
              className="inline-flex items-center whitespace-nowrap italic"
              style={{
                fontSize: style.fontSize,
                color: style.color,
                letterSpacing: style.letterSpacing,
              }}
            >
              {cap.text}
            </span>
          </div>
        );
      })}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  Reusable chrome plaque — engraved title plates and descriptor panels
 *
 *  variant:
 *    "title"   — larger, bolder, for section/board titles
 *    "label"   — compact, for descriptive callout panels
 * ═══════════════════════════════════════════════════════════════════════════ */

type PlaqueVariant = "title" | "label";

function ProcessMapPlaque({
  text,
  lines,
  x,
  y,
  variant = "title",
  offsetXPx = 0,
  offsetYPx = 0,
}: {
  /** Single-line plaque */
  text?: string;
  /** Multi-line plaque (each entry is one row); overrides `text` when set */
  lines?: string[];
  x: number;
  y: number;
  variant?: PlaqueVariant;
  /** Nudge from anchor after %-centering (e.g. +15 moves 15px right) */
  offsetXPx?: number;
  offsetYPx?: number;
}) {
  const isTitle = variant === "title";
  const rows = lines?.length ? lines : text ? [text] : [];

  return (
    <div
      className="pointer-events-none absolute z-30"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: `translate(calc(-50% + ${offsetXPx}px), calc(-50% + ${offsetYPx}px))`,
      }}
    >
      {/* Outer frame shell */}
      <div
        className="relative"
        style={{
          padding: isTitle ? "3px" : "2px",
          borderRadius: isTitle ? 8 : 6,
          background:
            "linear-gradient(180deg, rgba(55,65,95,0.70) 0%, rgba(28,33,55,0.80) 100%)",
          boxShadow: [
            "0 2px 10px rgba(0,0,0,0.45)",
            "0 0 20px rgba(99,102,241,0.06)",
            "inset 0 1px 0 rgba(148,163,184,0.12)",
          ].join(", "),
        }}
      >
        {/* Inner panel */}
        <div
          className={cn(
            "relative flex flex-col items-center justify-center text-center",
            rows.length <= 1 && "whitespace-nowrap",
          )}
          style={{
            borderRadius: isTitle ? 6 : 4,
            background:
              "linear-gradient(180deg, rgba(22,28,48,0.92) 0%, rgba(14,18,34,0.96) 100%)",
            border: "1px solid rgba(100,116,160,0.18)",
            paddingLeft: isTitle ? 18 : 10,
            paddingRight: isTitle ? 18 : 10,
            paddingTop: isTitle ? 7 : rows.length > 1 ? 6 : 4,
            paddingBottom: isTitle ? 7 : rows.length > 1 ? 6 : 4,
            gap: rows.length > 1 ? 2 : 0,
            boxShadow: [
              "inset 0 1px 0 rgba(148,163,184,0.10)",
              "inset 0 -1px 0 rgba(0,0,0,0.22)",
              "inset 0 0 8px rgba(99,102,241,0.04)",
            ].join(", "),
          }}
        >
          {/* Top bevel highlight line */}
          <span
            className="pointer-events-none absolute"
            style={{
              top: 1,
              left: "12%",
              right: "12%",
              height: "1px",
              borderRadius: "1px",
              background:
                "linear-gradient(90deg, transparent 0%, rgba(148,163,184,0.18) 30%, rgba(148,163,184,0.18) 70%, transparent 100%)",
            }}
          />
          {/* Text — one or more rows */}
          <span
            className="relative flex flex-col items-center font-bold uppercase leading-tight"
            style={{
              fontSize: isTitle ? 13 : 9,
              letterSpacing: isTitle ? "0.14em" : "0.08em",
              color: isTitle
                ? "rgba(203,213,225,0.90)"
                : "rgba(203,213,225,0.78)",
              textShadow: "0 1px 2px rgba(0,0,0,0.30)",
            }}
          >
            {rows.map((line, i) => (
              <span key={i} className="block">
                {line}
              </span>
            ))}
          </span>
          {/* Bottom bevel shadow line */}
          <span
            className="pointer-events-none absolute"
            style={{
              bottom: 1,
              left: "12%",
              right: "12%",
              height: "1px",
              borderRadius: "1px",
              background:
                "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.20) 30%, rgba(0,0,0,0.20) 70%, transparent 100%)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  Board chrome — title banners and fixed UI elements
 * ═══════════════════════════════════════════════════════════════════════════ */

function ProcessMapChrome() {
  return (
    <>
      <div
        className="pointer-events-none absolute z-30"
        style={{
          left: "69.5%",
          top: "4%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <span
          className="inline-flex items-center whitespace-nowrap font-semibold uppercase"
          style={{
            fontSize: 16,
            letterSpacing: "0.12em",
            color: "rgba(226,232,240,0.94)",
            textShadow: "0 1px 3px rgba(0,0,0,0.42)",
          }}
        >
          Be a Disciple Worth Reproducing
        </span>
      </div>
      <ProcessMapPlaque text="Discipleship Process" x={46} y={96} variant="title" />
      <ProcessMapPlaque
        lines={["My story, C2J, SHEMA,", "PRAYER WALK"]}
        x={54}
        y={15}
        variant="label"
        offsetXPx={15}
      />
      <ProcessMapPlaque
        lines={["PERSON OF PEACE", "2 HR/WK", "(4 MONTHS EACH)"]}
        x={66}
        y={30}
        variant="label"
        offsetXPx={40}
      />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */

function ProcessMapBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">

      {/* ── 1 · DEEP SPACE BASE ─────────────────────────────────────────── */}
      <div
        className="absolute inset-0"
        style={{
          background: [
            "linear-gradient(155deg, #040810 0%, #080e1e 18%, #0c1430 38%, #111a3a 52%, #1a1340 68%, #120c28 82%, #06080e 100%)",
          ].join(", "),
        }}
      />
      {/* Secondary depth layer — cross-gradient for dimensionality */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 120% 100% at 30% 40%, rgba(15,22,50,0.60) 0%, transparent 60%)",
        }}
      />

      {/* ── 2 · NEBULA CLOUDS ───────────────────────────────────────────── */}
      {/* Large blue-indigo cloud mass — left/center (identity + practice area) */}
      <div
        className="absolute"
        style={{
          left: "10%",
          top: "25%",
          width: "60%",
          height: "70%",
          transform: "translate(-10%, -15%) rotate(-8deg)",
          background:
            "radial-gradient(ellipse 100% 80% at 40% 50%, rgba(49,46,129,0.42) 0%, rgba(30,27,75,0.22) 35%, transparent 70%)",
          filter: "blur(30px)",
        }}
      />
      {/* Warm magenta-red nebula — right side (model → transformed corridor), stronger on the right */}
      <div
        className="absolute"
        style={{
          left: "48%",
          top: "28%",
          width: "58%",
          height: "64%",
          transform: "translate(0%, -5%) rotate(5deg)",
          background:
            "radial-gradient(ellipse 95% 100% at 62% 48%, rgba(127,29,29,0.48) 0%, rgba(88,28,135,0.32) 38%, rgba(34,12,48,0.14) 58%, transparent 76%)",
          filter: "blur(38px)",
        }}
      />
      {/* Secondary magenta bloom — tighter, brighter core in corridor */}
      <div
        className="absolute"
        style={{
          left: "62%",
          top: "42%",
          width: "30%",
          height: "35%",
          transform: "translate(-10%, -10%)",
          background:
            "radial-gradient(ellipse 80% 80% at 50% 50%, rgba(157,23,77,0.28) 0%, rgba(120,20,100,0.10) 50%, transparent 75%)",
          filter: "blur(22px)",
        }}
      />
      {/* Teal-cyan haze — upper left (practice cluster) */}
      <div
        className="absolute"
        style={{
          left: "0%",
          top: "-5%",
          width: "45%",
          height: "45%",
          background:
            "radial-gradient(ellipse 80% 90% at 40% 40%, rgba(22,78,99,0.32) 0%, rgba(15,60,80,0.12) 45%, transparent 70%)",
          filter: "blur(25px)",
        }}
      />
      {/* Deep violet mist — lower center (watch area) */}
      <div
        className="absolute"
        style={{
          left: "25%",
          top: "55%",
          width: "45%",
          height: "50%",
          background:
            "radial-gradient(ellipse 100% 80% at 50% 50%, rgba(76,29,149,0.28) 0%, rgba(49,10,100,0.14) 40%, transparent 68%)",
          filter: "blur(28px)",
        }}
      />
      {/* Green emergence cloud — far right (transformed + new33 area) */}
      <div
        className="absolute"
        style={{
          left: "66%",
          top: "48%",
          width: "44%",
          height: "58%",
          background:
            "radial-gradient(ellipse 85% 92% at 52% 44%, rgba(6,78,59,0.38) 0%, rgba(16,120,90,0.22) 38%, rgba(6,95,70,0.12) 52%, transparent 70%)",
          filter: "blur(28px)",
        }}
      />

      {/* Localized turbulent pockets — Model / Assist (53%, 42%) */}
      <div
        className="absolute"
        style={{
          left: "53%",
          top: "42%",
          width: "46%",
          height: "48%",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            animation: "pm-map-turbulence-pulse 16s ease-in-out infinite",
            background:
              "radial-gradient(ellipse 55% 60% at 42% 45%, rgba(220,60,50,0.35) 0%, rgba(120,30,80,0.18) 45%, transparent 68%)",
            filter: "blur(42px)",
            mixBlendMode: "screen",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            animation: "pm-map-turbulence-pulse 22s ease-in-out infinite 1.5s",
            background:
              "radial-gradient(ellipse 70% 55% at 58% 55%, rgba(168,85,247,0.28) 0%, rgba(80,20,60,0.15) 50%, transparent 72%)",
            filter: "blur(36px)",
            mixBlendMode: "plus-lighter",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            animation: "pm-map-turbulence-pulse 19s ease-in-out infinite 0.7s",
            background:
              "conic-gradient(from 210deg at 50% 50%, transparent 0%, rgba(255,180,160,0.12) 18%, transparent 35%, rgba(90,20,40,0.14) 55%, transparent 80%)",
            filter: "blur(28px)",
            opacity: 0.85,
            mixBlendMode: "soft-light",
          }}
        />
      </div>

      {/* Localized turbulent pockets — Transformed Person (80%, 55%) */}
      <div
        className="absolute"
        style={{
          left: "80%",
          top: "55%",
          width: "48%",
          height: "52%",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            animation: "pm-map-turbulence-pulse 18s ease-in-out infinite 0.4s",
            background:
              "radial-gradient(ellipse 58% 62% at 48% 48%, rgba(34,197,94,0.42) 0%, rgba(6,95,70,0.22) 42%, transparent 70%)",
            filter: "blur(44px)",
            mixBlendMode: "screen",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            animation: "pm-map-turbulence-pulse 24s ease-in-out infinite",
            background:
              "radial-gradient(ellipse 75% 50% at 62% 58%, rgba(52,211,153,0.32) 0%, rgba(20,83,45,0.16) 48%, transparent 74%)",
            filter: "blur(38px)",
            mixBlendMode: "plus-lighter",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            animation: "pm-map-turbulence-pulse 14s ease-in-out infinite 2.2s",
            background:
              "radial-gradient(ellipse 40% 70% at 72% 40%, rgba(167,243,208,0.22) 0%, transparent 55%)",
            filter: "blur(22px)",
            mixBlendMode: "soft-light",
          }}
        />
      </div>

      {/* ── 3 · ENERGY LIGHT ZONES ──────────────────────────────────────── */}
      {/* Identity core — bright indigo energy (x:24, y:40) */}
      <div
        className="absolute animate-[pulse_12s_ease-in-out_infinite]"
        style={{
          left: "24%",
          top: "40%",
          width: "36%",
          height: "48%",
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(ellipse 70% 65% at 50% 50%, rgba(99,102,241,0.38) 0%, rgba(129,140,248,0.16) 40%, transparent 72%)",
        }}
      />
      {/* Model/Assist — warm red energy (x:53, y:42) */}
      <div
        className="absolute"
        style={{
          left: "53%",
          top: "42%",
          width: "34%",
          height: "42%",
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(ellipse 68% 72% at 48% 48%, rgba(220,38,38,0.36) 0%, rgba(190,18,60,0.2) 40%, rgba(127,29,29,0.08) 58%, transparent 76%)",
        }}
      />
      {/* Transformed — green energy bloom (x:80, y:55) */}
      <div
        className="absolute animate-[pulse_15s_ease-in-out_infinite_2s]"
        style={{
          left: "80%",
          top: "55%",
          width: "42%",
          height: "52%",
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(ellipse 72% 68% at 50% 50%, rgba(22,163,74,0.42) 0%, rgba(34,197,94,0.22) 38%, rgba(6,78,59,0.1) 55%, transparent 76%)",
        }}
      />
      {/* Watch phase — blue shield glow (x:46, y:74) */}
      <div
        className="absolute"
        style={{
          left: "46%",
          top: "74%",
          width: "30%",
          height: "38%",
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(ellipse 60% 70% at 50% 50%, rgba(37,99,235,0.28) 0%, rgba(59,130,246,0.12) 45%, transparent 70%)",
        }}
      />
      {/* Practice cluster glow — soft cyan (centered on pray: x:24, y:11) */}
      <div
        className="absolute"
        style={{
          left: "24%",
          top: "14%",
          width: "42%",
          height: "28%",
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(ellipse 90% 70% at 50% 50%, rgba(56,189,248,0.22) 0%, transparent 65%)",
        }}
      />

      {/* ── 3b · DIAGONAL ENERGY SWEEP (TL → BR) ─────────────────────────── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(128deg, transparent 36%, rgba(199,210,254,0.04) 47%, rgba(167,139,250,0.09) 49.5%, rgba(224,231,255,0.07) 50.5%, rgba(99,102,241,0.06) 52%, transparent 64%)",
          backgroundSize: "240% 240%",
          animation: "pm-map-energy-sweep 30s ease-in-out infinite",
          mixBlendMode: "screen",
          filter: "blur(14px)",
        }}
      />

      {/* ── 4 · DIRECTIONAL LIGHT STREAKS ───────────────────────────────── */}
      {/* Primary diagonal streak — upper-left to center-right (main flow) */}
      <div
        className="absolute"
        style={{
          left: "5%",
          top: "10%",
          width: "75%",
          height: "55%",
          transform: "rotate(-18deg)",
          background:
            "linear-gradient(90deg, transparent 0%, rgba(99,102,241,0.10) 20%, rgba(139,92,246,0.16) 45%, rgba(99,102,241,0.08) 70%, transparent 100%)",
          filter: "blur(18px)",
        }}
      />
      {/* Secondary streak — model → transformed corridor */}
      <div
        className="absolute"
        style={{
          left: "38%",
          top: "22%",
          width: "55%",
          height: "40%",
          transform: "rotate(10deg)",
          background:
            "linear-gradient(90deg, transparent 0%, rgba(217,70,239,0.08) 25%, rgba(168,85,247,0.14) 50%, rgba(34,197,94,0.08) 80%, transparent 100%)",
          filter: "blur(20px)",
        }}
      />
      {/* Tertiary streak — identity down to watch (vertical flow) */}
      <div
        className="absolute"
        style={{
          left: "18%",
          top: "28%",
          width: "28%",
          height: "58%",
          transform: "rotate(4deg)",
          background:
            "linear-gradient(180deg, transparent 0%, rgba(99,102,241,0.10) 25%, rgba(59,130,246,0.14) 55%, rgba(37,99,235,0.06) 80%, transparent 100%)",
          filter: "blur(14px)",
        }}
      />
      {/* Bright accent ray — crosses from practice area toward model */}
      <div
        className="absolute"
        style={{
          left: "20%",
          top: "6%",
          width: "50%",
          height: "20%",
          transform: "rotate(-5deg)",
          background:
            "linear-gradient(90deg, transparent 5%, rgba(224,231,255,0.06) 25%, rgba(199,210,254,0.12) 50%, rgba(224,231,255,0.05) 75%, transparent 95%)",
          filter: "blur(10px)",
        }}
      />

      {/* ── 5 · AMBIENT GRAIN ───────────────────────────────────────────── */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.04]" aria-hidden>
        <defs>
          <filter id="pm-bg-noise">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.65"
              numOctaves="4"
              stitchTiles="stitch"
            />
          </filter>
        </defs>
        <rect width="100%" height="100%" filter="url(#pm-bg-noise)" />
      </svg>

      {/* Right-biased animated turbulence — reads as denser energy on the corridor side */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.085]"
        style={{ mixBlendMode: "soft-light" }}
        aria-hidden
      >
        <defs>
          <linearGradient id="pm-bg-turb-fade" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="black" stopOpacity="0" />
            <stop offset="38%" stopColor="black" stopOpacity="0.15" />
            <stop offset="100%" stopColor="white" stopOpacity="1" />
          </linearGradient>
          <mask id="pm-bg-turb-mask">
            <rect width="100%" height="100%" fill="url(#pm-bg-turb-fade)" />
          </mask>
          <filter id="pm-bg-turb-anim" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.018 0.055"
              numOctaves="4"
              seed="7"
              stitchTiles="stitch"
              result="t"
            >
              <animate
                attributeName="baseFrequency"
                dur="56s"
                values="0.014 0.048;0.022 0.062;0.016 0.05;0.014 0.048"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feColorMatrix
              in="t"
              type="matrix"
              values="0.35 0 0 0 0.12  0 0.28 0 0 0.08  0 0 0.42 0 0.18  0 0 0 0.55 0"
              result="c"
            />
            <feGaussianBlur in="c" stdDeviation="0.6" />
          </filter>
        </defs>
        <rect width="100%" height="100%" filter="url(#pm-bg-turb-anim)" mask="url(#pm-bg-turb-mask)" />
      </svg>

      {/* ── 6 · DEPTH PARTICLES — stars & cosmic dust ───────────────────── */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 400 250"
        preserveAspectRatio="none"
        aria-hidden
      >
        {/* Bright stars — larger, fewer */}
        {[
          [18,12],[62,8],[124,14],[198,6],[285,11],[348,9],[380,18],
          [32,48],[88,42],[156,38],[220,52],[310,44],[370,56],
          [12,78],[72,82],[140,74],[195,86],[265,72],[330,88],[392,76],
          [45,112],[105,118],[178,108],[248,120],[318,106],[375,122],
          [22,148],[82,142],[160,152],[230,138],[295,154],[360,146],
          [35,178],[100,184],[168,172],[240,188],[305,176],[385,182],
          [15,212],[68,208],[135,218],[205,206],[275,222],[340,210],[395,216],
          [50,238],[115,242],[185,234],[260,246],[328,236],[390,244],
        ].map(([cx, cy], i) => (
          <circle
            key={`s-${i}`}
            cx={cx}
            cy={cy}
            r={i % 7 === 0 ? 0.7 : i % 4 === 0 ? 0.5 : 0.3}
            fill="white"
            opacity={i % 7 === 0 ? 0.40 : i % 4 === 0 ? 0.25 : 0.12 + (i % 5) * 0.03}
          />
        ))}
        {/* Faint dust specks — tiny, numerous, low opacity */}
        {[
          [8,4],[28,18],[48,32],[75,22],[95,48],[118,8],[142,55],[165,28],
          [188,45],[210,15],[235,58],[258,35],[280,48],[305,18],[328,55],
          [352,28],[375,42],[395,12],
          [15,68],[42,85],[65,72],[90,98],[112,65],[138,92],[162,78],
          [185,105],[208,88],[232,68],[255,95],[278,82],[300,62],[325,98],
          [350,72],[378,95],
          [10,125],[38,138],[60,118],[85,145],[108,128],[132,148],[158,132],
          [180,155],[202,138],[228,122],[252,148],[275,132],[298,152],
          [322,128],[348,145],[372,138],[395,128],
          [20,168],[45,182],[68,175],[92,195],[115,165],[140,192],[165,178],
          [190,200],[215,168],[238,195],[262,178],[288,202],[312,185],
          [335,168],[360,195],[388,175],
          [12,225],[35,235],[58,215],[82,240],[108,220],[130,245],[155,228],
          [180,238],[205,225],[228,248],[252,232],[278,215],[302,242],
          [325,228],[350,215],[378,238],[396,222],
        ].map(([cx, cy], i) => (
          <circle
            key={`d-${i}`}
            cx={cx}
            cy={cy}
            r={0.2}
            fill="white"
            opacity={0.06 + (i % 4) * 0.02}
          />
        ))}
      </svg>

      {/* ── 6b · TONAL ASYMMETRY (less flat field) ──────────────────────── */}
      {/* Bottom-left: deeper anchor */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 62% 58% at 4% 96%, rgba(0,0,0,0.55) 0%, rgba(2,4,12,0.28) 42%, transparent 62%)",
          mixBlendMode: "multiply",
        }}
      />
      {/* Mid-right: lift — growth / corridor side */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 48% 58% at 71% 46%, rgba(230,237,255,0.11) 0%, rgba(129,140,248,0.07) 38%, rgba(99,102,241,0.04) 52%, transparent 68%)",
          mixBlendMode: "screen",
        }}
      />

      {/* ── 7 · CINEMATIC VIGNETTE ──────────────────────────────────────── */}
      {/* Primary vignette — strong outer darkening */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 55% 58% at 44% 44%, transparent 28%, rgba(4,6,14,0.48) 64%, rgba(2,3,8,0.82) 100%)",
        }}
      />
      {/* Corner darkening — extra weight in corners (BL slightly eased vs multiply layer) */}
      <div
        className="absolute inset-0"
        style={{
          background: [
            "radial-gradient(ellipse 38% 42% at 0% 0%, rgba(2,3,8,0.65) 0%, transparent 70%)",
            "radial-gradient(ellipse 38% 42% at 100% 0%, rgba(2,3,8,0.55) 0%, transparent 70%)",
            "radial-gradient(ellipse 44% 40% at 0% 100%, rgba(2,3,8,0.48) 0%, transparent 72%)",
            "radial-gradient(ellipse 38% 38% at 100% 100%, rgba(2,3,8,0.50) 0%, transparent 70%)",
          ].join(", "),
        }}
      />
      {/* Subtle inner glow — brightens identity / practice focal area */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 34% 28% at 38% 40%, rgba(99,102,241,0.065) 0%, transparent 72%)",
        }}
      />
    </div>
  );
}

export function ProcessMapCanvas() {
  return (
    <div
      className="relative mx-auto w-full max-w-[1200px] overflow-hidden rounded-xl border border-white/[0.06]"
      style={{ aspectRatio: "16 / 10" }}
    >
      <ProcessMapBackground />
      <ProcessMapConnections />
      <ProcessMapAnnotations />
      <ProcessMapChrome />
      {PROCESS_NODES.map((n) => (
        <ProcessNode
          key={n.id}
          id={n.id}
          label={n.label}
          x={n.x}
          y={n.y}
          href={n.href}
          size={n.size}
          type={n.type}
          child={n.child}
        />
      ))}
    </div>
  );
}
