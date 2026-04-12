import { startOfUtcWeekMonday, utcDateYmd } from "@/lib/dashboard/utc-week";

/** Inclusive count of UTC Monday weeks from start Monday through end Monday (both YYYY-MM-DD). */
export function utcMondayWeeksInclusive(startMondayYmd: string, endMondayYmd: string): number {
  const start = new Date(`${startMondayYmd}T12:00:00.000Z`);
  const end = new Date(`${endMondayYmd}T12:00:00.000Z`);
  if (end.getTime() < start.getTime()) return 0;
  const msWeek = 7 * 86400000;
  return Math.floor((end.getTime() - start.getTime()) / msWeek) + 1;
}

export function currentUtcWeekMondayYmd(now: Date = new Date()): string {
  return utcDateYmd(startOfUtcWeekMonday(now));
}

export type PriorFinalizedCommitments = {
  weekStartMonday: string;
  obedience_statement: string;
  sharing_commitment: string;
  train_commitment: string;
};

export type LookForwardCarrySource = {
  obedience_statement: string;
  sharing_commitment: string;
  train_commitment: string;
  prior_obedience_done: boolean;
  prior_sharing_done: boolean;
  prior_train_done: boolean;
};

export type SuggestedLookForward = {
  obedience_statement: string;
  sharing_commitment: string;
  train_commitment: string;
};

/** Unchecked Look Back pillars pull last week’s commitment text into Look Forward defaults. */
export function buildSuggestedLookForward(
  week: LookForwardCarrySource,
  prior: PriorFinalizedCommitments | null
): SuggestedLookForward {
  const o =
    week.obedience_statement.trim() ||
    (prior && !week.prior_obedience_done ? prior.obedience_statement.trim() : "");
  const s =
    week.sharing_commitment.trim() ||
    (prior && !week.prior_sharing_done ? prior.sharing_commitment.trim() : "");
  const t =
    week.train_commitment.trim() ||
    (prior && !week.prior_train_done ? prior.train_commitment.trim() : "");
  return {
    obedience_statement: o,
    sharing_commitment: s,
    train_commitment: t,
  };
}

/** Display reference for solo Look Up (matches common Bible citation style). */
export function formatThirdsPersonalPassageRef(
  book: string,
  chapter: number,
  verseStart: number,
  verseEnd: number
): string {
  const b = book.trim();
  if (!b || chapter < 1 || verseStart < 1 || verseEnd < 1) return "";
  if (verseStart === verseEnd) return `${b} ${chapter}:${verseStart}`;
  return `${b} ${chapter}:${verseStart}–${verseEnd}`;
}

/** Prefer `passage_ref`; if empty, derive from legacy structured columns (pre–single-field solo Look Up). */
export function effectiveThirdsPersonalPassageRef(w: {
  passage_ref: string;
  look_up_book: string;
  look_up_chapter: number | null;
  look_up_verse_start: number | null;
  look_up_verse_end: number | null;
}): string {
  const pr = (w.passage_ref ?? "").trim();
  if (pr) return pr;
  const b = (w.look_up_book ?? "").trim();
  const ch = w.look_up_chapter;
  const vs = w.look_up_verse_start;
  const ve = w.look_up_verse_end;
  if (
    b &&
    ch != null &&
    vs != null &&
    ve != null &&
    Number.isFinite(ch) &&
    Number.isFinite(vs) &&
    Number.isFinite(ve)
  ) {
    return formatThirdsPersonalPassageRef(b, Math.floor(ch), Math.floor(vs), Math.floor(ve));
  }
  return "";
}
