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
  const [facilitatorUserId, setFacilitatorUserId] = useState<string | null>(
    () =>
      normalizeMeetingUserId(initialFacilitatorUserId ?? "") ??
      initialFacilitatorUserId ??
      null
  );

  useEffect(() => {
    const n =
      normalizeMeetingUserId(initialFacilitatorUserId ?? "") ??
      initialFacilitatorUserId ??
      null;
    setFacilitatorUserId(n);
  }, [initialFacilitatorUserId]);

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
