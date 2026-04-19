/**
 * **Next best steps (v1)** — presentation-only coaching copy derived from the same `explain` payload as the
 * formation-momentum card. Does not change scoring.
 *
 * **How “behind” is determined (v1 thresholds):**
 * - **CHAT / 3/3rds:** “Completed” = any activity in the **current pillar week** (check-ins / participation).
 *   These are weekly-formation anchors; missing either is treated as highest-priority gap.
 * - **SOAPS / Prayer / Memory:** “Weak” = low `daysWithActivity` and/or `goalAlignmentFactor` below an
 *   on-track band (engine already compared actual vs goals in that factor).
 * - **Share:** low encounters or goal factor below track — reproduction nudge.
 *
 * **Why this priority order:** Weekly formation practices (CHAT, 3/3rds) are binary “did you show up” signals
 * for community rhythm; when absent they’re called out first. Daily habits (SOAPS, prayer, memory) come next
 * because they compound foundation. Goal-shortfall wording uses the same factors when we need sharper copy.
 * Reproduction (share) follows when inward habits are already in motion.
 *
 * **Evolving:** Later we can swap thresholds for profile-specific targets, add streak context, or blend with
 * a coaching model—keep this module pure so the UI can adopt richer rules without touching the engine.
 */

import { pillarWeekStartKeyFromInstant } from "@/lib/dashboard/pillar-week";
import type {
  FormationMomentumExplain,
  FormationMomentumSignalExplain,
  PracticeType,
} from "@/lib/metrics/formation-momentum/types";

/** Days in the pillar week we treat as a “strong” rhythm for SOAPS / prayer (v1). */
const RHYTHM_DAY_STRONG = 4;

/** Below this goal-alignment factor, the engine considers the practice meaningfully under goal. */
const ON_TRACK_FACTOR = 0.88;

/** Use sharper “behind your goal” copy under this factor. */
const SEVERE_SHORTFALL = 0.72;

type WeekPracticeStatus = {
  currentWeekKey: string;
  chat: { done: boolean; goalFactor: number };
  thirds: { done: boolean; goalFactor: number };
  soaps: {
    present: boolean;
    qualifyingUnits: number;
    daysWithActivity: number;
    goalFactor: number;
  };
  prayer: {
    present: boolean;
    totalUnits: number;
    daysWithActivity: number;
    goalFactor: number;
  };
  memoryNew: {
    present: boolean;
    totalUnits: number;
    daysWithActivity: number;
    goalFactor: number;
  };
  memoryReview: {
    present: boolean;
    totalUnits: number;
    daysWithActivity: number;
    goalFactor: number;
  };
  share: {
    present: boolean;
    totalUnits: number;
    daysWithActivity: number;
    goalFactor: number;
  };
};

function findSignal(
  signals: FormationMomentumSignalExplain[],
  id: string | undefined
): FormationMomentumSignalExplain | undefined {
  if (!id) return undefined;
  return signals.find((s) => s.signalId === id);
}

function sliceFor(
  explain: FormationMomentumExplain,
  weekKey: string,
  practiceType: PracticeType,
  subtype?: string
) {
  return explain.normalizedSignals.find(
    (n) =>
      n.windowKey === weekKey &&
      n.practiceType === practiceType &&
      (subtype === undefined ? n.subtype === undefined : n.subtype === subtype)
  );
}

/**
 * Summarize practices for the **current** pillar week (same week model as the engine).
 */
