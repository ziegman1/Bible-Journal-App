"use client";

import { cn } from "@/lib/utils";
import type { ProcessNodeType } from "@/lib/process-map/nodes";

/** Base palette — tuned for material passes (shells, cores, rims) */
type SvgPalette = {
  g0: string;
  g1: string;
  stroke: string;
  strokeWidth: number;
  text: string;
  childG0?: string;
  childG1?: string;
  childStroke?: string;
  childText?: string;
};

const SVG_PALETTE: Record<ProcessNodeType, SvgPalette> = {
  identity: {
    g0: "#d8d2c6",
    g1: "#5d523f",
    stroke: "rgba(60,52,40,0.85)",
    strokeWidth: 2,
    text: "#faf8f5",
  },
  practice: {
    g0: "#d3d8e2",
    g1: "#555d72",
    stroke: "rgba(70,78,95,0.85)",
    strokeWidth: 1.75,
    text: "#f8fafc",
    childG0: "#eef1f6",
    childG1: "#8a92a8",
    childStroke: "rgba(90,98,118,0.55)",
    childText: "#f8fafc",
  },
  chat: {
    g0: "#d0ccdf",
    g1: "#645a84",
    stroke: "rgba(75,65,100,0.82)",
    strokeWidth: 1.75,
    text: "#fafafa",
    childG0: "#e8e4f0",
    childG1: "#9088a8",
    childStroke: "rgba(95,88,120,0.5)",
    childText: "#f8fafc",
  },
  community: {
    g0: "#e3c252",
    g1: "#7d560f",
    stroke: "rgba(110,75,8,0.88)",
    strokeWidth: 2,
    text: "#fffbeb",
  },
  watch: {
    g0: "#9eb8d4",
    g1: "#1e3a5c",
    stroke: "rgba(20,45,80,0.9)",
    strokeWidth: 2,
    text: "#f0f7ff",
  },
  model: {
    g0: "#d8a888",
    g1: "#5c3018",
    stroke: "rgba(80,40,20,0.88)",
    strokeWidth: 2,
    text: "#fff5f0",
  },
  transformed: {
    g0: "#96e3b6",
    g1: "#0f5e2f",
    stroke: "rgba(12,70,36,0.9)",
    strokeWidth: 2,
    text: "#f0fdf4",
  },
  new33: {
    g0: "#5fce9f",
    g1: "#0a5f3a",
    stroke: "rgba(8,90,52,0.85)",
    strokeWidth: 1.75,
    text: "#ecfdf5",
  },
};

function splitLabelLines(label: string): string[] {
  if (label.includes(" / ")) return label.split(" / ");
  if (label === "Transformed Person") return ["TRANSFORMED", "PERSON"];
  if (label === "Watch Phase") return ["WATCH", "PHASE"];
  if (label === "My 3/3 Family") return ["MY 3/3", "FAMILY"];
  if (label === "New 3/3") return ["NEW", "3/3"];
  return [label];
}

type Props = {
  id: string;
  type: ProcessNodeType;
  isChild: boolean;
  w: number;
  h: number;
  label: string;
  fontSize: number;
  hasHref: boolean;
};

