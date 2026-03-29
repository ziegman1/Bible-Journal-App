import Link from "next/link";
import { getBadwrReproductionSnapshot } from "@/app/actions/badwr-reproduction";
import type { BadwrPillarModel } from "@/lib/dashboard/badwr-reproduction-model";
import { PaceNeedleMeter } from "@/components/dashboard/pace-needle-meter";
import { cn } from "@/lib/utils";

function tierDotClass(tier: BadwrPillarModel["tier"]) {
  if (tier === "strong") return "bg-emerald-500 dark:bg-emerald-400";
  if (tier === "ok") return "bg-amber-400 dark:bg-amber-500";
  return "bg-red-400 dark:bg-red-500";
}

function reproductionStatus(overallPercent: number): {
  needleDegrees: number;
  paceStatus: "ahead" | "on_pace" | "behind";
  heading: string;
} {
  const needleDegrees = 45 + (overallPercent / 100) * 90;
  if (overallPercent >= 78) {
    return { needleDegrees, paceStatus: "ahead", heading: "Strong reproduction rhythm" };
  }
  if (overallPercent >= 52) {
    return { needleDegrees, paceStatus: "on_pace", heading: "Building toward reproduction" };
  }
  return { needleDegrees, paceStatus: "behind", heading: "Rhythms need attention" };
}

export async function BadwrReproductionCard() {
  const snap = await getBadwrReproductionSnapshot();

  if ("error" in snap) {
    const err = snap.error;
    const body =
      err === "Not authenticated"
        ? "Sign in to see your collective BADWR progress."
        : err === "Supabase not configured"
          ? "Connect Supabase in setup to see BADWR progress."
          : "Could not load your reproduction summary. Try refreshing; if it continues, confirm recent database migrations are applied.";
    return (
      <div
        className={cn(
          "rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3 text-center text-xs text-muted-foreground"
        )}
        title={err}
      >
        {body}
      </div>
    );
  }

  const { overallPercent, pillars, focusAreas } = snap;
  const { needleDegrees, paceStatus, heading } = reproductionStatus(overallPercent);

  return (
    <div
      className={cn(
        "rounded-xl border border-indigo-200/50 bg-gradient-to-b from-white to-indigo-50/40 p-4 shadow-sm",
        "dark:border-indigo-500/15 dark:from-card dark:to-indigo-950/20"
      )}
    >
      <p className="text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-indigo-500/90 dark:text-indigo-400/80">
        Reproduction check
      </p>
      <p className="mt-1 text-center text-xs text-muted-foreground">
        Word + SOAPS, prayer, CHAT, 3/3rds, and share—weekly rhythms of a disciple worth reproducing.
      </p>

      <div className="mt-2 border-t border-border/50 pt-3">
        <PaceNeedleMeter
          variant="compact"
          needleDegrees={needleDegrees}
          status={paceStatus}
          statusHeading={heading}
          message={`${overallPercent}% likelihood you’re living a reproducible rhythm this week.`}
          detailLineCompact="Needle reflects the combined health of all five areas below."
          ariaDescription={`Combined weekly score ${overallPercent} percent across Word and SOAPS, prayer, CHAT, three-thirds groups, and sharing.`}
        />
      </div>

      <ul className="mt-3 space-y-2 border-t border-border/50 pt-3">
        {pillars.map((p) => (
          <li key={p.id}>
            <Link
              href={p.href}
              className="group flex gap-2 rounded-md text-left text-xs transition-colors hover:bg-indigo-50/60 dark:hover:bg-indigo-950/30"
            >
              <span
                className={cn("mt-1 size-2 shrink-0 rounded-full", tierDotClass(p.tier))}
                aria-hidden
              />
              <span>
                <span className="font-medium text-foreground group-hover:underline">
                  {p.label}
                </span>
                <span className="text-muted-foreground">
                  {" "}
                  · {Math.round(p.score * 100)}%
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {focusAreas.length > 0 ? (
        <div className="mt-3 rounded-lg border border-amber-200/60 bg-amber-50/50 px-3 py-2 dark:border-amber-900/40 dark:bg-amber-950/25">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-900 dark:text-amber-200">
            Improve next
          </p>
          <ul className="mt-1.5 space-y-1.5 text-xs text-amber-950/90 dark:text-amber-100/90">
            {focusAreas.map((p) => (
              <li key={`focus-${p.id}`}>
                <Link href={p.href} className="font-medium underline-offset-2 hover:underline">
                  {p.label}
                </Link>
                <span className="text-amber-900/85 dark:text-amber-100/80"> — {p.hint}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
