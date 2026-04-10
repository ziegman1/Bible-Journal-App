import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button-variants";

export function IdentityCoreCard({
  displayName,
  nextActionLabel,
  nextActionHref,
  prayHref = "/app/prayer",
  prayLabel = "Pray",
  stats,
  invitationalSubtitle = null,
}: {
  displayName: string;
  nextActionLabel: string;
  nextActionHref: string;
  prayHref?: string;
  prayLabel?: string;
  stats: readonly { label: string; value: string }[];
  /** When streak stats are hidden (Guided mode), short invitational line instead of the grid */
  invitationalSubtitle?: string | null;
}) {
  const showStats = stats.length > 0;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-indigo-200/60 p-6 shadow-sm",
        "bg-gradient-to-br from-white via-indigo-50/30 to-violet-50/40",
        "dark:border-indigo-500/20 dark:from-card dark:via-indigo-950/20 dark:to-violet-950/15",
        "md:text-center"
      )}
    >
      {/* Subtle radial glow behind the identity node */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-20"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(129,140,248,0.12), transparent)",
        }}
      />

      <p className="relative text-[11px] font-semibold uppercase tracking-[0.15em] text-indigo-400/80 dark:text-indigo-400/60">
        Me / BADWR
      </p>
      <h2 className="relative mt-1 text-2xl font-serif font-light tracking-wide text-foreground">
        {displayName}
      </h2>

      <div className="relative mt-5 flex flex-wrap items-center justify-center gap-3">
        <Link
          href={nextActionHref}
          className={cn(
            buttonVariants({ size: "default" }),
            "shadow-md shadow-indigo-500/10 dark:shadow-indigo-400/5 min-h-11 touch-manipulation"
          )}
        >
          {nextActionLabel}
        </Link>
        <Link
          href={prayHref}
          className={cn(
            buttonVariants({ size: "default", variant: "outline" }),
            "border-indigo-300/80 bg-white/70 dark:border-indigo-500/35 dark:bg-white/[0.04] min-h-11 touch-manipulation"
          )}
        >
          {prayLabel}
        </Link>
      </div>

      {showStats ? (
        <dl className="relative mt-6 grid grid-cols-2 gap-3 text-left sm:grid-cols-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className={cn(
                "flex min-h-[4.25rem] flex-col justify-center rounded-lg border border-indigo-100/60 px-3 py-2",
                "bg-white/60 backdrop-blur-xs",
                "dark:border-indigo-500/10 dark:bg-white/[0.03]"
              )}
            >
              <dt
                className="text-[11px] tracking-wide text-muted-foreground"
                title={
                  s.label.startsWith("SOAPS")
                    ? "Consecutive days with a qualifying SOAPS journal entry (same calendar day in your practice timezone). Miss a day → streak resets."
                    : s.label.startsWith("Prayer")
                      ? "Consecutive days with at least 60 minutes logged (Prayer Wheel + extra time). Miss a day → streak resets."
                      : s.label.startsWith("Share")
                        ? "Consecutive days with a logged gospel or testimony share. Miss a day → streak resets."
                        : s.label.startsWith("Scripture Memory")
                          ? "Consecutive days you logged new memorization or review (practice timezone). Miss a day → streak resets."
                          : s.label.startsWith("3/3 weekly")
                            ? "Consecutive pillar weeks (Sun–Sat, practice timezone) after you recorded Complete 3/3 (solo finalize, informal group, or 3/3rds meeting)."
                            : s.label.startsWith("CHAT weekly")
                              ? "Consecutive pillar weeks (Sun–Sat) after you submitted the final CHAT reading check-in question—counts regardless of yes/no."
                              : undefined
                }
              >
                {s.label}
              </dt>
              <dd className="text-sm font-medium text-foreground">{s.value}</dd>
            </div>
          ))}
        </dl>
      ) : invitationalSubtitle ? (
        <p className="relative mt-6 text-left text-sm leading-relaxed text-muted-foreground md:text-center">
          {invitationalSubtitle}
        </p>
      ) : null}
    </div>
  );
}
