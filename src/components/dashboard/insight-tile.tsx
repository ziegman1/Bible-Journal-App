import Link from "next/link";
import { cn } from "@/lib/utils";

export type InsightTileVariant = "default" | "alert" | "success";

export function InsightTile({
  title,
  value,
  supportingText,
  href,
  variant = "default",
}: {
  title: string;
  value?: string;
  supportingText?: string;
  href: string;
  variant?: InsightTileVariant;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "block rounded-lg border px-4 py-3 text-sm shadow-sm transition-all duration-200",
        "hover:shadow-[0_2px_12px_-3px_rgba(99,102,241,0.10)]",
        "dark:hover:shadow-[0_2px_12px_-3px_rgba(99,102,241,0.06)]",

        variant === "default" && [
          "border-slate-200/70 bg-gradient-to-r from-white to-slate-50/50",
          "dark:border-slate-500/12 dark:from-card dark:to-slate-900/20",
          "hover:border-indigo-200/50 dark:hover:border-indigo-500/20",
        ],
        variant === "alert" && [
          "border-amber-200/70 bg-gradient-to-r from-amber-50/50 to-orange-50/30",
          "dark:border-amber-500/20 dark:from-amber-950/15 dark:to-orange-950/10",
          "hover:border-amber-300/70 dark:hover:border-amber-500/30",
        ],
        variant === "success" && [
          "border-emerald-200/70 bg-gradient-to-r from-emerald-50/40 to-teal-50/25",
          "dark:border-emerald-500/20 dark:from-emerald-950/15 dark:to-teal-950/10",
          "hover:border-emerald-300/70 dark:hover:border-emerald-500/30",
        ]
      )}
    >
      <p className="font-medium tracking-wide text-foreground">{title}</p>
      {value ? <p className="mt-1 text-base font-light text-foreground">{value}</p> : null}
      {supportingText ? (
        <p className="mt-0.5 text-[11px] tracking-wide text-muted-foreground">
          {supportingText}
        </p>
      ) : null}
    </Link>
  );
}
