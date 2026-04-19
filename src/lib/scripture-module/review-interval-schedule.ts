/** Default spacing between completed review cycles (days). */
export const DEFAULT_REVIEW_INTERVAL_DAYS = [1, 3, 7, 14, 30] as const;

/** User-selectable manual override options (days). */
export const MANUAL_REVIEW_INTERVAL_DAYS = [1, 3, 5, 7, 14, 30] as const;

export type ManualReviewIntervalDay = (typeof MANUAL_REVIEW_INTERVAL_DAYS)[number];

export function isValidManualReviewIntervalDay(n: number): n is ManualReviewIntervalDay {
  return (MANUAL_REVIEW_INTERVAL_DAYS as readonly number[]).includes(n);
}

export function formatManualIntervalLabel(days: number): string {
  if (days === 1) return "1 day";
  if (days === 5) return "5 days";
  if (days === 7) return "1 week";
  if (days === 14) return "2 weeks";
  if (days === 30) return "1 month";
  return `${days} days`;
}

export function daysForReviewIntervalIndex(index: number): number {
  const i = Math.max(0, Math.min(index, DEFAULT_REVIEW_INTERVAL_DAYS.length - 1));
  return DEFAULT_REVIEW_INTERVAL_DAYS[i]!;
}

export function nextIntervalIndexAfterCompletedCycle(currentIndex: number): number {
  return Math.min(currentIndex + 1, DEFAULT_REVIEW_INTERVAL_DAYS.length - 1);
}

export function addDaysIsoFromNow(days: number): string {
  const n = Number(days);
  const safe = Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
  const d = new Date();
  d.setDate(d.getDate() + safe);
  return d.toISOString();
}
