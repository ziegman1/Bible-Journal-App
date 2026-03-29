export const BADWR_SOAPS_WEEKLY_GOAL = 5;
export const BADWR_READING_CHAPTERS_PER_DAY = 4;
export const BADWR_READING_MAX_PER_WEEK = 35;
export const BADWR_PRAYER_MINUTES_WEEKLY_GOAL = 60;
export const BADWR_SHARE_WEEKLY_GOAL = 4;

export type BadwrPillarTier = "strong" | "ok" | "attention";

export type BadwrPillarModel = {
  id: string;
  label: string;
  shortLabel: string;
  score: number;
  tier: BadwrPillarTier;
  hint: string;
  href: string;
};

export function ratioToScore(actual: number, expected: number): number {
  if (expected <= 0) return actual > 0 ? 1 : 0;
  return Math.min(1, actual / expected);
}

export function tierForScore(score: number): BadwrPillarTier {
  if (score >= 0.82) return "strong";
  if (score >= 0.55) return "ok";
  return "attention";
}

export function buildWordSoapsPillar(input: {
  soapsActual: number;
  soapsExpectedSoFar: number;
  readingSessionsActual: number;
  readingExpectedSoFar: number;
}): BadwrPillarModel {
  const soapsScore = ratioToScore(input.soapsActual, Math.max(1, input.soapsExpectedSoFar));
  const readScore = ratioToScore(
    input.readingSessionsActual,
    Math.max(1, input.readingExpectedSoFar)
  );
  const score = (soapsScore + readScore) / 2;
  const tier = tierForScore(score);
  let hint = "Keep a daily rhythm of SOAPS and steady reading (about 3–5 chapters per day).";
  if (soapsScore < readScore) hint = "Add SOAPS journal entries from Scripture you’re reading.";
  else if (readScore < soapsScore) hint = "Spend more time in the reader—aim for several chapters most days.";
  return {
    id: "word_soaps",
    label: "Word & SOAPS",
    shortLabel: "SOAPS + reading",
    score,
    tier,
    hint,
    href: "/app/soaps",
  };
}

export function buildPrayPillar(input: {
  minutesActual: number;
  minutesExpectedSoFar: number;
}): BadwrPillarModel {
  const score = ratioToScore(input.minutesActual, Math.max(1, input.minutesExpectedSoFar));
  return {
    id: "pray",
    label: "Pray",
    shortLabel: "Prayer",
    score,
    tier: tierForScore(score),
    hint: "Use the Prayer Wheel or your list—build toward about an hour a week.",
    href: "/app/prayer",
  };
}

export function buildChatPillar(input: {
  inChatGroup: boolean;
  paceAheadOrOn: boolean;
  /** loosely behind but not empty */
  paceRecoverable: boolean;
  chatHref?: string;
}): BadwrPillarModel {
  let score: number;
  let hint: string;
  if (!input.inChatGroup) {
    score = 0;
    hint = "Join or open a CHAT group for weekly accountability.";
  } else if (input.paceAheadOrOn) {
    score = 1;
    hint = "Your CHAT reading pace looks healthy this week.";
  } else if (input.paceRecoverable) {
    score = 0.62;
    hint = "Catch up on your CHAT reading plan before your next meeting.";
  } else {
    score = 0.32;
    hint = "Prioritize CHAT reading—several chapters behind the agreed pace.";
  }
  return {
    id: "chat",
    label: "CHAT",
    shortLabel: "CHAT",
    score,
    tier: tierForScore(score),
    hint,
    href: input.chatHref ?? "/app/chat",
  };
}

export function buildThirdsPillar(input: {
  attendedCompletedThisWeek: boolean;
  inThirdsGroup: boolean;
}): BadwrPillarModel {
  let score: number;
  let hint: string;
  if (input.attendedCompletedThisWeek) {
    score = 1;
    hint = "You connected with your 3/3rds group this week.";
  } else if (input.inThirdsGroup) {
    score = 0.42;
    hint = "Plan to attend or host a completed 3/3rds meeting this week.";
  } else {
    score = 0;
    hint = "Join a 3/3rds group and meet weekly when possible.";
  }
  return {
    id: "thirds",
    label: "3/3rds",
    shortLabel: "3/3rds",
    score,
    tier: tierForScore(score),
    hint,
    href: "/app/groups",
  };
}

export function buildSharePillar(input: {
  shareActual: number;
  shareExpectedSoFar: number;
}): BadwrPillarModel {
  const score = ratioToScore(input.shareActual, Math.max(1, input.shareExpectedSoFar));
  return {
    id: "share",
    label: "Share",
    shortLabel: "Share",
    score,
    tier: tierForScore(score),
    hint: "Log who and how you’ll share (SOAPS “Share”)—aim for several times a week.",
    href: "/app/share",
  };
}

export function overallReproductionPercent(pillars: BadwrPillarModel[]): number {
  if (pillars.length === 0) return 0;
  const sum = pillars.reduce((s, p) => s + p.score, 0);
  return Math.round((sum / pillars.length) * 100);
}

export function expectedReadingTouchesSoFar(daysElapsed: number): number {
  const cap = BADWR_READING_MAX_PER_WEEK;
  const raw = Math.floor(daysElapsed * BADWR_READING_CHAPTERS_PER_DAY);
  return Math.min(cap, Math.max(1, raw));
}
