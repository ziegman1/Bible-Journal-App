"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateMeetingPresenterState } from "@/app/actions/meetings";
import { toast } from "sonner";
import {
  presenterCanGoBack,
  rowToPresenterState,
  transitionGoToThird,
  transitionNext,
  transitionPrev,
  type MeetingPresenterStateRow,
  type PresenterState,
} from "@/lib/groups/meeting-presenter-state";

function buildCtx(opts: {
  hasPassage: boolean;
  readChunkCount: number;
  rereadChunkCount: number;
  practiceSlideCount: number;
}) {
  return {
    hasPassage: opts.hasPassage,
    readChunkCount: opts.readChunkCount,
    rereadChunkCount: opts.rereadChunkCount,
    practiceSlideCount: opts.practiceSlideCount,
  };
}

export function useMeetingPresenterSync(opts: {
  meetingId: string;
  initialRow: MeetingPresenterStateRow | null;
  hasPassage: boolean;
  readChunkCount: number;
  rereadChunkCount: number;
  practiceSlideCount: number;
  /** When true (e.g. meeting completed), do not subscribe or persist — show frozen state. */
  readOnly?: boolean;
  /**
   * When false, follow presenter state over realtime only — never write to DB.
   * Participant meeting page uses false; Facilitator / TV uses true only for the designated facilitator.
   */
  canPersist?: boolean;
}) {
  const readOnly = opts.readOnly ?? false;
  const canPersist = opts.canPersist ?? true;
  const [state, setState] = useState<PresenterState>(() => {
    const s = rowToPresenterState(opts.initialRow ?? undefined);
    const maxIdx = Math.max(0, opts.practiceSlideCount - 1);
    return { ...s, practiceSlideIndex: Math.min(s.practiceSlideIndex, maxIdx) };
  });
  const stateRef = useRef(state);
  useLayoutEffect(() => {
    stateRef.current = state;
  }, [state]);

  const [connection, setConnection] = useState<
    "connecting" | "subscribed" | "error" | "closed"
  >(() => (readOnly ? "closed" : "connecting"));

  // initialRow object identity often changes every parent render; `updated_at` is the server row version we sync from.
  useEffect(() => {
    queueMicrotask(() => {
      const s = rowToPresenterState(opts.initialRow ?? undefined);
      const maxIdx = Math.max(0, opts.practiceSlideCount - 1);
      setState({
        ...s,
        practiceSlideIndex: Math.min(s.practiceSlideIndex, maxIdx),
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync key is initialRow.updated_at, not full row reference
  }, [
    opts.initialRow?.updated_at,
    opts.meetingId,
    opts.practiceSlideCount,
  ]);

  const persist = useCallback(
    async (next: PresenterState): Promise<boolean> => {
      if (readOnly || !canPersist) return false;
      const prev = stateRef.current;
      stateRef.current = next;
      setState(next);
      const r = await updateMeetingPresenterState(opts.meetingId, next);
      if ("error" in r && r.error) {
        toast.error(r.error);
        stateRef.current = prev;
        setState(prev);
        return false;
      }
      return true;
    },
    [opts.meetingId, readOnly, canPersist]
  );

  /** If practice deck shrinks (e.g. first vs later ST meeting), clamp index and persist. */
  useEffect(() => {
    queueMicrotask(() => {
      const maxIdx = Math.max(0, opts.practiceSlideCount - 1);
      const s = stateRef.current;
      if (s.practiceSlideIndex <= maxIdx) return;
      const next = { ...s, practiceSlideIndex: maxIdx };
      if (readOnly || !canPersist) {
        stateRef.current = next;
        setState(next);
        return;
      }
      void persist(next);
    });
  }, [opts.practiceSlideCount, readOnly, canPersist, persist]);

  useEffect(() => {
    if (readOnly) {
      queueMicrotask(() => setConnection("closed"));
      return;
    }
    queueMicrotask(() => setConnection("connecting"));
    const supabase = createClient();
    const channel = supabase
      .channel(`presenter:${opts.meetingId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "meeting_presenter_state",
          filter: `meeting_id=eq.${opts.meetingId}`,
        },
        (payload) => {
          const row = payload.new as MeetingPresenterStateRow | null;
          if (row?.meeting_id) {
            const s = rowToPresenterState(row);
            const maxIdx = Math.max(0, opts.practiceSlideCount - 1);
            setState({
              ...s,
              practiceSlideIndex: Math.min(s.practiceSlideIndex, maxIdx),
            });
          }
        }
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
  }, [opts.meetingId, opts.practiceSlideCount, readOnly]);

  const goNext = useCallback(async () => {
    if (!canPersist) return;
    const ctx = buildCtx({
      hasPassage: opts.hasPassage,
      readChunkCount: opts.readChunkCount,
      rereadChunkCount: opts.rereadChunkCount,
      practiceSlideCount: opts.practiceSlideCount,
    });
    const n = transitionNext(stateRef.current, ctx);
    if (!n) return;
    await persist(n);
  }, [
    canPersist,
    opts.hasPassage,
    opts.readChunkCount,
    opts.rereadChunkCount,
    opts.practiceSlideCount,
    persist,
  ]);

  const goBack = useCallback(async () => {
    if (!canPersist) return;
    const ctx = buildCtx({
      hasPassage: opts.hasPassage,
      readChunkCount: opts.readChunkCount,
      rereadChunkCount: opts.rereadChunkCount,
      practiceSlideCount: opts.practiceSlideCount,
    });
    const n = transitionPrev(stateRef.current, ctx);
    if (!n) return;
    await persist(n);
  }, [
    canPersist,
    opts.hasPassage,
    opts.readChunkCount,
    opts.rereadChunkCount,
    opts.practiceSlideCount,
    persist,
  ]);

  const goToThird = useCallback(
    async (third: 1 | 2 | 3) => {
      if (!canPersist) return;
      const n = transitionGoToThird(stateRef.current, third);
      await persist(n);
    },
    [canPersist, persist]
  );

  const canGoBack = presenterCanGoBack(state, buildCtx(opts));

  return {
    state,
    connection,
    goNext,
    goBack,
    goToThird,
    canGoBack,
    persist,
  };
}
