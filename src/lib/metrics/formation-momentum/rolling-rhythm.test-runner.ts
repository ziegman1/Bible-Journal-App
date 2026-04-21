/**
 * Run: `npm run test:rolling-rhythm`
 */

import assert from "node:assert/strict";
import {
  pillarWeekStartKeyFromInstant,
  ymdAddCalendarDays,
} from "@/lib/dashboard/pillar-week";
import { applyCategoryRhythmMultipliersToPerSignal } from "@/lib/metrics/formation-momentum/aggregator";
import type { GoalAlignmentInputGoals } from "@/lib/metrics/formation-momentum/modifiers/goal-alignment";
import {
  FORMATION_STREAK_BONUS_CAP,
  FOUNDATION_STREAK_BONUS_CAP,
  ROLLING_CONSISTENCY_LOOKBACK_WEEKS,
  computeRollingRhythmContext,
  foundationWeekRhythm,
  formationWeekRhythm,
} from "@/lib/metrics/formation-momentum/modifiers/rolling-rhythm";
import type { NormalizedSignal } from "@/lib/metrics/formation-momentum/types";
import { applyProgressionCategoryGate } from "@/lib/metrics/formation-momentum/progression-gate";

const defaultGoals: GoalAlignmentInputGoals = {
  soapsWeeklyQualifyingGoal: 5,
  prayerWeeklyMinutesGoal: 100,
  shareWeeklyEncountersGoal: 1,
  scriptureMonthlyNewPassagesGoal: 5,
  scriptureDailyReviewGoal: 5,
};

function trailingWeekKeys(tz: string, now: Date, count: number): string[] {
  const currentSunday = pillarWeekStartKeyFromInstant(now, tz);
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    keys.push(`week:${ymdAddCalendarDays(currentSunday, -7 * i)}`);
  }
  return keys;
}

function weekSignals(
  wk: string,
  patch: Partial<{
    soaps: Partial<NormalizedSignal>;
    prayer: Partial<NormalizedSignal>;
    memoryNew: Partial<NormalizedSignal>;
    memoryReview: Partial<NormalizedSignal>;
    chat: Partial<NormalizedSignal>;
    thirds: Partial<NormalizedSignal>;
  }>
): NormalizedSignal[] {
  const base = (pt: NormalizedSignal["practiceType"], id: string, extra: Partial<NormalizedSignal>) =>
    ({
      id,
      practiceType: pt,
      windowKey: wk,
      totalUnits: 0,
      qualifyingUnits: 0,
      daysWithActivity: 0,
      goalTarget: null,
      metadata: {},
      ...extra,
    }) as NormalizedSignal;

  const out: NormalizedSignal[] = [];
  if (patch.soaps)
    out.push(
      base("soaps", `soaps:${wk}`, {
        totalUnits: 5,
        qualifyingUnits: 5,
        daysWithActivity: 5,
        ...patch.soaps,
      })
    );
  if (patch.prayer)
    out.push(
      base("prayer", `prayer:${wk}`, {
        totalUnits: 100,
        daysWithActivity: 5,
        ...patch.prayer,
      })
    );
  if (patch.memoryNew)
    out.push(
      base("memory", `mem:${wk}:n`, {
        subtype: "memory_new",
        totalUnits: 2,
        daysWithActivity: 2,
        metadata: { practiceDaysNew: ["2026-01-01", "2026-01-02", "2026-01-03"] },
        ...patch.memoryNew,
      })
    );
  if (patch.memoryReview)
    out.push(
      base("memory", `mem:${wk}:r`, {
        subtype: "memory_review",
        totalUnits: 1,
        daysWithActivity: 1,
        metadata: { practiceDaysReview: ["2026-01-04"] },
        ...patch.memoryReview,
      })
    );
  if (patch.chat)
    out.push(
      base("chat", `chat:${wk}`, {
        totalUnits: 6,
        qualifyingUnits: 1,
        daysWithActivity: 1,
        metadata: { checkInCount: 1, keptUpCount: 1, notKeptUpCount: 0 },
        ...patch.chat,
      })
    );
  if (patch.thirds)
    out.push(
      base("thirds", `thirds:${wk}`, {
        subtype: "thirds_week_participation",
        totalUnits: 6,
        qualifyingUnits: 6,
        daysWithActivity: 1,
        metadata: { rawEventCount: 1 },
        ...patch.thirds,
      })
    );
  return out;
}

// 1. Scattered: mix of complete and empty weeks → moderate rolling score, multipliers slightly above 1
{
  const now = new Date("2026-04-20T12:00:00Z");
  const tz = "America/Chicago";
  const keys = trailingWeekKeys(tz, now, 6);
  const signals: NormalizedSignal[] = [];
  keys.forEach((wk, i) => {
    if (i % 2 === 0) {
      signals.push(
        ...weekSignals(wk, {
          soaps: {},
          prayer: {},
          memoryNew: {},
        })
      );
    }
  });
  const ctx = computeRollingRhythmContext(signals, defaultGoals, tz, now);
  assert.ok(ctx.rollingFoundationScore > 0 && ctx.rollingFoundationScore < 1);
  assert.ok(ctx.foundationConsistencyMultiplier > 1 && ctx.foundationConsistencyMultiplier <= 1 + FOUNDATION_STREAK_BONUS_CAP);
  assert.ok(ctx.formationConsistencyMultiplier >= 1 && ctx.formationConsistencyMultiplier <= 1 + FORMATION_STREAK_BONUS_CAP);
  assert.equal(ctx.reproductionConsistencyMultiplier, 1);
}

