"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ProcessNodeType } from "@/lib/process-map/nodes";
import { useProcessMapScale } from "./process-map-scale-context";
import { ProcessNodeSvgVisual } from "./process-node-visual-svg";

/* ═══════════════════════════════════════════════════════════════════════════
 *  Outer glow (CSS) — complements SVG fills
 * ═══════════════════════════════════════════════════════════════════════════ */

type GlowTokens = {
  glow: string;
  hoverGlow: string;
  childGlow: string;
  childHoverGlow: string;
};

/** Key light top-left, fill shadow bottom-right — stacked with type tint */
function depthStack(
  tint: string,
  hoverTint: string,
  child: string,
  childHover: string,
): GlowTokens {
  const hi = "-3px -3px 10px rgba(255,255,255,0.14), -1px -1px 4px rgba(255,255,255,0.08)";
  const sh = "5px 6px 18px rgba(0,0,0,0.42), 2px 3px 8px rgba(0,0,0,0.28)";
  const hiSm = "-2px -2px 6px rgba(255,255,255,0.1)";
  const shSm = "3px 4px 12px rgba(0,0,0,0.38)";
  return {
    glow: `${tint}, ${hi}, ${sh}`,
    hoverGlow: `${hoverTint}, ${hi}, ${sh}`,
    childGlow: `${child}, ${hiSm}, ${shSm}`,
    childHoverGlow: `${childHover}, ${hiSm}, ${shSm}`,
  };
}

const nodeGlow: Record<ProcessNodeType, GlowTokens> = {
  identity: depthStack(
    "0 0 14px 4px rgba(170,152,116,0.18)",
    "0 0 22px 7px rgba(188,172,132,0.30)",
    "0 0 6px 2px rgba(170,152,116,0.08)",
    "0 0 10px 3px rgba(188,172,132,0.16)",
  ),
  practice: depthStack(
    "0 0 8px 2px rgba(140,150,170,0.12)",
    "0 0 13px 4px rgba(160,170,195,0.22)",
    "0 0 5px 1px rgba(140,150,170,0.08)",
    "0 0 9px 2px rgba(160,170,195,0.14)",
  ),
  chat: depthStack(
    "0 0 8px 2px rgba(138,128,160,0.12)",
    "0 0 13px 4px rgba(158,148,180,0.21)",
    "0 0 5px 1px rgba(138,128,160,0.08)",
    "0 0 9px 2px rgba(158,148,180,0.14)",
  ),
  community: depthStack(
    "0 0 9px 3px rgba(200,168,48,0.14)",
    "0 0 15px 5px rgba(220,188,68,0.24)",
    "0 0 5px 1px rgba(200,168,48,0.07)",
    "0 0 9px 2px rgba(220,188,68,0.14)",
  ),
  watch: depthStack(
    "0 0 14px 4px rgba(64,104,152,0.22)",
    "0 0 22px 7px rgba(84,124,172,0.36)",
    "0 0 6px 2px rgba(64,104,152,0.09)",
    "0 0 11px 3px rgba(84,124,172,0.18)",
  ),
  model: depthStack(
    "0 0 14px 4px rgba(168,96,64,0.22)",
    "0 0 22px 7px rgba(188,116,84,0.36)",
    "0 0 6px 2px rgba(168,96,64,0.09)",
    "0 0 11px 3px rgba(188,116,84,0.18)",
  ),
  transformed: depthStack(
    "0 0 22px 6px rgba(148,163,184,0.30)",
    "0 0 34px 11px rgba(203,213,225,0.46)",
    "0 0 8px 2px rgba(148,163,184,0.12)",
    "0 0 14px 4px rgba(203,213,225,0.24)",
  ),
  new33: depthStack(
    "0 0 9px 3px rgba(32,160,96,0.14)",
    "0 0 15px 5px rgba(48,180,112,0.24)",
    "0 0 5px 1px rgba(32,160,96,0.07)",
    "0 0 9px 2px rgba(48,180,112,0.14)",
  ),
};

/* ═══════════════════════════════════════════════════════════════════════════
 *  Shape geometry — unchanged; positions / sizes locked to map config
 * ═══════════════════════════════════════════════════════════════════════════ */

type ShapeGeometry = {
  w: number;
  h: number;
  radius: string;
};

