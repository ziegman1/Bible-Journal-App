import { parseSoloScriptureReference } from "@/lib/groups/solo-scripture-reference-parse";
import type {
  SoloLookUpMode,
  ThirdsPersonalDbsObservationDTO,
  ThirdsPersonalDbsObservationType,
  ThirdsPersonalWorkspacePayload,
} from "@/lib/groups/thirds-personal-types";
import { effectiveThirdsPersonalPassageRef } from "@/lib/groups/thirds-personal-helpers";

export type DbsDiscoveryObsRow = {
  observation_type: string;
  note?: unknown;
  verse_number: unknown;
  verse_end: unknown;
  book: unknown;
  chapter: unknown;
};

function parseSoloPassageBounds(passageRef: string) {
  const p = parseSoloScriptureReference(passageRef.trim());
  if (!p.ok) return { ok: false as const, message: p.message };
  return {
    ok: true as const,
    book: p.book,
    chapter: p.chapter,
    verseStart: p.verseStart,
    verseEnd: p.verseEnd,
  };
}

export function validateDbsVerseInPassage(
  passageRef: string,
  book: string,
  chapter: number,
  verseNumber: number,
  verseEnd: number | null
): string | null {
  const b = parseSoloPassageBounds(passageRef);
  if (!b.ok) return b.message;
  if (b.book.trim().toLowerCase() !== book.trim().toLowerCase()) {
    return "Use this passage’s book for each observation.";
  }
  if (b.chapter !== chapter) {
    return "Use this passage’s chapter for each observation.";
  }
  const lo = Math.min(verseNumber, verseEnd ?? verseNumber);
  const hi = Math.max(verseNumber, verseEnd ?? verseNumber);
  if (lo < b.verseStart || hi > b.verseEnd) {
    return `Choose verses between ${b.verseStart} and ${b.verseEnd} in this passage.`;
  }
  return null;
}

/** Same rules as finalize DBS Look Up checks; `null` means all four observations are valid. */
export function getDbsDiscoveryFinalizeError(
  passage: string,
  obsList: DbsDiscoveryObsRow[] | null | undefined
): string | null {
  const required: { typ: ThirdsPersonalDbsObservationType; label: string }[] = [
    { typ: "like", label: "What do you like" },
    { typ: "difficult", label: "What seems difficult" },
    { typ: "teaches_about_people", label: "What it teaches about people" },
    { typ: "teaches_about_god", label: "What it teaches about God" },
  ];
  for (const { typ, label } of required) {
    const ob = (obsList ?? []).find((x) => x.observation_type === typ);
    if (!ob || !String(ob.note ?? "").trim()) {
      return `DBS Look Up: save all four discovery observations (with verse anchors) before finalizing. Missing: ${label}.`;
    }
    const vn = Number(ob.verse_number);
    if (!Number.isFinite(vn) || vn < 1) {
      return "DBS Look Up: each observation needs a verse anchor.";
    }
    const ve = ob.verse_end == null || ob.verse_end === "" ? null : Number(ob.verse_end);
    const vErr = validateDbsVerseInPassage(
      passage,
      String(ob.book ?? ""),
      Number(ob.chapter ?? 0),
      vn,
      ve
    );
    if (vErr) return `DBS Look Up (${typ}): ${vErr}`;
  }
  return null;
}

/** Shared finalize checks for solo Personal 3/3rds (server finalize + guest-local finalize). */
export function validatePersonalThirdsFinalizePayload(
  payload: ThirdsPersonalWorkspacePayload,
  lookUpMode: SoloLookUpMode
): string | null {
  const row = payload.week;
  if (row.finalized_at) return "Already finalized.";
  const passage = effectiveThirdsPersonalPassageRef(row).trim();
  if (!passage) return "Look Up: add a scripture passage before finalizing.";
  const o = String(row.obedience_statement ?? "").trim();
  const s = String(row.sharing_commitment ?? "").trim();
  const t = String(row.train_commitment ?? "").trim();
  if (!o || !s || !t) {
    return "Look Forward: obey, share, and train commitments are required.";
  }

  if (lookUpMode === "dbs") {
    const rows: DbsDiscoveryObsRow[] = payload.dbsObservations.map((x) => ({
      observation_type: x.observation_type,
      note: x.note,
      verse_number: x.verse_number,
      verse_end: x.verse_end,
      book: x.book,
      chapter: x.chapter,
    }));
    return getDbsDiscoveryFinalizeError(passage, rows);
  }

  const like = String(row.observation_like ?? "").trim();
  const diff = String(row.observation_difficult ?? "").trim();
  const ppl = String(row.observation_teaches_people ?? "").trim();
  const god = String(row.observation_teaches_god ?? "").trim();
  if (!like || !diff || !ppl || !god) {
    return "Look Up: fill in all four observation prompts before finalizing.";
  }
  return null;
}

export function dbsObservationListDiscoveryComplete(
  passage: string,
  rows: ThirdsPersonalDbsObservationDTO[]
): boolean {
  const mapped: DbsDiscoveryObsRow[] = rows.map((x) => ({
    observation_type: x.observation_type,
    note: x.note,
    verse_number: x.verse_number,
    verse_end: x.verse_end,
    book: x.book,
    chapter: x.chapter,
  }));
  return getDbsDiscoveryFinalizeError(passage, mapped) === null;
}