// 2. Strong sustained: 6 identical complete foundation weeks + chat each week
{
  const now = new Date("2026-04-20T12:00:00Z");
  const tz = "America/Chicago";
  const keys = trailingWeekKeys(tz, now, 6);
  const signals: NormalizedSignal[] = [];
  for (const wk of keys) {
    signals.push(
      ...weekSignals(wk, {
        soaps: { qualifyingUnits: 4, daysWithActivity: 4 },
        prayer: { totalUnits: 80, daysWithActivity: 4 },
        memoryNew: {
          metadata: { practiceDaysNew: ["2026-04-01", "2026-04-02", "2026-04-03"] },
          daysWithActivity: 3,
          totalUnits: 3,
        },
        chat: { totalUnits: 6, qualifyingUnits: 1, metadata: { checkInCount: 1, keptUpCount: 1, notKeptUpCount: 0 } },
      })
    );
  }
  const ctx = computeRollingRhythmContext(signals, defaultGoals, tz, now);
  assertApprox(ctx.rollingFoundationScore, 1, 0.02);
  assertApprox(ctx.foundationConsistencyMultiplier, 1 + FOUNDATION_STREAK_BONUS_CAP, 0.02);
  assert.ok(ctx.formationConsistencyMultiplier > ctx.foundationConsistencyMultiplier);
}

// 3. One missed week after 5 strong — score drops modestly
{
  const now = new Date("2026-04-20T12:00:00Z");
  const tz = "America/Chicago";
  const keys = trailingWeekKeys(tz, now, 6);
  const signals: NormalizedSignal[] = [];
  keys.forEach((wk, i) => {
    if (i === 0) return;
    signals.push(
      ...weekSignals(wk, {
        soaps: { qualifyingUnits: 4, daysWithActivity: 4 },
        prayer: { totalUnits: 80, daysWithActivity: 4 },
        memoryNew: {
          metadata: { practiceDaysNew: ["2026-04-01", "2026-04-02", "2026-04-03"] },
          daysWithActivity: 3,
          totalUnits: 3,
        },
      })
    );
  });
  const ctx = computeRollingRhythmContext(signals, defaultGoals, tz, now);
  assert.ok(ctx.rollingFoundationScore < 1 && ctx.rollingFoundationScore > 0.75);
}

// 4. Early user sparse — only 2 weeks in window still /6 average
{
  const now = new Date("2026-04-20T12:00:00Z");
  const tz = "America/Chicago";
  const keys = trailingWeekKeys(tz, now, 6);
  const signals = [
    ...weekSignals(keys[5]!, {
      soaps: { qualifyingUnits: 1, daysWithActivity: 1 },
    }),
    ...weekSignals(keys[4]!, {
      soaps: { qualifyingUnits: 1, daysWithActivity: 1 },
    }),
  ];
  const ctx = computeRollingRhythmContext(signals, defaultGoals, tz, now);
  assert.equal(ctx.foundationWeeklyRhythm.length, ROLLING_CONSISTENCY_LOOKBACK_WEEKS);
  assert.ok(ctx.rollingFoundationScore < 0.5);
}

// 5. Reproduction multiplier neutral
{
  const ctx = computeRollingRhythmContext([], defaultGoals, "America/Chicago", new Date());
  assert.equal(ctx.reproductionConsistencyMultiplier, 1);
  assert.equal(ctx.rollingReproductionScore, 0);
}

// 6. Rhythm + progression gate — strong Formation rhythm does not remove Foundation-first gate
{
  const per = [{ signalId: "x", foundation: 5, formation: 50, reproduction: 45 }];
  const rhythm = { foundation: 1.06, formation: 1.15, reproduction: 1 };
  const afterR = applyCategoryRhythmMultipliersToPerSignal(per, rhythm);
  const gate = applyProgressionCategoryGate(afterR.totals, afterR.perSignal);
  assert.ok(gate.formationMultiplier < 1, "progression gate still dampens Formation when Foundation share is low");
  assertApprox(gate.preGateTotals.foundation, 5 * 1.06);
}

// Helpers
function assertApprox(a: number, b: number, eps = 1e-6) {
  assert.ok(Math.abs(a - b) <= eps, `${a} vs ${b}`);
}

// foundationWeekRhythm / formationWeekRhythm unit checks
{
  const wk = "week:2026-05-04";
  const s = weekSignals(wk, {
    soaps: { qualifyingUnits: 4, daysWithActivity: 4 },
    prayer: { totalUnits: 50, daysWithActivity: 4 },
    memoryNew: {
      metadata: { practiceDaysNew: ["2026-05-01", "2026-05-02", "2026-05-03"] },
      daysWithActivity: 3,
      totalUnits: 3,
    },
  });
  const f = foundationWeekRhythm(s, 100);
  assert.equal(f.status, "complete");
  const fo = formationWeekRhythm(s);
  assert.equal(fo.status, "empty");
}

console.log("rolling-rhythm tests: OK");
