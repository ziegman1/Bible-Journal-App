"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ThreeThirdsStepper } from "@/components/groups/three-thirds-stepper";
import { LookBackSection } from "@/components/groups/look-back-section";
import { LookUpSection } from "@/components/groups/look-up-section";
import { LookForwardSection } from "@/components/groups/look-forward-section";
import type { StarterTrackLookBackPayload } from "@/lib/groups/starter-track/starter-track-lookback";
import { Button, buttonVariants } from "@/components/ui/button";
import { updateMeetingStatus } from "@/app/actions/meetings";
import { ArrowLeft, FileText, Loader2, Presentation } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  chunkVerses,
  PRESENTER_READ_VERSES_PER_CHUNK,
  PRESENTER_REREAD_VERSES_PER_CHUNK,
  lookUpPhaseToParticipantStep,
  practiceSlideCountForMeeting,
  rowToPresenterState,
  type ForwardSub,
  type MeetingPresenterStateRow,
} from "@/lib/groups/meeting-presenter-state";
import { useMeetingPresenterSync } from "@/hooks/use-meeting-presenter-sync";
import { useMeetingFacilitatorUserId } from "@/hooks/use-meeting-facilitator-user-id";
import { useMeetingPresence } from "@/hooks/use-meeting-presence";
import { useMeetingResponsesRealtime } from "@/hooks/use-meeting-responses-realtime";
import { MeetingLivePresence } from "@/components/groups/meeting-live-presence";
import {
  displayNameForMeetingUser,
  normalizeMeetingUserId,
} from "@/lib/groups/member-display-name";
import { formatObservationVerseRefShort } from "@/lib/groups/observation-verse-ref";
import type { AccountabilityCheckupLine } from "@/lib/groups/accountability-checkup";

interface Meeting {
  id: string;
  group_id: string;
  title?: string | null;
  meeting_date: string;
  status: string;
  facilitator_user_id?: string | null;
  story_source_type: string;
  book?: string | null;
  chapter?: number | null;
  verse_start?: number | null;
  verse_end?: number | null;
  preset_story_id?: string | null;
  preset_stories?: { title: string; book: string; chapter: number; verse_start: number; verse_end: number } | null;
  starter_track_week?: number | null;
}

interface Participant {
  user_id: string;
  display_name: string;
}

/** When the server omitted `passageRef`, derive from meeting row (same rules as meeting page). */
function buildPassageRefFromMeeting(m: Meeting): string | null {
  if (m.story_source_type === "preset_story" && m.preset_stories) {
    const p = m.preset_stories;
    return `${p.book} ${p.chapter}:${p.verse_start}${
      p.verse_start !== p.verse_end ? `-${p.verse_end}` : ""
    }`;
  }
  if (m.book != null && m.chapter != null && m.verse_start != null) {
    const end = m.verse_end ?? m.verse_start;
    return `${m.book} ${m.chapter}:${m.verse_start}${
      m.verse_start !== end ? `-${end}` : ""
    }`;
  }
  return null;
}

function buildScriptureLoadHint(m: Meeting): {
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
} | null {
  if (m.story_source_type === "preset_story" && m.preset_stories) {
    const p = m.preset_stories;
    return {
      book: p.book,
      chapter: p.chapter,
      verseStart: p.verse_start,
      verseEnd: p.verse_end,
    };
  }
  if (m.book != null && m.chapter != null && m.verse_start != null) {
    return {
      book: m.book,
      chapter: m.chapter,
      verseStart: m.verse_start,
      verseEnd: m.verse_end ?? m.verse_start,
    };
  }
  return null;
}

