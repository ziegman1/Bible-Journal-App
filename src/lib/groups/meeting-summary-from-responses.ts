/**
 * Build meeting summary sections from live DB rows + group roster.
 * Used on the summary page so names stay correct (UUID casing, RLS-safe roster)
 * and content matches what’s in the database — not a stale JSON snapshot.
 */
import { splitSharingAndTrain } from "@/lib/groups/lookforward-train-embed";
import {
  displayNameForMeetingUser,
  normalizeMeetingUserId,
} from "@/lib/groups/member-display-name";
import { formatObservationVerseRef } from "@/lib/groups/observation-verse-ref";

export type MeetingSummaryNameContext = {
  memberDisplayNames: Record<string, string>;
  participants: { user_id: string; display_name: string }[];
};

export function resolveMeetingParticipantName(
  ctx: MeetingSummaryNameContext,
  userId: string | null | undefined
): string {
  return displayNameForMeetingUser(
    userId,
    ctx.memberDisplayNames,
    ctx.participants
  );
}

export type LookbackDisplayRow = {
  user: string;
  accountability?: string | null;
  visionCasting?: string | null;
  /** Pastoral care / prayer needs (shown in Look Back with other responses). */
  pastoralCare?: string | null;
};

export function lookbackItemsFromRows(
  rows: {
    user_id: string;
    pastoral_care_response?: string | null;
    accountability_response?: string | null;
    vision_casting_response?: string | null;
  }[],
  ctx: MeetingSummaryNameContext
): LookbackDisplayRow[] {
  return (rows ?? [])
    .map((r) => {
      const uid = normalizeMeetingUserId(r.user_id);
      if (!uid) return null;
      const pastoral = String(r.pastoral_care_response ?? "").trim();
      const acc = String(r.accountability_response ?? "").trim();
      const vis = String(r.vision_casting_response ?? "").trim();
      if (!pastoral && !acc && !vis) return null;
      return {
        user: resolveMeetingParticipantName(ctx, uid),
        ...(acc ? { accountability: r.accountability_response } : {}),
        ...(vis ? { visionCasting: r.vision_casting_response } : {}),
        ...(pastoral
          ? { pastoralCare: String(r.pastoral_care_response ?? "").trim() }
          : {}),
      };
    })
    .filter(Boolean) as LookbackDisplayRow[];
}

const OBSERVATION_TYPE_LABELS: Record<string, string> = {
  like: "What stood out / liked",
  difficult: "Difficult to understand or believe",
  teaches_about_people: "What it teaches about people",
  teaches_about_god: "What it teaches about God",
};

export function observationsForSummaryFromRows(
  rows: {
    user_id: string;
    observation_type: string;
    book?: string | null;
    chapter?: number | null;
    verse_number?: number | null;
    verse_end?: number | null;
    note?: string | null;
  }[],
  ctx: MeetingSummaryNameContext
): { user: string; typeLabel: string; verseRef: string | null; note: string }[] {
  return (rows ?? [])
    .filter((o) => o.note != null && String(o.note).trim())
    .map((o) => {
      const book = String(o.book ?? "").trim();
      const ch = o.chapter;
      const vs = o.verse_number;
      const ve = o.verse_end;
      const verseRef =
        book && ch != null && vs != null && Number.isFinite(Number(vs))
          ? formatObservationVerseRef({
              book,
              chapter: Number(ch),
              verseStart: Number(vs),
              verseEnd:
                ve != null &&
                Number.isFinite(Number(ve)) &&
                Number(ve) !== Number(vs)
                  ? Number(ve)
                  : null,
            })
          : null;
      return {
        user: resolveMeetingParticipantName(ctx, o.user_id),
        typeLabel:
          OBSERVATION_TYPE_LABELS[o.observation_type] ?? o.observation_type,
        verseRef,
        note: String(o.note).trim(),
      };
    });
}

export function lookforwardItemsFromRows(
  rows: {
    user_id: string;
    obedience_statement: string;
    sharing_commitment: string;
    train_commitment?: string | null;
  }[],
  ctx: MeetingSummaryNameContext
): {
  user: string;
  obedience: string;
  sharing: string;
  train: string;
}[] {
  return (rows ?? [])
    .map((r) => {
      const uid = normalizeMeetingUserId(r.user_id);
      if (!uid) return null;
      const { sharing, train } = splitSharingAndTrain(r);
      return {
        user: resolveMeetingParticipantName(ctx, uid),
        obedience: r.obedience_statement,
        sharing,
        train,
      };
    })
    .filter(Boolean) as {
    user: string;
    obedience: string;
    sharing: string;
    train: string;
  }[];
}