function summarizeWeekStatus(
  explain: FormationMomentumExplain | undefined,
  timeZone: string,
  now: Date = new Date()
): WeekPracticeStatus | null {
  if (!explain?.normalizedSignals?.length) return null;

  const sun = pillarWeekStartKeyFromInstant(now, timeZone);
  const currentWeekKey = `week:${sun}`;
  const sigList = explain.signals;

  const chatN = sliceFor(explain, currentWeekKey, "chat");
  const chatSig = findSignal(sigList, chatN?.id);
  const chatDone =
    !!chatN && (chatN.totalUnits > 0 || chatN.qualifyingUnits > 0 || chatN.daysWithActivity > 0);
  const chatFactor = chatSig?.goalAlignmentFactor ?? 1;

  const thirdsN = sliceFor(explain, currentWeekKey, "thirds", "thirds_week_participation");
  const thirdsSig = findSignal(sigList, thirdsN?.id);
  const thirdsDone = !!thirdsN && thirdsN.totalUnits > 0;
  const thirdsFactor = thirdsSig?.goalAlignmentFactor ?? 1;

  const soapsN = sliceFor(explain, currentWeekKey, "soaps");
  const soapsSig = findSignal(sigList, soapsN?.id);
  const soapsPresent = !!soapsN;
  const soapsFactor = soapsSig?.goalAlignmentFactor ?? (soapsPresent ? 1 : 0);

  const prayerN = sliceFor(explain, currentWeekKey, "prayer");
  const prayerSig = findSignal(sigList, prayerN?.id);
  const prayerPresent = !!prayerN;
  const prayerFactor = prayerSig?.goalAlignmentFactor ?? (prayerPresent ? 1 : 0);

  const memNewN = sliceFor(explain, currentWeekKey, "memory", "memory_new");
  const memNewSig = findSignal(sigList, memNewN?.id);
  const memoryNewPresent = !!memNewN;
  const memoryNewFactor = memNewSig?.goalAlignmentFactor ?? (memoryNewPresent ? 1 : 0);

  const memRevN = sliceFor(explain, currentWeekKey, "memory", "memory_review");
  const memRevSig = findSignal(sigList, memRevN?.id);
  const memoryReviewPresent = !!memRevN;
  const memoryReviewFactor = memRevSig?.goalAlignmentFactor ?? (memoryReviewPresent ? 1 : 0);

  const shareN = sliceFor(explain, currentWeekKey, "share");
  const shareSig = findSignal(sigList, shareN?.id);
  const sharePresent = !!shareN;
  const shareFactor = shareSig?.goalAlignmentFactor ?? (sharePresent ? 1 : 0);

  return {
    currentWeekKey,
    chat: { done: chatDone, goalFactor: chatFactor },
    thirds: { done: thirdsDone, goalFactor: thirdsFactor },
    soaps: {
      present: soapsPresent,
      qualifyingUnits: soapsN?.qualifyingUnits ?? 0,
      daysWithActivity: soapsN?.daysWithActivity ?? 0,
      goalFactor: soapsFactor,
    },
    prayer: {
      present: prayerPresent,
      totalUnits: prayerN?.totalUnits ?? 0,
      daysWithActivity: prayerN?.daysWithActivity ?? 0,
      goalFactor: prayerFactor,
    },
    memoryNew: {
      present: memoryNewPresent,
      totalUnits: memNewN?.totalUnits ?? 0,
      daysWithActivity: memNewN?.daysWithActivity ?? 0,
      goalFactor: memoryNewFactor,
    },
    memoryReview: {
      present: memoryReviewPresent,
      totalUnits: memRevN?.totalUnits ?? 0,
      daysWithActivity: memRevN?.daysWithActivity ?? 0,
      goalFactor: memoryReviewFactor,
    },
    share: {
      present: sharePresent,
      totalUnits: shareN?.totalUnits ?? 0,
      daysWithActivity: shareN?.daysWithActivity ?? 0,
      goalFactor: shareFactor,
    },
  };
}

type Gap = {
  key: string;
  /** 1 = CHAT/3/3rds tier, 2 = rhythm, 3 = severe goal, 4 = reproduction */
  tier: number;
  text: string;
};

function soapsWeak(s: WeekPracticeStatus): boolean {
  return (
    !s.soaps.present ||
    s.soaps.daysWithActivity < RHYTHM_DAY_STRONG ||
    s.soaps.goalFactor < ON_TRACK_FACTOR
  );
}

function prayerWeak(s: WeekPracticeStatus): boolean {
  return (
    !s.prayer.present ||
    s.prayer.daysWithActivity < RHYTHM_DAY_STRONG ||
    s.prayer.goalFactor < ON_TRACK_FACTOR
  );
}

function laneNeedsWork(goalFactor: number, present: boolean): boolean {
  if (!present) return true;
  return goalFactor < ON_TRACK_FACTOR;
}

function memoryWeak(s: WeekPracticeStatus): boolean {
  return (
    laneNeedsWork(s.memoryNew.goalFactor, s.memoryNew.present) ||
    laneNeedsWork(s.memoryReview.goalFactor, s.memoryReview.present)
  );
}

function shareWeak(s: WeekPracticeStatus): boolean {
  return !s.share.present || s.share.totalUnits < 1 || s.share.goalFactor < ON_TRACK_FACTOR;
}

