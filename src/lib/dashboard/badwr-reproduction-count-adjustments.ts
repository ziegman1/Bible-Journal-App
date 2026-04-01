import type { ThirdsParticipationMetrics } from "@/lib/groups/thirds-participation-metrics";

/**
 * Manual corrections added to activity totals before BADWR cumulative averages.
 * Rhythm fields (SOAPS, reading, prayer, share) are total units spread evenly across
 * every week included in the reproduction average. Thirds adds to participated weeks (3/3rds
 * panel path) or marks extra weeks attended (legacy path).
 */
export type BadwrReproductionCountAdjustments = {
  soaps_qualifying?: number;
  reading_sessions?: number;
  prayer_minutes?: number;
  share_encounters?: number;
  /** Extra 3/3rds weeks counted as participated / attended for reproduction math only. */
  thirds_meeting_weeks?: number;
};

export const BADWR_COUNT_ADJUSTMENT_FIELDS: {
  key: keyof BadwrReproductionCountAdjustments;
  label: string;
  description: string;
}[] = [
  {
    key: "soaps_qualifying",
    label: "Qualifying SOAPS entries",
    description:
      "Total extra entries (or negative to reduce). Split evenly across each week in your average.",
  },
  {
    key: "reading_sessions",
    label: "Reading sessions",
    description:
      "Total extra sessions logged in the reader. Split evenly across each week in your average.",
  },
  {
    key: "prayer_minutes",
    label: "Prayer minutes",
    description:
      "Total extra minutes (wheel + extra prayer). Split evenly across each week in your average.",
  },
  {
    key: "share_encounters",
    label: "Share encounters",
    description:
      "Total extra gospel/testimony shares. Split evenly across each week in your average.",
  },
  {
    key: "thirds_meeting_weeks",
    label: "3/3rds weeks",
    description:
      "Extra weeks counted as participated (when you track a start date) or as attended group/solo weeks (otherwise). Does not change your real group or solo logs.",
  },
];

const ADJ_MIN = -10_000;
const ADJ_MAX = 10_000;

export function clampBadwrCountAdjustment(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round(Math.min(ADJ_MAX, Math.max(ADJ_MIN, n)));
}

export function parseBadwrReproductionCountAdjustments(
  raw: unknown
): BadwrReproductionCountAdjustments {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  const o = raw as Record<string, unknown>;
  const out: BadwrReproductionCountAdjustments = {};
  const keys: (keyof BadwrReproductionCountAdjustments)[] = [
    "soaps_qualifying",
    "reading_sessions",
    "prayer_minutes",
    "share_encounters",
    "thirds_meeting_weeks",
  ];
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "number") {
      const c = clampBadwrCountAdjustment(v);
      if (c !== 0) out[k] = c;
    }
  }
  return out;
}

export function applyThirdsParticipationWeeksAdjust(
  metrics: ThirdsParticipationMetrics | null,
  addWeeks: number
): ThirdsParticipationMetrics | null {
  if (metrics == null || metrics.totalWeeks <= 0) return metrics;
  const w = clampBadwrCountAdjustment(addWeeks);
  if (w === 0) return metrics;
  const participated = Math.max(0, metrics.participatedWeeks + w);
  const ratio =
    metrics.totalWeeks > 0 ? Math.min(1, participated / metrics.totalWeeks) : 0;
  return { ...metrics, participatedWeeks: participated, ratio };
}

/**
 * Marks extra pillar weeks as 3/3rds-attended when not using participation start-date metrics.
 * Weeks are filled from the earliest eligible week that is not already marked attended.
 */
export function augmentAttendedThirdsWeekStartsForAdjust(
  set: ReadonlySet<string>,
  pillarWeeksOrderedOldestFirst: string[],
  inThirdsGroupForWeek: (weekStartSundayYmd: string) => boolean,
  addWeeks: number
): Set<string> {
  const n = clampBadwrCountAdjustment(addWeeks);
  const next = new Set(set);
  if (n <= 0) return next;
  const candidates = pillarWeeksOrderedOldestFirst.filter(
    (w) => inThirdsGroupForWeek(w) && !next.has(w)
  );
  for (let i = 0; i < Math.min(n, candidates.length); i++) {
    next.add(candidates[i]);
  }
  return next;
}
