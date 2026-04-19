import "server-only";

import { createClient } from "@/lib/supabase/server";
import { isQualifyingSoapsEntry } from "@/lib/dashboard/soaps-entry";
import { pillarTodayYmd } from "@/lib/dashboard/identity-streaks";
import { metricsQueryFloorYmd } from "@/lib/profile/practice-metrics-anchor";
import { getPracticeTimeZone } from "@/lib/timezone/get-practice-timezone";
import type { RawEvent } from "@/lib/metrics/formation-momentum/types";

export type IngestionResult = {
  events: RawEvent[];
};

/** Aligned with identity streak / BADWR lookback windows (see `identity-streaks.ts`). */
const LOOKBACK_DAYS = 800;

function isoFromDateYmd(ymd: string): string {
  const d = ymd.trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return new Date().toISOString();
  return `${d}T12:00:00.000Z`;
}

/**
 * Load raw practice events for a user from live Supabase tables (parallel engine input only).
 *
 * **RLS:** Callers must use a Supabase client session where `auth.uid()` can read this user's
 * rows (typically the same user). Passing another `userId` without service role will not return data.
 *
 * **Ambiguity (see repo comments):**
 * - **3/3rds** overlaps: `pillar_week_streak_completions` (weekly pillar credit), `thirds_personal_weeks`
 *   (solo finalized weeks), `thirds_personal_group_completions` (informal group taps), and
 *   `meeting_participants` + `group_meetings` (attended group meetings). Downstream normalization
 *   should dedupe or weight by `source` + `metadata`.
 * - **SOAPS:** `isQualifyingSoapsEntry` matches dashboard/BADWR; `metadata.qualifying` is set for later layers.
 * - **Scripture memory:** One row per calendar day in DB; `value` is total touches (new + review); split in `metadata`.
 * - **CHAT:** One row per group per pillar week; same week can appear for multiple groups.
 */
