import Link from "next/link";
import { ChevronRight, HandHeart, UserPlus, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const icons = [Users, UserPlus, HandHeart] as const;

const iconColors = [
  "bg-emerald-100/70 text-emerald-600 dark:bg-emerald-900/25 dark:text-emerald-400",
  "bg-sky-100/70 text-sky-600 dark:bg-sky-900/25 dark:text-sky-400",
  "bg-rose-100/60 text-rose-600 dark:bg-rose-900/25 dark:text-rose-400",
] as const;

export function CommunityNodeCard({
  title,
  description,
  countLabel,
  href,
  iconIndex,
}: {
  title: string;
  description: string;
  countLabel?: string;
  href: string;
  iconIndex: 0 | 1 | 2;
}) {
  const Icon = icons[iconIndex];
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-start gap-3 rounded-xl border p-4 text-left shadow-sm transition-all duration-200",
        "border-emerald-200/40 bg-gradient-to-br from-white via-emerald-50/20 to-teal-50/15",
        "dark:border-emerald-500/12 dark:from-card dark:via-emerald-950/10 dark:to-teal-950/8",
        "hover:border-emerald-300/60 hover:shadow-[0_4px_20px_-4px_rgba(52,211,153,0.12)]",
        "dark:hover:border-emerald-500/25 dark:hover:shadow-[0_4px_20px_-4px_rgba(52,211,153,0.06)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full transition-colors duration-200",
          iconColors[iconIndex]
        )}
      >
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium tracking-wide text-foreground">{title}</h3>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground/60 transition-colors group-hover:text-foreground" />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        {countLabel ? (
          <p className="mt-2 text-[11px] font-medium tracking-wide text-foreground/70">
            {countLabel}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
