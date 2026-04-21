/**
 * Run: `npx tsx src/lib/metrics/formation-momentum/progression-gate.test-runner.ts`
 * Focused checks for {@link applyProgressionCategoryGate} (no Jest/Vitest in repo).
 */

import assert from "node:assert/strict";
import type { PerSignalCategoryMass } from "@/lib/metrics/formation-momentum/aggregator";
import {
  FOUNDATION_PROGRESS_UNLOCK_THRESHOLD,
  FORMATION_MIN_MULTIPLIER_BEFORE_UNLOCK,
  FORMATION_PROGRESS_REPRODUCTION_UNLOCK_THRESHOLD,
  applyProgressionCategoryGate,
} from "@/lib/metrics/formation-momentum/progression-gate";

function syntheticPerSignal(
  totals: { foundation: number; formation: number; reproduction: number }
): PerSignalCategoryMass[] {
  return [
    {
      signalId: "synthetic:1",
      foundation: totals.foundation,
      formation: totals.formation,
      reproduction: totals.reproduction,
    },
  ];
}

function assertApprox(a: number, b: number, eps = 1e-9, msg?: string) {
  assert.ok(Math.abs(a - b) <= eps, msg ?? `${a} vs ${b}`);
}

// 1. Very early user, low Foundation
{
  const pre = { foundation: 5, formation: 40, reproduction: 55 };
  const r = applyProgressionCategoryGate(pre, syntheticPerSignal(pre));
  assert.ok(r.formationMultiplier > FORMATION_MIN_MULTIPLIER_BEFORE_UNLOCK);
  assert.ok(r.formationMultiplier < 1);
  assert.ok(r.reproductionMultiplier < 1);
  assertApprox(r.postGateTotals.foundation, pre.foundation);
}

// 2. Near unlock — Foundation just below 40% of pre-gate totals
{
  const pre = { foundation: 39, formation: 41, reproduction: 20 };
  const r = applyProgressionCategoryGate(pre, syntheticPerSignal(pre));
  const ratio = 39 / 100 / FOUNDATION_PROGRESS_UNLOCK_THRESHOLD;
  const expectedForm =
    FORMATION_MIN_MULTIPLIER_BEFORE_UNLOCK + (1 - FORMATION_MIN_MULTIPLIER_BEFORE_UNLOCK) * Math.min(1, ratio);
  assertApprox(r.formationMultiplier, expectedForm);
  assert.ok(r.formationMultiplier > 0.5, "Formation should be partially active near unlock");
  assert.ok(r.reproductionMultiplier < 1);
  assertApprox(r.postGateTotals.foundation, pre.foundation);
}

// 3. Foundation unlocked, Formation below 30% for reproduction leg
{
  const pre = { foundation: 50, formation: 20, reproduction: 30 };
  const r = applyProgressionCategoryGate(pre, syntheticPerSignal(pre));
  assert.equal(r.formationMultiplier, 1);
  assert.equal(r.foundationUnlockReached, true);
  assert.equal(r.formationReproductionUnlockReached, false);
  const formShare = 20 / 100;
  const ratio = formShare / FORMATION_PROGRESS_REPRODUCTION_UNLOCK_THRESHOLD;
  const expectedReproForm =
    0.15 + 0.85 * Math.min(1, ratio);
  assertApprox(r.reproductionFormationMultiplier, expectedReproForm);
  assert.equal(r.reproductionFoundationMultiplier, 1);
  assertApprox(r.reproductionMultiplier, Math.min(1, expectedReproForm));
  assertApprox(r.postGateTotals.foundation, pre.foundation);
}

// 4. Both thresholds unlocked
{
  const pre = { foundation: 40, formation: 35, reproduction: 25 };
  const r = applyProgressionCategoryGate(pre, syntheticPerSignal(pre));
  assert.equal(r.formationMultiplier, 1);
  assert.equal(r.reproductionMultiplier, 1);
  assert.equal(r.foundationUnlockReached, true);
  assert.equal(r.formationReproductionUnlockReached, true);
  assert.deepEqual(r.preGateTotals, pre);
  assertApprox(r.postGateTotals.foundation + r.postGateTotals.formation + r.postGateTotals.reproduction, 100);
}

// 5. Explain-style integrity
{
  const pre = { foundation: 10, formation: 30, reproduction: 60 };
  const per = syntheticPerSignal(pre);
  const r = applyProgressionCategoryGate(pre, per);
  assert.deepEqual(r.preGateTotals, pre);
  assert.ok(r.postGateTotals.formation <= pre.formation + 1e-9);
  assert.ok(r.postGateTotals.reproduction <= pre.reproduction + 1e-9);
  assertApprox(r.postGateTotals.foundation, pre.foundation);
  assert.equal(r.foundationUnlockReached, pre.foundation / 100 >= FOUNDATION_PROGRESS_UNLOCK_THRESHOLD);
  assert.equal(
    r.formationReproductionUnlockReached,
    pre.formation / 100 >= FORMATION_PROGRESS_REPRODUCTION_UNLOCK_THRESHOLD
  );
}

console.log("progression-gate tests: OK");
