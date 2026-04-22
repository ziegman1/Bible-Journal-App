import { cn } from "@/lib/utils";

/** Me / BADWR strip + display name (identity card top). */
export function IdentityProfileHeader({ displayName }: { displayName: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-indigo-200/60 p-6 shadow-sm",
        "bg-gradient-to-br from-white via-indigo-50/30 to-violet-50/40",
        "dark:border-indigo-500/20 dark:from-card dark:via-indigo-950/20 dark:to-violet-950/15",
        "md:text-center"
      )}
    >
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
    </div>
  );
}
