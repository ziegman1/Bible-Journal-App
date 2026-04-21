/**
 * **v1 presentation layer:** maps raw category mass (engine **post–progression-gate** `CategoryScore.score`)
 * to named levels and within-band progress.
 *
 * This is for **user clarity only** — not engine truth. Thresholds are placeholders; tune after field testing.
 * Changing bands here does **not** change scoring — only labels and progress bars in the UI.
 */

export type BenchmarkBand = {
  /** Inclusive lower bound for this level (mass units). */
  lowerBound: number;
  /** Exclusive upper bound, or `null` for the top/open-ended tier. */
  upperBound: number | null;
  levelName: string;
};

/**
 * Ordered from lowest to highest. Same thresholds for every category in v1.
 * Edit `BENCHMARK_BANDS` to tune; keep sorted by `lowerBound`.
 */
export const BENCHMARK_BANDS: readonly BenchmarkBand[] = [
  { lowerBound: 0, upperBound: 80, levelName: "Starting" },
  { lowerBound: 80, upperBound: 160, levelName: "Building" },
  { lowerBound: 160, upperBound: 260, levelName: "Steady" },
  { lowerBound: 260, upperBound: 380, levelName: "Strong" },
  { lowerBound: 380, upperBound: null, levelName: "Overflowing" },
] as const;

export type BenchmarkProgress = {
  levelName: string;
  levelIndex: number;
  nextLevelName: string | null;
  /** Position within the current band: 0 at lower bound → 1 at upper bound (or 1 if top tier with no next). */
  progressToNext: number;
  percentToNext: number;
  lowerBound: number;
  upperBound: number | null;
};

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

/**
 * Given a raw category score (mass), returns level + progress toward the **next** named level’s threshold.
 */
export function scoreToBenchmarkProgress(score: number): BenchmarkProgress {
  const s = Number.isFinite(score) ? Math.max(0, score) : 0;

  let bandIndex = BENCHMARK_BANDS.length - 1;
  for (let i = 0; i < BENCHMARK_BANDS.length; i++) {
    const b = BENCHMARK_BANDS[i]!;
    const top = b.upperBound;
    if (top === null) {
      bandIndex = i;
      break;
    }
    if (s < top) {
      bandIndex = i;
      break;
    }
    if (i === BENCHMARK_BANDS.length - 1) {
      bandIndex = i;
      break;
    }
  }

  const band = BENCHMARK_BANDS[bandIndex]!;
  const nextBand = BENCHMARK_BANDS[bandIndex + 1];

  const lowerBound = band.lowerBound;
  const upperBound = band.upperBound;
  const nextLevelName = nextBand?.levelName ?? null;

  let progressToNext = 0;
  if (upperBound === null) {
    // Open-ended top tier: show full bar; no “next level” in the band sense.
    progressToNext = 1;
  } else {
    const span = upperBound - lowerBound;
    progressToNext = span > 0 ? clamp01((s - lowerBound) / span) : 0;
  }

  const percentToNext = Math.round(progressToNext * 100);

  return {
    levelName: band.levelName,
    levelIndex: bandIndex,
    nextLevelName,
    progressToNext,
    percentToNext,
    lowerBound,
    upperBound,
  };
}

/** Bar fill: higher index → richer indigo (encouraging ramp, not traffic-light). */
export function levelBarFillClass(levelIndex: number): string {
  const classes = [
    "bg-indigo-300/80 dark:bg-indigo-500/45",
    "bg-indigo-400/85 dark:bg-indigo-400/55",
    "bg-indigo-500/88 dark:bg-indigo-400/65",
    "bg-indigo-600/90 dark:bg-indigo-400/75",
    "bg-indigo-700/92 dark:bg-indigo-300/80",
  ];
  return classes[Math.min(levelIndex, classes.length - 1)]!;
}
