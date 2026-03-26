"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Footprints,
  Heart,
  Maximize2,
  Send,
  type LucideIcon,
} from "lucide-react";
import { SharePalmsTogetherIcon } from "@/components/icons/share-palms-together-icon";
import { cn } from "@/lib/utils";
import "./facilitator-present.css";
import type { StarterTrackLookBackPayload } from "@/lib/groups/starter-track/starter-track-lookback";
import { WEEK1_ACCOUNTABILITY_TEACHING } from "@/lib/groups/starter-track/week1-accountability-teaching";
import { getStarterWeekConfig } from "@/lib/groups/starter-track/starter-track-v1-config";
import {
  buildFacilitatorPracticeSlides,
  chunkVerses,
  includeWeeklyEvangelismHomeworkPractice,
  PRESENTER_READ_VERSES_PER_CHUNK,
  PRESENTER_REREAD_VERSES_PER_CHUNK,
  type ForwardSub,
  type LookUpPhase,
  type MeetingPresenterStateRow,
} from "@/lib/groups/meeting-presenter-state";
import { useMeetingPresenterSync } from "@/hooks/use-meeting-presenter-sync";
import { useMeetingPresence } from "@/hooks/use-meeting-presence";
import { useMeetingFacilitatorUserId } from "@/hooks/use-meeting-facilitator-user-id";
import { MeetingLivePresence } from "@/components/groups/meeting-live-presence";
import {
  displayNameForMeetingUser,
  normalizeMeetingUserId,
} from "@/lib/groups/member-display-name";
import {
  accountabilityLineKey,
  type AccountabilityCheckupLine,
} from "@/lib/groups/accountability-checkup";
import { formatCommissioningVisionLine } from "@/lib/groups/commissioning-vision";
import { useMeetingCommitmentCheckoffsOnlyRealtime } from "@/hooks/use-meeting-responses-realtime";
import {
  commencePresentFacilitatorFromPresence,
  saveMeetingCommitmentCheckoff,
} from "@/app/actions/meetings";
import { toast } from "sonner";

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
  preset_stories?: {
    title: string;
    book: string;
    chapter: number;
    verse_start: number;
    verse_end: number;
  } | null;
  starter_track_week?: number | null;
}

interface Participant {
  user_id: string;
  display_name: string;
}

function getDocumentFullscreenElement(): Element | null {
  const d = document as Document & {
    webkitFullscreenElement?: Element | null;
    msFullscreenElement?: Element | null;
  };
  return (
    document.fullscreenElement ??
    d.webkitFullscreenElement ??
    d.msFullscreenElement ??
    null
  );
}

/** Room-facing type scale — matches Discuss slides; exclude bible passage verse body. */
const FP_H2 =
  "text-4xl sm:text-5xl md:text-6xl font-semibold text-foreground";
const FP_H2_TIGHT = `${FP_H2} tracking-tight`;
const FP_LEAD =
  "text-2xl sm:text-3xl md:text-4xl lg:text-[2.5rem] leading-snug sm:leading-relaxed";
const FP_BODY = `${FP_LEAD} text-foreground/90`;
const FP_BODY_MUTED = `${FP_LEAD} text-muted-foreground`;
const FP_PROMPT = `${FP_LEAD} font-medium text-foreground`;
const FP_BLOCKQUOTE = `${FP_LEAD} font-serif text-foreground`;

/** One main title per slide — avoids “Practice” + blue “Practice” when config uses generic heading. */
function practicePresenterTitle(heading: string | undefined): string {
  const t = heading?.trim();
  if (!t) return "Practice";
  if (t.toLowerCase() === "practice") return "Practice";
  return t;
}

export interface FacilitatorMeetingViewProps {
  meeting: Meeting;
  participants: Participant[];
  memberDisplayNames: Record<string, string>;
  currentUserId: string;
  groupMemberRole: "admin" | "member";
  groupId: string;
  meetingId: string;
  priorCommitments: {
    obedience: string;
    sharing: string;
    train?: string;
  } | null;
  starterTrackLookBack?: StarterTrackLookBackPayload | null;
  accountabilityCheckupLines?: AccountabilityCheckupLine[];
  commitmentCheckoffs?: Record<string, unknown>[];
  retell: { assigned_user_id: string } | null;
  practice: Record<string, unknown>[];
  passageVerses: { verse: number; text: string }[];
  passageRef: string | null;
  presenterStateRow: MeetingPresenterStateRow | null;
  /**
   * From `getMeetingDetail`: 1 = first Starter Track meeting for this group (chronological).
   * Used to omit the recurring “five people this week” practice slide on meeting 1.
   */
  starterTrackMeetingOrdinal: number | null;
}