function soapsCopy(s: WeekPracticeStatus): string {
  if (s.soaps.goalFactor < SEVERE_SHORTFALL) {
    return "You’re behind your SOAPS pace for the week—add another qualifying journaling session.";
  }
  return "Add 1–2 more days of SOAPS this week to firm up your base rhythm.";
}

function prayerCopy(s: WeekPracticeStatus): string {
  if (s.prayer.goalFactor < SEVERE_SHORTFALL) {
    return "You’re behind your prayer-minute goal—schedule another focused prayer time this week.";
  }
  return "Increase prayer consistency—aim for focused prayer on more days this week.";
}

function memoryCopy(s: WeekPracticeStatus): string {
  const newNeeds = laneNeedsWork(s.memoryNew.goalFactor, s.memoryNew.present);
  const revNeeds = laneNeedsWork(s.memoryReview.goalFactor, s.memoryReview.present);

  if (newNeeds && revNeeds) {
    return "Strengthen Scripture memory—add new passages or extra review sessions this week.";
  }
  if (newNeeds) {
    if (s.memoryNew.goalFactor < SEVERE_SHORTFALL) {
      return "You’re behind on new memory passages—add a short session to catch up.";
    }
    return "Add time for new Scripture memory this week.";
  }
  if (revNeeds) {
    if (s.memoryReview.goalFactor < SEVERE_SHORTFALL) {
      return "You’re behind on memory review—fit in another review session before the week ends.";
    }
    return "Add another Scripture memory review day this week.";
  }
  return "Strengthen Scripture memory—add new passages or extra review sessions this week.";
}

function shareCopy(s: WeekPracticeStatus): string {
  if (s.share.goalFactor < SEVERE_SHORTFALL || s.share.totalUnits < 1) {
    return "Initiate one gospel or spiritual conversation this week—or log a share you’ve already had.";
  }
  return "Look for one more spiritual conversation this week to stay on pace with your sharing goal.";
}

/**
 * Returns **1–2** actionable strings, prioritized: missing CHAT/3/3rds → daily/weekly habits → reproduction.
 */
export function computeNextBestSteps(
  explain: FormationMomentumExplain | undefined,
  timeZone: string,
  now: Date = new Date()
): string[] {
  const status = summarizeWeekStatus(explain, timeZone, now);
  if (!status) {
    return ["Keep investing in Word, prayer, community, and sharing this week."];
  }

  const gaps: Gap[] = [];

  if (!status.chat.done) {
    gaps.push({
      key: "chat",
      tier: 1,
      text: "Complete at least one CHAT check-in this week.",
    });
  }

  if (!status.thirds.done) {
    gaps.push({
      key: "thirds",
      tier: 1,
      text: "Participate in 3/3rds this week (group meeting or your weekly rhythm).",
    });
  }

  const foundationGaps: Gap[] = [];

  if (soapsWeak(status)) {
    foundationGaps.push({ key: "soaps", tier: 2, text: soapsCopy(status) });
  }
  if (prayerWeak(status)) {
    foundationGaps.push({ key: "prayer", tier: 2, text: prayerCopy(status) });
  }
  if (memoryWeak(status)) {
    foundationGaps.push({ key: "memory", tier: 2, text: memoryCopy(status) });
  }

  if (foundationGaps.length > 0) {
    foundationGaps.sort((a, b) => {
      const fa = factorForKey(status, a.key);
      const fb = factorForKey(status, b.key);
      return fa - fb;
    });
    gaps.push(foundationGaps[0]!);
  }

  if (shareWeak(status)) {
    gaps.push({ key: "share", tier: 4, text: shareCopy(status) });
  }

  gaps.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier;
    return 0;
  });

  const seen = new Set<string>();
  const out: string[] = [];
  for (const g of gaps) {
    if (seen.has(g.key)) continue;
    seen.add(g.key);
    out.push(g.text);
    if (out.length >= 2) break;
  }

  if (out.length === 0) {
    return ["Stay consistent this week—small faithful steps keep momentum."];
  }

  return out;
}

function factorForKey(status: WeekPracticeStatus, key: string): number {
  switch (key) {
    case "soaps":
      return status.soaps.goalFactor;
    case "prayer":
      return status.prayer.goalFactor;
    case "memory":
      return Math.min(status.memoryNew.goalFactor, status.memoryReview.goalFactor);
    default:
      return 1;
  }
}
