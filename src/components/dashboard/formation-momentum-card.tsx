import { getFormationMomentumDashboard } from "@/app/actions/formation-momentum-dashboard";
import { scoreToPhaseGauge } from "@/lib/metrics/formation-momentum/phase-gauge";
import { topInsightPhrasesForCategory } from "@/lib/metrics/formation-momentum/category-contributors";
import { resolveDiscipleshipMomentumInstruction } from "@/lib/metrics/formation-momentum/discipleship-momentum-instruction";
import { computeNextBestSteps } from "@/lib/metrics/formation-momentum/next-best-steps";
import type { CategoryId } from "@/lib/metrics/formation-momentum/types";
import { getPracticeTimeZone } from "@/lib/timezone/get-practice-timezone";
import { cn } from "@/lib/utils";
import { DiscipleshipMomentumInfoModal } from "@/components/dashboard/discipleship-momentum-info-modal";
import {
  FormationMomentumCardInteractive,
  type FormationMomentumRowVM,
} from "@/components/dashboard/formation-momentum-card-interactive";

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
  /** Primary coaching line: early Foundation path vs default strongest/weakest (see `discipleship-momentum-instruction.ts`). */
  const { summaryLine } = resolveDiscipleshipMomentumInstruction({
    strongest,
    weakest,
    growthStageId: snapshot.meta?.growthStageId,
    foundationScore: scores.foundation,
    explain,
  });

  return (
    <div
      className={cn(
        "rounded-xl border border-indigo-200/50 bg-gradient-to-b from-white to-indigo-50/40 p-4 shadow-sm",
        "dark:border-indigo-500/15 dark:from-card dark:to-indigo-950/20"
      )}
    >
      {/* Info control: pastoral explainer modal (non-technical copy); see DiscipleshipMomentumInfoModal */}
      <div className="relative">
        <DiscipleshipMomentumInfoModal className="absolute right-0 top-0" />
        <p className="px-9 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-indigo-500/90 dark:text-indigo-400/80">
          Discipleship momentum
        </p>
        <p className="mt-1 text-center text-xs text-muted-foreground">
          A picture of your growth in foundation, formation, and reproduction this week.
        </p>
      </div>

      <FormationMomentumCardInteractive
        rows={rows}
        summaryLine={summaryLine}
        signalCount={snapshot.meta?.signalCount ?? 0}
        nextBestSteps={nextBestSteps}
      />
    </div>
  );
}
