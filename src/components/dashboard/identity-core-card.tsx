import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button-variants";

export function IdentityCoreCard({
  displayName,
  phaseLabel,
  nextActionLabel,
  nextActionHref,
  stats,
}: {
  displayName: string;
  phaseLabel: string;
  nextActionLabel: string;
  nextActionHref: string;
  stats: readonly { label: string; value: string }[];
}) {
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
      <p className="relative mt-1 text-sm tracking-wide text-muted-foreground">{phaseLabel}</p>

      <div className="relative mt-5 md:flex md:justify-center">
        <Link
          href={nextActionHref}
          className={cn(
            buttonVariants({ size: "default" }),
            "shadow-md shadow-indigo-500/10 dark:shadow-indigo-400/5"
          )}
        >
          {nextActionLabel}
        </Link>
      </div>

      <dl className="relative mt-6 grid grid-cols-2 gap-3 text-left sm:grid-cols-2">
        {stats.map((s) => (
          <div
            key={s.label}
            className={cn(
              "rounded-lg border border-indigo-100/60 px-3 py-2",
              "bg-white/60 backdrop-blur-xs",
              "dark:border-indigo-500/10 dark:bg-white/[0.03]"
            )}
          >
            <dt className="text-[11px] tracking-wide text-muted-foreground">{s.label}</dt>
            <dd className="text-sm font-medium text-foreground">{s.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
