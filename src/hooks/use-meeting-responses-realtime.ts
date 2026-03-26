"use client";

import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { normalizeLookforwardRow } from "@/lib/groups/lookforward-train-embed";
import { normalizeMeetingUserId } from "@/lib/groups/member-display-name";
import {
  accountabilityLineKey,
  normalizeAccountabilityMeetingId,
  type CommitmentPillar,
} from "@/lib/groups/accountability-checkup";

export type MeetingResponseConnection =
  | "connecting"
  | "subscribed"
  | "error"
  | "closed";

export type PassageObservationRow = {
  id: string;
  meeting_id: string;
  user_id: string;
  observation_type: string;
  book: string;
  chapter: number;
  /** Null = note saved without verse anchor (non–Starter Track). */
  verse_number: number | null;
  /** Inclusive end verse when set; otherwise single-verse at verse_number. */
  verse_end?: number | null;
  note: string | null;
  created_at?: string;
};

function rowsToMap(
  rows: Record<string, unknown>[] | undefined
): Record<string, Record<string, unknown>> {
  const out: Record<string, Record<string, unknown>> = {};
  for (const r of rows ?? []) {
    const uid = normalizeMeetingUserId(r.user_id as string);
    if (uid) out[uid] = { ...r, user_id: uid };
  }
  return out;
}

/** Split embedded train from sharing (legacy DB without train_commitment column). */
function rowsToLookforwardMap(
  rows: Record<string, unknown>[] | undefined
): Record<string, Record<string, unknown>> {
  const out: Record<string, Record<string, unknown>> = {};
  for (const r of rows ?? []) {
    const uid = normalizeMeetingUserId(r.user_id as string);
    if (uid)
      out[uid] = normalizeLookforwardRow({ ...r, user_id: uid });
  }
  return out;
}

/** Merge a postgres row into a user-keyed map (last-write-wins per user). */
function mergeResponseRow(
  prev: Record<string, Record<string, unknown>>,
  row: Record<string, unknown> & { user_id: string }
): Record<string, Record<string, unknown>> {
  const uid = normalizeMeetingUserId(row.user_id);
  if (!uid) return prev;
  return {
    ...prev,
    [uid]: { ...(prev[uid] ?? {}), ...row, user_id: uid },
  };
}

function removeUser(
  prev: Record<string, Record<string, unknown>>,
  userId: string
): Record<string, Record<string, unknown>> {
  const next = { ...prev };
  delete next[userId];
  return next;
}

function mergeObservationList(
  prev: PassageObservationRow[],
  row: PassageObservationRow
): PassageObservationRow[] {
  const idx = prev.findIndex((r) => r.id === row.id);
  if (idx >= 0) {
    const next = [...prev];
    next[idx] = { ...next[idx], ...row };
    return next;
  }
  return [...prev, row];
}

function removeObservationById(
  prev: PassageObservationRow[],
  id: string
): PassageObservationRow[] {
  return prev.filter((r) => r.id !== id);
}

function rowIsComplete(v: unknown): boolean {
  if (v === true) return true;
  if (typeof v === "string" && (v === "true" || v === "t")) return true;
  return false;
}

function rowBelongsToMeeting(meetingId: string, rowMeetingId: unknown): boolean {
  if (rowMeetingId == null) return false;
  return (
    normalizeAccountabilityMeetingId(String(rowMeetingId)) ===
    normalizeAccountabilityMeetingId(meetingId)
  );
}

