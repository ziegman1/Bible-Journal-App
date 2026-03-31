import {
  BADWR_SOAPS_WEEKLY_GOAL,
  buildPrayPillar,
  buildSharePillar,
  buildThirdsPillar,
  buildWordSoapsPillar,
  expectedReadingTouchesSoFar,
  tierForScore,
  type BadwrPillarModel,
} from "@/lib/dashboard/badwr-reproduction-model";
import { pillarWeekDaysElapsedInclusive } from "@/lib/dashboard/pillar-week";
import { expectedUnitsThroughWeek } from "@/lib/dashboard/weekly-rhythm-pace";
import type { ThirdsParticipationMetrics } from "@/lib/groups/thirds-participation-metrics";

/** When historical CHAT pace isn’t stored, use a neutral mid-tier score for completed weeks. */
const CHAT_HISTORICAL_WEEK_SCORE = 0.62;

export type WeekRhythmBucket = {
  soapsQualifying: number;
  readingSessions: number;
  prayerMinutes: number;
  shares: number;
};

export function emptyBucket(): WeekRhythmBucket {
  return {
    soapsQualifying: 0,
    readingSessions: 0,
    prayerMinutes: 0,
    shares: 0,
  };
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function daysElapsedForHistoricalWeek(
  weekStartSundayYmd: string,
  currentPillarWeekStartYmd: string,
  now: Date,
  practiceTimeZone: string
): number {
  if (weekStartSundayYmd < currentPillarWeekStartYmd) return 7;
  if (weekStartSundayYmd > currentPillarWeekStartYmd) return 1;
  return pillarWeekDaysElapsedInclusive(now, practiceTimeZone);
}

export type CumulativeBadwrResult = {
  scoresById: Record<string, number>;
  /** When 3/3rds uses participation metrics, this is the full pillar (`scoresById` has no `thirds`). */
  thirdsPillarOverride: BadwrPillarModel | null;
};

export function computeCumulativeBadwr(input: {
  pillarWeekStartYmids: string[];
  currentPillarWeekStartYmd: string;
  now: Date;
  practiceTimeZone: string;
  weeklyShareGoalEncounters: number;
  weeklyPrayerGoalMinutes: number;
  buckets: Map<string, WeekRhythmBucket>;
  chatEngagedWeekStartYmd: string | null;
  currentChatPillar: BadwrPillarModel;
  attendedThirdsWeekStarts: Set<string>;
  inThirdsGroupForWeek: (weekStartYmd: string) => boolean;
  participationMetrics: ThirdsParticipationMetrics | null;
  attendedCompletedThisWeekForCurrent: boolean;
  inThirdsGroupNow: boolean;
}): CumulativeBadwrResult {
  const {
    pillarWeekStartYmids,
    currentPillarWeekStartYmd,
    now,
    practiceTimeZone,
    weeklyShareGoalEncounters,
    weeklyPrayerGoalMinutes,
    buckets,
    chatEngagedWeekStartYmd,
    currentChatPillar,
    attendedThirdsWeekStarts,
    inThirdsGroupForWeek,
    participationMetrics,
    attendedCompletedThisWeekForCurrent,
    inThirdsGroupNow,
  } = input;

  const wordScores: number[] = [];
  const prayScores: number[] = [];
  const shareScores: number[] = [];
  const chatScores: number[] = [];
  const thirdsScores: number[] = [];

  const useParticipationForThirds =
    participationMetrics != null && participationMetrics.totalWeeks > 0;

  for (const weekStart of pillarWeekStartYmids) {
    const b = buckets.get(weekStart) ?? emptyBucket();
    const days = daysElapsedForHistoricalWeek(
      weekStart,
      currentPillarWeekStartYmd,
      now,
      practiceTimeZone
    );

    const soapsExpectedSoFar = expectedUnitsThroughWeek(days, BADWR_SOAPS_WEEKLY_GOAL);
    const prayerExpectedSoFar = expectedUnitsThroughWeek(days, weeklyPrayerGoalMinutes);
    const shareExpectedSoFar = expectedUnitsThroughWeek(days, weeklyShareGoalEncounters);
    const readingExpectedSoFar = expectedReadingTouchesSoFar(days);

    wordScores.push(
      buildWordSoapsPillar({
        soapsActual: b.soapsQualifying,
        soapsExpectedSoFar,
        readingSessionsActual: b.readingSessions,
        readingExpectedSoFar,
      }).score
    );

    prayScores.push(
      buildPrayPillar({
        minutesActual: b.prayerMinutes,
        minutesExpectedSoFar: prayerExpectedSoFar,
        weeklyPrayerGoalMinutes,
      }).score
    );

    shareScores.push(
      buildSharePillar({
        shareActual: b.shares,
        shareExpectedSoFar,
        weeklyShareGoalEncounters,
      }).score
    );

    if (chatEngagedWeekStartYmd && weekStart >= chatEngagedWeekStartYmd) {
      chatScores.push(
        weekStart === currentPillarWeekStartYmd
          ? currentChatPillar.score
          : CHAT_HISTORICAL_WEEK_SCORE
      );
    } else {
      chatScores.push(0);
    }

    if (!useParticipationForThirds) {
      thirdsScores.push(
        buildThirdsPillar({
          attendedCompletedThisWeek: attendedThirdsWeekStarts.has(weekStart),
          inThirdsGroup: inThirdsGroupForWeek(weekStart),
          participationMetrics: null,
        }).score
      );
    }
  }

  const scoresById: Record<string, number> = {
    word_soaps: mean(wordScores),
    pray: mean(prayScores),
    share: mean(shareScores),
    chat: mean(chatScores),
  };

  let thirdsPillarOverride: BadwrPillarModel | null = null;
  if (useParticipationForThirds) {
    thirdsPillarOverride = buildThirdsPillar({
      attendedCompletedThisWeek: attendedCompletedThisWeekForCurrent,
      inThirdsGroup: inThirdsGroupNow,
      participationMetrics,
    });
  } else {
    scoresById.thirds = mean(thirdsScores);
  }

  return { scoresById, thirdsPillarOverride };
}

/** Merge cumulative scores into weekly pillar templates (keeps weekly hints / labels). */
export function mergeCumulativeIntoWeeklyTemplates(
  weeklyPillars: BadwrPillarModel[],
  cumulative: CumulativeBadwrResult
): BadwrPillarModel[] {
  return weeklyPillars.map((w) => {
    if (w.id === "thirds" && cumulative.thirdsPillarOverride) {
      return {
        ...cumulative.thirdsPillarOverride,
        hint: w.hint,
      };
    }
    const s = cumulative.scoresById[w.id] ?? w.score;
    return {
      ...w,
      score: s,
      tier: tierForScore(s),
    };
  });
}
