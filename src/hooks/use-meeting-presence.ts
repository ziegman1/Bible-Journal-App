"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { normalizeMeetingUserId } from "@/lib/groups/member-display-name";

export type MeetingPresenceConnection =
  | "connecting"
  | "subscribed"
  | "error"
  | "closed";

export type MeetingPresenceRole = "facilitator" | "group_admin" | "member";

export type MeetingPresencePeer = {
  userId: string;
  displayName: string;
  meetingRole: MeetingPresenceRole;
  onlineAt: string | null;
};

type RawPresence = {
  user_id?: string;
  display_name?: string;
  meeting_role?: string;
  online_at?: string;
};

function parsePresenceRow(raw: unknown): MeetingPresencePeer | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as RawPresence;
  const rawId = r.user_id;
  if (!rawId || typeof rawId !== "string") return null;
  const userId = normalizeMeetingUserId(rawId) ?? rawId;
  const role = r.meeting_role;
  const meetingRole: MeetingPresenceRole =
    role === "facilitator" || role === "group_admin" || role === "member"
      ? role
      : "member";
  return {
    userId,
    displayName:
      typeof r.display_name === "string" && r.display_name.trim()
        ? r.display_name.trim()
        : "Member",
    meetingRole,
    onlineAt: typeof r.online_at === "string" ? r.online_at : null,
  };
}

/**
 * Ephemeral “who is on this meeting page now” via Supabase Realtime Presence.
 * No DB writes — not attendance. Uses channel `meeting-presence:{meetingId}`.
 *
 * presence.key = userId → one slot per user; a second tab replaces the first tab’s track.
 */
export function useMeetingPresence(opts: {
  meetingId: string;
  userId: string;
  displayName: string;
  groupMemberRole: "admin" | "member";
  facilitatorUserId: string | null | undefined;
  /** When true (e.g. completed meeting), do not subscribe or track. */
  readOnly?: boolean;
}) {
  const readOnly = opts.readOnly ?? false;
  const [peers, setPeers] = useState<MeetingPresencePeer[]>([]);
  const [connection, setConnection] = useState<MeetingPresenceConnection>(() =>
    readOnly ? "closed" : "connecting"
  );

  const flattenPresenceState = useCallback((presenceState: object) => {
    const byUser = new Map<string, MeetingPresencePeer>();
    for (const list of Object.values(presenceState)) {
      if (!Array.isArray(list)) continue;
      for (const entry of list) {
        const parsed = parsePresenceRow(entry);
        if (parsed) byUser.set(parsed.userId, parsed);
      }
    }
    return Array.from(byUser.values()).sort((a, b) =>
      a.displayName.localeCompare(b.displayName, undefined, {
        sensitivity: "base",
      })
    );
  }, []);

  useEffect(() => {
    if (readOnly) {
      queueMicrotask(() => {
        setConnection("closed");
        setPeers([]);
      });
      return;
    }

    queueMicrotask(() => setConnection("connecting"));
    const supabase = createClient();
    const userIdNorm = normalizeMeetingUserId(opts.userId) ?? opts.userId;
    const facilitatorNorm = opts.facilitatorUserId
      ? normalizeMeetingUserId(opts.facilitatorUserId) ?? opts.facilitatorUserId
      : null;
    const meetingRole: MeetingPresenceRole =
      facilitatorNorm != null && facilitatorNorm === userIdNorm
        ? "facilitator"
        : opts.groupMemberRole === "admin"
          ? "group_admin"
          : "member";

    const channelName = `meeting-presence:${opts.meetingId}`;
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: userIdNorm,
        },
      },
    });

    const sync = () => {
      const state = channel.presenceState() as object;
      setPeers(flattenPresenceState(state));
    };

    channel
      .on("presence", { event: "sync" }, sync)
      .on("presence", { event: "join" }, sync)
      .on("presence", { event: "leave" }, sync)
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          setConnection("subscribed");
          const trackPayload = {
            user_id: userIdNorm,
            display_name: opts.displayName,
            meeting_role: meetingRole,
            online_at: new Date().toISOString(),
          };
          try {
            await channel.track(trackPayload);
            sync();
          } catch (e) {
            console.warn("meeting presence track:", e);
            setConnection("error");
          }
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setConnection("error");
        } else if (status === "CLOSED") {
          setConnection("closed");
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [
    readOnly,
    opts.meetingId,
    opts.userId,
    opts.displayName,
    opts.groupMemberRole,
    opts.facilitatorUserId,
    flattenPresenceState,
  ]);

  return { peers, connection };
}
