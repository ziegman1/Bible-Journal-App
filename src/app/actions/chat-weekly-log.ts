"use server";

/**
 * Manual CHAT weekly log (Manage / Options): backfill and maintain `chat_reading_check_ins`, the same
 * canonical table Q18 uses. Formation-momentum ingests this table only—no parallel source.
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  enumeratePillarWeekStartYmids,
  pillarWeekStartKeyFromInstant,
  ymdAddCalendarDays,
} from "@/lib/dashboard/pillar-week";
import { getPracticeTimeZone } from "@/lib/timezone/get-practice-timezone";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

export type ChatWeeklyLogRow = {
  weekStartYmd: string;
  /** e.g. "Mar 30 – Apr 5, 2026" in practice TZ */
  rangeLabel: string;
  /** Display status for the row */
  status: "none" | "completed" | "missed";
};

function revalidateChatSurfaces(groupId: string) {
  revalidatePath(`/app/chat/groups/${groupId}`);
  revalidatePath(`/app/chat/groups/${groupId}/manage`);
  revalidatePath("/app/chat");
  revalidatePath("/app");
}

function formatRangeLabel(weekStartYmd: string, tz: string): string {
  const start = fromZonedTime(`${weekStartYmd.slice(0, 10)}T12:00:00`, tz);
  const endYmd = ymdAddCalendarDays(weekStartYmd.slice(0, 10), 6);
  const end = fromZonedTime(`${endYmd}T12:00:00`, tz);
  const a = formatInTimeZone(start, tz, "MMM d");
  const b = formatInTimeZone(end, tz, "MMM d, yyyy");
  return `${a} – ${b}`;
}

function meetingDayHint(chatWeekday: number | null, weekdayLabels: readonly string[]): string | null {
  if (chatWeekday == null || !Number.isInteger(chatWeekday) || chatWeekday < 0 || chatWeekday > 6) {
    return null;
  }
  return `Typical meeting: ${weekdayLabels[chatWeekday] ?? "—"}`;
}

const WEEKDAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

/**
 * Load pillar weeks from the earliest relevant instant (user, group, or membership) through the current week.
 */
export async function getChatWeeklyLogSnapshot(groupId: string): Promise<
  | { error: string }
  | {
      rows: ChatWeeklyLogRow[];
      meetingHint: string | null;
    }
> {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: grp, error: gErr } = await supabase
    .from("groups")
    .select("group_kind, created_at, chat_weekday, chat_meeting_time_text")
    .eq("id", groupId)
    .single();
  if (gErr || !grp || grp.group_kind !== "chat") return { error: "Not a CHAT group" };

  const { data: mem } = await supabase
    .from("group_members")
    .select("joined_at")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!mem) return { error: "Not a member" };

  const tz = await getPracticeTimeZone();
  const now = new Date();

  const userCreated = user.created_at ? new Date(user.created_at) : now;
  const groupCreated = grp.created_at ? new Date(grp.created_at) : now;
  const joined = mem.joined_at ? new Date(mem.joined_at as string) : now;

  const earliest = new Date(Math.min(userCreated.getTime(), groupCreated.getTime(), joined.getTime()));

  const firstSundayYmd = pillarWeekStartKeyFromInstant(earliest, tz);
  const lastSundayYmd = pillarWeekStartKeyFromInstant(now, tz);

  const weekYmids = enumeratePillarWeekStartYmids(firstSundayYmd, lastSundayYmd);

  const { data: checkIns, error: cErr } = await supabase
    .from("chat_reading_check_ins")
    .select("week_start_ymd, kept_up")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .gte("week_start_ymd", firstSundayYmd)
    .lte("week_start_ymd", lastSundayYmd)
    .order("week_start_ymd", { ascending: true });

  if (cErr) return { error: cErr.message };

  const byWeek = new Map<string, boolean>();
  for (const r of checkIns ?? []) {
    const w = String(r.week_start_ymd).slice(0, 10);
    byWeek.set(w, Boolean(r.kept_up));
  }

  const rows: ChatWeeklyLogRow[] = weekYmids.map((weekStartYmd) => {
    const kept = byWeek.get(weekStartYmd);
    let status: ChatWeeklyLogRow["status"] = "none";
    if (kept === true) status = "completed";
    else if (kept === false) status = "missed";

    return {
      weekStartYmd,
      rangeLabel: formatRangeLabel(weekStartYmd, tz),
      status,
    };
  });

  const wd = grp.chat_weekday as number | null;
  const timeText = grp.chat_meeting_time_text?.trim();
  const dayPart = meetingDayHint(wd, WEEKDAY_LABELS);
  const meetingHint =
    dayPart || timeText
      ? [dayPart, timeText].filter(Boolean).join(" · ") || null
      : null;

  return { rows: rows.reverse(), meetingHint };
}

/**
 * Persist weekly status using the same upsert/delete patterns as Q18 (`chat_reading_check_ins`).
 * - **completed** → `kept_up: true` (canonical “met / kept up” for momentum).
 * - **missed** → `kept_up: false` with null restarts (explicit non-completion; still one signal row for that week).
 * - **none** → delete row so the engine sees no check-in for that week (same as never logged).
 */
export async function saveChatWeeklyLogEntry(
  groupId: string,
  weekStartYmd: string,
  status: "completed" | "missed" | "none"
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const ymd = weekStartYmd.trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return { error: "Invalid week" };

  const tz = await getPracticeTimeZone();
  const canonical = pillarWeekStartKeyFromInstant(fromZonedTime(`${ymd}T12:00:00`, tz), tz);
  if (canonical !== ymd) return { error: "Week must be a pillar-week Sunday (practice timezone)" };

  const { data: grp } = await supabase
    .from("groups")
    .select("group_kind")
    .eq("id", groupId)
    .single();
  if (!grp || grp.group_kind !== "chat") return { error: "Not a CHAT group" };

  const { data: mem } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!mem) return { error: "Not a member" };

  if (status === "none") {
    const { error: delErr } = await supabase
      .from("chat_reading_check_ins")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .eq("week_start_ymd", ymd);
    if (delErr) return { error: delErr.message };
    revalidateChatSurfaces(groupId);
    return { success: true };
  }

  const row =
    status === "completed"
      ? {
          group_id: groupId,
          user_id: user.id,
          week_start_ymd: ymd,
          kept_up: true,
          restart_book_id: null as string | null,
          restart_chapter: null as number | null,
          grace_was_applied: false,
          updated_at: new Date().toISOString(),
        }
      : {
          group_id: groupId,
          user_id: user.id,
          week_start_ymd: ymd,
          kept_up: false,
          restart_book_id: null as string | null,
          restart_chapter: null as number | null,
          grace_was_applied: false,
          updated_at: new Date().toISOString(),
        };

  const { error: upErr } = await supabase.from("chat_reading_check_ins").upsert(row, {
    onConflict: "group_id,user_id,week_start_ymd",
  });
  if (upErr) return { error: upErr.message };

  revalidateChatSurfaces(groupId);
  return { success: true };
}