function applyMeetingCommitmentCheckoffPayload(
  meetingId: string,
  payload: {
    eventType: string;
    new: Record<string, unknown> | null;
    old: Record<string, unknown> | null;
  },
  setCommitmentCompleteByKey: Dispatch<SetStateAction<Record<string, boolean>>>
) {
  if (payload.eventType === "DELETE") {
    const old = payload.old;
    if (!old || !rowBelongsToMeeting(meetingId, old.meeting_id)) return;
    if (!old.source_meeting_id || !old.subject_user_id || !old.pillar) return;
    const su =
      normalizeMeetingUserId(String(old.subject_user_id)) ??
      String(old.subject_user_id);
    const key = accountabilityLineKey(meetingId, {
      sourceMeetingId: String(old.source_meeting_id),
      subjectUserId: su,
      pillar: String(old.pillar) as CommitmentPillar,
    });
    setCommitmentCompleteByKey((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    return;
  }

  const row = payload.new;
  if (!row || !rowBelongsToMeeting(meetingId, row.meeting_id)) return;
  if (!row.source_meeting_id || !row.subject_user_id || !row.pillar) return;
  if (!rowIsComplete(row.is_complete)) return;

  const su =
    normalizeMeetingUserId(String(row.subject_user_id)) ??
    String(row.subject_user_id);
  const key = accountabilityLineKey(meetingId, {
    sourceMeetingId: String(row.source_meeting_id),
    subjectUserId: su,
    pillar: String(row.pillar) as CommitmentPillar,
  });
  setCommitmentCompleteByKey((prev) => ({ ...prev, [key]: true }));
}

function commitmentRowsToCompleteMap(
  meetingId: string,
  rows: Record<string, unknown>[]
): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const r of rows ?? []) {
    if (!rowIsComplete(r.is_complete)) continue;
    const sm = String(r.source_meeting_id ?? "");
    const su = String(r.subject_user_id ?? "");
    const pillar = String(r.pillar ?? "") as CommitmentPillar;
    if (!sm || !su || !pillar) continue;
    const key = accountabilityLineKey(meetingId, {
      sourceMeetingId: sm,
      subjectUserId: su,
      pillar,
    });
    out[key] = true;
  }
  return out;
}

/**
 * Subscribe to lookback / lookforward / prior follow-up / passage observation rows for one meeting.
 * RLS ensures only group members receive events.
 */
