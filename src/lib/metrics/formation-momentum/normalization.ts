import { formatInTimeZone } from "date-fns-tz";
import {
  PILLAR_WEEK_TIMEZONE,
  pillarWeekStartKeyFromDateYmd,
  pillarWeekStartKeyFromInstant,
} from "@/lib/dashboard/pillar-week";
import type { NormalizedSignal, PracticeType, RawEvent } from "@/lib/metrics/formation-momentum/types";

export type NormalizeEventsOptions = {
  /**
   * IANA timezone for pillar weeks (matches practice cookie / `pillar-week.ts`).
   * Defaults to {@link PILLAR_WEEK_TIMEZONE} when omitted (e.g. tests without request context).
   */
  timeZone?: string;
  /** Reserved for future anchor windows (e.g. trailing 4-week analysis); unused in v1 normalization. */
  now?: Date;
  /**
   * Mass for CHAT + 3/3rds merged weekly rows (default {@link WEEKLY_ANCHOR_UNITS}).
   * Engine may pass a lower value in early weeks so weekly anchors do not overpower Foundation.
   */
  weeklyAnchorUnitsForChatAndThirds?: number;
};

const PRACTICE_ORDER: PracticeType[] = ["soaps", "prayer", "memory", "chat", "thirds", "share"];

/**
 * **Weekly anchor practices** (CHAT, 3/3rds): each pillar week emits exactly one merged signal per stream.
 * Raw event counts are low (often ~1 participation) while daily habits accumulate large `totalUnits`.
 * Scale weekly rows so one completed week carries mass comparable to **~6 days** of typical daily volume
 * before modifiers — reflecting their role as full-week discipleship anchors (not stacking extra rows).
 */
export const WEEKLY_ANCHOR_UNITS = 6;

/**
 * Column names on `scripture_memory_settings` for goal alignment later.
 * Normalization does not load profile rows; modifiers / a merge step can attach values.
 */
export const SCRIPTURE_MEMORY_SETTINGS_GOAL_KEYS = {
  monthlyNewPassagesGoal: "monthly_new_passages_goal",
  dailyReviewGoal: "daily_review_goal",
} as const;

function resolveTz(opts?: NormalizeEventsOptions): string {
  return opts?.timeZone?.trim() || PILLAR_WEEK_TIMEZONE;
}