export async function getUserPracticeEvents(
  userId: string,
  opts?: { practiceMetricsAnchorYmd?: string | null }
): Promise<IngestionResult> {
  const supabase = await createClient();
  if (!supabase) {
    return { events: [] };
  }

  const tz = await getPracticeTimeZone();
  const now = new Date();
  const todayYmd = pillarTodayYmd(now, tz);
  const oldestYmd = metricsQueryFloorYmd(todayYmd, LOOKBACK_DAYS, opts?.practiceMetricsAnchorYmd);
  const oldestIso = `${oldestYmd}T00:00:00.000Z`;

  const [
    thirdsGroupIdsRes,
    journalRes,
    wheelRes,
    extraRes,
    freestyleRes,
    oikosRes,
    scriptureRes,
    chatRes,
    shareRes,
    pillarStreakRes,
    personalWeeksRes,
    personalGroupCompletionsRes,
  ] = await Promise.all([
    supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", userId),
    supabase
      .from("journal_entries")
      .select(
        "id, entry_date, created_at, scripture_text, soaps_share, user_reflection, prayer, application"
      )
      .eq("user_id", userId)
      .gte("entry_date", oldestYmd)
      .order("entry_date", { ascending: true }),
    supabase
      .from("prayer_wheel_segment_completions")
      .select("id, completed_at, step_index, duration_minutes")
      .eq("user_id", userId)
      .gte("completed_at", oldestIso)
      .order("completed_at", { ascending: true }),
    supabase
      .from("prayer_extra_minutes")
      .select("id, logged_at, minutes")
      .eq("user_id", userId)
      .gte("logged_at", oldestIso)
      .order("logged_at", { ascending: true }),
    supabase
      .from("freestyle_prayer_sessions")
      .select("id, practice_date, ended_at, duration_seconds, note")
      .eq("user_id", userId)
      .gte("ended_at", oldestIso)
      .order("ended_at", { ascending: true }),
    supabase
      .from("oikos_prayer_visits")
      .select("id, practice_date, started_at")
      .eq("user_id", userId)
      .gte("started_at", oldestIso)
      .order("started_at", { ascending: true }),
    supabase
      .from("scripture_memory_logs")
      .select(
        "id, practice_date, memorized_new_count, reviewed_count, created_at, updated_at"
      )
      .eq("user_id", userId)
      .gte("practice_date", oldestYmd)
      .order("practice_date", { ascending: true }),
    supabase
      .from("chat_reading_check_ins")
      .select(
        "id, group_id, week_start_ymd, kept_up, restart_book_id, restart_chapter, grace_was_applied, created_at, updated_at"
      )
      .eq("user_id", userId)
      .gte("week_start_ymd", oldestYmd)
      .order("week_start_ymd", { ascending: true }),
    supabase
      .from("share_encounters")
      .select(
        "id, encounter_date, location, shared_type, received, follow_up, created_at"
      )
      .eq("user_id", userId)
      .gte("encounter_date", oldestYmd)
      .order("encounter_date", { ascending: true }),
    supabase
      .from("pillar_week_streak_completions")
      .select(
        "id, pillar_week_start_ymd, source, group_id, meeting_id, created_at"
      )
      .eq("user_id", userId)
      .gte("pillar_week_start_ymd", oldestYmd)
      .order("pillar_week_start_ymd", { ascending: true }),
    supabase
      .from("thirds_personal_weeks")
      .select("id, week_start_monday, finalized_at, created_at, updated_at")
      .eq("user_id", userId)
      .not("finalized_at", "is", null)
      .gte("week_start_monday", oldestYmd)
      .order("week_start_monday", { ascending: true }),
    supabase
      .from("thirds_personal_group_completions")
      .select("id, completed_at")
      .eq("user_id", userId)
      .gte("completed_at", oldestIso)
      .order("completed_at", { ascending: true }),
  ]);

  if (thirdsGroupIdsRes.error) {
    console.error("[formation-momentum ingestion] group_members", thirdsGroupIdsRes.error.message);
  }
  const memberGroupIds = [...new Set((thirdsGroupIdsRes.data ?? []).map((r) => r.group_id))];
  let thirdsGroupIds: string[] = [];
  if (memberGroupIds.length > 0) {
    const { data: thirdsGroups, error: gErr } = await supabase
      .from("groups")
      .select("id")
      .in("id", memberGroupIds)
      .eq("group_kind", "thirds");
    if (gErr) {
      console.error("[formation-momentum ingestion] groups filter", gErr.message);
    } else {
      thirdsGroupIds = (thirdsGroups ?? []).map((g) => g.id);
    }
  }

  let meetingRows: {
    meeting_id: string;
    joined_at: string;
    meeting_date: string;
    group_id: string;
  }[] = [];

  if (thirdsGroupIds.length > 0) {
    const { data: meetings, error: mErr } = await supabase
      .from("group_meetings")
      .select("id, meeting_date, group_id")
      .in("group_id", thirdsGroupIds)
      .eq("status", "completed")
      .gte("meeting_date", oldestYmd);

    if (mErr) {
      console.error("[formation-momentum ingestion] group_meetings", mErr.message);
    } else {
      const meetingList = meetings ?? [];
      const meetingIds = meetingList.map((m) => m.id);
      const meetingMeta = new Map(
        meetingList.map((m) => [
          m.id,
          { meeting_date: String(m.meeting_date).slice(0, 10), group_id: String(m.group_id) },
        ])
      );

      if (meetingIds.length > 0) {
        const { data: parts, error: pErr } = await supabase
          .from("meeting_participants")
          .select("meeting_id, joined_at")
          .eq("user_id", userId)
          .eq("present", true)
          .in("meeting_id", meetingIds);

        if (pErr) {
          console.error("[formation-momentum ingestion] meeting_participants", pErr.message);
        } else {
          meetingRows = (parts ?? [])
            .map((p) => {
              const meta = meetingMeta.get(p.meeting_id);
              if (!meta) return null;
              return {
                meeting_id: p.meeting_id,
                joined_at: String(p.joined_at),
                meeting_date: meta.meeting_date,
                group_id: meta.group_id,
              };
            })
            .filter((x): x is NonNullable<typeof x> => x != null);
        }
      }
    }
  }

  const events: RawEvent[] = [];

  const push = (e: RawEvent) => events.push(e);

  if (journalRes.error) {
    console.error("[formation-momentum ingestion] journal_entries", journalRes.error.message);
  } else {
    for (const row of journalRes.data ?? []) {
      const qualifying = isQualifyingSoapsEntry({
        scripture_text: row.scripture_text,
        soaps_share: row.soaps_share,
        user_reflection: row.user_reflection,
        prayer: row.prayer,
        application: row.application,
      });
      const occurredAt = row.created_at
        ? String(row.created_at)
        : isoFromDateYmd(String(row.entry_date));
      push({
        id: `journal_entries:${row.id}`,
        practiceType: "soaps",
        occurredAt,
        value: 1,
        source: "journal_entries",
        metadata: {
          entryId: row.id,
          entryDate: String(row.entry_date).slice(0, 10),
          qualifying,
        },
      });
    }
  }

  if (wheelRes.error) {
    console.error(
      "[formation-momentum ingestion] prayer_wheel_segment_completions",
      wheelRes.error.message
    );
  } else {
    for (const row of wheelRes.data ?? []) {
      push({
        id: `prayer_wheel_segment_completions:${row.id}`,
        practiceType: "prayer",
        occurredAt: String(row.completed_at),
        value: Math.max(0, row.duration_minutes ?? 0),
        source: "prayer_wheel_segment_completions",
        metadata: {
          kind: "wheel_segment",
          stepIndex: row.step_index,
          durationMinutes: row.duration_minutes,
        },
      });
    }
  }

  if (extraRes.error) {
    console.error("[formation-momentum ingestion] prayer_extra_minutes", extraRes.error.message);
  } else {
    for (const row of extraRes.data ?? []) {
      push({
        id: `prayer_extra_minutes:${row.id}`,
        practiceType: "prayer",
        occurredAt: String(row.logged_at),
        value: Math.max(0, row.minutes ?? 0),
        source: "prayer_extra_minutes",
        metadata: { kind: "extra_minutes", minutes: row.minutes },
      });
    }
  }

  if (freestyleRes.error) {
    console.error(
      "[formation-momentum ingestion] freestyle_prayer_sessions",
      freestyleRes.error.message
    );
  } else {
    for (const row of freestyleRes.data ?? []) {
      const minutes = Math.max(0, (row.duration_seconds ?? 0) / 60);
      push({
        id: `freestyle_prayer_sessions:${row.id}`,
        practiceType: "prayer",
        occurredAt: String(row.ended_at),
        value: minutes,
        source: "freestyle_prayer_sessions",
        metadata: {
          kind: "freestyle",
          practiceDate: String(row.practice_date).slice(0, 10),
          durationSeconds: row.duration_seconds,
          note: row.note,
        },
      });
    }
  }

  if (oikosRes.error) {
    console.error("[formation-momentum ingestion] oikos_prayer_visits", oikosRes.error.message);
  } else {
    for (const row of oikosRes.data ?? []) {
      push({
        id: `oikos_prayer_visits:${row.id}`,
        practiceType: "prayer",
        occurredAt: String(row.started_at),
        value: 1,
        source: "oikos_prayer_visits",
        metadata: {
          kind: "oikos_visit",
          practiceDate: String(row.practice_date).slice(0, 10),
        },
      });
    }
  }

  if (scriptureRes.error) {
    console.error("[formation-momentum ingestion] scripture_memory_logs", scriptureRes.error.message);
  } else {
    for (const row of scriptureRes.data ?? []) {
      const newC = row.memorized_new_count ?? 0;
      const rev = row.reviewed_count ?? 0;
      const updated =
        row.updated_at != null ? String(row.updated_at) : String(row.created_at ?? "");
      push({
        id: `scripture_memory_logs:${row.id}`,
        practiceType: "memory",
        occurredAt: updated || isoFromDateYmd(String(row.practice_date)),
        value: Math.max(0, newC + rev),
        source: "scripture_memory_logs",
        metadata: {
          practiceDate: String(row.practice_date).slice(0, 10),
          memorizedNewCount: newC,
          reviewedCount: rev,
        },
      });
    }
  }

  if (chatRes.error) {
    console.error("[formation-momentum ingestion] chat_reading_check_ins", chatRes.error.message);
  } else {
    for (const row of chatRes.data ?? []) {
      push({
        id: `chat_reading_check_ins:${row.id}`,
        practiceType: "chat",
        occurredAt: String(row.updated_at ?? row.created_at),
        value: 1,
        source: "chat_reading_check_ins",
        metadata: {
          groupId: row.group_id,
          weekStartYmd: String(row.week_start_ymd).slice(0, 10),
          keptUp: row.kept_up,
          restartBookId: row.restart_book_id,
          restartChapter: row.restart_chapter,
          graceWasApplied: row.grace_was_applied,
        },
      });
    }
  }

  if (shareRes.error) {
    console.error("[formation-momentum ingestion] share_encounters", shareRes.error.message);
  } else {
    for (const row of shareRes.data ?? []) {
      push({
        id: `share_encounters:${row.id}`,
        practiceType: "share",
        occurredAt: String(row.created_at ?? isoFromDateYmd(String(row.encounter_date))),
        value: 1,
        source: "share_encounters",
        metadata: {
          encounterDate: String(row.encounter_date).slice(0, 10),
          location: row.location,
          sharedType: row.shared_type,
          received: row.received,
          followUp: row.follow_up,
        },
      });
    }
  }

  if (pillarStreakRes.error) {
    console.error(
      "[formation-momentum ingestion] pillar_week_streak_completions",
      pillarStreakRes.error.message
    );
  } else {
    for (const row of pillarStreakRes.data ?? []) {
      push({
        id: `pillar_week_streak_completions:${row.id}`,
        practiceType: "thirds",
        occurredAt: String(row.created_at),
        value: 1,
        source: "pillar_week_streak_completions",
        metadata: {
          kind: "pillar_week_credit",
          pillarWeekStartYmd: String(row.pillar_week_start_ymd).slice(0, 10),
          streakSource: row.source,
          groupId: row.group_id,
          meetingId: row.meeting_id,
        },
      });
    }
  }

  if (personalWeeksRes.error) {
    console.error("[formation-momentum ingestion] thirds_personal_weeks", personalWeeksRes.error.message);
  } else {
    for (const row of personalWeeksRes.data ?? []) {
      const at = row.finalized_at ? String(row.finalized_at) : isoFromDateYmd(String(row.week_start_monday));
      push({
        id: `thirds_personal_weeks:${row.id}`,
        practiceType: "thirds",
        occurredAt: at,
        value: 1,
        source: "thirds_personal_weeks",
        metadata: {
          kind: "solo_week_finalized",
          weekStartMonday: String(row.week_start_monday).slice(0, 10),
          finalizedAt: row.finalized_at ? String(row.finalized_at) : null,
        },
      });
    }
  }

  if (personalGroupCompletionsRes.error) {
    console.error(
      "[formation-momentum ingestion] thirds_personal_group_completions",
      personalGroupCompletionsRes.error.message
    );
  } else {
    for (const row of personalGroupCompletionsRes.data ?? []) {
      push({
        id: `thirds_personal_group_completions:${row.id}`,
        practiceType: "thirds",
        occurredAt: String(row.completed_at),
        value: 1,
        source: "thirds_personal_group_completions",
        metadata: { kind: "informal_group_completion" },
      });
    }
  }

  for (const row of meetingRows) {
    push({
      id: `meeting_participants:${row.meeting_id}`,
      practiceType: "thirds",
      occurredAt: row.joined_at || isoFromDateYmd(row.meeting_date),
      value: 1,
      source: "meeting_participants",
      metadata: {
        kind: "group_meeting_attended",
        meetingId: row.meeting_id,
        groupId: row.group_id,
        meetingDate: row.meeting_date,
      },
    });
  }

  events.sort((a, b) => {
    const t = a.occurredAt.localeCompare(b.occurredAt);
    if (t !== 0) return t;
    return a.id.localeCompare(b.id);
  });

  return { events };
}
