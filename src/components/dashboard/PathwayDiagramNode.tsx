"use client";

import { Caveat } from "next/font/google";
import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

const handLetter = Caveat({
  subsets: ["latin"],
  weight: ["600", "700"],
});

// ─── Editable defaults (match spec) ─────────────────────────────────────────
const NODE_LABEL_DEFAULT = "ME";
const NODE_SUBTEXT_DEFAULT = "Disciple";
const NODE_SHAPE_DEFAULT = "oval" as const;
const NODE_WIDTH_DEFAULT = 120;
const NODE_HEIGHT_DEFAULT = 130;
const NODE_STROKE_COLOR_DEFAULT = "blue";
const NODE_POSITIONING_DEFAULT = "absolute" as const;

// ─── Locked style tokens (illustrated / whiteboard) ─────────────────────────
/** Label ink — readable, not pure black */
const INK_CHARCOAL = "#3d4f5c";
const INK_CHARCOAL_SOFT = "#5a6b78";
/** Outer ring: light pastel blue (must stay visible; too pale reads as “black only” on top stroke). */
/** Maps tokens to pastel rings; pass hex in strokeColor to override. */
function resolveStrokeColor(token: string): string {
  const t = token.trim().toLowerCase();
  if (t === "blue") return "#a8daf0";
  /** Slightly darker pastel blue than `blue` (e.g. PRAYER vs ME) */
  if (t === "blue-deep") return "#88c2e8";
  if (t === "purple") return "#d8ccf2";
  if (t === "green") return "#b8e8c8";
  /** Dark pastel yellow / gold (e.g. SHARE) */
  if (t === "yellow-deep") return "#d4c26a";
  if (t === "red") return "#e89898";
  if (t === "orange") return "#f5c9a0";
  return token;
}

/** Inner marker outline — charcoal (not pure black) for crisp definition */
const OUTLINE_CHARCOAL = "#1a1f24";
/** Pastel ring width (SVG user units); was +10 then −7 per layout pass */
const PASTEL_STROKE_WIDTH = 10.45;

export type PathwayDiagramNodeShape = "circle" | "oval" | "rounded-rect";

export type PathwayDiagramNodeProps = {
  label?: string;
  /** Omit or pass `undefined` for label-only nodes */
  subtext?: string;
  shape?: PathwayDiagramNodeShape;
  width?: number;
  height?: number;
  strokeColor?: string;
  /** Label size in SVG units; defaults from height when omitted */
  labelFontSize?: number;
  /** For parent layout only; does not alter internal geometry */
  positioning?: typeof NODE_POSITIONING_DEFAULT;
  icon?: ReactNode;
  className?: string;
  /** Optional id prefix for SVG defs (multiple nodes on one canvas) */
  idPrefix?: string;
  /** Added to pastel ring only (SVG user units ≈ px at 1:1) */
  pastelStrokeExtraPx?: number;
  /** Rotate only the outline (pastel + charcoal); label stays horizontal. Degrees, e.g. -45 */
  shapeRotationDeg?: number;
};

/** Deterministic micro-wobble so edges feel hand-drawn, not CAD-perfect. */
function wobbleAt(t: number, phase: number, amp: number): number {
  return (
    Math.sin(t * 4.17 + phase) * 0.55 +
    Math.sin(t * 7.03 - phase * 0.7) * 0.35 +
    Math.cos(t * 2.91 + 1.2) * 0.25
  ) * amp;
}

