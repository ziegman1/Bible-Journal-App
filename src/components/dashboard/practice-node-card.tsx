import Link from "next/link";
import { BookOpen, Heart, MessageCircle, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

const themeIcon = {
  soap: BookOpen,
  pray: Heart,
  share: Share2,
  chat: MessageCircle,
} as const;

const themeStyles = {
  soap: {
    card: "border-sky-200/50 bg-gradient-to-br from-white via-sky-50/40 to-blue-50/30 dark:border-sky-500/15 dark:from-card dark:via-sky-950/15 dark:to-blue-950/10",
    hover: "hover:border-sky-300/70 hover:shadow-[0_4px_20px_-4px_rgba(56,189,248,0.15)] dark:hover:border-sky-500/30 dark:hover:shadow-[0_4px_20px_-4px_rgba(56,189,248,0.08)]",
    iconBg: "bg-sky-100/70 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400",
    label: "text-sky-700/70 dark:text-sky-400/60",
  },
  pray: {
    card: "border-violet-200/50 bg-gradient-to-br from-white via-violet-50/35 to-purple-50/25 dark:border-violet-500/15 dark:from-card dark:via-violet-950/15 dark:to-purple-950/10",
    hover: "hover:border-violet-300/70 hover:shadow-[0_4px_20px_-4px_rgba(167,139,250,0.15)] dark:hover:border-violet-500/30 dark:hover:shadow-[0_4px_20px_-4px_rgba(167,139,250,0.08)]",
    iconBg: "bg-violet-100/70 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
    label: "text-violet-700/70 dark:text-violet-400/60",
  },
  share: {
    card: "border-amber-200/50 bg-gradient-to-br from-white via-amber-50/35 to-orange-50/25 dark:border-amber-500/15 dark:from-card dark:via-amber-950/15 dark:to-orange-950/10",
    hover: "hover:border-amber-300/70 hover:shadow-[0_4px_20px_-4px_rgba(251,191,36,0.15)] dark:hover:border-amber-500/30 dark:hover:shadow-[0_4px_20px_-4px_rgba(251,191,36,0.08)]",
    iconBg: "bg-amber-100/70 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
    label: "text-amber-700/70 dark:text-amber-400/60",
  },
  chat: {
    card: "border-indigo-200/50 bg-gradient-to-br from-white via-indigo-50/35 to-slate-50/30 dark:border-indigo-500/15 dark:from-card dark:via-indigo-950/15 dark:to-slate-950/10",
    hover: "hover:border-indigo-300/70 hover:shadow-[0_4px_20px_-4px_rgba(129,140,248,0.15)] dark:hover:border-indigo-500/30 dark:hover:shadow-[0_4px_20px_-4px_rgba(129,140,248,0.08)]",
    iconBg: "bg-indigo-100/70 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
    label: "text-indigo-700/70 dark:text-indigo-400/60",
  },
} as const;

export function PracticeNodeCard({
  title,
  description,
  statusLabel,
  progressValue,
  secondaryMeta,
  href,
  theme,
}: {
  title: string;
  description: string;
  statusLabel?: string;
  progressValue?: string;
  secondaryMeta?: string;
  href: string;
  theme: keyof typeof themeIcon;
}) {
  const Icon = themeIcon[theme];
  const s = themeStyles[theme];
  return (
    <Link
      href={href}
      className={cn(
        "group flex h-full min-h-[140px] flex-col rounded-xl border p-4 text-left shadow-sm transition-all duration-200",
        s.card,
        s.hover,
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "text-[11px] font-semibold uppercase tracking-[0.12em]",
            s.label
          )}
        >
          {title}
        </span>
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full transition-colors duration-200",
            s.iconBg
          )}
        >
          <Icon className="size-3.5" />
        </span>
      </div>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-foreground">{description}</p>
      <div className="mt-3 space-y-1 border-t border-border/60 pt-3 text-xs text-muted-foreground">
        {statusLabel ? <p>{statusLabel}</p> : null}
        {progressValue ? <p>{progressValue}</p> : null}
        {secondaryMeta ? <p className="text-muted-foreground/70">{secondaryMeta}</p> : null}
      </div>
    </Link>
  );
}
