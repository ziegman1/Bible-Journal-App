import Link from "next/link";
import { Eye, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const icons = [Eye, Sparkles] as const;

const iconColors = [
  "bg-cyan-100/60 text-cyan-600 dark:bg-cyan-900/25 dark:text-cyan-400",
  "bg-amber-100/60 text-amber-600 dark:bg-amber-900/25 dark:text-amber-400",
] as const;

export function JourneyNodeCard({
  title,
  description,
  statusLabel,
  progressLabel,
  href,
  iconIndex,
}: {
  title: string;
  description: string;
  statusLabel: string;
  progressLabel?: string;
  href: string;
  iconIndex: 0 | 1;
}) {
  const Icon = icons[iconIndex];
  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col rounded-xl border p-4 text-left shadow-sm transition-all duration-200",
        "border-fuchsia-200/35 bg-gradient-to-br from-white via-fuchsia-50/15 to-violet-50/20",
        "dark:border-fuchsia-500/12 dark:from-card dark:via-fuchsia-950/10 dark:to-violet-950/8",
        "hover:border-fuchsia-300/55 hover:shadow-[0_4px_20px_-4px_rgba(192,132,252,0.12)]",
        "dark:hover:border-fuchsia-500/25 dark:hover:shadow-[0_4px_20px_-4px_rgba(192,132,252,0.06)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      )}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full transition-colors duration-200",
            iconColors[iconIndex]
          )}
        >
          <Icon className="size-4" />
        </span>
        <h3 className="text-sm font-medium tracking-wide text-foreground">{title}</h3>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
      <div className="mt-3 flex flex-wrap gap-2 border-t border-border/50 pt-3 text-xs">
        <span
          className={cn(
            "rounded-full border px-2.5 py-0.5 font-medium",
            "border-fuchsia-200/50 bg-fuchsia-50/50 text-fuchsia-700",
            "dark:border-fuchsia-500/20 dark:bg-fuchsia-950/20 dark:text-fuchsia-300"
          )}
        >
          {statusLabel}
        </span>
        {progressLabel ? (
          <span className="rounded-full px-2.5 py-0.5 text-muted-foreground">
            {progressLabel}
          </span>
        ) : null}
      </div>
    </Link>
  );
}