function wobblyEllipsePath(cx: number, cy: number, rx: number, ry: number): string {
  const n = 36;
  const parts: string[] = [];
  for (let i = 0; i <= n; i++) {
    const u = (i / n) * Math.PI * 2;
    const wx = (wobbleAt(u, 0.4, 1) / 100) * rx;
    const wy = (wobbleAt(u + 1.1, 0.9, 1) / 100) * ry;
    const x = cx + (rx + wx) * Math.cos(u);
    const y = cy + (ry + wy) * Math.sin(u);
    parts.push(i === 0 ? `M ${x.toFixed(2)} ${y.toFixed(2)}` : `L ${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  parts.push("Z");
  return parts.join(" ");
}

function sampleLine(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  steps: number,
  seed: number,
): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [];
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const px = x0 + dx * t;
    const py = y0 + dy * t;
    const o = wobbleAt(t * 9 + seed, seed * 0.71, 1) * 0.52;
    pts.push({ x: px + nx * o, y: py + ny * o });
  }
  return pts;
}

function sampleArc(
  cx: number,
  cy: number,
  r: number,
  a0: number,
  a1: number,
  steps: number,
  seed: number,
): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = a0 + (a1 - a0) * t;
    const rr = r + wobbleAt(a * 4 + seed, seed * 0.55, 0.55) * 0.65;
    pts.push({ x: cx + rr * Math.cos(a), y: cy + rr * Math.sin(a) });
  }
  return pts;
}

function appendPoints(
  acc: { x: number; y: number }[],
  next: { x: number; y: number }[],
) {
  for (const p of next) {
    const q = acc[acc.length - 1];
    if (!q || Math.hypot(p.x - q.x, p.y - q.y) > 0.35) acc.push(p);
  }
}

function wobblyRoundedRectPath(x: number, y: number, w: number, h: number, r: number): string {
  const c = Math.min(r, w / 2 - 2, h / 2 - 2);
  const pts: { x: number; y: number }[] = [];
  appendPoints(pts, sampleLine(x + c, y, x + w - c, y, 14, 1));
  appendPoints(pts, sampleArc(x + w - c, y + c, c, -Math.PI / 2, 0, 7, 2));
  appendPoints(pts, sampleLine(x + w, y + c, x + w, y + h - c, 12, 3));
  appendPoints(pts, sampleArc(x + w - c, y + h - c, c, 0, Math.PI / 2, 7, 4));
  appendPoints(pts, sampleLine(x + w - c, y + h, x + c, y + h, 14, 5));
  appendPoints(pts, sampleArc(x + c, y + h - c, c, Math.PI / 2, Math.PI, 7, 6));
  appendPoints(pts, sampleLine(x, y + h - c, x, y + c, 12, 7));
  appendPoints(pts, sampleArc(x + c, y + c, c, Math.PI, (3 * Math.PI) / 2, 7, 8));
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ");
  return `${d} Z`;
}

function shapePath(
  shape: PathwayDiagramNodeShape,
  w: number,
  h: number,
): { d: string; labelCy: number } {
  const cx = w / 2;
  const cy = h / 2;
  if (shape === "circle") {
    const r = Math.min(w, h) / 2 - 2;
    return { d: wobblyEllipsePath(cx, cy, r, r), labelCy: cy };
  }
  if (shape === "oval") {
    return { d: wobblyEllipsePath(cx, cy, w / 2 - 2, h / 2 - 2), labelCy: cy };
  }
  const rr = Math.min(w, h) * 0.18;
  return { d: wobblyRoundedRectPath(2, 2, w - 4, h - 4, rr), labelCy: cy };
}

function softFill(hex: string): string {
  if (hex.toLowerCase() === "white" || hex === "#fff" || hex === "#ffffff") return "#fffef8";
  return hex;
}

/** “3 HR/WK” — optional split so digit + letters share one explicit font size (script fonts). */
function splitLeadingNumberSubtext(s: string): { num: string; rest: string } | null {
  const m = /^(\d+(?:\.\d+)?)\s+(.+)$/.exec(s.trim());
  return m ? { num: m[1], rest: m[2] } : null;
}

/**
 * Single pathway diagram node — illustrated whiteboard style only.
 * Does not position itself on a canvas; parent supplies layout.
 */
export function PathwayDiagramNode({
  label = NODE_LABEL_DEFAULT,
  subtext,
  shape = NODE_SHAPE_DEFAULT,
  width = NODE_WIDTH_DEFAULT,
  height = NODE_HEIGHT_DEFAULT,
  strokeColor = NODE_STROKE_COLOR_DEFAULT,
  labelFontSize,
  positioning = NODE_POSITIONING_DEFAULT,
  icon,
  className,
  idPrefix = "pathway-node",
  pastelStrokeExtraPx = 0,
  shapeRotationDeg,
}: PathwayDiagramNodeProps) {
  const resolvedSubtext = subtext ?? (label === NODE_LABEL_DEFAULT ? NODE_SUBTEXT_DEFAULT : undefined);
  const svgH = height;
  const accentStroke = resolveStrokeColor(strokeColor);
  const resolvedLabelSize = labelFontSize ?? (height < 88 ? 26 : 32);
  const { d, labelCy } = shapePath(shape, width, height);

  /** Very small ovals: thick pastel + displacement filter can erase the ring in some engines */
  const minDim = Math.min(width, height);
  const compactPastel = minDim < 65;
  const pastelStrokeW =
    (compactPastel
      ? Math.min(6.2, Math.max(3, minDim * 0.12))
      : PASTEL_STROKE_WIDTH) + pastelStrokeExtraPx;
  const charcoalStrokeW = compactPastel ? 1.45 : 1.65;

  const labelLines = label.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
  const isMultiline = labelLines.length > 1;
  const multilineLead = resolvedLabelSize * 1.08;
  const labelForA11y = label.replace(/\n/g, " ").replace(/\s+/g, " ").trim();

  const subtextLines =
    resolvedSubtext
      ?.split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0) ?? [];
  const isSubtextMultiline = subtextLines.length > 1;
  const subtextFontSize = 17;
  const subtextLead = subtextFontSize * 1.06;
  const subtextForA11y = resolvedSubtext?.replace(/\n/g, " ").replace(/\s+/g, " ").trim();

  const rot = shapeRotationDeg ?? 0;
  const shapeCx = width / 2;
  const shapeCy = height / 2;
  const shapeTransform = rot !== 0 ? `rotate(${rot} ${shapeCx} ${shapeCy})` : undefined;

  return (
    <div
      data-positioning={positioning}
      className={cn("inline-block", handLetter.className, className)}
      style={{ width, minWidth: width }}
    >
      <svg
        width={width}
        height={svgH}
        viewBox={`0 0 ${width} ${svgH}`}
        overflow="visible"
        role="img"
        aria-label={resolvedSubtext ? `${labelForA11y} — ${subtextForA11y}` : labelForA11y}
      >
        <defs>
          {/* Pastel stroke is centered on the path; clip to shape interior so it can’t extend past the outer charcoal edge */}
          <clipPath id={`${idPrefix}-pastel-clip`} clipPathUnits="userSpaceOnUse">
            <path d={d} />
          </clipPath>
          {/* Subtle wobble on pastel only — reads hand-drawn; charcoal stays crisp */}
          <filter
            id={`${idPrefix}-pastel-hand`}
            x="-35%"
            y="-35%"
            width="170%"
            height="170%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.038 0.068"
              numOctaves="2"
              seed="41"
              result="turb"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="turb"
              scale="1.28"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>

        {/* Strokes only — optional rotation; label group below stays horizontal */}
        <g transform={shapeTransform}>
          {compactPastel ? (
            <path
              d={d}
              fill="none"
              stroke={accentStroke}
              strokeWidth={pastelStrokeW}
              strokeLinejoin="round"
              strokeLinecap="round"
              opacity={1}
              clipPath={`url(#${idPrefix}-pastel-clip)`}
            />
          ) : (
            <g
              clipPath={`url(#${idPrefix}-pastel-clip)`}
              filter={`url(#${idPrefix}-pastel-hand)`}
            >
              <path
                d={d}
                fill="none"
                stroke={accentStroke}
                strokeWidth={pastelStrokeW * 1.12}
                strokeLinejoin="round"
                strokeLinecap="round"
                opacity={0.38}
                transform="translate(0.55 -0.4)"
              />
              <path
                d={d}
                fill="none"
                stroke={accentStroke}
                strokeWidth={pastelStrokeW}
                strokeLinejoin="round"
                strokeLinecap="round"
                opacity={0.97}
              />
            </g>
          )}
          <path
            d={d}
            fill="none"
            stroke={OUTLINE_CHARCOAL}
            strokeWidth={charcoalStrokeW}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </g>

        {/* Label + subtext inside shape; optional icon above — not rotated with shape */}
        <g style={{ fontFamily: "inherit" }}>
          {icon ? (
            <g transform={`translate(${width / 2}, ${labelCy - 32})`} textAnchor="middle">
              {icon}
            </g>
          ) : null}
          {isMultiline ? (
            <text
              x={width / 2 + 0.5}
              y={labelCy + (icon ? 2 : 0)}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={INK_CHARCOAL}
              style={{
                fontFamily: "inherit",
                fontWeight: 700,
                letterSpacing: "0.04em",
              }}
            >
              {labelLines.map((line, i) => (
                <tspan
                  key={i}
                  x={width / 2 + 0.5}
                  dy={
                    i === 0
                      ? -((labelLines.length - 1) * multilineLead) / 2
                      : multilineLead
                  }
                  style={{
                    fontSize: i > 0 ? resolvedLabelSize * 0.92 : resolvedLabelSize,
                  }}
                >
                  {line}
                </tspan>
              ))}
            </text>
          ) : (
            <text
              x={width / 2 + 0.5}
              y={labelCy + (icon ? 2 : 0)}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={INK_CHARCOAL}
              style={{
                fontFamily: "inherit",
                fontSize: resolvedLabelSize,
                fontWeight: 700,
                letterSpacing: "0.04em",
              }}
            >
              {label}
            </text>
          )}
          {resolvedSubtext ? (
            <text
              x={width / 2 + 0.5}
              y={
                labelCy +
                (icon ? 26 : 18) +
                (isMultiline ? ((labelLines.length - 1) * multilineLead) / 2 + multilineLead * 0.25 : 0) +
                (isSubtextMultiline ? subtextLead * 0.35 : 0)
              }
              textAnchor="middle"
              dominantBaseline="middle"
              fill={INK_CHARCOAL_SOFT}
              style={{
                fontFamily: "inherit",
                fontSize: subtextFontSize,
                fontWeight: 500,
                letterSpacing: "0.02em",
                /** Match digit cap-height to letters (e.g. “3 HR/WK”) in script faces */
                fontVariantNumeric: "lining-nums",
                fontFeatureSettings: '"lnum" 1',
              }}
            >
              {isSubtextMultiline ? (
                subtextLines.map((line, i) => (
                  <tspan
                    key={i}
                    x={width / 2 + 0.5}
                    dy={
                      i === 0
                        ? -((subtextLines.length - 1) * subtextLead) / 2
                        : subtextLead
                    }
                  >
                    {line}
                  </tspan>
                ))
              ) : (
                (() => {
                  const split = splitLeadingNumberSubtext(resolvedSubtext);
                  if (split) {
                    return (
                      <>
                        <tspan style={{ fontSize: subtextFontSize }}>{split.num}</tspan>
                        <tspan style={{ fontSize: subtextFontSize }}> </tspan>
                        <tspan style={{ fontSize: subtextFontSize }}>{split.rest}</tspan>
                      </>
                    );
                  }
                  return resolvedSubtext;
                })()
              )}
            </text>
          ) : null}
        </g>
      </svg>
    </div>
  );
}
