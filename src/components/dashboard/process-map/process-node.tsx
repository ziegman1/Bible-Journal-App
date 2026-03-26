"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ProcessNodeType } from "./process-map-config";

const typeStyles: Record<
  ProcessNodeType,
  { ring: string; bg: string; glow: string; text: string }
> = {
  identity: {
    ring: "border-indigo-300/60 dark:border-indigo-500/30",
    bg: "bg-gradient-to-br from-white via-indigo-50/50 to-violet-50/40 dark:from-zinc-900 dark:via-indigo-950/30 dark:to-violet-950/20",
    glow: "group-hover:shadow-[0_0_24px_-4px_rgba(129,140,248,0.30)] dark:group-hover:shadow-[0_0_24px_-4px_rgba(129,140,248,0.15)]",
    text: "text-indigo-900 dark:text-indigo-200",
  },
  practice: {
    ring: "border-sky-200/60 dark:border-sky-500/25",
    bg: "bg-gradient-to-br from-white via-sky-50/40 to-blue-50/30 dark:from-zinc-900 dark:via-sky-950/20 dark:to-blue-950/15",
    glow: "group-hover:shadow-[0_0_20px_-4px_rgba(56,189,248,0.25)] dark:group-hover:shadow-[0_0_20px_-4px_rgba(56,189,248,0.12)]",
    text: "text-sky-900 dark:text-sky-200",
  },
  community: {
    ring: "border-emerald-200/60 dark:border-emerald-500/25",
    bg: "bg-gradient-to-br from-white via-emerald-50/40 to-teal-50/25 dark:from-zinc-900 dark:via-emerald-950/20 dark:to-teal-950/15",
    glow: "group-hover:shadow-[0_0_20px_-4px_rgba(52,211,153,0.25)] dark:group-hover:shadow-[0_0_20px_-4px_rgba(52,211,153,0.12)]",
    text: "text-emerald-900 dark:text-emerald-200",
  },
  growth: {
    ring: "border-fuchsia-200/50 dark:border-fuchsia-500/25",
    bg: "bg-gradient-to-br from-white via-fuchsia-50/30 to-violet-50/20 dark:from-zinc-900 dark:via-fuchsia-950/20 dark:to-violet-950/15",
    glow: "group-hover:shadow-[0_0_20px_-4px_rgba(192,132,252,0.25)] dark:group-hover:shadow-[0_0_20px_-4px_rgba(192,132,252,0.12)]",
    text: "text-fuchsia-900 dark:text-fuchsia-200",
  },
};

const sizeClasses = {
  sm: "w-[72px] h-[72px]",
  md: "w-[96px] h-[96px] sm:w-[110px] sm:h-[110px]",
  lg: "w-[110px] h-[110px] sm:w-[130px] sm:h-[130px]",
} as const;

const labelSize = {
  sm: "text-[10px] sm:text-[11px]",
  md: "text-[11px] sm:text-xs",
  lg: "text-sm sm:text-base",
} as const;

export function ProcessNode({
  id,
  label,
  subtitle,
  x,
  y,
  type,
  href,
  size = "md",
}: {
  id: string;
  label: string;
  subtitle?: string;
  x: number;
  y: number;
  type: ProcessNodeType;
  href?: string;
  size?: "sm" | "md" | "lg";
}) {
  const s = typeStyles[type];

  const inner = (
    <div
      className={cn(
        "group flex flex-col items-center justify-center rounded-full border-2 text-center shadow-sm transition-all duration-200",
        sizeClasses[size],
        s.ring,
        s.bg,
        s.glow,
        href && "cursor-pointer",
        "hover:scale-105 hover:border-opacity-80"
      )}
    >
      <span
        className={cn(
          "font-semibold leading-tight tracking-wide",
          labelSize[size],
          s.text
        )}
      >
        {label}
      </span>
      {subtitle ? (
        <span className="mt-0.5 text-[9px] leading-tight text-muted-foreground sm:text-[10px]">
          {subtitle}
        </span>
      ) : null}
    </div>
  );

  const positionStyle = {
    position: "absolute" as const,
    left: `${x}%`,
    top: `${y}%`,
    transform: "translate(-50%, -50%)",
  };

  if (href) {
    return (
      <Link
        href={href}
        data-node-id={id}
        className="z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-full"
        style={positionStyle}
      >
        {inner}
      </Link>
    );
  }

  return (
    <div data-node-id={id} style={positionStyle}>
      {inner}
    </div>
  );
}
