/**
 * **Practice metrics anchor** — optional profile field `practice_metrics_anchor_ymd` that acts as
 * “day 1” for dashboards and formation-momentum ingestion instead of raw account signup.
 * Historical rows remain in the database; metrics simply ignore activity before the anchor.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { userSignupStartYmd } from "@/lib/dashboard/cumulative-rhythm-pace";
import { ymdAddCalendarDays } from "@/lib/dashboard/pillar-week";

/** Later of two yyyy-MM-dd strings (lexicographic works for ISO dates). */
export function maxYmd(a: string, b: string): string {
  return a >= b ? a : b;
}

/**
 * Effective first calendar day for practice metrics: auth signup, unless the user set a **reset**
 * anchor that is not before signup (cannot count time before the account existed).
 */
export function effectiveMetricsStartYmd(
  userCreatedAt: string | null | undefined,
  practiceMetricsAnchorYmd: string | null | undefined,
  timeZone: string
): string {
  const auth = userSignupStartYmd(userCreatedAt, timeZone);
  const raw = practiceMetricsAnchorYmd?.trim().slice(0, 10);
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return auth;
  return maxYmd(raw, auth);
}

/**
 * Lower bound for raw SQL queries (e.g. journal `entry_date`): max(lookback start, metrics anchor).
 */
export function metricsQueryFloorYmd(
  todayYmd: string,
  lookbackDays: number,
  practiceMetricsAnchorYmd: string | null | undefined
): string {
  const lookbackStart = ymdAddCalendarDays(todayYmd, -lookbackDays);
  const raw = practiceMetricsAnchorYmd?.trim().slice(0, 10);
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return lookbackStart;
  return maxYmd(lookbackStart, raw);
}

export async function fetchPracticeMetricsAnchorYmd(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("profiles")
    .select("practice_metrics_anchor_ymd")
    .eq("id", userId)
    .maybeSingle();
  const v = data?.practice_metrics_anchor_ymd;
  if (v == null || typeof v !== "string") return null;
  const s = v.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}
