import { getFormationMomentumDashboard } from "@/app/actions/formation-momentum-dashboard";
import { scoreToPhaseGauge } from "@/lib/metrics/formation-momentum/phase-gauge";
import { topInsightPhrasesForCategory } from "@/lib/metrics/formation-momentum/category-contributors";
import { computeNextBestSteps } from "@/lib/metrics/formation-momentum/next-best-steps";
import type { CategoryId } from "@/lib/metrics/formation-momentum/types";
import { getPracticeTimeZone } from "@/lib/timezone/get-practice-timezone";
import { cn } from "@/lib/utils";
import {
  FormationMomentumCardInteractive,
  type FormationMomentumRowVM,
} from "@/components/dashboard/formation-momentum-card-interactive";

const CATEGORY_LABEL: Record<CategoryId, string> = {
  foundation: "Foundation",
  formation: "Formation",
  reproduction: "Reproduction",
};

const CATEGORY_ORDER: CategoryId[] = ["foundation", "formation", "reproduction"];

/** Highest score first; ties broken by foundation → formation → reproduction. */
function orderCategoriesByStrength(scores: Record<CategoryId, number>) {
  return [...CATEGORY_ORDER]
    .map((category) => ({ category, score: scores[category] }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);
    });
}

/**
 * Live **formation-momentum** metrics (Foundation / Formation / Reproduction).
 *
 * **Phase gauges** map the same benchmark bands (`benchmarks.ts` + `phase-gauge.ts`) into three named
 * phases per category — presentation only, not engine truth. Raw masses stay off this surface.
 */
export async function FormationMomentumCard() {
  const result = await getFormationMomentumDashboard({ includeExplain: true });

  if ("error" in result) {
    const err = result.error;
    const body =
      err === "Not authenticated"
        ? "Sign in to see your momentum summary."
        : err === "Supabase not configured"
          ? "Connect Supabase in setup to load metrics."
          : "Could not load formation momentum. Try refreshing.";
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

  const { snapshot } = result;
  const scores = Object.fromEntries(snapshot.categories.map((c) => [c.category, c.score])) as Record<
    CategoryId,
    number
  >;

  const explain = snapshot.explain;
  const timeZone = await getPracticeTimeZone();
  const nextBestSteps = computeNextBestSteps(explain, timeZone);

  const rows: FormationMomentumRowVM[] = snapshot.categories.map(({ category, score }) => {
    const gauge = scoreToPhaseGauge(category, score);
    const whyInsightLines = topInsightPhrasesForCategory(explain, category, 3);
    return {
      category,
      phaseLabel: gauge.phaseLabel,
      phaseLabels: gauge.phaseLabels,
      phaseIndex: gauge.phaseIndex,
      needleT: gauge.needleT,
      positionSubtitle: gauge.positionSubtitle,
      whyInsightLines,
    };
  });

  const byStrength = orderCategoriesByStrength(scores);
  const strongest = byStrength[0]!.category;
  const weakest = byStrength[2]!.category;
  const summaryLine = `You are strongest in ${CATEGORY_LABEL[strongest]}. Focus next on growing in ${CATEGORY_LABEL[weakest]}.`;

  return (
    <div
      className={cn(
        "rounded-xl border border-indigo-200/50 bg-gradient-to-b from-white to-indigo-50/40 p-4 shadow-sm",
        "dark:border-indigo-500/15 dark:from-card dark:to-indigo-950/20"
      )}
    >
      <p className="text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-indigo-500/90 dark:text-indigo-400/80">
        Discipleship momentum
      </p>
      <p className="mt-1 text-center text-xs text-muted-foreground">
        A picture of your growth in foundation, formation, and reproduction this week.
      </p>

      <FormationMomentumCardInteractive
        rows={rows}
        summaryLine={summaryLine}
        signalCount={snapshot.meta?.signalCount ?? 0}
        nextBestSteps={nextBestSteps}
      />
    </div>
  );
}
