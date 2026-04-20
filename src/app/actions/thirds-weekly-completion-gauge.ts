"use server";

/**
 * 3/3rds dashboard gauge — **overall weekly completion %**: distinct pillar weeks completed (solo
 * finalize and/or group streak) / pillar weeks since metrics anchor (same as
 * `fetchThirdsParticipationMetrics`). Not Formation Momentum.
 */

import {
  buildWeeklyCompletionGauge,
  type PracticeCompletionGaugeVm,
} from "@/lib/dashboard/practice-completion-gauge";
import { fetchThirdsParticipationMetrics } from "@/lib/groups/thirds-participation-metrics";
import { createClient } from "@/lib/supabase/server";

export type ThirdsWeeklyCompletionGaugeResult = PracticeCompletionGaugeVm & {
  participatedWeeks: number;
  totalWeeks: number;
  hasParticipationStart: boolean;
};

export async function getThirdsWeeklyCompletionGauge(): Promise<
  { error: string } | ThirdsWeeklyCompletionGaugeResult
> {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const metrics = await fetchThirdsParticipationMetrics(supabase, user.id);
  if (!metrics) {
    const gauge = buildWeeklyCompletionGauge(0, 1, "3/3rds");
    return {
      ...gauge,
      participatedWeeks: 0,
      totalWeeks: 0,
      hasParticipationStart: false,
    };
  }

  const { participatedWeeks, totalWeeks } = metrics;
  const gauge = buildWeeklyCompletionGauge(
    participatedWeeks,
    Math.max(1, totalWeeks),
    "3/3rds"
  );

  return {
    ...gauge,
    participatedWeeks,
    totalWeeks,
    hasParticipationStart: true,
  };
}