export function useMeetingResponsesRealtime(opts: {
  meetingId: string;
  initialLookback: Record<string, unknown>[];
  initialLookforward: Record<string, unknown>[];
  initialPriorFollowups: Record<string, unknown>[];
  initialPassageObservations?: Record<string, unknown>[];
  initialCommitmentCheckoffs?: Record<string, unknown>[];
  readOnly?: boolean;
}) {
  const readOnly = opts.readOnly ?? false;

  const [lookbackByUser, setLookbackByUser] = useState<
    Record<string, Record<string, unknown>>
  >(() => rowsToMap(opts.initialLookback));

  const [lookforwardByUser, setLookforwardByUser] = useState<
    Record<string, Record<string, unknown>>
  >(() => rowsToLookforwardMap(opts.initialLookforward));

  const [priorFollowupByUser, setPriorFollowupByUser] = useState<
    Record<string, Record<string, unknown>>
  >(() => rowsToMap(opts.initialPriorFollowups));

  const [passageObservations, setPassageObservations] = useState<
    PassageObservationRow[]
  >(() =>
    (opts.initialPassageObservations ?? []).map(normalizeObservationRow)
  );

  const [commitmentCompleteByKey, setCommitmentCompleteByKey] = useState<
    Record<string, boolean>
  >(() =>
    commitmentRowsToCompleteMap(
      opts.meetingId,
      opts.initialCommitmentCheckoffs ?? []
    )
  );

  const [connection, setConnection] = useState<MeetingResponseConnection>(() =>
    readOnly ? "closed" : "connecting"
  );

  const patchCommitmentComplete = useCallback((key: string, complete: boolean) => {
    setCommitmentCompleteByKey((prev) => {
      const next = { ...prev };
      if (complete) next[key] = true;
      else delete next[key];
      return next;
    });
  }, []);

  useEffect(() => {
    setLookbackByUser(rowsToMap(opts.initialLookback));
    setLookforwardByUser(rowsToLookforwardMap(opts.initialLookforward));
    setPriorFollowupByUser(rowsToMap(opts.initialPriorFollowups));
    setPassageObservations(
      (opts.initialPassageObservations ?? []).map(normalizeObservationRow)
    );
    setCommitmentCompleteByKey(
      commitmentRowsToCompleteMap(
        opts.meetingId,
        opts.initialCommitmentCheckoffs ?? []
      )
    );
  }, [opts.meetingId]);

  const onLookbackEvent = useCallback(
    (payload: {
      eventType: string;
      new: Record<string, unknown> | null;
      old: Record<string, unknown> | null;
    }) => {
      if (payload.eventType === "DELETE") {
        const uid = normalizeMeetingUserId(
          payload.old?.user_id as string | undefined
        );
        if (uid) setLookbackByUser((p) => removeUser(p, uid));
        return;
      }
      const row = payload.new as { user_id: string } | null;
      if (row?.user_id) {
        setLookbackByUser((p) =>
          mergeResponseRow(p, row as Record<string, unknown> & { user_id: string })
        );
      }
    },
    []
  );

  const onLookforwardEvent = useCallback(
    (payload: {
      eventType: string;
      new: Record<string, unknown> | null;
      old: Record<string, unknown> | null;
    }) => {
      if (payload.eventType === "DELETE") {
        const uid = normalizeMeetingUserId(
          payload.old?.user_id as string | undefined
        );
        if (uid) setLookforwardByUser((p) => removeUser(p, uid));
        return;
      }
      const row = payload.new as { user_id: string } | null;
      if (row?.user_id) {
        setLookforwardByUser((p) => {
          const next = mergeResponseRow(
            p,
            row as Record<string, unknown> & { user_id: string }
          );
          const uid = normalizeMeetingUserId(row.user_id);
          if (!uid) return p;
          const merged = next[uid];
          if (merged) next[uid] = normalizeLookforwardRow(merged);
          return next;
        });
      }
    },
    []
  );

  const onPriorEvent = useCallback(
    (payload: {
      eventType: string;
      new: Record<string, unknown> | null;
      old: Record<string, unknown> | null;
    }) => {
      if (payload.eventType === "DELETE") {
        const uid = normalizeMeetingUserId(
          payload.old?.user_id as string | undefined
        );
        if (uid) setPriorFollowupByUser((p) => removeUser(p, uid));
        return;
      }
      const row = payload.new as { user_id: string } | null;
      if (row?.user_id) {
        setPriorFollowupByUser((p) =>
          mergeResponseRow(p, row as Record<string, unknown> & { user_id: string })
        );
      }
    },
    []
  );

  const onObservationEvent = useCallback(
    (payload: {
      eventType: string;
      new: Record<string, unknown> | null;
      old: Record<string, unknown> | null;
    }) => {
      if (payload.eventType === "DELETE") {
        const id = payload.old?.id as string | undefined;
        if (id)
          setPassageObservations((p) => removeObservationById(p, id));
        return;
      }
      const row = payload.new as Record<string, unknown> | null;
      if (row?.id && row.user_id) {
        const normalized = normalizeObservationRow(row);
        setPassageObservations((p) => mergeObservationList(p, normalized));
      }
    },
    []
  );

  const onCommitmentCheckoffEvent = useCallback(
    (payload: {
      eventType: string;
      new: Record<string, unknown> | null;
      old: Record<string, unknown> | null;
    }) => {
      applyMeetingCommitmentCheckoffPayload(
        opts.meetingId,
        payload,
        setCommitmentCompleteByKey
      );
    },
    [opts.meetingId]
  );

  useEffect(() => {
    if (readOnly) {
      setConnection("closed");
      return;
    }
    const supabase = createClient();
    const filter = `meeting_id=eq.${opts.meetingId}`;
    const channel = supabase
      .channel(`meeting-responses:${opts.meetingId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "lookback_responses",
          filter,
        },
        onLookbackEvent
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "lookforward_responses",
          filter,
        },
        onLookforwardEvent
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "prior_obedience_followups",
          filter,
        },
        onPriorEvent
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "passage_observations",
          filter,
        },
        onObservationEvent
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "meeting_commitment_checkoffs",
        },
        onCommitmentCheckoffEvent
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setConnection("subscribed");
        else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT")
          setConnection("error");
        else if (status === "CLOSED") setConnection("closed");
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [
    opts.meetingId,
    readOnly,
    onLookbackEvent,
    onLookforwardEvent,
    onPriorEvent,
    onObservationEvent,
    onCommitmentCheckoffEvent,
  ]);

  return {
    lookbackByUser,
    lookforwardByUser,
    priorFollowupByUser,
    passageObservations,
    commitmentCompleteByKey,
    patchCommitmentComplete,
    connection,
  };
}

/** Facilitator / TV view: only commitment checkoffs (no lookback/lookforward subscriptions). */
export function useMeetingCommitmentCheckoffsOnlyRealtime(opts: {
  meetingId: string;
  initialCommitmentCheckoffs: Record<string, unknown>[];
  readOnly?: boolean;
}) {
  const readOnly = opts.readOnly ?? false;

  const [commitmentCompleteByKey, setCommitmentCompleteByKey] = useState<
    Record<string, boolean>
  >(() =>
    commitmentRowsToCompleteMap(
      opts.meetingId,
      opts.initialCommitmentCheckoffs
    )
  );

  const patchCommitmentComplete = useCallback((key: string, complete: boolean) => {
    setCommitmentCompleteByKey((prev) => {
      const next = { ...prev };
      if (complete) next[key] = true;
      else delete next[key];
      return next;
    });
  }, []);

  const [connection, setConnection] = useState<MeetingResponseConnection>(() =>
    readOnly ? "closed" : "connecting"
  );

  useEffect(() => {
    setCommitmentCompleteByKey(
      commitmentRowsToCompleteMap(
        opts.meetingId,
        opts.initialCommitmentCheckoffs
      )
    );
  }, [opts.meetingId]);

  const onCommitmentCheckoffEvent = useCallback(
    (payload: {
      eventType: string;
      new: Record<string, unknown> | null;
      old: Record<string, unknown> | null;
    }) => {
      applyMeetingCommitmentCheckoffPayload(
        opts.meetingId,
        payload,
        setCommitmentCompleteByKey
      );
    },
    [opts.meetingId]
  );

  useEffect(() => {
    if (readOnly) {
      setConnection("closed");
      return;
    }
    const supabase = createClient();
    const channel = supabase
      .channel(`meeting-commit-checkoffs:${opts.meetingId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "meeting_commitment_checkoffs",
        },
        onCommitmentCheckoffEvent
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setConnection("subscribed");
        else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT")
          setConnection("error");
        else if (status === "CLOSED") setConnection("closed");
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [opts.meetingId, readOnly, onCommitmentCheckoffEvent]);

  return { commitmentCompleteByKey, patchCommitmentComplete, connection };
}

function normalizeObservationRow(
  row: Record<string, unknown>
): PassageObservationRow {
  const raw = String(row.user_id ?? "");
  const uid = normalizeMeetingUserId(raw) ?? raw;
  const ve = row.verse_end;
  const vn = row.verse_number;
  const verseNum =
    vn == null || vn === ""
      ? null
      : Number(vn);
  const verseNumNorm =
    verseNum != null && Number.isFinite(verseNum) ? verseNum : null;
  return {
    id: String(row.id),
    meeting_id: String(row.meeting_id),
    user_id: uid,
    observation_type: String(row.observation_type),
    book: String(row.book ?? ""),
    chapter: Number(row.chapter ?? 0),
    verse_number: verseNumNorm,
    verse_end:
      verseNumNorm == null
        ? null
        : ve != null && ve !== "" && !Number.isNaN(Number(ve))
          ? Number(ve)
          : null,
    note: row.note != null ? String(row.note) : null,
    created_at: row.created_at != null ? String(row.created_at) : undefined,
  };
}
