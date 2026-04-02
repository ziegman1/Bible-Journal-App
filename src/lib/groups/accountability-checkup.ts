import { normalizeMeetingUserId } from "@/lib/groups/member-display-name";
import { splitSharingAndTrain } from "@/lib/groups/lookforward-train-embed";

export type CommitmentPillar = "obedience" | "sharing" | "train";

/** One check-up row: a single obey / share / train commitment to review. */
export type AccountabilityCheckupLine = {
  sourceMeetingId: string;
  subjectUserId: string;
  displayName: string;
  pillar: CommitmentPillar;
  pillarLabel: string;
  text: string;
  isCarryForward: boolean;
};

export type LookforwardRowInput = {
  user_id: string;
  obedience_statement: string;
  sharing_commitment: string;
  train_commitment?: string | null;
};

/** Canonical UUID string for maps (URL params vs Postgres JSON casing can differ). */
export function normalizeAccountabilityMeetingId(id: string): string {
  return String(id ?? "").trim().toLowerCase();
}

/** Stable key for merging DB checkoff rows with lines (scoped to current meeting). */
export function accountabilityLineKey(
  meetingId: string,
  line: Pick<
    AccountabilityCheckupLine,
    "sourceMeetingId" | "subjectUserId" | "pillar"
  >
): string {
  const mid = normalizeAccountabilityMeetingId(meetingId);
  const src = normalizeAccountabilityMeetingId(line.sourceMeetingId);
  const uid =
    normalizeMeetingUserId(line.subjectUserId) ??
    normalizeAccountabilityMeetingId(String(line.subjectUserId));
  return `${mid}:${src}:${uid}:${line.pillar}`;
}

export function linesFromLookforwardRows(
  sourceMeetingId: string,
  rows: LookforwardRowInput[],
  displayNameForUserId: (userId: string) => string,
  isCarryForward: boolean
): AccountabilityCheckupLine[] {
  const out: AccountabilityCheckupLine[] = [];
  for (const row of rows) {
    const uid = normalizeMeetingUserId(row.user_id) ?? row.user_id;
    const { sharing, train } = splitSharingAndTrain(row);
    const o = String(row.obedience_statement ?? "").trim();
    const s = String(sharing ?? "").trim();
    const t = String(train ?? "").trim();
    const name = displayNameForUserId(uid);
    if (o) {
      out.push({
        sourceMeetingId,
        subjectUserId: uid,
        displayName: name,
        pillar: "obedience",
        pillarLabel: "Obey",
        text: o,
        isCarryForward,
      });
    }
    if (s) {
      out.push({
        sourceMeetingId,
        subjectUserId: uid,
        displayName: name,
        pillar: "sharing",
        pillarLabel: "Share",
        text: s,
        isCarryForward,
      });
    }
    if (t) {
      out.push({
        sourceMeetingId,
        subjectUserId: uid,
        displayName: name,
        pillar: "train",
        pillarLabel: "Train",
        text: t,
        isCarryForward,
      });
    }
  }
  return out;
}

/**
 * Text for Obey / Share / Train fields: all checklist lines for this subject that are
 * not checked off in the current meeting. Multiple lines are joined with blank lines.
 */
export function buildUncheckedAccountabilityCarryForward(
  meetingId: string,
  lines: AccountabilityCheckupLine[],
  completeByKey: Record<string, boolean>,
  subjectUserId: string
): { obedience: string; sharing: string; train: string } {
  const uid = normalizeMeetingUserId(subjectUserId) ?? subjectUserId;
  const by: Record<CommitmentPillar, string[]> = {
    obedience: [],
    sharing: [],
    train: [],
  };
  for (const line of lines) {
    const lineUid =
      normalizeMeetingUserId(line.subjectUserId) ?? line.subjectUserId;
    if (lineUid !== uid) continue;
    const key = accountabilityLineKey(meetingId, line);
    if (completeByKey[key]) continue;
    const t = line.text.trim();
    if (!t) continue;
    by[line.pillar].push(t);
  }
  const dedupeJoin = (arr: string[]) => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const x of arr) {
      const n = x.trim();
      if (!n || seen.has(n)) continue;
      seen.add(n);
      out.push(n);
    }
    return out.join("\n\n");
  };
  return {
    obedience: dedupeJoin(by.obedience),
    sharing: dedupeJoin(by.sharing),
    train: dedupeJoin(by.train),
  };
}

/** Append carry paragraphs that are not already present (substring match). */
export function appendMissingCarryBlocks(existing: string, carry: string): string {
  const blocks = carry.split(/\n\n+/).map((b) => b.trim()).filter(Boolean);
  if (blocks.length === 0) return existing;
  let out = existing.trim();
  for (const b of blocks) {
    if (out.includes(b)) continue;
    out = out ? `${out}\n\n${b}` : b;
  }
  return out;
}

export function sortAccountabilityLines(
  lines: AccountabilityCheckupLine[]
): AccountabilityCheckupLine[] {
  const pillarOrder: Record<CommitmentPillar, number> = {
    obedience: 0,
    sharing: 1,
    train: 2,
  };
  return [...lines].sort((a, b) => {
    const byName = a.displayName.localeCompare(b.displayName);
    if (byName !== 0) return byName;
    if (a.isCarryForward !== b.isCarryForward) return a.isCarryForward ? -1 : 1;
    return pillarOrder[a.pillar] - pillarOrder[b.pillar];
  });
}