function shapeFor(type: ProcessNodeType, size: number, isChild: boolean): ShapeGeometry {
  if (isChild) return { w: size, h: size, radius: "50%" };

  switch (type) {
    case "identity":
      return {
        w: size * 0.88,
        h: size * 1.20,
        radius: "42% 42% 38% 38% / 36% 36% 44% 44%",
      };
    case "practice":
    case "chat":
      /* SOAPS / PRAY / SHARE / CHAT — perfect circles (same diameter = size) */
      return { w: size, h: size, radius: "50%" };
    case "watch":
      /* Horizontal oval — same footprint as Model / Assist (vertical oval rotated 90°) */
      return {
        w: size * 1.15,
        h: size * 0.90,
        radius: "48% 48% 48% 48% / 50%",
      };
    case "model":
      return {
        w: size * 1.15,
        h: size * 0.90,
        radius: "48% 48% 48% 48% / 50%",
      };
    case "community":
      return { w: size, h: size, radius: "50%" };
    case "transformed":
      return {
        w: size * 0.82,
        h: size * 1.30,
        radius: "40% 40% 36% 36% / 32% 32% 42% 42%",
      };
    case "new33":
      return {
        w: size,
        h: size * 1.05,
        radius: "50%",
      };
    default:
      return { w: size, h: size, radius: "50%" };
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  ProcessNode — public component
 * ═══════════════════════════════════════════════════════════════════════════ */

type Props = {
  id: string;
  label: string;
  x: number;
  y: number;
  href?: string;
  size: number;
  type: ProcessNodeType;
  child?: boolean;
};

function NodeArmorPlaque({
  label,
  type,
  nodeWidth,
  nodeHeight,
}: {
  label: string;
  type: ProcessNodeType;
  nodeWidth: number;
  nodeHeight: number;
}) {
  const isIdentity = type === "identity";
  const isTransformed = type === "transformed";
  const usesLargeTwoLinePlaque = isIdentity || isTransformed;
  const width = Math.max(88, Math.min(nodeWidth * 1.12, 230));
  const baseHeight = Math.max(16, Math.min(nodeHeight * 0.17, 30));
  const height = usesLargeTwoLinePlaque ? Math.min(baseHeight * 1.45, 42) : baseHeight;
  const bottom = Math.max(1, nodeHeight * 0.01);
  const plaqueRadius = 999;
  const labelLines = isIdentity
    ? ["ME", "DISCIPLE"]
    : isTransformed
      ? ["TRANSFORMED", "PERSON"]
      : [label];

  const bg = isIdentity
    ? "linear-gradient(145deg, rgba(196,170,118,0.82) 0%, rgba(116,88,48,0.84) 46%, rgba(46,30,14,0.90) 100%)"
    : "linear-gradient(145deg, rgba(228,232,240,0.86) 0%, rgba(124,136,154,0.88) 46%, rgba(32,40,54,0.92) 100%)";
  const outerGlow = isIdentity
    ? "0 0 8px rgba(214,184,116,0.34), 0 0 16px rgba(214,184,116,0.16)"
    : "0 0 8px rgba(203,213,225,0.34), 0 0 16px rgba(148,163,184,0.18)";
  const rim = isIdentity
    ? "rgba(244,224,176,0.62)"
    : "rgba(232,238,248,0.7)";
  const innerRim = isIdentity
    ? "rgba(244,222,170,0.24)"
    : "rgba(226,232,240,0.3)";
  const innerDarkRim = isIdentity
    ? "rgba(58,40,18,0.44)"
    : "rgba(24,32,46,0.48)";

  return (
    <span
      className="pointer-events-none absolute z-20"
      style={{
        left: "50%",
        bottom,
        width,
        height,
        transform: "translate(-50%, 0)",
        borderRadius: plaqueRadius,
        clipPath: "ellipse(50% 46% at 50% 50%)",
        background: bg,
        border: `1.25px solid ${rim}`,
        boxShadow: [
          "0 0 0 1.5px rgba(255,255,255,0.14)",
          "0 0 0 2.5px rgba(0,0,0,0.56)",
          outerGlow,
          "0 6px 10px rgba(0,0,0,0.38)",
          "inset 0 1px 0 rgba(255,255,255,0.18)",
          "inset 0 -1.5px 0 rgba(0,0,0,0.34)",
        ].join(", "),
      }}
    >
      {/* subtle inner rim/bevel */}
      <span
        className="absolute inset-[1px]"
        style={{
          borderRadius: 999,
          border: `1px solid ${innerRim}`,
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -1px 0 rgba(0,0,0,0.28)",
        }}
      />
      {/* inner darker edge for double bevel read */}
      <span
        className="absolute inset-[2px]"
        style={{
          borderRadius: 999,
          border: `1px solid ${innerDarkRim}`,
          opacity: 0.7,
        }}
      />
      {/* micro texture — very subtle forged variation */}
      <span
        className="absolute inset-[2px]"
        style={{
          borderRadius: 999,
          background: [
            "linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.04) 100%)",
            "repeating-linear-gradient(108deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, rgba(0,0,0,0.02) 1px, rgba(0,0,0,0.02) 3px)",
          ].join(", "),
          opacity: 0.35,
          mixBlendMode: "soft-light",
        }}
      />
      {/* top highlight band */}
      <span
        className="absolute left-[10%] right-[10%] top-[18%] h-[26%]"
        style={{
          borderRadius: 999,
          background:
            "linear-gradient(145deg, rgba(246,250,255,0.30) 0%, rgba(255,255,255,0.03) 65%, rgba(0,0,0,0.10) 100%)",
          opacity: 0.62,
        }}
      />
      {/* subtle diagonal specular streak */}
      <span
        className="absolute top-[10%] h-[16%] w-[52%]"
        style={{
          borderRadius: 999,
          left: "30%",
          transform: "rotate(-10deg)",
          background:
            "linear-gradient(110deg, rgba(255,255,255,0) 0%, rgba(236,244,255,0.24) 52%, rgba(0,0,0,0.10) 100%)",
          opacity: 0.42,
        }}
      />
      <span
        className="absolute inset-0 flex items-center justify-center text-center"
        style={{
          color: isIdentity ? "rgba(255,251,240,0.94)" : "rgba(244,255,248,0.94)",
          fontSize: Math.max(7, Math.min(height * (usesLargeTwoLinePlaque ? 0.25 : 0.38), 10)),
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          textShadow: "0 1px 1.5px rgba(0,0,0,0.45)",
        }}
      >
        <span className="flex flex-col items-center leading-[1.02]">
          {labelLines.map((line, i) => (
            <span key={i}>{line}</span>
          ))}
        </span>
      </span>
    </span>
  );
}

export function ProcessNode({ id, label, x, y, href, size, type, child }: Props) {
  const scale = useProcessMapScale();
  const isChild = child ?? id.startsWith("t_");
  const glow = nodeGlow[type];
  const shape = shapeFor(type, size, isChild);
  const fontSize =
    size >= 150 ? 14 : size >= 120 ? 13 : size >= 100 ? 12 : size >= 70 ? 11 : size >= 50 ? 10 : 9;
  const scaledFont = Math.max(7, fontSize * scale);
  const w = shape.w * scale;
  const h = shape.h * scale;

  const positionStyle = {
    position: "absolute" as const,
    left: `${x}%`,
    top: `${y}%`,
    transform: "translate(-50%, -50%)",
  };

  const node = (
    <span
      className={cn(
        "group/node relative flex items-center justify-center text-center leading-tight",
        "transition-all duration-200",
        href && "cursor-pointer",
      )}
      style={{
        width: w,
        height: h,
        letterSpacing: isChild ? "0.03em" : "0.05em",
        opacity: isChild ? 0.88 : 1,
        borderRadius: shape.radius,
      }}
    >
      <span
        className="pointer-events-none absolute inset-[-3px] transition-shadow duration-200"
        style={{
          borderRadius: shape.radius,
          boxShadow: isChild ? glow.childGlow : glow.glow,
        }}
      />
      <span
        className="pointer-events-none absolute inset-[-3px] opacity-0 transition-opacity duration-200 group-hover/node:opacity-100"
        style={{
          borderRadius: shape.radius,
          boxShadow: isChild ? glow.childHoverGlow : glow.hoverGlow,
        }}
      />
      <ProcessNodeSvgVisual
        id={id}
        type={type}
        isChild={isChild}
        w={w}
        h={h}
        label={label}
        fontSize={scaledFont}
        hasHref={!!href}
      />
      {(type === "identity" || type === "transformed") && (
        <span
          className="pointer-events-none absolute z-20 left-1/2 -translate-x-1/2 text-center uppercase"
          style={{
            top: type === "identity" ? "12%" : "11%",
            lineHeight: 1.02,
          }}
        >
          <span
            className="block font-extrabold"
            style={{
              fontSize: (type === "identity" ? 13 : 12.5) * scale,
              letterSpacing: "0.1em",
              background:
                type === "identity"
                  ? "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(255,236,195,0.95) 52%, rgba(210,178,118,0.92) 100%)"
                  : undefined,
              WebkitBackgroundClip: type === "identity" ? "text" : undefined,
              backgroundClip: type === "identity" ? "text" : undefined,
              color: type === "identity" ? "transparent" : "rgba(236,241,248,0.96)",
              textShadow:
                type === "identity"
                  ? "0 1px 2px rgba(0,0,0,0.55), 0 0 8px rgba(255,214,150,0.32)"
                  : "0 1px 2px rgba(0,0,0,0.55), 0 0 8px rgba(226,232,240,0.30)",
            }}
          >
            BADWR
          </span>
        </span>
      )}
      {(type === "identity" || type === "transformed") && (
        <NodeArmorPlaque
          label={label}
          type={type}
          nodeWidth={w}
          nodeHeight={h}
        />
      )}
    </span>
  );

  if (href) {
    return (
      <Link
        href={href}
        data-node-id={id}
        className={cn(
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          isChild ? "z-20" : "z-10",
        )}
        style={{ ...positionStyle, borderRadius: shape.radius }}
      >
        {node}
      </Link>
    );
  }

  return (
    <div data-node-id={id} className={isChild ? "z-20" : "z-10"} style={positionStyle}>
      {node}
    </div>
  );
}
