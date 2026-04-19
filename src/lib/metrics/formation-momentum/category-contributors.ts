import type {
  CategoryId,
  FormationMomentumExplain,
  FormationMomentumSignalExplain,
  PracticeType,
} from "@/lib/metrics/formation-momentum/types";
import { practiceInsightPhrase } from "@/lib/metrics/formation-momentum/practice-insights";

function categoryMassFor(
  s: FormationMomentumSignalExplain,
  category: CategoryId
): number {
  return s.categoryContribution[category];
}

type PracticeGroup = {
  practiceType: PracticeType;
  totalMass: number;
  /** Subtype of the signal row that contributed the most mass for this practice type. */
  topSubtype?: string;
  topMass: number;
};

/**
 * Aggregates signals by `practiceType`, sums mass, picks the dominant subtype for phrasing,
 * then returns top groups as human-readable insight lines (deduplicated by practice).
 */
export function topInsightPhrasesForCategory(
  explain: FormationMomentumExplain | undefined,
  category: CategoryId,
  limit = 3
): string[] {
  if (!explain?.signals?.length) return [];

  const groups = new Map<PracticeType, PracticeGroup>();

  for (const s of explain.signals) {
    const mass = categoryMassFor(s, category);
    if (mass <= 0) continue;

    const existing = groups.get(s.practiceType);
    if (!existing) {
      groups.set(s.practiceType, {
        practiceType: s.practiceType,
        totalMass: mass,
        topSubtype: s.subtype,
        topMass: mass,
      });
      continue;
    }

    existing.totalMass += mass;
    if (mass > existing.topMass) {
      existing.topMass = mass;
      existing.topSubtype = s.subtype;
    }
  }

  const ranked = [...groups.values()].sort((a, b) => b.totalMass - a.totalMass).slice(0, limit);

  return ranked.map((g) => practiceInsightPhrase(g.practiceType, g.topSubtype));
}