function safeDate(iso: string): Date | null {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Pillar-week bucket `week:yyyy-MM-dd` (Sunday start in practice TZ). */
export function weekWindowKeyFromIso(iso: string, timeZone: string): string {
  const d = safeDate(iso);
  if (!d) return "week:invalid";
  const sun = pillarWeekStartKeyFromInstant(d, timeZone);
  return `week:${sun}`;
}

/**
 * Pillar week for a scripture **practice calendar day** (`practice_date` from logs).
 * Delegates to `pillarWeekStartKeyFromDateYmd` (noon in practice TZ) for stable week boundaries.
 */
export function weekWindowKeyFromPracticeDateYmd(
  practiceDayYmd: string,
  timeZone: string
): string {
  const d = practiceDayYmd.trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return "week:invalid";
  const sun = pillarWeekStartKeyFromDateYmd(d, timeZone);
  return `week:${sun}`;
}

function dayKeyInTz(iso: string, timeZone: string): string {
  const d = safeDate(iso);
  if (!d) return "invalid";
  return formatInTimeZone(d, timeZone, "yyyy-MM-dd");
}

function metaStr(e: RawEvent, key: string): string | undefined {
  const v = e.metadata?.[key];
  return typeof v === "string" ? v : undefined;
}

function metaBool(e: RawEvent, key: string): boolean | undefined {
  const v = e.metadata?.[key];
  return typeof v === "boolean" ? v : undefined;
}

function metaNum(e: RawEvent, key: string): number | undefined {
  const v = e.metadata?.[key];
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

type WeeklyAgg = {
  totalUnits: number;
  qualifyingUnits: number;
  /** local yyyy-MM-dd */
  days: Set<string>;
  /** prayer: optional minute breakdown */
  prayerBySource?: Record<string, number>;
};

function emptyWeeklyAgg(): WeeklyAgg {
  return {
    totalUnits: 0,
    qualifyingUnits: 0,
    days: new Set(),
  };
}

/** Per-pillar-week aggregates for scripture (split new vs review in the emit phase). */
type MemoryWeekBucket = {
  newSum: number;
  reviewSum: number;
  daysWithNew: Set<string>;
  daysWithReview: Set<string>;
};

/**
 * Convert heterogeneous {@link RawEvent} rows into comparable, window-grouped {@link NormalizedSignal}s.
 *
 * **Primary time model (v1):** all practices use **pillar weeks** — `windowKey` = `week:yyyy-MM-dd` (Sunday start,
 * practice TZ). Scripture Memory (`memory_new` / `memory_review`) buckets by the pillar week that contains each
 * row’s `practice_date` (see {@link weekWindowKeyFromPracticeDateYmd}). Monthly scripture UI / reports are unchanged.
 *
 * **Assumptions**
 * - **Practice TZ:** Defaults to `PILLAR_WEEK_TIMEZONE` when omitted; server should pass the user’s cookie TZ.
 * - **Scripture goals:** `metadata.scriptureSettingsColumnNames` + `profileGoalsFromSettings` (null here) wire to
 *   `monthly_new_passages_goal` / `daily_review_goal` later. Weekly targets can be **derived** from those (e.g.
 *   prorate month across remaining pillar weeks, or policy-specific factors) without reintroducing monthly windows.
 * - **3/3rds dedupe:** One merged signal per week; see `metadata.sourcesSeen` / `traceEventIds`.
 * - **CHAT:** `week_start_ymd` aligns with the same `week:*` keys. One row per pillar week; `totalUnits`
 *   uses the weekly anchor (default {@link WEEKLY_ANCHOR_UNITS}) when any check-in exists.
 * - **3/3rds:** One merged row per pillar week; same weekly anchor mass for participation.
 */
export function normalizeEvents(
  events: readonly RawEvent[],
  options?: NormalizeEventsOptions
): NormalizedSignal[] {
  const tz = resolveTz(options);
  const weeklyAnchorUnits =
    typeof options?.weeklyAnchorUnitsForChatAndThirds === "number" &&
    Number.isFinite(options.weeklyAnchorUnitsForChatAndThirds) &&
    options.weeklyAnchorUnitsForChatAndThirds > 0
      ? options.weeklyAnchorUnitsForChatAndThirds
      : WEEKLY_ANCHOR_UNITS;
  const soapsByWeek = new Map<string, WeeklyAgg>();
  const prayerByWeek = new Map<string, WeeklyAgg>();
  const chatByWeek = new Map<
    string,
    {
      checkIns: number;
      keptUpCount: number;
      notKeptUpCount: number;
      graceAppliedCount: number;
      groupIds: Set<string>;
      activityDays: Set<string>;
    }
  >();
  const shareByWeek = new Map<string, WeeklyAgg>();

  const memoryByWeek = new Map<string, MemoryWeekBucket>();

  /** thirds: week -> raw events for dedupe */
  const thirdsByWeek = new Map<string, RawEvent[]>();

  for (const e of events) {
    switch (e.practiceType) {
      case "soaps": {
        const wk = weekWindowKeyFromIso(e.occurredAt, tz);
        let agg = soapsByWeek.get(wk);
        if (!agg) {
          agg = emptyWeeklyAgg();
          soapsByWeek.set(wk, agg);
        }
        agg.totalUnits += 1;
        if (metaBool(e, "qualifying") === true) agg.qualifyingUnits += 1;
        const entryDay = metaStr(e, "entryDate") ?? dayKeyInTz(e.occurredAt, tz);
        agg.days.add(entryDay.slice(0, 10));
        break;
      }
      case "prayer": {
        const wk = weekWindowKeyFromIso(e.occurredAt, tz);
        let agg = prayerByWeek.get(wk);
        if (!agg) {
          agg = emptyWeeklyAgg();
          agg.prayerBySource = {};
          prayerByWeek.set(wk, agg);
        }
        const minutes = Math.max(0, e.value);
        agg.totalUnits += minutes;
        agg.qualifyingUnits += minutes;
        agg.days.add(dayKeyInTz(e.occurredAt, tz));
        const src = e.source;
        if (agg.prayerBySource) {
          agg.prayerBySource[src] = (agg.prayerBySource[src] ?? 0) + minutes;
        }
        break;
      }
      case "memory": {
        const practiceDay =
          metaStr(e, "practiceDate")?.slice(0, 10) ?? dayKeyInTz(e.occurredAt, tz);
        const wk = weekWindowKeyFromPracticeDateYmd(practiceDay, tz);
        let bucket = memoryByWeek.get(wk);
        if (!bucket) {
          bucket = {
            newSum: 0,
            reviewSum: 0,
            daysWithNew: new Set(),
            daysWithReview: new Set(),
          };
          memoryByWeek.set(wk, bucket);
        }
        const n = metaNum(e, "memorizedNewCount") ?? 0;
        const r = metaNum(e, "reviewedCount") ?? 0;
        bucket.newSum += Math.max(0, n);
        bucket.reviewSum += Math.max(0, r);
        if (n > 0) bucket.daysWithNew.add(practiceDay.slice(0, 10));
        if (r > 0) bucket.daysWithReview.add(practiceDay.slice(0, 10));
        break;
      }
      case "chat": {
        const ws = metaStr(e, "weekStartYmd")?.slice(0, 10);
        const wk = ws ? `week:${ws}` : weekWindowKeyFromIso(e.occurredAt, tz);
        let row = chatByWeek.get(wk);
        if (!row) {
          row = {
            checkIns: 0,
            keptUpCount: 0,
            notKeptUpCount: 0,
            graceAppliedCount: 0,
            groupIds: new Set(),
            activityDays: new Set(),
          };
          chatByWeek.set(wk, row);
        }
        row.checkIns += 1;
        row.activityDays.add(dayKeyInTz(e.occurredAt, tz));
        if (metaBool(e, "keptUp") === true) row.keptUpCount += 1;
        if (metaBool(e, "keptUp") === false) row.notKeptUpCount += 1;
        if (metaBool(e, "graceWasApplied") === true) row.graceAppliedCount += 1;
        const gid = metaStr(e, "groupId");
        if (gid) row.groupIds.add(gid);
        break;
      }
      case "thirds": {
        const wk = weekWindowKeyFromIso(e.occurredAt, tz);
        const list = thirdsByWeek.get(wk) ?? [];
        list.push(e);
        thirdsByWeek.set(wk, list);
        break;
      }
      case "share": {
        const wk = weekWindowKeyFromIso(e.occurredAt, tz);
        let agg = shareByWeek.get(wk);
        if (!agg) {
          agg = emptyWeeklyAgg();
          shareByWeek.set(wk, agg);
        }
        agg.totalUnits += 1;
        agg.qualifyingUnits += 1;
        const encDay = metaStr(e, "encounterDate")?.slice(0, 10) ?? dayKeyInTz(e.occurredAt, tz);
        agg.days.add(encDay);
        break;
      }
      default:
        break;
    }
  }

  const scriptureGoalMeta = {
    scriptureSettingsColumnNames: { ...SCRIPTURE_MEMORY_SETTINGS_GOAL_KEYS },
    /** Populated when merging `scripture_memory_settings`; keeps monthly goal fields addressable without monthly windows */
    profileGoalsFromSettings: {
      monthlyNewPassagesGoal: null as number | null,
      dailyReviewGoal: null as number | null,
    },
  };

  const out: NormalizedSignal[] = [];

  for (const [wk, agg] of [...soapsByWeek.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    out.push({
      id: `soaps:${wk}`,
      practiceType: "soaps",
      windowKey: wk,
      totalUnits: agg.totalUnits,
      qualifyingUnits: agg.qualifyingUnits,
      daysWithActivity: agg.days.size,
      goalTarget: null,
      metadata: {
        uniqueEntryDays: [...agg.days].sort(),
      },
    });
  }

  for (const [wk, agg] of [...prayerByWeek.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    out.push({
      id: `prayer:${wk}`,
      practiceType: "prayer",
      windowKey: wk,
      totalUnits: agg.totalUnits,
      qualifyingUnits: agg.qualifyingUnits,
      daysWithActivity: agg.days.size,
      goalTarget: null,
      metadata: {
        minutesTotal: agg.totalUnits,
        sourceMinutes: agg.prayerBySource ?? {},
        uniquePrayerDays: [...agg.days].sort(),
      },
    });
  }

  for (const [wk, bucket] of [...memoryByWeek.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    out.push({
      id: `memory:${wk}:new`,
      practiceType: "memory",
      windowKey: wk,
      subtype: "memory_new",
      totalUnits: bucket.newSum,
      qualifyingUnits: bucket.newSum,
      daysWithActivity: bucket.daysWithNew.size,
      goalTarget: null,
      metadata: {
        kind: "memorized_new",
        practiceDaysNew: [...bucket.daysWithNew].sort(),
        primaryGoalColumn: SCRIPTURE_MEMORY_SETTINGS_GOAL_KEYS.monthlyNewPassagesGoal,
        ...scriptureGoalMeta,
      },
    });
    out.push({
      id: `memory:${wk}:review`,
      practiceType: "memory",
      windowKey: wk,
      subtype: "memory_review",
      totalUnits: bucket.reviewSum,
      qualifyingUnits: bucket.reviewSum,
      daysWithActivity: bucket.daysWithReview.size,
      goalTarget: null,
      metadata: {
        kind: "reviewed",
        practiceDaysReview: [...bucket.daysWithReview].sort(),
        primaryGoalColumn: SCRIPTURE_MEMORY_SETTINGS_GOAL_KEYS.dailyReviewGoal,
        ...scriptureGoalMeta,
      },
    });
  }

  for (const [wk, row] of [...chatByWeek.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const anchorUnits = row.checkIns > 0 ? weeklyAnchorUnits : 0;
    out.push({
      id: `chat:${wk}`,
      practiceType: "chat",
      windowKey: wk,
      totalUnits: anchorUnits,
      /** Q18 “on pace” submissions — preserved counts; not scaled (kept for audit / consistency heuristics). */
      qualifyingUnits: row.keptUpCount,
      daysWithActivity: row.activityDays.size,
      goalTarget: null,
      metadata: {
        checkInCount: row.checkIns,
        keptUpCount: row.keptUpCount,
        notKeptUpCount: row.notKeptUpCount,
        graceAppliedCount: row.graceAppliedCount,
        distinctGroups: row.groupIds.size,
        groupIds: [...row.groupIds].sort(),
      },
    });
  }

  for (const [wk, list] of [...thirdsByWeek.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const days = new Set<string>();
    const sourcesSeen = new Set<string>();
    const traceIds: string[] = [];
    for (const ev of list) {
      days.add(dayKeyInTz(ev.occurredAt, tz));
      sourcesSeen.add(ev.source);
      traceIds.push(ev.id);
    }
    out.push({
      id: `thirds:${wk}:deduped`,
      practiceType: "thirds",
      windowKey: wk,
      subtype: "thirds_week_participation",
      /** Scaled to weekly anchor mass; still one merged row per pillar week (deduped sources). */
      totalUnits: weeklyAnchorUnits,
      qualifyingUnits: weeklyAnchorUnits,
      daysWithActivity: days.size,
      goalTarget: null,
      metadata: {
        rawEventCount: list.length,
        sourcesSeen: [...sourcesSeen].sort(),
        traceEventIds: traceIds.sort(),
      },
    });
  }

  for (const [wk, agg] of [...shareByWeek.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    out.push({
      id: `share:${wk}`,
      practiceType: "share",
      windowKey: wk,
      totalUnits: agg.totalUnits,
      qualifyingUnits: agg.qualifyingUnits,
      daysWithActivity: agg.days.size,
      goalTarget: null,
      metadata: {
        uniqueEncounterDays: [...agg.days].sort(),
      },
    });
  }

  out.sort((a, b) => {
    const pi = PRACTICE_ORDER.indexOf(a.practiceType);
    const pj = PRACTICE_ORDER.indexOf(b.practiceType);
    if (pi !== pj) return pi - pj;
    const w = a.windowKey.localeCompare(b.windowKey);
    if (w !== 0) return w;
    return (a.subtype ?? "").localeCompare(b.subtype ?? "");
  });

  return out;
}
