import type { SupabaseClient } from "@supabase/supabase-js";
import { formatInTimeZone } from "date-fns-tz";
import {
  enumeratePillarWeekStartYmids,
  pillarWeekStartKeyFromDateYmd,
} from "@/lib/dashboard/pillar-week";
import {
  effectiveMetricsStartYmd,
  fetchPracticeMetricsAnchorYmd,
} from "@/lib/profile/practice-metrics-anchor";
import { getPracticeTimeZone } from "@/lib/timezone/get-practice-timezone";

/**
 * 3/3rds participation: finalized solo weeks + group streak completions, over pillar weeks
 * (practice TZ) since the metrics anchor / signup — aligned with home dashboard reset behavior.
 * Not Formation Momentum.
 */
export type ThirdsParticipationMetrics = {
  participatedWeeks: number;
  totalWeeks: number;
  /** 0–1; display percent = Math.round(ratio * 100) to match the panel */
  ratio: number;
};

/**
 * Pillar-week window from effective metrics start through the pillar week containing "today"
 * (practice timezone). Numerator = distinct pillar weeks with either finalized solo week
 * (`thirds_personal_weeks`) or group completion (`pillar_week_streak_completions`).
 */
export async function fetchThirdsParticipationMetrics(
  supabase: SupabaseClient,
  userId: string
): Promise<ThirdsParticipationMetrics | null> {
  const tz = await getPracticeTimeZone();

  const [{ data: auth }, anchorYmd] = await Promise.all([
    supabase.auth.getUser(),
    fetchPracticeMetricsAnchorYmd(supabase, userId),
  ]);

  const createdAt =
    auth.user?.id === userId ? auth.user.created_at ?? null : null;

  const effectiveDay = effectiveMetricsStartYmd(createdAt, anchorYmd, tz);
  const firstPillarSunday = pillarWeekStartKeyFromDateYmd(effectiveDay, tz);
  const now = new Date();
  const todayYmd = formatInTimeZone(now, tz, "yyyy-MM-dd");
  const lastPillarSunday = pillarWeekStartKeyFromDateYmd(todayYmd, tz);

  if (firstPillarSunday > lastPillarSunday) {
    return { participatedWeeks: 0, totalWeeks: 1, ratio: 0 };
  }

  const pillarRange = enumeratePillarWeekStartYmids(firstPillarSunday, lastPillarSunday);
  const totalWeeks = Math.max(1, pillarRange.length);

  const [streakRes, personalRes] = await Promise.all([
    supabase
      .from("pillar_week_streak_completions")
      .select("pillar_week_start_ymd")
      .eq("user_id", userId)
      .gte("pillar_week_start_ymd", firstPillarSunday)
      .lte("pillar_week_start_ymd", lastPillarSunday),
    supabase
      .from("thirds_personal_weeks")
      .select("week_start_monday")
      .eq("user_id", userId)
      .not("finalized_at", "is", null),
  ]);

  if (streakRes.error || personalRes.error) return null;

  const completed = new Set<string>();

  for (const row of streakRes.data ?? []) {
    const k = String(row.pillar_week_start_ymd).slice(0, 10);
    if (k >= firstPillarSunday && k <= lastPillarSunday) {
      completed.add(k);
    }
  }

  for (const row of personalRes.data ?? []) {
    const m = String(row.week_start_monday).slice(0, 10);
    const k = pillarWeekStartKeyFromDateYmd(m, tz);
    if (k >= firstPillarSunday && k <= lastPillarSunday) {
      completed.add(k);
    }
  }

  const participatedWeeks = completed.size;
  const ratio = totalWeeks > 0 ? Math.min(1, participatedWeeks / totalWeeks) : 0;

  return { participatedWeeks, totalWeeks, ratio };
}
