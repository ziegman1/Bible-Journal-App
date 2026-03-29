import type { SupabaseClient } from "@supabase/supabase-js";
import { startOfUtcWeekMonday, utcDateYmd } from "@/lib/dashboard/utc-week";
import { currentUtcWeekMondayYmd, utcMondayWeeksInclusive } from "@/lib/groups/thirds-personal-helpers";

/** Same numbers as the 3/3rds Groups participation panel (finalized weeks / weeks since start). */
export type ThirdsParticipationMetrics = {
  participatedWeeks: number;
  totalWeeks: number;
  /** 0–1; display percent = Math.round(ratio * 100) to match the panel */
  ratio: number;
};

/**
 * Returns null if the user has no participation start date, or if required tables error (e.g. migration not applied).
 * Pass `normalizedStartMondayYmd` when you already loaded `thirds_participation_settings` (UTC Monday YYYY-MM-DD).
 */
export async function fetchThirdsParticipationMetrics(
  supabase: SupabaseClient,
  userId: string,
  normalizedStartMondayYmd?: string
): Promise<ThirdsParticipationMetrics | null> {
  let startMonday: string;
  if (normalizedStartMondayYmd && /^\d{4}-\d{2}-\d{2}$/.test(normalizedStartMondayYmd)) {
    startMonday = normalizedStartMondayYmd;
  } else {
    const { data: settings, error: settingsErr } = await supabase
      .from("thirds_participation_settings")
      .select("participation_started_on")
      .eq("user_id", userId)
      .maybeSingle();

    if (settingsErr || !settings?.participation_started_on) return null;

    startMonday = utcDateYmd(
      startOfUtcWeekMonday(new Date(`${settings.participation_started_on}T12:00:00.000Z`))
    );
  }
  const currentMonday = currentUtcWeekMondayYmd();
  const totalWeeks = utcMondayWeeksInclusive(startMonday, currentMonday);

  const { count: participated, error: cErr } = await supabase
    .from("thirds_personal_weeks")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .not("finalized_at", "is", null)
    .gte("week_start_monday", startMonday)
    .lte("week_start_monday", currentMonday);

  if (cErr) return null;

  const participatedWeeks = participated ?? 0;
  const ratio = totalWeeks > 0 ? Math.min(1, participatedWeeks / totalWeeks) : 0;

  return { participatedWeeks, totalWeeks, ratio };
}
