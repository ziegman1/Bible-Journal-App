"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { normalizeMeetingUserId } from "@/lib/groups/member-display-name";

/**
 * Keeps `facilitator_user_id` in sync when it changes (e.g. live commence on TV view).
 */
export function useMeetingFacilitatorUserId(
  meetingId: string,
  initialFacilitatorUserId: string | null | undefined,
  readOnly?: boolean
) {
  const normalizedProp =
    normalizeMeetingUserId(initialFacilitatorUserId ?? "") ??
    initialFacilitatorUserId ??
    null;

  const [facilitatorUserId, setFacilitatorUserId] = useState<string | null>(
    normalizedProp
  );
  const [propSnap, setPropSnap] = useState(normalizedProp);
  if (normalizedProp !== propSnap) {
    setPropSnap(normalizedProp);
    setFacilitatorUserId(normalizedProp);
  }

  useEffect(() => {
    if (readOnly) return;
    const supabase = createClient();
    if (!supabase) return;

    const channel = supabase
      .channel(`group-meeting-facilitator:${meetingId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "group_meetings",
          filter: `id=eq.${meetingId}`,
        },
        (payload) => {
          const row = payload.new as { facilitator_user_id?: string | null };
          const v = row?.facilitator_user_id;
          setFacilitatorUserId(
            normalizeMeetingUserId(v ?? "") ?? v ?? null
          );
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [meetingId, readOnly]);

  return facilitatorUserId;
}

/**
 * True after Facilitator / TV view has commenced this meeting (`present_facilitator_commenced_at` set).
 * Used to hide participant-only quick section navigation while shared slides are in play.
 */
export function usePresentFacilitatorCommenced(
  meetingId: string,
  initialCommencedAt: string | null | undefined,
  readOnly?: boolean
): boolean {
  const initial =
    initialCommencedAt != null && String(initialCommencedAt).trim() !== ""
      ? String(initialCommencedAt)
      : null;
  const [commencedAt, setCommencedAt] = useState<string | null>(initial);
  const [propSnap, setPropSnap] = useState(initial);
  if (initial !== propSnap) {
    setPropSnap(initial);
    setCommencedAt(initial);
  }

  useEffect(() => {
    if (readOnly) return;
    const supabase = createClient();
    if (!supabase) return;

    const channel = supabase
      .channel(`group-meeting-present-commenced:${meetingId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "group_meetings",
          filter: `id=eq.${meetingId}`,
        },
        (payload) => {
          const row = payload.new as {
            present_facilitator_commenced_at?: string | null;
          };
          const v = row?.present_facilitator_commenced_at;
          setCommencedAt(
            v != null && String(v).trim() !== "" ? String(v) : null
          );
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [meetingId, readOnly]);

  return commencedAt != null;
}