export function FacilitatorMeetingView({
  meeting,
  participants,
  memberDisplayNames,
  currentUserId,
  groupMemberRole,
  groupId,
  meetingId,
  priorCommitments,
  starterTrackLookBack,
  accountabilityCheckupLines = [],
  commitmentCheckoffs = [],
  retell,
  practice,
  passageVerses,
  passageRef,
  presenterStateRow,
  starterTrackMeetingOrdinal,
}: FacilitatorMeetingViewProps) {
  const presenterRootRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const syncFullscreenState = useCallback(() => {
    const root = presenterRootRef.current;
    if (!root) return;
    setIsFullscreen(getDocumentFullscreenElement() === root);
  }, []);

  useEffect(() => {
    document.addEventListener("fullscreenchange", syncFullscreenState);
    document.addEventListener("webkitfullscreenchange", syncFullscreenState);
    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreenState);
      document.removeEventListener(
        "webkitfullscreenchange",
        syncFullscreenState
      );
    };
  }, [syncFullscreenState]);

  const toggleFullscreen = useCallback(async () => {
    const el = presenterRootRef.current;
    if (!el) return;
    const doc = document as Document & {
      webkitExitFullscreen?: () => Promise<void> | void;
      msExitFullscreen?: () => Promise<void> | void;
    };
    const fsEl = getDocumentFullscreenElement();
    try {
      if (fsEl) {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if (doc.webkitExitFullscreen) await doc.webkitExitFullscreen();
        else if (doc.msExitFullscreen) await doc.msExitFullscreen();
      } else {
        const anyEl = el as unknown as {
          requestFullscreen?: () => Promise<void>;
          webkitRequestFullscreen?: () => void;
          msRequestFullscreen?: () => void;
        };
        if (anyEl.requestFullscreen) await anyEl.requestFullscreen();
        else if (anyEl.webkitRequestFullscreen) anyEl.webkitRequestFullscreen();
        else if (anyEl.msRequestFullscreen) anyEl.msRequestFullscreen();
        else {
          toast.error("Fullscreen isn’t supported in this browser.");
        }
      }
    } catch {
      toast.error("Couldn’t change fullscreen mode.");
    }
  }, []);

  const starterWeek = meeting.starter_track_week ?? null;
  const starterWeekConfig = useMemo(() => {
    if (starterWeek == null || starterWeek < 1 || starterWeek > 8) {
      return undefined;
    }
    return getStarterWeekConfig(starterWeek);
  }, [starterWeek]);

  const readChunks = useMemo(
    () => chunkVerses(passageVerses, PRESENTER_READ_VERSES_PER_CHUNK),
    [passageVerses]
  );
  const rereadChunks = useMemo(
    () => chunkVerses(passageVerses, PRESENTER_REREAD_VERSES_PER_CHUNK),
    [passageVerses]
  );
  const hasPassage = Boolean(passageRef && passageVerses.length > 0);

  const includeWeeklyHomework = includeWeeklyEvangelismHomeworkPractice(
    starterWeek,
    starterTrackMeetingOrdinal
  );
  const practiceSlides = useMemo(
    () => buildFacilitatorPracticeSlides(starterWeek, includeWeeklyHomework),
    [starterWeek, includeWeeklyHomework]
  );

  const currentUserDisplayName = useMemo(
    () => displayNameForMeetingUser(currentUserId, memberDisplayNames, participants),
    [memberDisplayNames, participants, currentUserId]
  );

  const liveFacilitatorUserId = useMeetingFacilitatorUserId(
    meetingId,
    meeting.facilitator_user_id,
    meeting.status === "completed"
  );

  const { peers: presencePeers, connection: presenceConnection } =
    useMeetingPresence({
      meetingId,
      userId: currentUserId,
      displayName: currentUserDisplayName,
      groupMemberRole,
      facilitatorUserId: liveFacilitatorUserId ?? meeting.facilitator_user_id,
      readOnly: meeting.status === "completed",
    });

  const canPersistPresenter =
    meeting.status !== "completed" &&
    (() => {
      if (
        liveFacilitatorUserId == null ||
        String(liveFacilitatorUserId).trim() === ""
      ) {
        return true;
      }
      const fac =
        normalizeMeetingUserId(liveFacilitatorUserId) ?? liveFacilitatorUserId;
      const me = normalizeMeetingUserId(currentUserId) ?? currentUserId;
      return fac === me;
    })();

  const router = useRouter();
  const commenceLiveFacilitatorOnceRef = useRef(false);
  useEffect(() => {
    if (meeting.status === "completed") return;
    if (presenceConnection !== "subscribed") return;
    if (commenceLiveFacilitatorOnceRef.current) return;
    const tid = window.setTimeout(() => {
      commenceLiveFacilitatorOnceRef.current = true;
      const ids = [
        normalizeMeetingUserId(currentUserId) ?? currentUserId,
        ...presencePeers.map(
          (p) => normalizeMeetingUserId(p.userId) ?? p.userId
        ),
      ];
      void commencePresentFacilitatorFromPresence(meetingId, ids).then((r) => {
        if ("error" in r && r.error) {
          toast.error(r.error);
          commenceLiveFacilitatorOnceRef.current = false;
          return;
        }
        if (r.commenced) router.refresh();
      });
    }, 500);
    return () => window.clearTimeout(tid);
  }, [
    meeting.status,
    meetingId,
    presenceConnection,
    currentUserId,
    presencePeers,
    router,
  ]);

  const { state: ps, goNext, goBack, connection } =
    useMeetingPresenterSync({
      meetingId,
      initialRow: presenterStateRow,
      hasPassage,
      readChunkCount: readChunks.length,
      rereadChunkCount: rereadChunks.length,
      practiceSlideCount: practiceSlides.length,
      readOnly: meeting.status === "completed",
      canPersist: canPersistPresenter,
    });

  const activeThird = ps.activeThird;
  const lookBackIdx = ps.lookBackSlide;
  const lookUpPhase = ps.lookUpPhase as LookUpPhase;
  const readPage = ps.readChunkIndex;
  const rereadPage = ps.rereadChunkIndex;
  const forwardSub = ps.forwardSub as ForwardSub;
  const practiceSlideIdx = ps.practiceSlideIndex;

  const retellerName = retell?.assigned_user_id
    ? displayNameForMeetingUser(
        retell.assigned_user_id,
        memberDisplayNames,
        participants
      )
    : null;

  const meetingTitle =
    meeting.title ||
    new Date(meeting.meeting_date).toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    });

  /** Drives slide-in when facilitator advances (thirds, substeps, chunks, practice). */
  const presentationKey = useMemo(
    () =>
      [
        activeThird,
        lookBackIdx,
        lookUpPhase,
        forwardSub,
        practiceSlideIdx,
        readPage,
        rereadPage,
      ].join(":"),
    [
      activeThird,
      lookBackIdx,
      lookUpPhase,
      forwardSub,
      practiceSlideIdx,
      readPage,
      rereadPage,
    ]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "f" || e.key === "F") {
        const t = e.target as HTMLElement | null;
        if (t?.closest?.("input, textarea, select, [contenteditable=true]")) {
          return;
        }
        e.preventDefault();
        void toggleFullscreen();
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        void goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        void goBack();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goBack, goNext, toggleFullscreen]);

  const accountabilityIsWeek1Teaching =
    starterTrackLookBack?.checkUpMode === "week1_teaching";

  const visionText =
    starterTrackLookBack?.groupVisionStatement?.trim() ||
    "Add your group’s vision statement in Starter Track onboarding when you’re ready.";
  const commissioningVisionLine = formatCommissioningVisionLine(
    starterTrackLookBack?.groupVisionStatement?.trim() ?? ""
  );

  const readOnlyMeeting = meeting.status === "completed";

  const isObeyTrainShareSlide =
    activeThird === 3 && forwardSub === "obey";

  const { commitmentCompleteByKey, patchCommitmentComplete } =
    useMeetingCommitmentCheckoffsOnlyRealtime({
      meetingId,
      initialCommitmentCheckoffs: commitmentCheckoffs,
      readOnly: readOnlyMeeting,
    });

  const [checkoffPending, setCheckoffPending] = useState<Record<string, boolean>>(
    {}
  );

  const groupedAccountabilityForPresent = useMemo(() => {
    const pillarOrder: Record<string, number> = {
      obedience: 0,
      sharing: 1,
      train: 2,
    };
    const m = new Map<string, AccountabilityCheckupLine[]>();
    for (const line of accountabilityCheckupLines) {
      if (!m.has(line.subjectUserId)) m.set(line.subjectUserId, []);
      m.get(line.subjectUserId)!.push(line);
    }
    return [...m.entries()]
      .map(([, lines]) => ({
        userId: lines[0]!.subjectUserId,
        displayName: lines[0]!.displayName,
        lines: [...lines].sort(
          (a, b) => pillarOrder[a.pillar] - pillarOrder[b.pillar]
        ),
      }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [accountabilityCheckupLines]);

  async function handlePresentCommitmentToggle(
    line: AccountabilityCheckupLine,
    checked: boolean
  ) {
    if (readOnlyMeeting) return;
    const key = accountabilityLineKey(meetingId, line);
    patchCommitmentComplete(key, checked);
    setCheckoffPending((p) => ({ ...p, [key]: true }));
    const r = await saveMeetingCommitmentCheckoff(meetingId, {
      sourceMeetingId: line.sourceMeetingId,
      subjectUserId: line.subjectUserId,
      pillar: line.pillar,
      isComplete: checked,
    });
    setCheckoffPending((p) => {
      const n = { ...p };
      delete n[key];
      return n;
    });
    if ("error" in r && r.error) {
      patchCommitmentComplete(key, !checked);
      toast.error(r.error);
    }
  }

  function renderMain() {
    if (activeThird === 1) {
      if (lookBackIdx === 0) {
        return (
          <div className="space-y-10 text-center">
            <h2 className={FP_H2_TIGHT}>Care</h2>
            <div
              className={cn("space-y-10 max-w-5xl mx-auto text-center", FP_PROMPT)}
            >
              <p>How has your week been?</p>
              <p>How is your relationship with God?</p>
            </div>
          </div>
        );
      }
      if (lookBackIdx === 1) {
        return (
          <div className="space-y-10 text-center">
            <h2 className={FP_H2_TIGHT}>Accountability</h2>
            {accountabilityIsWeek1Teaching ? (
              <div
                className={cn(
                  "text-left max-w-5xl mx-auto space-y-6",
                  FP_BODY
                )}
              >
                <p className={cn(FP_PROMPT, "text-center")}>
                  {WEEK1_ACCOUNTABILITY_TEACHING.title}
                </p>
                <p className={cn(FP_BODY_MUTED, "text-center")}>
                  {WEEK1_ACCOUNTABILITY_TEACHING.lead}
                </p>
                {WEEK1_ACCOUNTABILITY_TEACHING.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
                <p className={cn(FP_BODY_MUTED, "text-center pt-4")}>
                  Scriptures:{" "}
                  {WEEK1_ACCOUNTABILITY_TEACHING.scriptureRefs.join(" · ")}
                </p>
              </div>
            ) : accountabilityCheckupLines.length > 0 ? (
              <div className="text-left max-w-5xl mx-auto space-y-8">
                <p className={cn(FP_BODY_MUTED, "text-center")}>
                  Review obey · share · train commitments. Check off what was
                  followed through; unchecked items stay on the list for next week.
                </p>
                <div className="space-y-8 rounded-xl border border-white/15 bg-black/10 p-5 sm:p-8">
                  {groupedAccountabilityForPresent.map((group) => (
                    <div key={group.userId} className="space-y-4">
                      <p className="font-semibold text-foreground text-3xl sm:text-4xl md:text-5xl">
                        {group.displayName}
                      </p>
                      <ul className="m-0 list-none space-y-5 p-0">
                        {group.lines.map((line) => {
                          const key = accountabilityLineKey(meetingId, line);
                          const checked = commitmentCompleteByKey[key] ?? false;
                          const pending = checkoffPending[key];
                          return (
                            <li
                              key={key}
                              className={cn("flex gap-4", FP_BODY)}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={readOnlyMeeting || pending}
                                onChange={(e) =>
                                  void handlePresentCommitmentToggle(
                                    line,
                                    e.target.checked
                                  )
                                }
                                className="mt-1 size-8 shrink-0 cursor-pointer rounded border-white/40 disabled:cursor-not-allowed [accent-color:#83b0da] sm:size-9"
                                aria-label={`${line.pillarLabel} for ${group.displayName}`}
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-base sm:text-lg font-semibold uppercase tracking-wide text-[#83b0da]">
                                  {line.pillarLabel}
                                  {line.isCarryForward ? (
                                    <span className="ml-2 font-normal normal-case text-muted-foreground">
                                      · carried forward
                                    </span>
                                  ) : null}
                                </p>
                                <p className="mt-1 leading-relaxed">{line.text}</p>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ) : starterTrackLookBack?.checkUpMode ===
              "prior_group_commitments" &&
              starterTrackLookBack.priorWeekByMember.length > 0 ? (
              <div className="text-left max-w-5xl mx-auto space-y-6">
                <p className={cn(FP_BODY_MUTED, "text-center")}>
                  Review last week’s commitments — take turns sharing how you
                  obeyed, who you shared with, and how you trained others.
                </p>
                <ul className={cn("space-y-5", FP_BODY)}>
                  {starterTrackLookBack.priorWeekByMember.map((m) => (
                    <li
                      key={m.userId}
                      className="rounded-xl border border-white/20 bg-transparent p-5"
                    >
                      <p className="font-semibold text-foreground text-3xl sm:text-4xl mb-3">
                        {m.displayName}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Obey: </span>
                        {m.obedience?.trim() || "—"}
                      </p>
                      <p className="mt-2">
                        <span className="text-muted-foreground">Share: </span>
                        {m.sharing?.trim() || "—"}
                      </p>
                      <p className="mt-2">
                        <span className="text-muted-foreground">Train: </span>
                        {m.train?.trim() || "—"}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div
                className={cn(
                  "space-y-8 max-w-5xl mx-auto text-center",
                  FP_PROMPT
                )}
              >
                <p>
                  Take time for accountability: How did we obey what God showed
                  us? Who did we share with?
                </p>
                {priorCommitments &&
                (priorCommitments.obedience?.trim() ||
                  priorCommitments.sharing?.trim() ||
                  priorCommitments.train?.trim()) ? (
                  <div
                    className={cn(
                      "text-left rounded-xl border border-white/20 bg-transparent p-6",
                      FP_BODY
                    )}
                  >
                    <p className="text-muted-foreground text-base sm:text-lg uppercase tracking-wide mb-2">
                      Reference (your last commitments)
                    </p>
                    {priorCommitments.obedience?.trim() ? (
                      <p className="mb-2">
                        <span className="text-muted-foreground">Obey: </span>
                        {priorCommitments.obedience}
                      </p>
                    ) : null}
                    {priorCommitments.sharing?.trim() ? (
                      <p className="mb-2">
                        <span className="text-muted-foreground">Share: </span>
                        {priorCommitments.sharing}
                      </p>
                    ) : null}
                    {priorCommitments.train?.trim() ? (
                      <p>
                        <span className="text-muted-foreground">Train: </span>
                        {priorCommitments.train}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        );
      }
      return (
        <div className="space-y-10 text-center">
          <h2 className={FP_H2_TIGHT}>Vision</h2>
          <blockquote className={cn(FP_BLOCKQUOTE, "max-w-6xl mx-auto px-4")}>
            {visionText}
          </blockquote>
          <p className={cn(FP_BODY_MUTED, "max-w-4xl mx-auto")}>
            We exist to make disciples who obey, share, and multiply.
          </p>
        </div>
      );
    }

    if (activeThird === 2) {
      if (lookUpPhase === "read") {
        if (!hasPassage) {
          return (
            <div className="space-y-8 text-center max-w-5xl mx-auto">
              <h2 className={FP_H2}>Read</h2>
              <p className={FP_BODY_MUTED}>
                Passage text isn’t available on this screen. Read from your
                Bibles or the participant view, then continue.
              </p>
            </div>
          );
        }
        return (
          <div className="facilitator-passage-reading flex min-h-0 w-full max-w-[min(100%,96rem)] flex-1 flex-col mx-auto">
            <div className="shrink-0 text-center pb-3 sm:pb-4">
              <h2 className="text-3xl font-semibold text-foreground sm:text-4xl md:text-5xl lg:text-6xl mb-1">
                Read the passage
              </h2>
              <p className="text-xl text-[#83b0da] sm:text-2xl md:text-3xl lg:text-4xl">
                {passageRef}
              </p>
              {readChunks.length > 1 ? (
                <p className="mt-2 text-lg text-muted-foreground sm:text-xl md:text-2xl">
                  Participant devices: part {readPage + 1} of {readChunks.length}
                </p>
              ) : null}
            </div>
            <div className="facilitator-passage-verses font-serif min-h-0 flex-1 overflow-y-auto overscroll-contain text-foreground leading-snug sm:leading-normal">
              <div className="mx-auto max-w-4xl space-y-1 sm:space-y-1.5">
                {passageVerses.map((v) => (
                  <p key={v.verse} className="text-pretty">
                    <span className="text-[#83b0da]/80 mr-2 tabular-nums sm:mr-3">
                      {v.verse}
                    </span>
                    {v.text}
                  </p>
                ))}
              </div>
            </div>
          </div>
        );
      }

      if (lookUpPhase === "retell") {
        return (
          <div className="space-y-10 text-center max-w-5xl mx-auto">
            <h2 className={FP_H2}>Retell</h2>
            <p className={FP_PROMPT}>
              Retell the story in your own words as best you can. Have the rest
              of the group fill in anything that was left out.
            </p>
            {retellerName ? (
              <p className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.5rem] text-[#83b0da] leading-snug sm:leading-relaxed">
                Retelling:{" "}
                <span className="font-semibold text-foreground">{retellerName}</span>
              </p>
            ) : (
              <p className={FP_BODY_MUTED}>
                Assign a reteller from the participant view if needed.
              </p>
            )}
          </div>
        );
      }

      if (lookUpPhase === "like") {
        return (
          <div className="space-y-10 text-center max-w-5xl mx-auto">
            <h2 className={FP_H2}>Discuss</h2>
            <div className={cn("space-y-10", FP_BODY)}>
              <p className="font-medium text-foreground">
                What did you like about the story?
              </p>
              <p className="font-medium text-foreground">
                Was there any part that really stood out to you?
              </p>
            </div>
            {starterWeek != null && starterWeek >= 1 && starterWeek <= 8 ? (
              <p className={cn(FP_BODY_MUTED, "text-base max-w-3xl mx-auto")}>
                On their devices, participants anchor each written note in
                specific verse(s) and can reopen the passage while they answer.
              </p>
            ) : null}
          </div>
        );
      }

      if (lookUpPhase === "difficult") {
        return (
          <div className="space-y-10 text-center max-w-5xl mx-auto">
            <h2 className={FP_H2}>Discuss</h2>
            <div className={cn("space-y-10", FP_BODY)}>
              <p className="font-medium text-foreground">
                Was there anything difficult to understand in the story?
              </p>
              <p className="font-medium text-foreground">
                Anything hard to believe?
              </p>
            </div>
            {starterWeek != null && starterWeek >= 1 && starterWeek <= 8 ? (
              <p className={cn(FP_BODY_MUTED, "text-base max-w-3xl mx-auto")}>
                On their devices, participants anchor each written note in
                specific verse(s) and can reopen the passage while they answer.
              </p>
            ) : null}
          </div>
        );
      }

      if (lookUpPhase === "reread" && hasPassage) {
        return (
          <div className="facilitator-passage-reading flex min-h-0 w-full max-w-[min(100%,96rem)] flex-1 flex-col mx-auto">
            <div className="shrink-0 text-center pb-3 sm:pb-4">
              <h2 className="text-3xl font-semibold text-foreground sm:text-4xl md:text-5xl lg:text-6xl mb-1">
                Read again
              </h2>
              <p className="text-lg text-muted-foreground sm:text-xl md:text-2xl">
                Read the passage again together.
              </p>
              <p className="mt-2 text-xl text-[#83b0da] sm:text-2xl md:text-3xl lg:text-4xl">
                {passageRef}
              </p>
              {rereadChunks.length > 1 ? (
                <p className="mt-2 text-lg text-muted-foreground sm:text-xl md:text-2xl">
                  Participant devices: part {rereadPage + 1} of{" "}
                  {rereadChunks.length}
                </p>
              ) : null}
            </div>
            <div className="facilitator-passage-verses font-serif min-h-0 flex-1 overflow-y-auto overscroll-contain text-foreground leading-snug sm:leading-normal">
              <div className="mx-auto max-w-4xl space-y-1 sm:space-y-1.5">
                {passageVerses.map((v) => (
                  <p key={v.verse} className="text-pretty">
                    <span className="text-[#83b0da]/80 mr-2 tabular-nums sm:mr-3">
                      {v.verse}
                    </span>
                    {v.text}
                  </p>
                ))}
              </div>
            </div>
          </div>
        );
      }

      if (lookUpPhase === "people") {
        return (
          <div className="space-y-10 text-center max-w-5xl mx-auto">
            <h2 className={FP_H2}>Discuss</h2>
            <p className={FP_PROMPT}>
              What does the story teach us about people, ourselves, or humanity?
            </p>
            {starterWeek != null && starterWeek >= 1 && starterWeek <= 8 ? (
              <p className={cn(FP_BODY_MUTED, "text-base max-w-3xl mx-auto")}>
                On their devices, participants anchor each written note in
                specific verse(s) and can reopen the passage while they answer.
              </p>
            ) : null}
          </div>
        );
      }

      if (lookUpPhase === "god") {
        return (
          <div className="space-y-10 text-center max-w-5xl mx-auto">
            <h2 className={FP_H2}>Discuss</h2>
            <p className={FP_PROMPT}>
              What does the story teach us about God?
            </p>
            {starterWeek != null && starterWeek >= 1 && starterWeek <= 8 ? (
              <p className={cn(FP_BODY_MUTED, "text-base max-w-3xl mx-auto")}>
                On their devices, participants anchor each written note in
                specific verse(s) and can reopen the passage while they answer.
              </p>
            ) : null}
          </div>
        );
      }
    }

    if (activeThird === 3) {
      if (forwardSub === "obey") {
        /** Matches participant Look Forward order: Obey → Share → Train */
        const obeyShareTrainCards: {
          accent: string;
          title: string;
          body: string;
          Icon: LucideIcon | typeof SharePalmsTogetherIcon;
        }[] = [
          {
            accent: "#83b0da",
            title: "Obey",
            body: "How will you obey what you learned this week?",
            Icon: Heart,
          },
          {
            accent: "#eae5e1",
            title: "Share",
            body: "Who will you share with this week?",
            Icon: SharePalmsTogetherIcon,
          },
          {
            accent: "#edb73e",
            title: "Train",
            body: "Who will you help follow Jesus — modeling and walking with them?",
            Icon: Footprints,
          },
        ];

        return (
          <div className="facilitator-obey-train-share-slide">
            <h2 className="facilitator-ots-main-title">This week</h2>
            <div className="facilitator-ots-cards">
              {obeyShareTrainCards.map((c) => (
                <div
                  key={c.title}
                  className="facilitator-ots-card"
                  style={{ borderLeftColor: c.accent }}
                >
                  <div className="facilitator-ots-card-head">
                    <c.Icon
                      className={cn(
                        c.title === "Share" && "facilitator-ots-share-icon"
                      )}
                      style={{ color: c.accent }}
                      strokeWidth={1.75}
                      aria-hidden
                    />
                    <p
                      className="facilitator-ots-card-title"
                      style={{ color: c.accent }}
                    >
                      {c.title}
                    </p>
                  </div>
                  <p className="facilitator-ots-card-body">{c.body}</p>
                </div>
              ))}
            </div>
            <p className="facilitator-ots-footnote">
              Participants record commitments in their own devices.
            </p>
          </div>
        );
      }

      if (forwardSub === "practice") {
        const slide = practiceSlides[practiceSlideIdx];
        if (!slide) return null;
        if (slide.kind === "image") {
          return (
            <div className="space-y-6 w-full max-w-6xl mx-auto text-center">
              <h2 className={FP_H2}>Practice</h2>
              {slide.caption ? (
                <p className={FP_BODY_MUTED}>{slide.caption}</p>
              ) : null}
              <div className="relative w-full max-w-5xl mx-auto aspect-[16/10]">
                <Image
                  src={slide.src}
                  alt={slide.alt}
                  fill
                  className="object-contain rounded-lg border border-white/25"
                  sizes="(max-width: 1200px) 100vw, 1200px"
                  priority
                />
              </div>
              {practiceSlides.length > 1 ? (
                <p className={FP_BODY_MUTED}>
                  Slide {practiceSlideIdx + 1} of {practiceSlides.length}
                </p>
              ) : null}
            </div>
          );
        }
        return (
          <div className="space-y-8 w-full max-w-6xl mx-auto text-center">
            <h2 className={FP_H2}>
              {practicePresenterTitle(slide.heading)}
            </h2>
            {practiceSlides.length > 1 ? (
              <p className={FP_BODY_MUTED}>
                Part {practiceSlideIdx + 1} of {practiceSlides.length}
              </p>
            ) : null}
            <div
              className={cn(
                "text-left whitespace-pre-line",
                FP_BODY
              )}
            >
              {slide.body}
            </div>
          </div>
        );
      }

      if (forwardSub === "prayer") {
        return (
          <div className="space-y-10 text-center max-w-5xl mx-auto">
            <h2 className={FP_H2}>Prayer</h2>
            <p className={FP_PROMPT}>
              Pray together for obedience, for those you will share with, and for
              courage to train others.
            </p>
            <p className={FP_BODY_MUTED}>
              Keep prayers simple and brief. Pray for specific people and needs as
              the group shares.
            </p>
          </div>
        );
      }

      if (forwardSub === "commissioning") {
        return (
          <div className="flex w-full max-w-4xl flex-col items-center gap-4 px-3 text-center sm:gap-5 md:max-w-5xl">
            <div className="flex flex-col items-center gap-1.5 sm:gap-2">
              <Send
                className="size-11 text-[#83b0da] sm:size-14 md:size-16"
                strokeWidth={1.5}
                aria-hidden
              />
              <p className="text-4xl font-bold tracking-tight text-[#83b0da] sm:text-5xl md:text-6xl lg:text-7xl">
                GO
              </p>
            </div>
            <p className={cn(FP_PROMPT, "leading-snug sm:leading-relaxed")}>
              You’ve heard God’s Word, shared commitments, and prayed together.
              Now go — step out in faith this week and live what you’ve received.
            </p>
            <p
              className={cn(
                FP_BODY,
                "font-medium text-foreground pt-1 leading-snug"
              )}
            >
              Fulfill the vision God has given your group!
            </p>
            <p
              className={cn(
                FP_BODY,
                "w-full max-w-3xl border-l-2 border-[#83b0da]/55 pl-4 text-left leading-snug sm:pl-6 sm:leading-relaxed"
              )}
            >
              {commissioningVisionLine}
            </p>
          </div>
        );
      }
    }

    return null;
  }

  return (
    <div
      ref={presenterRootRef}
      className="facilitator-fullscreen-root flex min-h-screen min-h-[100dvh] flex-col bg-[#1c252e]"
      data-facilitator-practice-count={practice.length}
    >
      <header className="shrink-0 border-b border-white/20 px-4 py-3 sm:py-4">
        <div className="mx-auto max-w-7xl text-center">
          {starterWeek != null ? (
            <p className="text-lg sm:text-xl font-semibold text-[#edb73e]">
              Week {starterWeek}
              {starterWeekConfig?.title
                ? `: ${starterWeekConfig.title}`
                : null}
            </p>
          ) : null}
          <p className="truncate text-muted-foreground text-sm sm:text-base">
            {meetingTitle}
            {passageRef ? (
              <span className="text-[#83b0da]"> · {passageRef}</span>
            ) : null}
          </p>
          <p className="text-[0.65rem] uppercase tracking-wide text-white/45 mt-1">
            {connection === "subscribed"
              ? "Live sync on"
              : connection === "connecting"
                ? "Connecting…"
                : connection === "error"
                  ? "Live sync unavailable — refresh if stuck"
                  : null}
          </p>
          {!canPersistPresenter && meeting.status !== "completed" ? (
            <p className="mt-2 px-2 text-xs leading-snug text-amber-100/95">
              <span className="font-semibold">View-only on this device.</span>{" "}
              Slides are controlled by the live facilitator
              {liveFacilitatorUserId ? (
                <>
                  :{" "}
                  <span className="font-medium text-white">
                    {displayNameForMeetingUser(
                      liveFacilitatorUserId,
                      memberDisplayNames,
                      participants
                    )}
                  </span>
                </>
              ) : null}
              .
            </p>
          ) : null}
        </div>
        {meeting.status !== "completed" ? (
          <div className="mx-auto mt-3 max-w-7xl border-t border-white/15 px-4 pt-3">
            <MeetingLivePresence
              variant="facilitator"
              peers={presencePeers}
              connection={presenceConnection}
              currentUserId={currentUserId}
            />
          </div>
        ) : null}
      </header>

      <main className="flex min-h-0 flex-1 flex-col items-stretch px-2 py-3 sm:px-3 sm:py-4 md:px-4">
        <div
          key={presentationKey}
          className="facilitator-slide-in flex min-h-0 w-full max-w-[min(100%,96rem)] flex-1 flex-col mx-auto"
        >
          <div
            className={cn(
              "facilitator-slide-stage flex min-h-0 w-full flex-1 flex-col overflow-hidden",
              isObeyTrainShareSlide
                ? "facilitator-slide-stage-ots"
                : "items-center justify-center"
            )}
          >
            {renderMain()}
          </div>
        </div>
      </main>

      <footer className="shrink-0 border-t border-white/20 bg-[#1c252e] px-4 py-4">
        <div
          className="mx-auto flex max-w-7xl justify-center gap-2"
          role="status"
          aria-label={`Meeting section ${activeThird} of 3`}
        >
          {([1, 2, 3] as const).map((third) => (
            <span
              key={third}
              className={cn(
                "h-1.5 rounded-full transition-all duration-500 ease-out",
                activeThird === third
                  ? "w-10 bg-[#83b0da] shadow-[0_0_12px_rgba(131,176,218,0.35)]"
                  : "w-2 bg-white/20"
              )}
              title={`Section ${third} of 3`}
            />
          ))}
        </div>
      </footer>

      {!isFullscreen ? (
        <button
          type="button"
          onClick={() => void toggleFullscreen()}
          className={cn(
            "fixed bottom-4 right-4 z-50 flex size-9 items-center justify-center rounded-md",
            "border border-white/20 bg-[#1c252e]/90 text-white/70 shadow-lg backdrop-blur-sm",
            "hover:border-white/35 hover:bg-[#1c252e] hover:text-white",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#83b0da] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1c252e]"
          )}
          aria-label="Enter full screen"
          title="Full screen (F)"
        >
          <Maximize2 className="size-[1.05rem] shrink-0" strokeWidth={2} aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
