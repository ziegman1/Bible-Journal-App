import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  streakOpenAriaForStreakStatLabel,
  streakMainHrefForStreakStatLabel,
} from "@/lib/dashboard/dashboard-streak-links";

function streakTitleAttr(label: string): string | undefined {
  if (label.startsWith("SOAPS")) {
    return "Consecutive days with a qualifying SOAPS journal entry (same calendar day in your practice timezone). Miss a day → streak resets.";
  }
  if (label.startsWith("Prayer")) {
    return "Consecutive days you engaged in prayer (Prayer Wheel, freestyle timer, or extra time—practice timezone). Miss a day → streak resets.";
  }
  if (label.startsWith("Share")) {
    return "Consecutive days with a logged gospel or testimony share. Miss a day → streak resets.";
  }
  if (label.startsWith("Scripture Memory")) {
    return "Consecutive days you logged new memorization or review (practice timezone). Miss a day → streak resets.";
  }
  if (label.startsWith("3/3 weekly")) {
    return "Consecutive pillar weeks (Sun–Sat, practice timezone) after you recorded Complete 3/3 (solo finalize, informal group, or 3/3rds meeting).";
  }
  if (label.startsWith("CHAT weekly")) {
    return "Consecutive pillar weeks (Sun–Sat) after you submitted the final CHAT reading check-in question—counts regardless of yes/no.";
  }
  return undefined;
}

const interactiveTile =
  "cursor-pointer transition-colors hover:border-indigo-300/80 hover:bg-indigo-50/40 active:bg-indigo-100/45 dark:hover:border-indigo-400/25 dark:hover:bg-indigo-950/25 dark:active:bg-indigo-950/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

/** Single streak stat (used in custom dashboard item-by-item layout). */
export function DashboardStreakTile({
  label,
  value,
  compact = false,
  href: hrefProp,
  ariaLabel: ariaLabelProp,
}: {
  label: string;
  value: string;
  /** Narrow grid cells (e.g. 2-column mobile); looser typography when false (full-width row). */
  compact?: boolean;
  /** When set, the tile navigates to this practice hub (overrides label-based default). */
  href?: string | null;
  /** Accessible name for the link; defaults from label + value. */
  ariaLabel?: string;
}) {
  const href = hrefProp ?? streakMainHrefForStreakStatLabel(label) ?? null;
  const ariaLabel =
    ariaLabelProp ??
    (href ? `${streakOpenAriaForStreakStatLabel(label)}. Current streak: ${value}.` : undefined);

  const shell = cn(
    "flex min-w-0 max-w-full flex-col justify-center rounded-xl border border-indigo-100/60 shadow-sm",
    "bg-white/80 backdrop-blur-xs",
    "dark:border-indigo-500/10 dark:bg-white/[0.03]",
    compact
      ? "min-h-[3.75rem] px-2.5 py-2.5 sm:min-h-[4.25rem] sm:px-3 sm:py-3"
      : "min-h-[4.25rem] px-3 py-3"
  );

  const labelClass = cn(
    "tracking-wide text-muted-foreground leading-snug",
    compact ? "text-[10px] sm:text-[11px]" : "text-[11px]"
  );

  const valueClass = cn(
    "font-medium text-foreground",
    compact ? "mt-0.5 text-xs tabular-nums sm:text-sm" : "text-sm"
  );

  if (href && ariaLabel) {
    return (
      <Link href={href} aria-label={ariaLabel} className={cn(shell, interactiveTile, "no-underline")}>
        <span className={labelClass} title={streakTitleAttr(label)}>
          {label}
        </span>
        <span className={valueClass}>{value}</span>
      </Link>
    );
  }

  return (
    <div className={shell}>
      <dt className={labelClass} title={streakTitleAttr(label)}>
        {label}
      </dt>
      <dd className={valueClass}>{value}</dd>
    </div>
  );
}