export function ProcessNodeSvgVisual({
  id,
  type,
  isChild,
  w,
  h,
  label,
  fontSize,
  hasHref,
}: Props) {
  const pal = SVG_PALETTE[type];
  const g0 = isChild && pal.childG0 ? pal.childG0 : pal.g0;
  const g1 = isChild && pal.childG1 ? pal.childG1 : pal.g1;
  const stroke = isChild && pal.childStroke ? pal.childStroke : pal.stroke;
  const sw = isChild ? Math.max(1, pal.strokeWidth - 0.5) : pal.strokeWidth;
  const textFill = isChild && pal.childText ? pal.childText : pal.text;
  const lines = splitLabelLines(label);
  const renderInlineLabel = type !== "identity" && type !== "transformed";
  const lineHeight = fontSize * 1.15;
  const textStartY =
    h / 2 - ((lines.length - 1) * lineHeight) / 2 + fontSize * 0.35;
  const rxTorso = Math.min(w, h) * 0.22;
  const inset = sw;

  const rxE = (w - inset * 2) / 2;
  const ryE = (h - inset * 2) / 2;
  const cx = w / 2;
  const cy = h / 2;

  const specScale = isChild ? 0.55 : 1;

  const shapeEl = (() => {
    /* ── IDENTITY: armored shell + glowing core ───────────────────── */
    if (type === "identity") {
      const rx = Math.min(rxTorso, w / 2 - inset, h / 2 - inset);
      const clipId = `pm-clip-id-${id}`;
      const shellId = `pm-id-shell-${id}`;
      const coreId = `pm-id-core-${id}`;
      const rimId = `pm-id-rim-${id}`;
      const shadeId = `pm-id-shade-${id}`;
      const filtId = `pm-id-filt-${id}`;
      return (
        <g filter={`url(#${filtId})`}>
          <defs>
            <clipPath id={clipId}>
              <rect
                x={inset}
                y={inset}
                width={w - inset * 2}
                height={h - inset * 2}
                rx={rx}
                ry={rx}
              />
            </clipPath>
            <linearGradient id={shellId} x1="15%" y1="12%" x2="88%" y2="92%">
              <stop offset="0%" stopColor="#2a2418" />
              <stop offset="35%" stopColor="#3d3428" />
              <stop offset="100%" stopColor="#1a1510" />
            </linearGradient>
            <radialGradient
              id={coreId}
              cx="38%"
              cy="34%"
              r="62%"
              gradientUnits="objectBoundingBox"
            >
              <stop offset="0%" stopColor="#f8f0dc" stopOpacity="0.95" />
              <stop offset="35%" stopColor="#c4a574" stopOpacity="0.85" />
              <stop offset="70%" stopColor="#6b5a3e" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#2c2618" stopOpacity="0" />
              <animateTransform
                attributeName="gradientTransform"
                type="rotate"
                from="0 0.5 0.5"
                to="360 0.5 0.5"
                dur="22s"
                repeatCount="indefinite"
                additive="sum"
              />
            </radialGradient>
            <linearGradient id={rimId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,248,230,0.55)" />
              <stop offset="22%" stopColor="rgba(255,245,220,0.12)" />
              <stop offset="55%" stopColor="rgba(0,0,0,0)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.45)" />
            </linearGradient>
            <linearGradient id={shadeId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.14)" />
              <stop offset="40%" stopColor="rgba(255,255,255,0)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.5)" />
            </linearGradient>
            <radialGradient id={`pm-id-chest-${id}`} cx="50%" cy="56%" r="26%">
              <stop offset="0%" stopColor="rgba(224,236,255,0.82)" />
              <stop offset="55%" stopColor="rgba(180,205,255,0.34)" />
              <stop offset="100%" stopColor="rgba(180,205,255,0)" />
            </radialGradient>
            <radialGradient id={`pm-id-swirl-${id}`} cx="46%" cy="52%" r="58%">
              <stop offset="0%" stopColor="rgba(196,216,255,0.08)" />
              <stop offset="55%" stopColor="rgba(196,216,255,0.05)" />
              <stop offset="100%" stopColor="rgba(196,216,255,0)" />
              <animateTransform
                attributeName="gradientTransform"
                type="rotate"
                from="0 0.5 0.5"
                to="360 0.5 0.5"
                dur="34s"
                repeatCount="indefinite"
              />
            </radialGradient>
            <radialGradient id={`pm-id-human-fade-${id}`} cx="50%" cy="56%" r="56%">
              <stop offset="0%" stopColor="white" stopOpacity="1" />
              <stop offset="48%" stopColor="white" stopOpacity="0.72" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
            <mask id={`pm-id-human-mask-${id}`}>
              <rect width={w} height={h} fill={`url(#pm-id-human-fade-${id})`} />
            </mask>
            <radialGradient id={`pm-id-human-core-${id}`} cx="50%" cy="54%" r="38%">
              <stop offset="0%" stopColor="rgba(255,249,228,0.95)" />
              <stop offset="45%" stopColor="rgba(235,226,198,0.62)" />
              <stop offset="100%" stopColor="rgba(235,226,198,0)" />
            </radialGradient>
            <linearGradient id={`pm-id-plate-${id}`} x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="rgba(250,242,222,0.36)" />
              <stop offset="45%" stopColor="rgba(232,216,184,0.26)" />
              <stop offset="100%" stopColor="rgba(184,162,124,0.14)" />
            </linearGradient>
            <radialGradient id={`pm-id-plate-core-${id}`} cx="50%" cy="45%" r="62%">
              <stop offset="0%" stopColor="rgba(255,244,216,0.38)" />
              <stop offset="100%" stopColor="rgba(255,244,216,0)" />
            </radialGradient>
            <linearGradient id={`pm-id-shoulder-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(246,236,210,0.35)" />
              <stop offset="100%" stopColor="rgba(246,236,210,0)" />
            </linearGradient>
            <radialGradient id={`pm-id-shield-${id}`} cx="42%" cy="50%" r="58%">
              <stop offset="0%" stopColor="rgba(255,242,214,0.30)" />
              <stop offset="65%" stopColor="rgba(255,232,190,0.16)" />
              <stop offset="100%" stopColor="rgba(255,232,190,0)" />
            </radialGradient>
            <linearGradient id={`pm-id-shield-rim-${id}`} x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="rgba(255,252,236,0.36)" />
              <stop offset="100%" stopColor="rgba(255,252,236,0)" />
            </linearGradient>
            <linearGradient id={`pm-id-sword-${id}`} x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,246,226,0)" />
              <stop offset="20%" stopColor="rgba(255,246,226,0.42)" />
              <stop offset="50%" stopColor="rgba(255,246,226,0.6)" />
              <stop offset="80%" stopColor="rgba(255,246,226,0.34)" />
              <stop offset="100%" stopColor="rgba(255,246,226,0)" />
            </linearGradient>
            <filter id={`pm-id-human-soft-${id}`} x="-35%" y="-35%" width="170%" height="170%">
              <feGaussianBlur stdDeviation="0.7" />
            </filter>
            <filter id={filtId} x="-25%" y="-25%" width="150%" height="150%">
              <feDropShadow
                dx="-1.5"
                dy="-1.5"
                stdDeviation="1.2"
                floodColor="#fff8e8"
                floodOpacity="0.35"
              />
              <feDropShadow
                dx="3"
                dy="4"
                stdDeviation="3"
                floodColor="#000"
                floodOpacity="0.55"
              />
            </filter>
          </defs>
          <g clipPath={`url(#${clipId})`}>
            <rect
              x={inset}
              y={inset}
              width={w - inset * 2}
              height={h - inset * 2}
              rx={rx}
              ry={rx}
              fill={`url(#${shellId})`}
            />
            <rect
              x={inset}
              y={inset}
              width={w - inset * 2}
              height={h - inset * 2}
              rx={rx}
              ry={rx}
              fill={`url(#${coreId})`}
            />
            <rect
              x={inset}
              y={inset}
              width={w - inset * 2}
              height={h - inset * 2}
              rx={rx}
              ry={rx}
              fill={`url(#${rimId})`}
              style={{ mixBlendMode: "soft-light" }}
            />
            <rect
              x={inset}
              y={inset}
              width={w - inset * 2}
              height={h - inset * 2}
              rx={rx}
              ry={rx}
              fill={`url(#${shadeId})`}
              style={{ mixBlendMode: "multiply" }}
            />
            <ellipse
              cx={cx}
              cy={cy}
              rx={rxE * 0.82}
              ry={ryE * 0.82}
              fill={`url(#pm-id-swirl-${id})`}
              style={{ mixBlendMode: "screen" }}
            />
            {/* integrated light-warrior: symbolic geometry, soft projections */}
            <ellipse
              cx={cx}
              cy={cy + ryE * 0.08}
              rx={rxE * 0.45}
              ry={ryE * 0.52}
              fill={`url(#pm-id-human-core-${id})`}
              opacity={0.56}
              style={{ mixBlendMode: "screen" }}
            />
            <g
              opacity={0.48}
              mask={`url(#pm-id-human-mask-${id})`}
              filter={`url(#pm-id-human-soft-${id})`}
              style={{ mixBlendMode: "screen" }}
            >
              <circle
                cx={cx}
                cy={cy - ryE * 0.36}
                r={Math.max(2, Math.min(rxE, ryE) * 0.1)}
                fill="rgba(232,240,255,0.95)"
              />
              <path
                d={`
                  M ${cx - rxE * 0.08} ${cy - ryE * 0.22}
                  C ${cx - rxE * 0.15} ${cy - ryE * 0.13}, ${cx - rxE * 0.24} ${cy - ryE * 0.08}, ${cx - rxE * 0.35} ${cy - ryE * 0.03}
                  C ${cx - rxE * 0.43} ${cy + ryE * 0.03}, ${cx - rxE * 0.47} ${cy + ryE * 0.10}, ${cx - rxE * 0.37} ${cy + ryE * 0.16}
                  C ${cx - rxE * 0.28} ${cy + ryE * 0.21}, ${cx - rxE * 0.20} ${cy + ryE * 0.31}, ${cx - rxE * 0.16} ${cy + ryE * 0.45}
                  C ${cx - rxE * 0.15} ${cy + ryE * 0.62}, ${cx - rxE * 0.26} ${cy + ryE * 0.78}, ${cx - rxE * 0.36} ${cy + ryE * 0.91}
                  C ${cx - rxE * 0.28} ${cy + ryE * 0.95}, ${cx - rxE * 0.15} ${cy + ryE * 0.95}, ${cx - rxE * 0.06} ${cy + ryE * 0.88}
                  L ${cx - rxE * 0.03} ${cy + ryE * 0.75}
                  L ${cx} ${cy + ryE * 0.92}
                  L ${cx + rxE * 0.03} ${cy + ryE * 0.75}
                  C ${cx + rxE * 0.06} ${cy + ryE * 0.88}, ${cx + rxE * 0.15} ${cy + ryE * 0.95}, ${cx + rxE * 0.28} ${cy + ryE * 0.95}
                  C ${cx + rxE * 0.36} ${cy + ryE * 0.91}, ${cx + rxE * 0.26} ${cy + ryE * 0.78}, ${cx + rxE * 0.15} ${cy + ryE * 0.62}
                  C ${cx + rxE * 0.16} ${cy + ryE * 0.45}, ${cx + rxE * 0.20} ${cy + ryE * 0.31}, ${cx + rxE * 0.28} ${cy + ryE * 0.21}
                  C ${cx + rxE * 0.37} ${cy + ryE * 0.16}, ${cx + rxE * 0.47} ${cy + ryE * 0.10}, ${cx + rxE * 0.43} ${cy + ryE * 0.03}
                  C ${cx + rxE * 0.35} ${cy - ryE * 0.03}, ${cx + rxE * 0.24} ${cy - ryE * 0.08}, ${cx + rxE * 0.15} ${cy - ryE * 0.13}
                  C ${cx + rxE * 0.12} ${cy - ryE * 0.17}, ${cx + rxE * 0.10} ${cy - ryE * 0.20}, ${cx + rxE * 0.08} ${cy - ryE * 0.22}
                  Z
                `}
                fill="rgba(220,232,255,0.92)"
              />
              {/* armor cues: chest plate + shoulder pads + soft segment seams */}
              <path
                d={`
                  M ${cx - rxE * 0.20} ${cy - ryE * 0.01}
                  L ${cx + rxE * 0.20} ${cy - ryE * 0.01}
                  L ${cx + rxE * 0.14} ${cy + ryE * 0.28}
                  L ${cx - rxE * 0.14} ${cy + ryE * 0.28}
                  Z
                `}
                fill={`url(#pm-id-plate-${id})`}
              />
              <path
                d={`
                  M ${cx - rxE * 0.18} ${cy + ryE * 0.00}
                  L ${cx + rxE * 0.18} ${cy + ryE * 0.00}
                  L ${cx + rxE * 0.13} ${cy + ryE * 0.30}
                  L ${cx - rxE * 0.13} ${cy + ryE * 0.30}
                  Z
                `}
                fill={`url(#pm-id-plate-core-${id})`}
              />
              <line
                x1={cx - rxE * 0.14}
                y1={cy + ryE * 0.01}
                x2={cx + rxE * 0.14}
                y2={cy + ryE * 0.01}
                stroke="rgba(255,245,220,0.24)"
                strokeWidth={0.9}
                strokeLinecap="round"
              />
              <path
                d={`
                  M ${cx - rxE * 0.27} ${cy - ryE * 0.02}
                  Q ${cx - rxE * 0.35} ${cy + ryE * 0.06} ${cx - rxE * 0.21} ${cy + ryE * 0.12}
                  Q ${cx - rxE * 0.17} ${cy + ryE * 0.03} ${cx - rxE * 0.27} ${cy - ryE * 0.02}
                  Z
                `}
                fill={`url(#pm-id-shoulder-${id})`}
              />
              <path
                d={`
                  M ${cx + rxE * 0.27} ${cy - ryE * 0.02}
                  Q ${cx + rxE * 0.35} ${cy + ryE * 0.06} ${cx + rxE * 0.21} ${cy + ryE * 0.12}
                  Q ${cx + rxE * 0.17} ${cy + ryE * 0.03} ${cx + rxE * 0.27} ${cy - ryE * 0.02}
                  Z
                `}
                fill={`url(#pm-id-shoulder-${id})`}
              />
              <line
                x1={cx}
                y1={cy + ryE * 0.00}
                x2={cx}
                y2={cy + ryE * 0.30}
                stroke="rgba(245,250,255,0.2)"
                strokeWidth={0.9}
                strokeLinecap="round"
              />
              <line
                x1={cx - rxE * 0.08}
                y1={cy + ryE * 0.13}
                x2={cx + rxE * 0.08}
                y2={cy + ryE * 0.13}
                stroke="rgba(245,250,255,0.16)"
                strokeWidth={0.8}
                strokeLinecap="round"
              />
            </g>
            {/* shield projection: soft left defensive field */}
            <ellipse
              cx={cx - rxE * 0.36}
              cy={cy + ryE * 0.12}
              rx={rxE * 0.17}
              ry={ryE * 0.22}
              fill={`url(#pm-id-shield-${id})`}
              filter={`url(#pm-id-human-soft-${id})`}
              style={{ mixBlendMode: "screen" }}
            />
            <ellipse
              cx={cx - rxE * 0.40}
              cy={cy + ryE * 0.12}
              rx={rxE * 0.14}
              ry={ryE * 0.19}
              fill="none"
              stroke={`url(#pm-id-shield-rim-${id})`}
              strokeWidth={0.9}
              style={{ mixBlendMode: "screen" }}
              opacity={0.55}
            />
            {/* sword projection: thin angled energy blade */}
            <line
              x1={cx + rxE * 0.28}
              y1={cy + ryE * 0.14}
              x2={cx + rxE * 0.52}
              y2={cy - ryE * 0.23}
              stroke={`url(#pm-id-sword-${id})`}
              strokeWidth={1.05}
              strokeLinecap="round"
              filter={`url(#pm-id-human-soft-${id})`}
              style={{ mixBlendMode: "screen" }}
            />
            <ellipse
              cx={cx}
              cy={cy + ryE * 0.97}
              rx={rxE * 0.26}
              ry={ryE * 0.08}
              fill="rgba(235,226,198,0.22)"
              style={{ mixBlendMode: "screen" }}
            />
            <circle
              cx={cx}
              cy={cy + ryE * 0.14}
              r={Math.max(2.6, Math.min(rxE, ryE) * 0.2)}
              fill={`url(#pm-id-chest-${id})`}
              opacity={0.7}
            />
          </g>
          <rect
            x={inset + sw * 0.35}
            y={inset + sw * 0.35}
            width={w - inset * 2 - sw * 0.7}
            height={h - inset * 2 - sw * 0.7}
            rx={Math.max(rx - sw * 0.35, 0)}
            ry={Math.max(rx - sw * 0.35, 0)}
            fill="none"
            stroke="rgba(255,245,220,0.5)"
            strokeWidth={Math.max(0.8, sw * 0.45)}
          />
          <rect
            x={inset}
            y={inset}
            width={w - inset * 2}
            height={h - inset * 2}
            rx={rx}
            ry={rx}
            fill="none"
            stroke={stroke}
            strokeWidth={sw}
          />
        </g>
      );
    }

    /* ── PRACTICE: glass orb ─────────────────────────────────────── */
    if (type === "practice") {
      const gid = `pm-pr-glass-${id}`;
      const specId = `pm-pr-spec-${id}`;
      const edgeId = `pm-pr-edge-${id}`;
      const reflId = `pm-pr-refl-${id}`;
      const lightId = `pm-pr-light-${id}`;
      const blurId = `pm-pr-blur-${id}`;
      const s = specScale;
      return (
        <g>
          <defs>
            <linearGradient id={gid} x1="18%" y1="12%" x2="82%" y2="95%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
              <stop offset="18%" stopColor="rgba(210,218,232,0.42)" />
              <stop offset="45%" stopColor="rgba(100,110,135,0.55)" />
              <stop offset="100%" stopColor="rgba(35,42,58,0.88)" />
            </linearGradient>
            <radialGradient id={specId} cx="32%" cy="28%" r="48%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
              <stop offset="25%" stopColor="rgba(255,255,255,0.35)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>
            <linearGradient id={edgeId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.65)" />
              <stop offset="50%" stopColor="rgba(180,190,210,0.25)" />
              <stop offset="100%" stopColor="rgba(40,48,65,0.5)" />
            </linearGradient>
            <linearGradient id={reflId} x1="50%" y1="15%" x2="78%" y2="55%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
            <linearGradient id={lightId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.24)" />
              <stop offset="40%" stopColor="rgba(255,255,255,0.02)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.32)" />
            </linearGradient>
            <filter id={blurId} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="0.8" />
            </filter>
          </defs>
          <ellipse
            cx={cx}
            cy={cy}
            rx={rxE}
            ry={ryE}
            fill={`url(#${gid})`}
            stroke={`url(#${edgeId})`}
            strokeWidth={sw}
            strokeOpacity={0.92}
          />
          <ellipse
            cx={cx - rxE * 0.08}
            cy={cy - ryE * 0.12}
            rx={rxE * 0.55 * s}
            ry={ryE * 0.38 * s}
            fill={`url(#${specId})`}
            style={{ mixBlendMode: "screen" }}
          />
          <path
            d={`M ${cx - rxE * 0.35} ${cy - ryE * 0.55} A ${rxE * 0.72} ${ryE * 0.55} 0 0 1 ${cx + rxE * 0.5} ${cy - ryE * 0.15}`}
            fill="none"
            stroke={`url(#${reflId})`}
            strokeWidth={Math.max(1.2, 2.2 * s)}
            strokeLinecap="round"
            filter={`url(#${blurId})`}
            opacity={0.85 * s}
          />
          <ellipse
            cx={cx}
            cy={cy}
            rx={rxE * 0.98}
            ry={ryE * 0.98}
            fill={`url(#${lightId})`}
            style={{ mixBlendMode: "soft-light" }}
          />
        </g>
      );
    }

    /* ── CHAT: matte orb (less specular than practice) ───────────── */
    if (type === "chat") {
      const gid = `pm-ch-matte-${id}`;
      const softId = `pm-ch-soft-${id}`;
      const edgeId = `pm-ch-edge-${id}`;
      const lightId = `pm-ch-light-${id}`;
      const s = specScale * 0.72;
      return (
        <g>
          <defs>
            <linearGradient id={gid} x1="20%" y1="14%" x2="85%" y2="92%">
              <stop offset="0%" stopColor="rgba(200,192,220,0.92)" />
              <stop offset="40%" stopColor="rgba(110,98,140,0.88)" />
              <stop offset="100%" stopColor="rgba(38,32,58,0.94)" />
            </linearGradient>
            <radialGradient id={softId} cx="35%" cy="30%" r="50%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.28)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>
            <linearGradient id={edgeId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(230,225,245,0.4)" />
              <stop offset="100%" stopColor="rgba(50,42,75,0.45)" />
            </linearGradient>
            <linearGradient id={lightId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
              <stop offset="40%" stopColor="rgba(255,255,255,0.02)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.34)" />
            </linearGradient>
          </defs>
          <ellipse
            cx={cx}
            cy={cy}
            rx={rxE}
            ry={ryE}
            fill={`url(#${gid})`}
            stroke={`url(#${edgeId})`}
            strokeWidth={sw}
            strokeOpacity={0.88}
          />
          <ellipse
            cx={cx - rxE * 0.06}
            cy={cy - ryE * 0.1}
            rx={rxE * 0.5 * s}
            ry={ryE * 0.32 * s}
            fill={`url(#${softId})`}
            style={{ mixBlendMode: "soft-light" }}
          />
          <ellipse
            cx={cx}
            cy={cy}
            rx={rxE * 0.98}
            ry={ryE * 0.98}
            fill={`url(#${lightId})`}
            style={{ mixBlendMode: "soft-light" }}
          />
        </g>
      );
    }

    /* ── MODEL: forged metal oval ───────────────────────────────── */
    if (type === "model") {
      const baseId = `pm-mo-base-${id}`;
      const cavId = `pm-mo-cav-${id}`;
      const texId = `pm-mo-tex-${id}`;
      const rimId = `pm-mo-rim-${id}`;
      const lightId = `pm-mo-light-${id}`;
      const filtId = `pm-mo-filt-${id}`;
      return (
        <g filter={`url(#${filtId})`}>
          <defs>
            <linearGradient id={baseId} x1="12%" y1="10%" x2="90%" y2="94%">
              <stop offset="0%" stopColor="#c99872" />
              <stop offset="40%" stopColor="#6b3820" />
              <stop offset="100%" stopColor="#2a1408" />
            </linearGradient>
            <radialGradient id={cavId} cx="50%" cy="55%" r="65%">
              <stop offset="0%" stopColor="rgba(0,0,0,0.5)" />
              <stop offset="55%" stopColor="rgba(0,0,0,0.12)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>
            <linearGradient id={texId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.07)" />
              <stop offset="22%" stopColor="rgba(0,0,0,0.04)" />
              <stop offset="48%" stopColor="rgba(255,240,230,0.05)" />
              <stop offset="71%" stopColor="rgba(0,0,0,0.06)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.04)" />
            </linearGradient>
            <linearGradient id={rimId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,220,200,0.45)" />
              <stop offset="35%" stopColor="rgba(255,200,170,0.08)" />
              <stop offset="100%" stopColor="rgba(20,8,4,0.65)" />
            </linearGradient>
            <linearGradient id={lightId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,236,220,0.22)" />
              <stop offset="46%" stopColor="rgba(255,255,255,0.02)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.36)" />
            </linearGradient>
            <filter id={filtId} x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow
                dx="-2"
                dy="-2"
                stdDeviation="1.5"
                floodColor="#ffd4bc"
                floodOpacity="0.25"
              />
              <feDropShadow
                dx="4"
                dy="5"
                stdDeviation="4"
                floodColor="#000"
                floodOpacity="0.6"
              />
            </filter>
          </defs>
          <ellipse
            cx={cx}
            cy={cy}
            rx={rxE}
            ry={ryE}
            fill={`url(#${baseId})`}
            stroke={stroke}
            strokeWidth={sw + 0.5}
          />
          <ellipse
            cx={cx}
            cy={cy}
            rx={rxE * 0.92}
            ry={ryE * 0.92}
            fill={`url(#${cavId})`}
            style={{ mixBlendMode: "multiply" }}
          />
          <ellipse
            cx={cx}
            cy={cy}
            rx={rxE * 0.99}
            ry={ryE * 0.99}
            fill={`url(#${texId})`}
            style={{ mixBlendMode: "overlay" }}
          />
          <ellipse
            cx={cx}
            cy={cy}
            rx={rxE}
            ry={ryE}
            fill={`url(#${rimId})`}
            style={{ mixBlendMode: "overlay" }}
          />
          <ellipse
            cx={cx}
            cy={cy}
            rx={rxE * 0.99}
            ry={ryE * 0.99}
            fill={`url(#${lightId})`}
            style={{ mixBlendMode: "soft-light" }}
          />
          <ellipse
            cx={cx}
            cy={cy}
            rx={rxE * 0.98}
            ry={ryE * 0.98}
            fill="none"
            stroke="rgba(255,210,180,0.35)"
            strokeWidth={1.2}
          />
        </g>
      );
    }

    /* ── WATCH: shield-like lighting on oval ─────────────────────── */
    if (type === "watch") {
      const bodyId = `pm-wa-body-${id}`;
      const ridgeId = `pm-wa-ridge-${id}`;
      const tipId = `pm-wa-tip-${id}`;
      const edgeId = `pm-wa-edge-${id}`;
      const lightId = `pm-wa-light-${id}`;
      return (
        <g>
          <defs>
            <linearGradient id={bodyId} x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#c5d8ec" />
              <stop offset="35%" stopColor="#4a6fa0" />
              <stop offset="78%" stopColor="#1a3050" />
              <stop offset="100%" stopColor="#0c1828" />
            </linearGradient>
            <linearGradient id={ridgeId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="42%" stopColor="rgba(255,255,255,0)" />
              <stop offset="50%" stopColor="rgba(255,255,255,0.55)" />
              <stop offset="58%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
            <radialGradient id={tipId} cx="50%" cy="92%" r="55%">
              <stop offset="0%" stopColor="rgba(0,0,0,0.55)" />
              <stop offset="70%" stopColor="rgba(0,0,0,0.15)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>
            <linearGradient id={edgeId} x1="12%" y1="8%" x2="88%" y2="95%">
              <stop offset="0%" stopColor="rgba(200,225,255,0.5)" />
              <stop offset="100%" stopColor="rgba(8,24,48,0.55)" />
            </linearGradient>
            <linearGradient id={lightId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(220,235,255,0.2)" />
              <stop offset="45%" stopColor="rgba(255,255,255,0.01)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.34)" />
            </linearGradient>
          </defs>
          <ellipse
            cx={cx}
            cy={cy}
            rx={rxE}
            ry={ryE}
            fill={`url(#${bodyId})`}
            stroke={`url(#${edgeId})`}
            strokeWidth={sw}
          />
          <ellipse
            cx={cx}
            cy={cy}
            rx={rxE}
            ry={ryE}
            fill={`url(#${tipId})`}
            style={{ mixBlendMode: "multiply" }}
          />
          <rect
            x={cx - 1.25}
            y={cy - ryE * 0.92}
            width={2.5}
            height={ryE * 1.84}
            fill={`url(#${ridgeId})`}
            style={{ mixBlendMode: "screen" }}
          />
          <ellipse
            cx={cx}
            cy={cy}
            rx={rxE * 0.98}
            ry={ryE * 0.98}
            fill={`url(#${lightId})`}
            style={{ mixBlendMode: "soft-light" }}
          />
        </g>
      );
    }

    /* ── TRANSFORMED: polished capsule + inner ring + glow ─────── */
    if (type === "transformed") {
      const rx = Math.min(rxTorso, w / 2 - inset, h / 2 - inset);
      const clipId = `pm-tr-clip-${id}`;
      const surfId = `pm-tr-surf-${id}`;
      const veilId = `pm-tr-veil-${id}`;
      const glowId = `pm-tr-glow-${id}`;
      const filtId = `pm-tr-filt-${id}`;
      return (
        <g filter={`url(#${filtId})`}>
          <defs>
            <clipPath id={clipId}>
              <rect
                x={inset}
                y={inset}
                width={w - inset * 2}
                height={h - inset * 2}
                rx={rx}
                ry={rx}
              />
            </clipPath>
            <linearGradient id={surfId} x1="14%" y1="10%" x2="86%" y2="92%">
              <stop offset="0%" stopColor="#a8ecc4" />
              <stop offset="30%" stopColor="#3da86a" />
              <stop offset="70%" stopColor="#145a32" />
              <stop offset="100%" stopColor="#0a2816" />
            </linearGradient>
            <linearGradient id={veilId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
              <stop offset="45%" stopColor="rgba(255,255,255,0.06)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.4)" />
            </linearGradient>
            <radialGradient id={glowId} cx="50%" cy="38%" r="68%">
              <stop offset="0%" stopColor="rgba(180,255,210,0.55)" />
              <stop offset="60%" stopColor="rgba(40,160,90,0.12)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>
            <radialGradient id={`pm-tr-aura-${id}`} cx="50%" cy="52%" r="58%">
              <stop offset="0%" stopColor="rgba(180,255,210,0.38)" />
              <stop offset="70%" stopColor="rgba(80,210,140,0.12)" />
              <stop offset="100%" stopColor="rgba(80,210,140,0)" />
            </radialGradient>
            <linearGradient id={`pm-tr-human-${id}`} x1="28%" y1="18%" x2="74%" y2="90%">
              <stop offset="0%" stopColor="rgba(220,255,234,0.92)" />
              <stop offset="100%" stopColor="rgba(120,220,160,0.88)" />
            </linearGradient>
            <radialGradient id={`pm-tr-human-core-${id}`} cx="50%" cy="56%" r="34%">
              <stop offset="0%" stopColor="rgba(236,255,244,0.98)" />
              <stop offset="46%" stopColor="rgba(180,255,214,0.74)" />
              <stop offset="100%" stopColor="rgba(180,255,214,0)" />
            </radialGradient>
            <linearGradient id={`pm-tr-plate-${id}`} x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="rgba(225,255,236,0.5)" />
              <stop offset="45%" stopColor="rgba(170,245,206,0.34)" />
              <stop offset="100%" stopColor="rgba(74,200,136,0.18)" />
            </linearGradient>
            <radialGradient id={`pm-tr-plate-core-${id}`} cx="50%" cy="46%" r="62%">
              <stop offset="0%" stopColor="rgba(236,255,244,0.5)" />
              <stop offset="100%" stopColor="rgba(236,255,244,0)" />
            </radialGradient>
            <linearGradient id={`pm-tr-shoulder-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(220,255,236,0.46)" />
              <stop offset="100%" stopColor="rgba(220,255,236,0)" />
            </linearGradient>
            <radialGradient id={`pm-tr-shield-${id}`} cx="42%" cy="50%" r="58%">
              <stop offset="0%" stopColor="rgba(194,255,224,0.52)" />
              <stop offset="70%" stopColor="rgba(144,245,196,0.28)" />
              <stop offset="100%" stopColor="rgba(144,245,196,0)" />
            </radialGradient>
            <linearGradient id={`pm-tr-shield-rim-${id}`} x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="rgba(232,255,244,0.62)" />
              <stop offset="100%" stopColor="rgba(232,255,244,0)" />
            </linearGradient>
            <linearGradient id={`pm-tr-human-beam-${id}`} x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="rgba(220,255,236,0)" />
              <stop offset="22%" stopColor="rgba(220,255,236,0.22)" />
              <stop offset="50%" stopColor="rgba(220,255,236,0.36)" />
              <stop offset="78%" stopColor="rgba(220,255,236,0.22)" />
              <stop offset="100%" stopColor="rgba(220,255,236,0)" />
            </linearGradient>
            <radialGradient id={`pm-tr-human-top-${id}`} cx="50%" cy="24%" r="32%">
              <stop offset="0%" stopColor="rgba(240,255,246,0.44)" />
              <stop offset="100%" stopColor="rgba(240,255,246,0)" />
            </radialGradient>
            <filter id={`pm-tr-human-soft-${id}`} x="-35%" y="-35%" width="170%" height="170%">
              <feGaussianBlur stdDeviation="0.55" />
            </filter>
            <filter id={filtId} x="-35%" y="-35%" width="170%" height="170%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="b" />
              <feFlood floodColor="#4ade80" floodOpacity="0.35" result="f" />
              <feComposite in="f" in2="b" operator="in" result="g" />
              <feMerge>
                <feMergeNode in="g" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <g clipPath={`url(#${clipId})`}>
            <rect
              x={inset}
              y={inset}
              width={w - inset * 2}
              height={h - inset * 2}
              rx={rx}
              ry={rx}
              fill={`url(#${surfId})`}
            />
            <rect
              x={inset}
              y={inset}
              width={w - inset * 2}
              height={h - inset * 2}
              rx={rx}
              ry={rx}
              fill={`url(#${glowId})`}
              style={{ mixBlendMode: "screen" }}
            />
            <rect
              x={inset}
              y={inset}
              width={w - inset * 2}
              height={h - inset * 2}
              rx={rx}
              ry={rx}
              fill={`url(#${veilId})`}
              style={{ mixBlendMode: "soft-light" }}
            />
            <ellipse
              cx={cx}
              cy={cy}
              rx={rxE * 0.84}
              ry={ryE * 0.83}
              fill={`url(#pm-tr-aura-${id})`}
              style={{ mixBlendMode: "screen" }}
            />
            {/* transformed light-warrior: clearer symmetry and stronger definition */}
            <ellipse
              cx={cx}
              cy={cy + ryE * 0.08}
              rx={rxE * 0.43}
              ry={ryE * 0.55}
              fill={`url(#pm-tr-human-core-${id})`}
              opacity={0.72}
              style={{ mixBlendMode: "screen" }}
            />
            <g opacity={0.9} filter={`url(#pm-tr-human-soft-${id})`}>
              <circle
                cx={cx}
                cy={cy - ryE * 0.35}
                r={Math.max(2, Math.min(rxE, ryE) * 0.095)}
                fill={`url(#pm-tr-human-${id})`}
              />
              <path
                d={`
                  M ${cx - rxE * 0.09} ${cy - ryE * 0.25}
                  C ${cx - rxE * 0.16} ${cy - ryE * 0.14}, ${cx - rxE * 0.26} ${cy - ryE * 0.09}, ${cx - rxE * 0.39} ${cy - ryE * 0.03}
                  C ${cx - rxE * 0.48} ${cy + ryE * 0.02}, ${cx - rxE * 0.53} ${cy + ryE * 0.10}, ${cx - rxE * 0.42} ${cy + ryE * 0.18}
                  C ${cx - rxE * 0.32} ${cy + ryE * 0.24}, ${cx - rxE * 0.24} ${cy + ryE * 0.35}, ${cx - rxE * 0.18} ${cy + ryE * 0.52}
                  C ${cx - rxE * 0.16} ${cy + ryE * 0.69}, ${cx - rxE * 0.29} ${cy + ryE * 0.86}, ${cx - rxE * 0.42} ${cy + ryE * 1.01}
                  C ${cx - rxE * 0.31} ${cy + ryE * 1.05}, ${cx - rxE * 0.17} ${cy + ryE * 1.05}, ${cx - rxE * 0.06} ${cy + ryE * 0.97}
                  L ${cx - rxE * 0.03} ${cy + ryE * 0.79}
                  L ${cx} ${cy + ryE * 1.00}
                  L ${cx + rxE * 0.03} ${cy + ryE * 0.79}
                  C ${cx + rxE * 0.06} ${cy + ryE * 0.97}, ${cx + rxE * 0.17} ${cy + ryE * 1.05}, ${cx + rxE * 0.31} ${cy + ryE * 1.05}
                  C ${cx + rxE * 0.42} ${cy + ryE * 1.01}, ${cx + rxE * 0.29} ${cy + ryE * 0.86}, ${cx + rxE * 0.16} ${cy + ryE * 0.69}
                  C ${cx + rxE * 0.18} ${cy + ryE * 0.52}, ${cx + rxE * 0.24} ${cy + ryE * 0.35}, ${cx + rxE * 0.32} ${cy + ryE * 0.24}
                  C ${cx + rxE * 0.42} ${cy + ryE * 0.18}, ${cx + rxE * 0.53} ${cy + ryE * 0.10}, ${cx + rxE * 0.48} ${cy + ryE * 0.02}
                  C ${cx + rxE * 0.39} ${cy - ryE * 0.03}, ${cx + rxE * 0.26} ${cy - ryE * 0.09}, ${cx + rxE * 0.16} ${cy - ryE * 0.14}
                  C ${cx + rxE * 0.12} ${cy - ryE * 0.18}, ${cx + rxE * 0.10} ${cy - ryE * 0.22}, ${cx + rxE * 0.09} ${cy - ryE * 0.25}
                  Z
                `}
                fill={`url(#pm-tr-human-${id})`}
              />
              {/* abstract armor cues */}
              <path
                d={`
                  M ${cx - rxE * 0.22} ${cy - ryE * 0.02}
                  L ${cx + rxE * 0.22} ${cy - ryE * 0.02}
                  L ${cx + rxE * 0.15} ${cy + ryE * 0.31}
                  L ${cx - rxE * 0.15} ${cy + ryE * 0.31}
                  Z
                `}
                fill={`url(#pm-tr-plate-${id})`}
              />
              <path
                d={`
                  M ${cx - rxE * 0.20} ${cy + ryE * 0.01}
                  L ${cx + rxE * 0.20} ${cy + ryE * 0.01}
                  L ${cx + rxE * 0.14} ${cy + ryE * 0.29}
                  L ${cx - rxE * 0.14} ${cy + ryE * 0.29}
                  Z
                `}
                fill={`url(#pm-tr-plate-core-${id})`}
              />
              <line
                x1={cx - rxE * 0.15}
                y1={cy}
                x2={cx + rxE * 0.15}
                y2={cy}
                stroke="rgba(236,255,244,0.36)"
                strokeWidth={1}
                strokeLinecap="round"
              />
              <path
                d={`
                  M ${cx - rxE * 0.29} ${cy - ryE * 0.02}
                  Q ${cx - rxE * 0.38} ${cy + ryE * 0.07} ${cx - rxE * 0.23} ${cy + ryE * 0.13}
                  Q ${cx - rxE * 0.18} ${cy + ryE * 0.03} ${cx - rxE * 0.29} ${cy - ryE * 0.02}
                  Z
                `}
                fill={`url(#pm-tr-shoulder-${id})`}
              />
              <path
                d={`
                  M ${cx + rxE * 0.29} ${cy - ryE * 0.02}
                  Q ${cx + rxE * 0.38} ${cy + ryE * 0.07} ${cx + rxE * 0.23} ${cy + ryE * 0.13}
                  Q ${cx + rxE * 0.18} ${cy + ryE * 0.03} ${cx + rxE * 0.29} ${cy - ryE * 0.02}
                  Z
                `}
                fill={`url(#pm-tr-shoulder-${id})`}
              />
              <line
                x1={cx}
                y1={cy + ryE * 0.0}
                x2={cx}
                y2={cy + ryE * 0.34}
                stroke="rgba(220,255,236,0.34)"
                strokeWidth={1}
                strokeLinecap="round"
              />
              <line
                x1={cx - rxE * 0.09}
                y1={cy + ryE * 0.15}
                x2={cx + rxE * 0.09}
                y2={cy + ryE * 0.15}
                stroke="rgba(220,255,236,0.26)"
                strokeWidth={0.9}
                strokeLinecap="round"
              />
            </g>
            {/* shield projection (left): brighter and tighter than ME */}
            <ellipse
              cx={cx - rxE * 0.38}
              cy={cy + ryE * 0.14}
              rx={rxE * 0.18}
              ry={ryE * 0.23}
              fill={`url(#pm-tr-shield-${id})`}
              filter={`url(#pm-tr-human-soft-${id})`}
              style={{ mixBlendMode: "screen" }}
            />
            <ellipse
              cx={cx - rxE * 0.43}
              cy={cy + ryE * 0.14}
              rx={rxE * 0.15}
              ry={ryE * 0.2}
              fill="none"
              stroke={`url(#pm-tr-shield-rim-${id})`}
              strokeWidth={1.1}
              opacity={0.72}
              style={{ mixBlendMode: "screen" }}
            />
            <rect
              x={cx + rxE * 0.34}
              y={cy - ryE * 0.30}
              width={1.5}
              height={ryE * 0.78}
              fill={`url(#pm-tr-human-beam-${id})`}
              opacity={0.86}
              transform={`rotate(16 ${cx + rxE * 0.34} ${cy - ryE * 0.30})`}
              style={{ mixBlendMode: "screen" }}
            />
            <ellipse
              cx={cx}
              cy={cy + ryE * 1.04}
              rx={rxE * 0.3}
              ry={ryE * 0.09}
              fill="rgba(180,255,214,0.30)"
              style={{ mixBlendMode: "screen" }}
            />
            <ellipse
              cx={cx}
              cy={cy - ryE * 0.26}
              rx={rxE * 0.36}
              ry={ryE * 0.24}
              fill={`url(#pm-tr-human-top-${id})`}
              style={{ mixBlendMode: "screen" }}
            />
          </g>
          <rect
            x={inset + sw * 1.1}
            y={inset + sw * 1.1}
            width={w - inset * 2 - sw * 2.2}
            height={h - inset * 2 - sw * 2.2}
            rx={Math.max(rx - sw * 1.1, 1)}
            ry={Math.max(rx - sw * 1.1, 1)}
            fill="none"
            stroke="rgba(200,255,220,0.4)"
            strokeWidth={Math.max(1, sw * 0.5)}
          />
          <rect
            x={inset}
            y={inset}
            width={w - inset * 2}
            height={h - inset * 2}
            rx={rx}
            ry={rx}
            fill="none"
            stroke={stroke}
            strokeWidth={sw}
          />
        </g>
      );
    }

    /* ── COMMUNITY + NEW33: diagonal light, material depth ───────── */
    if (type === "community" || type === "new33") {
      const gid = `pm-misc-${id}`;
      const litId = `pm-misc-lit-${id}`;
      return (
        <g>
          <defs>
            <linearGradient id={gid} x1="12%" y1="8%" x2="88%" y2="95%">
              <stop offset="0%" stopColor={g0} />
              <stop offset="55%" stopColor={g1} />
              <stop offset="100%" stopColor={g1} />
            </linearGradient>
            <linearGradient id={litId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
              <stop offset="40%" stopColor="rgba(255,255,255,0)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.35)" />
            </linearGradient>
          </defs>
          <ellipse
            cx={cx}
            cy={cy}
            rx={rxE}
            ry={ryE}
            fill={`url(#${gid})`}
            stroke={stroke}
            strokeWidth={sw}
          />
          <ellipse
            cx={cx}
            cy={cy}
            rx={rxE * 0.98}
            ry={ryE * 0.98}
            fill={`url(#${litId})`}
            style={{ mixBlendMode: "soft-light" }}
          />
        </g>
      );
    }

    /* fallback */
    return null;
  })();

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className={cn(
        "pointer-events-none block overflow-visible transition-transform duration-200",
        hasHref && "group-hover/node:scale-[1.03]",
      )}
      aria-hidden
    >
      {shapeEl}
      {renderInlineLabel &&
        lines.map((line, i) => (
          <text
            key={i}
            x={w / 2}
            y={textStartY + i * lineHeight}
            textAnchor="middle"
            fill={textFill}
            style={{
              fontSize,
              fontWeight: isChild ? 600 : 700,
              letterSpacing: isChild ? "0.04em" : "0.06em",
              fontFamily: "system-ui, sans-serif",
              textTransform: "uppercase",
              paintOrder: "stroke fill",
              stroke: "rgba(0,0,0,0.22)",
              strokeWidth: isChild ? 0.25 : 0.35,
            }}
          >
            {line}
          </text>
        ))}
    </svg>
  );
}
