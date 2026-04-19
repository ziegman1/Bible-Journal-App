"use server";

/**
 * 3/3rds dashboard gauge — **overall weekly completion %**: finalized solo weeks / total weeks since
 * participation start (same model as `fetchThirdsParticipationMetrics`). Not Formation Momentum.
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
    const gauge = buildWeeklyCompletionGauge(0, 1, "3/3rds finalized weeks");
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
    "3/3rds weeks finalized"
  );

  return {
    ...gauge,
    participatedWeeks,
    totalWeeks,
    hasParticipationStart: true,
  };
}
