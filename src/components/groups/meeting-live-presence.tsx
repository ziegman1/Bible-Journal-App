"use client";

import type {
  MeetingPresenceConnection,
  MeetingPresencePeer,
} from "@/hooks/use-meeting-presence";
import { cn } from "@/lib/utils";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  const a = parts[0]![0] ?? "";
  const b = parts[parts.length - 1]![0] ?? "";
  return (a + b).toUpperCase();
}

function roleShort(role: MeetingPresencePeer["meetingRole"]): string | null {
  if (role === "facilitator") return "Facilitator";
  if (role === "group_admin") return "Admin";
  return null;
}

export function MeetingLivePresence({
  variant,
  peers,
  connection,
  currentUserId,
}: {
  variant: "participant" | "facilitator";
  peers: MeetingPresencePeer[];
  connection: MeetingPresenceConnection;
  currentUserId: string;
}) {
  if (connection === "closed") return null;

  const isParticipant = variant === "participant";

  return (
    <div
      className={cn(
        "flex flex-col gap-1.5",
        isParticipant && "text-gray-600",
        !isParticipant && "text-white/85"
      )}
      aria-live="polite"
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span
          className={cn(
            "text-[0.65rem] font-semibold uppercase tracking-wide",
            isParticipant && "text-gray-500",
            !isParticipant && "text-[#83b0da]"
          )}
        >
          {isParticipant ? "In this meeting now" : "Present now"}
        </span>
        {connection === "connecting" ? (
          <span
            className={cn(
              "text-[0.65rem]",
              isParticipant ? "text-gray-400" : "text-white/45"
            )}
          >
            Connecting…
          </span>
        ) : null}
        {connection === "error" ? (
          <span
            className={cn(
              "text-[0.65rem]",
              isParticipant ? "text-amber-700" : "text-amber-200/90"
            )}
          >
            Presence unavailable
          </span>
        ) : null}
      </div>
      {peers.length === 0 && connection === "subscribed" ? (
        <p
          className={cn(
            "text-xs",
            isParticipant ? "text-gray-400" : "text-white/50"
          )}
        >
          Just you (or waiting for others to join)
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {peers.map((p) => {
            const mine = p.userId === currentUserId;
            const tag = roleShort(p.meetingRole);
            return (
              <li key={p.userId}>
                <span
                  className={cn(
                    "inline-flex max-w-[200px] items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-medium",
                    isParticipant &&
                      "border-gray-200 bg-gray-100 text-gray-800",
                    !isParticipant &&
                      "border-white/25 bg-white/10 text-white",
                    mine &&
                      isParticipant &&
                      "ring-1 ring-gray-400 ring-offset-1 ring-offset-white",
                    mine &&
                      !isParticipant &&
                      "ring-1 ring-[#edb73e]/80 ring-offset-1 ring-offset-[#1c252e]"
                  )}
                  title={p.displayName + (tag ? ` · ${tag}` : "")}
                >
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full text-[0.65rem] font-semibold",
                      isParticipant && "bg-white text-gray-700",
                      !isParticipant && "bg-[#83b0da]/35 text-white"
                    )}
                    aria-hidden
                  >
                    {initials(p.displayName)}
                  </span>
                  <span className="truncate">{p.displayName}</span>
                  {mine ? (
                    <span
                      className={cn(
                        "shrink-0 text-[0.6rem] font-normal opacity-80",
                        isParticipant && "text-gray-500",
                        !isParticipant && "text-white/70"
                      )}
                    >
                      You
                    </span>
                  ) : null}
                  {tag ? (
                    <span
                      className={cn(
                        "shrink-0 text-[0.6rem] font-normal opacity-80",
                        isParticipant && "text-gray-500",
                        !isParticipant && "text-[#edb73e]/90"
                      )}
                    >
                      {tag}
                    </span>
                  ) : null}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
