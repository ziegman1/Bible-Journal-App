import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button-variants";

const actionButtonClass = cn(
  buttonVariants({ size: "default", variant: "outline" }),
  "flex min-h-11 w-full min-w-0 items-center justify-center touch-manipulation whitespace-normal px-2 py-2 text-center text-xs leading-snug sm:px-3 sm:text-sm",
  "border-indigo-300/80 dark:border-indigo-500/35",
  "bg-black text-white hover:bg-neutral-900",
  "dark:bg-white dark:text-black dark:hover:bg-neutral-100"
);

export type IdentityQuickActionSpec = { href: string; label: string };

/** One row of optional SOAPS / Pray / Scripture Memory shortcuts (same styling as full identity card). */
export function IdentityQuickActionsRow({
  actions,
  className,
  embedded = false,
}: {
  actions: IdentityQuickActionSpec[];
  className?: string;
  /** When true, only the button grid (for use inside the Me/BADWR card without a nested card shell). */
  embedded?: boolean;
}) {
  if (actions.length === 0) return null;
  const cols = actions.length;
  const grid = (
    <div
      className={cn(
        "relative grid w-full gap-2 sm:gap-3",
        cols === 1 && "grid-cols-1",
        cols === 2 && "grid-cols-2",
        cols >= 3 && "grid-cols-3",
        className
      )}
    >
      {actions.map((a) => (
        <Link key={a.href + a.label} href={a.href} className={actionButtonClass}>
          {a.label}
        </Link>
      ))}
    </div>
  );
  if (embedded) return grid;
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-indigo-200/60 p-6 shadow-sm",
        "bg-gradient-to-br from-white via-indigo-50/30 to-violet-50/40",
        "dark:border-indigo-500/20 dark:from-card dark:via-indigo-950/20 dark:to-violet-950/15"
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-20"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(129,140,248,0.12), transparent)",
        }}
      />
      {grid}
    </div>
  );
}