interface LiveMeetingViewProps {
  meeting: Meeting;
  participants: Participant[];
  /** Current user’s role in the group (from `getMeetingDetail`). */
  groupMemberRole: "admin" | "member";
  groupId: string;
  meetingId: string;
  currentUserId: string;
  priorCommitments: {
    obedience: string;
    sharing: string;
    train?: string;
  } | null;
  starterTrackLookBack?: StarterTrackLookBackPayload | null;
  lookback: Record<string, unknown>[];
  lookforward: Record<string, unknown>[];
  passageObservations: Record<string, unknown>[];
  retell: { assigned_user_id: string } | null;
  practice: Record<string, unknown>[];
  priorFollowups: Record<string, unknown>[];
  accountabilityCheckupLines?: AccountabilityCheckupLine[];
  commitmentCheckoffs?: Record<string, unknown>[];
  passageVerses: { verse: number; text: string }[];
  passageRef: string | null;
  presenterStateRow: MeetingPresenterStateRow | null;
  /** All group members — used so live responses show names even if someone isn’t in `meeting_participants`. */
  memberDisplayNames: Record<string, string>;
  /** Align practice slide count with facilitator (weekly homework hidden on first ST meeting). */
  starterTrackMeetingOrdinal: number | null;
}

export function LiveMeetingView({
  meeting,
  participants,
  groupMemberRole,
  groupId,
  meetingId,
  currentUserId,
  priorCommitments,
  starterTrackLookBack,
  lookback,
  lookforward,
  passageObservations: initialPassageObservations,
  retell,
  practice,
  priorFollowups,
  accountabilityCheckupLines = [],
  commitmentCheckoffs = [],
  passageVerses,
  passageRef,
  presenterStateRow,
  memberDisplayNames,
  starterTrackMeetingOrdinal,
}: LiveMeetingViewProps) {
  const router = useRouter();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const status = meeting.status;
  const isCompleted = status === "completed";

  /** Align with server + realtime maps (UUID casing). */
  const viewerId = useMemo(
    () => normalizeMeetingUserId(currentUserId) ?? currentUserId,
    [currentUserId]
  );

  const displayNameFor = useCallback(
    (uid: string) =>
      displayNameForMeetingUser(uid, memberDisplayNames, participants),
    [memberDisplayNames, participants]
  );

  const currentUserDisplayName = useMemo(
    () => displayNameFor(currentUserId),
    [displayNameFor, currentUserId]
  );

  const liveFacilitatorUserId = useMeetingFacilitatorUserId(
    meetingId,
    meeting.facilitator_user_id,
    isCompleted
  );
  const facilitatorForLabel =
    liveFacilitatorUserId ?? meeting.facilitator_user_id ?? undefined;

  const { peers: presencePeers, connection: presenceConnection } =
    useMeetingPresence({
      meetingId,
      userId: currentUserId,
      displayName: currentUserDisplayName,
      groupMemberRole,
      facilitatorUserId: liveFacilitatorUserId ?? meeting.facilitator_user_id,
      readOnly: isCompleted,
    });

  const readChunks = useMemo(
    () => chunkVerses(passageVerses, PRESENTER_READ_VERSES_PER_CHUNK),
    [passageVerses]
  );
  const rereadChunks = useMemo(
    () => chunkVerses(passageVerses, PRESENTER_REREAD_VERSES_PER_CHUNK),
    [passageVerses]
  );
  const hasPassage = Boolean(passageRef && passageVerses.length > 0);
  const practiceSlideCount = useMemo(
    () =>
      practiceSlideCountForMeeting(
        meeting.starter_track_week,
        starterTrackMeetingOrdinal
      ),
    [meeting.starter_track_week, starterTrackMeetingOrdinal]
  );

  const { state: ps, connection } = useMeetingPresenterSync({
    meetingId,
    initialRow: presenterStateRow,
    hasPassage,
    readChunkCount: readChunks.length,
    rereadChunkCount: rereadChunks.length,
    practiceSlideCount,
    readOnly: isCompleted,
    /** Participant devices follow TV; only facilitator / present view writes presenter state. */
    canPersist: false,
  });

  const [localSection, setLocalSection] = useState<1 | 2 | 3>(() => {
    const t = rowToPresenterState(presenterStateRow ?? undefined).activeThird;
    return t === 1 || t === 2 || t === 3 ? t : 1;
  });

  const {
    lookbackByUser,
    lookforwardByUser,
    priorFollowupByUser,
    passageObservations,
    commitmentCompleteByKey,
    patchCommitmentComplete,
    connection: responsesConnection,
  } = useMeetingResponsesRealtime({
    meetingId,
    initialLookback: lookback,
    initialLookforward: lookforward,
    initialPriorFollowups: priorFollowups,
    initialPassageObservations: initialPassageObservations,
    initialCommitmentCheckoffs: commitmentCheckoffs,
    readOnly: isCompleted,
  });

  const observationAnchor = useMemo(() => {
    if (
      meeting.story_source_type === "preset_story" &&
      meeting.preset_stories
    ) {
      const p = meeting.preset_stories;
      return {
        book: p.book,
        chapter: p.chapter,
        verseNumber: p.verse_start,
      };
    }
    if (
      meeting.book &&
      meeting.chapter != null &&
      meeting.verse_start != null
    ) {
      return {
        book: meeting.book,
        chapter: meeting.chapter,
        verseNumber: meeting.verse_start,
      };
    }
    return null;
  }, [meeting]);

  const passageRefEffective = useMemo(() => {
    const t = (passageRef ?? "").trim();
    if (t.length > 0) return t;
    return buildPassageRefFromMeeting(meeting);
  }, [passageRef, meeting]);

  const scriptureLoadHint = useMemo(
    () => buildScriptureLoadHint(meeting),
    [meeting]
  );

  const activeSection = localSection;

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [activeSection]);

  const myLookback = lookbackByUser[viewerId] as
    | {
        pastoral_care_response?: string;
        accountability_response?: string;
        vision_casting_response?: string;
      }
    | undefined;

  const myLookforward = lookforwardByUser[viewerId] as
    | {
        obedience_statement?: string;
        sharing_commitment?: string;
        train_commitment?: string;
      }
    | undefined;

  const myPriorFollowup = priorFollowupByUser[viewerId];

  const priorFollowupsLive = useMemo(
    () => Object.values(priorFollowupByUser),
    [priorFollowupByUser]
  );

  const othersPastoralLive = useMemo(() => {
    return Object.values(lookbackByUser)
      .filter((r) => (r.user_id as string) !== viewerId)
      .map((r) => {
        const text = String(r.pastoral_care_response ?? "").trim();
        if (!text) return null;
        const uid = r.user_id as string;
        return {
          userId: uid,
          displayName: displayNameFor(uid),
          text,
        };
      })
      .filter(Boolean) as {
      userId: string;
      displayName: string;
      text: string;
    }[];
  }, [lookbackByUser, viewerId, displayNameFor]);

  const othersAccountabilityLive = useMemo(() => {
    return Object.values(lookbackByUser)
      .filter((r) => (r.user_id as string) !== viewerId)
      .map((r) => {
        const text = String(r.accountability_response ?? "").trim();
        if (!text) return null;
        const uid = r.user_id as string;
        return {
          userId: uid,
          displayName: displayNameFor(uid),
          text,
        };
      })
      .filter(Boolean) as {
      userId: string;
      displayName: string;
      text: string;
    }[];
  }, [lookbackByUser, viewerId, displayNameFor]);

  const othersVisionLive = useMemo(() => {
    return Object.values(lookbackByUser)
      .filter((r) => (r.user_id as string) !== viewerId)
      .map((r) => {
        const text = String(r.vision_casting_response ?? "").trim();
        if (!text) return null;
        const uid = r.user_id as string;
        return {
          userId: uid,
          displayName: displayNameFor(uid),
          text,
        };
      })
      .filter(Boolean) as {
      userId: string;
      displayName: string;
      text: string;
    }[];
  }, [lookbackByUser, viewerId, displayNameFor]);

  type ObsType =
    | "like"
    | "difficult"
    | "teaches_about_people"
    | "teaches_about_god";

  const othersObservationsByType = useMemo(() => {
    const empty: Record<
      ObsType,
      {
        userId: string;
        displayName: string;
        text: string;
        verseRefShort?: string;
      }[]
    > = {
      like: [],
      difficult: [],
      teaches_about_people: [],
      teaches_about_god: [],
    };
    for (const row of passageObservations) {
      const uid = row.user_id;
      if (uid === viewerId) continue;
      const text = String(row.note ?? "").trim();
      if (!text) continue;
      const t = row.observation_type as ObsType;
      if (!empty[t]) continue;
      const ve = row.verse_end;
      const verseRefShort =
        formatObservationVerseRefShort(
          row.verse_number,
          ve != null && row.verse_number != null && ve !== row.verse_number
            ? ve
            : null
        ) ?? undefined;
      empty[t].push({
        userId: uid,
        displayName: displayNameFor(uid),
        text,
        ...(verseRefShort ? { verseRefShort } : {}),
      });
    }
    return empty;
  }, [passageObservations, viewerId, displayNameFor]);

  const othersPriorFollowupLive = useMemo(() => {
    return Object.values(priorFollowupByUser)
      .filter((r) => (r.user_id as string) !== viewerId)
      .map((r) => {
        const o = String(
          (r as { obedience_followup_response?: string })
            .obedience_followup_response ?? ""
        ).trim();
        const s = String(
          (r as { sharing_followup_response?: string })
            .sharing_followup_response ?? ""
        ).trim();
        if (!o && !s) return null;
        const uid = r.user_id as string;
        return {
          userId: uid,
          displayName: displayNameFor(uid),
          obedienceText: o,
          sharingText: s,
        };
      })
      .filter(Boolean) as {
      userId: string;
      displayName: string;
      obedienceText: string;
      sharingText: string;
    }[];
  }, [priorFollowupByUser, viewerId, displayNameFor]);

  const othersCommitmentsLive = useMemo(() => {
    return Object.values(lookforwardByUser)
      .filter((r) => (r.user_id as string) !== viewerId)
      .map((r) => {
        const o = String(
          (r as { obedience_statement?: string }).obedience_statement ?? ""
        ).trim();
        const s = String(
          (r as { sharing_commitment?: string }).sharing_commitment ?? ""
        ).trim();
        const t = String(
          (r as { train_commitment?: string }).train_commitment ?? ""
        ).trim();
        if (!o && !s && !t) return null;
        const uid = r.user_id as string;
        return {
          userId: uid,
          displayName: displayNameFor(uid),
          obedienceText: o,
          sharingText: s,
          trainText: t,
        };
      })
      .filter(Boolean) as {
      userId: string;
      displayName: string;
      obedienceText: string;
      sharingText: string;
      trainText: string;
    }[];
  }, [lookforwardByUser, viewerId, displayNameFor]);

  async function handleMarkComplete() {
    setIsUpdatingStatus(true);
    try {
      const r = await updateMeetingStatus(meetingId, "completed");
      if ("error" in r && r.error) {
        toast.error(r.error);
        return;
      }
      toast.success("Meeting completed");
      router.push(`/app/groups/${groupId}/meetings/${meetingId}/summary`);
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  const cardClass =
    "rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm sm:p-6";

  const liveSyncLabel = !isCompleted
    ? (() => {
        const p = connection;
        const r = responsesConnection;
        if (p === "subscribed" && r === "subscribed") return "Live";
        if (p === "connecting" || r === "connecting") return "Connecting…";
        if (p === "error" || r === "error") return "Sync off";
        if (p === "subscribed" || r === "subscribed") return "Live partial";
        return null;
      })()
    : null;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-white px-3 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] shadow-sm sm:px-4">
        <div className="mx-auto flex max-w-3xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <div className="flex min-w-0 items-start gap-2 sm:flex-1 sm:items-center">
            <Link
              href={`/app/groups/${groupId}`}
              aria-label="Back to group"
              className="mt-0.5 flex shrink-0 items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground hover:underline sm:text-sm"
            >
              <ArrowLeft className="size-3.5 shrink-0 sm:size-4" />
              <span className="truncate max-sm:sr-only sm:not-sr-only">Group</span>
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-semibold leading-tight text-foreground sm:text-lg">
                {meeting.title ||
                  new Date(meeting.meeting_date).toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
              </h1>
              {(passageRefEffective || liveSyncLabel) && (
                <p className="mt-0.5 truncate text-[0.7rem] leading-snug text-muted-foreground sm:text-xs">
                  {passageRefEffective ? (
                    <span className="font-medium">{passageRefEffective}</span>
                  ) : null}
                  {passageRefEffective && liveSyncLabel ? (
                    <span className="text-muted-foreground/70"> · </span>
                  ) : null}
                  {liveSyncLabel ? (
                    <span className="uppercase tracking-wide">
                      {liveSyncLabel}
                    </span>
                  ) : null}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:shrink-0 sm:justify-end">
            <span
              className={cn(
                "rounded border px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide",
                status === "completed" &&
                  "border-border bg-muted text-muted-foreground",
                status === "active" &&
                  "border-border bg-card text-foreground shadow-sm",
                status === "draft" &&
                  "border-border bg-muted/80 text-muted-foreground"
              )}
            >
              {status === "completed"
                ? "Done"
                : status === "active"
                  ? "Active"
                  : "Draft"}
            </span>
            {status !== "completed" && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 px-2.5 text-xs"
                disabled={isUpdatingStatus}
                onClick={handleMarkComplete}
              >
                {isUpdatingStatus ? (
                  <Loader2 className="mr-1 size-3.5 animate-spin" />
                ) : null}
                Mark complete
              </Button>
            )}
            <Link
              href={`/app/groups/${groupId}/meetings/${meetingId}/present`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-2 text-xs"
                title="Open TV / facilitator view"
              >
                <Presentation className="size-3.5 sm:mr-1" />
                <span className="hidden sm:inline">Facilitator</span>
              </Button>
            </Link>
            <Link href={`/app/groups/${groupId}/meetings/${meetingId}/summary`}>
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-2 text-xs"
              >
                <FileText className="size-3.5 sm:mr-1" />
                <span className="hidden sm:inline">Summary</span>
              </Button>
            </Link>
          </div>
        </div>

        {!isCompleted ? (
          <div className="mx-auto mt-2 max-w-3xl border-t border-border/70 pt-1.5">
            <MeetingLivePresence
              variant="participant"
              peers={presencePeers}
              connection={presenceConnection}
              currentUserId={currentUserId}
            />
          </div>
        ) : null}
      </header>

      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:space-y-8">
        {isCompleted && (
          <div className={cardClass}>
            <p className="text-center text-sm text-muted-foreground">
              This meeting is finished. Open the{" "}
              <Link
                href={`/app/groups/${groupId}/meetings/${meetingId}/summary`}
                className="font-semibold text-foreground underline underline-offset-2"
              >
                summary
              </Link>{" "}
              or return to your{" "}
              <Link
                href={`/app/groups/${groupId}`}
                className="font-semibold text-foreground underline underline-offset-2"
              >
                group workspace
              </Link>
              .
            </p>
            <div className="flex justify-center pt-1">
              <Link
                href={`/app/groups/${groupId}/meetings/${meetingId}/summary`}
                className={cn(
                  buttonVariants({ variant: "default", size: "sm" }),
                  "inline-flex items-center gap-2"
                )}
              >
                <FileText className="size-4" />
                View Summary
              </Link>
            </div>
          </div>
        )}

        <div
          className={cn(
            "space-y-6 sm:space-y-8",
            isCompleted && "pointer-events-none select-none opacity-[0.65]"
          )}
        >
          <div className="space-y-2 sm:space-y-2.5">
            <ThreeThirdsStepper
              activeSection={activeSection}
              onSectionChange={(n) => {
                if (isCompleted) return;
                setLocalSection(n);
              }}
            />
            {(status === "draft" || status === "active") && (
              <p className="text-center text-sm leading-snug text-muted-foreground">
                The tabs above are <span className="font-medium text-foreground">for you only</span>{" "}
                — switch sections to review or catch up without changing the Facilitator / TV screen.
                Shared slides in Look Up follow the facilitator. Move through the three steps with your
                group:{" "}
                <span className="font-medium text-foreground">Look Back</span>, then{" "}
                <span className="font-medium text-foreground">Look Up</span>, then{" "}
                <span className="font-medium text-foreground">Look Forward</span>.
              </p>
            )}
          </div>

          {activeSection === 1 && (
            <div className={cardClass}>
              <LookBackSection
                meetingId={meetingId}
                currentUserId={currentUserId}
                groupId={groupId}
                priorCommitments={priorCommitments}
                starterTrackLookBack={starterTrackLookBack ?? null}
                myLookback={myLookback}
                myPriorFollowup={myPriorFollowup}
                priorFollowups={priorFollowupsLive}
                participants={participants}
                displayNames={memberDisplayNames}
                onGoToLookUp={() => {
                  if (isCompleted) return;
                  setLocalSection(2);
                }}
                othersPastoralLive={othersPastoralLive}
                othersAccountabilityLive={othersAccountabilityLive}
                othersVisionLive={othersVisionLive}
                othersPriorFollowupLive={othersPriorFollowupLive}
                accountabilityCheckupLines={accountabilityCheckupLines}
                commitmentCompleteByKey={commitmentCompleteByKey}
                patchCommitmentComplete={patchCommitmentComplete}
                readOnly={isCompleted}
              />
            </div>
          )}

          {activeSection === 2 && (
            <div className={cardClass}>
              <LookUpSection
                meetingId={meetingId}
                currentUserId={currentUserId}
                passageVerses={passageVerses}
                passageRef={passageRefEffective}
                scriptureLoadHint={scriptureLoadHint}
                observationAnchor={observationAnchor}
                passageObservations={passageObservations}
                othersObservationsByType={othersObservationsByType}
                facilitator={
                  facilitatorForLabel
                    ? displayNameFor(facilitatorForLabel)
                    : undefined
                }
                reteller={
                  retell?.assigned_user_id
                    ? displayNameFor(retell.assigned_user_id)
                    : undefined
                }
                participants={participants}
                memberDisplayNames={memberDisplayNames}
                readOnly={isCompleted}
                onGoToLookForward={() => {
                  if (isCompleted) return;
                  setLocalSection(3);
                }}
                presenterSync={{
                  step: lookUpPhaseToParticipantStep(ps.lookUpPhase),
                  readChunkIndex: ps.readChunkIndex,
                  rereadChunkIndex: ps.rereadChunkIndex,
                  readChunks,
                  rereadChunks,
                  onAdvance: () => {},
                  onBack: () => {},
                  disabled: isCompleted,
                  followOnly: true,
                }}
              />
            </div>
          )}

          {activeSection === 3 && (
            <div className={cardClass}>
              <LookForwardSection
                meetingId={meetingId}
                groupId={groupId}
                starterTrackWeek={meeting.starter_track_week ?? null}
                myLookforward={myLookforward}
                participants={participants}
                practice={practice}
                currentUserId={currentUserId}
                presenterFocus={{
                  forwardSub: ps.forwardSub as ForwardSub,
                  practiceSlideIndex: ps.practiceSlideIndex,
                }}
                othersCommitmentsLive={othersCommitmentsLive}
                memberDisplayNames={memberDisplayNames}
                starterTrackMeetingOrdinal={starterTrackMeetingOrdinal}
                groupVisionStatement={
                  starterTrackLookBack?.groupVisionStatement ?? null
                }
                passageReferenceLabel={passageRefEffective}
                passageObservations={passageObservations}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
