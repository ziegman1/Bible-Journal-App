"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  saveLookForwardResponse,
  assignPracticeActivity,
} from "@/app/actions/meetings";
import { getStarterWeekConfig } from "@/lib/groups/starter-track/starter-track-v1-config";
import {
  meetingLiveBody,
  meetingLiveEmpty,
  meetingLiveLabel,
  meetingLiveName,
  meetingLiveRegion,
  meetingLiveRow,
  meetingSectionPadding,
  meetingTextareaClass,
  meetingYourLabel,
  meetingYourRegion,
} from "@/components/groups/meeting-input-layout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Loader2, Shuffle } from "lucide-react";
import { toast } from "sonner";
import { formatCommissioningVisionLine } from "@/lib/groups/commissioning-vision";
import {
  starterTrackPracticeSectionsForLiveMeeting,
  type ForwardSub,
} from "@/lib/groups/meeting-presenter-state";
import { displayNameForMeetingUser } from "@/lib/groups/member-display-name";
import { ObservationsHelper } from "@/components/groups/observations-helper";
import type { PassageObservationRow } from "@/hooks/use-meeting-responses-realtime";

const PRACTICE_TYPES = [
  { id: "share_story", label: "Share the story just studied" },
  { id: "share_testimony", label: "Share personal testimony" },
  { id: "share_gospel", label: "Share God's story / the gospel" },
  { id: "role_play_obedience", label: "Role-play obedience/application" },
] as const;

interface LookForwardSectionProps {
  meetingId: string;
  groupId: string;
  /** When set, Practice shows this week’s guided instructions from Starter Track config (display-only). */
  starterTrackWeek?: number | null;
  myLookforward?: {
    obedience_statement?: string;
    sharing_commitment?: string;
    train_commitment?: string;
  };
  participants: { user_id: string; display_name: string }[];
  memberDisplayNames?: Record<string, string>;
  practice: Record<string, unknown>[];
  currentUserId: string;
  /** Scroll / align with facilitator Look Forward sub-step (shared presenter state). */
  presenterFocus?: {
    forwardSub: ForwardSub;
    practiceSlideIndex: number;
  };
  /** Other members&apos; saved commitments (realtime), excluding current user */
  othersCommitmentsLive?: {
    userId: string;
    displayName: string;
    obedienceText: string;
    sharingText: string;
    trainText: string;
  }[];
  /** Matches facilitator: weekly “five people” block hidden on first Starter Track meeting. */
  starterTrackMeetingOrdinal?: number | null;
  /** Group vision (Starter Track) — shown on commissioning step with facilitator. */
  groupVisionStatement?: string | null;
  /** Look Up passage label for Observations Helper (e.g. &quot;1 Cor 15:1–8&quot;). */
  passageReferenceLabel?: string | null;
  /** When set, Observations Helper uses live/synced rows instead of fetching. */
  passageObservations?: PassageObservationRow[];
}

export function LookForwardSection({
  meetingId,
  groupId,
  starterTrackWeek,
  myLookforward,
  participants,
  memberDisplayNames = {},
  practice,
  currentUserId,
  presenterFocus,
  othersCommitmentsLive = [],
  starterTrackMeetingOrdinal = null,
  groupVisionStatement = null,
  passageReferenceLabel = null,
  passageObservations,
}: LookForwardSectionProps) {
  const obeyRef = useRef<HTMLDivElement>(null);
  const practiceRef = useRef<HTMLDivElement>(null);
  const prayerGuidanceRef = useRef<HTMLDivElement>(null);
  const commissioningRef = useRef<HTMLDivElement>(null);
  const prayerRef = useRef<HTMLDivElement>(null);

  const obedienceRemote = myLookforward?.obedience_statement ?? "";
  const sharingRemote = myLookforward?.sharing_commitment ?? "";
  const trainRemote = myLookforward?.train_commitment ?? "";

  const [obedience, setObedience] = useState(obedienceRemote);
  const [obedienceSource, setObedienceSource] = useState(obedienceRemote);
  if (obedienceRemote !== obedienceSource) {
    setObedienceSource(obedienceRemote);
    setObedience(obedienceRemote);
  }

  const [sharing, setSharing] = useState(sharingRemote);
  const [sharingSource, setSharingSource] = useState(sharingRemote);
  if (sharingRemote !== sharingSource) {
    setSharingSource(sharingRemote);
    setSharing(sharingRemote);
  }

  const [train, setTrain] = useState(trainRemote);
  const [trainSource, setTrainSource] = useState(trainRemote);
  if (trainRemote !== trainSource) {
    setTrainSource(trainRemote);
    setTrain(trainRemote);
  }

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!presenterFocus) return;
    const el =
      presenterFocus.forwardSub === "obey"
        ? obeyRef.current
        : presenterFocus.forwardSub === "practice"
          ? practiceRef.current
          : presenterFocus.forwardSub === "prayer"
            ? prayerGuidanceRef.current
            : presenterFocus.forwardSub === "commissioning"
              ? commissioningRef.current
              : prayerRef.current;
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [presenterFocus]);

  const starterWeekConfig =
    starterTrackWeek != null &&
    starterTrackWeek >= 1 &&
    starterTrackWeek <= 8
      ? getStarterWeekConfig(starterTrackWeek)
      : undefined;
  const isStarterPractice = Boolean(starterWeekConfig);
  const starterPracticeSections = useMemo(
    () =>
      starterTrackPracticeSectionsForLiveMeeting(
        starterTrackWeek ?? null,
        starterTrackMeetingOrdinal ?? null
      ),
    [starterTrackWeek, starterTrackMeetingOrdinal]
  );

  async function handleSave() {
    if (!obedience.trim() || !sharing.trim() || !train.trim()) {
      toast.error(
        "Please fill in obey, share, and train commitments"
      );
      return;
    }
    setSaving(true);
    const r = await saveLookForwardResponse(meetingId, {
      obedienceStatement: obedience.trim(),
      sharingCommitment: sharing.trim(),
      trainCommitment: train.trim(),
    });
    setSaving(false);
    if (r.error) toast.error(r.error);
    else toast.success("Look Forward commitments saved");
  }

  async function handleAssignPractice() {
    const type = PRACTICE_TYPES[
      Math.floor(Math.random() * PRACTICE_TYPES.length)
    ];
    const idx = Math.floor(Math.random() * participants.length);
    const r = await assignPracticeActivity(meetingId, {
      practiceType: type.id,
      assignedUserId: participants[idx]?.user_id,
      assignedByMode: "random",
    });
    if (r.error) toast.error(r.error);
    else {
      const assigneeId = participants[idx]?.user_id;
      const assigneeName = assigneeId
        ? displayNameForMeetingUser(assigneeId, memberDisplayNames, participants)
        : "someone";
      toast.success(`Assigned ${type.label} to ${assigneeName}`);
      window.location.reload();
    }
  }

  const selfName = (() => {
    const n = displayNameForMeetingUser(
      currentUserId,
      memberDisplayNames,
      participants
    );
    return n === "Member" ? "You" : n;
  })();

  return (
    <div className="space-y-10">
      <div
        ref={obeyRef}
        id="lf-obey"
        className={cn(
          "scroll-mt-24 rounded-xl border border-[#d8d4d0] border-l-4 border-l-[#edb73e] bg-white",
          meetingSectionPadding
        )}
      >
        <h2 className="text-lg font-medium text-[#1c252e]">
          Obey, Share &amp; Train
        </h2>
        <p className="text-sm text-muted-foreground">
          How will you obey what you learned? Who will you share with? Who will
          you help follow Jesus by modeling and walking with them?
        </p>
        <ObservationsHelper
          meetingId={meetingId}
          userId={currentUserId}
          referenceLabel={passageReferenceLabel}
          observations={passageObservations}
        />
        <div className="mt-2 space-y-0">
          <div className={cn(meetingYourRegion, "mt-6 space-y-4")}>
            <p className={meetingYourLabel}>
              Your commitment
              <span className="sr-only"> ({selfName})</span>
            </p>
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-medium text-[#5c6570]">
                  How will you obey?
                </Label>
                <Textarea
                  value={obedience}
                  onChange={(e) => setObedience(e.target.value)}
                  placeholder="I will..."
                  rows={3}
                  className={meetingTextareaClass("mt-1.5")}
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-[#5c6570]">
                  Who will you share with?
                </Label>
                <Textarea
                  value={sharing}
                  onChange={(e) => setSharing(e.target.value)}
                  placeholder="I will share with..."
                  rows={2}
                  className={meetingTextareaClass("mt-1.5")}
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-[#5c6570]">
                  Who will you train?
                </Label>
                <Textarea
                  value={train}
                  onChange={(e) => setTrain(e.target.value)}
                  placeholder="I will help … follow Jesus by modeling … and walking with them."
                  rows={3}
                  className={meetingTextareaClass("mt-1.5")}
                />
              </div>
            </div>
            <Button
              type="button"
              className="mt-1"
              size="sm"
              variant="outline"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Save commitment
            </Button>
          </div>
          <div className={meetingLiveRegion}>
            <p className={meetingLiveLabel}>Group (live)</p>
            {othersCommitmentsLive.length === 0 ? (
              <p className={meetingLiveEmpty}>No one else has shared yet.</p>
            ) : (
              <ul className="m-0 list-none space-y-0 p-0">
                {othersCommitmentsLive.map((o) => (
                  <li key={o.userId} className={meetingLiveRow}>
                    <p className={meetingLiveName}>{o.displayName}</p>
                    {o.obedienceText ? (
                      <p className={cn(meetingLiveBody, "mt-2")}>
                        <span className="font-medium text-[#1c252e]/85">
                          Obey:
                        </span>{" "}
                        {o.obedienceText}
                      </p>
                    ) : null}
                    {o.sharingText ? (
                      <p className={cn(meetingLiveBody, "mt-2")}>
                        <span className="font-medium text-[#1c252e]/85">
                          Share:
                        </span>{" "}
                        {o.sharingText}
                      </p>
                    ) : null}
                    {o.trainText ? (
                      <p className={cn(meetingLiveBody, "mt-2")}>
                        <span className="font-medium text-[#1c252e]/85">
                          Train:
                        </span>{" "}
                        {o.trainText}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div
        ref={practiceRef}
        id="lf-practice"
        className={cn(
          "scroll-mt-24 rounded-xl border border-[#d8d4d0] border-l-4 border-l-[#edb73e] bg-white",
          meetingSectionPadding
        )}
      >
        <h2 className="text-lg font-medium text-[#1c252e]">
          Practice
        </h2>
        {presenterFocus?.forwardSub === "practice" ? (
          <p className="text-xs text-muted-foreground">
            Facilitator slide {presenterFocus.practiceSlideIndex + 1} — scroll
            this section to follow along.
          </p>
        ) : presenterFocus?.forwardSub === "prayer" ? (
          <p className="text-xs text-muted-foreground">
            Facilitator is on Prayer — pray together below.
          </p>
        ) : presenterFocus?.forwardSub === "commissioning" ? (
          <p className="text-xs text-muted-foreground">
            Facilitator is on commissioning — read the charge below.
          </p>
        ) : null}
        {isStarterPractice && starterWeekConfig ? (
          <>
            <p className="text-xs font-medium uppercase tracking-wide text-[#5c6570]">
              Starter Track — Week {starterTrackWeek}
            </p>
            <div className="space-y-5">
              {starterPracticeSections.map((section, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-[#e5e1dc]/80 bg-[#f8f7f5]/90 px-4 py-4"
                >
                  {section.heading ? (
                    <h3 className="text-sm font-semibold text-[#1c252e] mb-2">
                      {section.heading}
                    </h3>
                  ) : null}
                  <div className="text-sm text-[#1c252e]/90 leading-relaxed whitespace-pre-line">
                    {section.body}
                  </div>
                </div>
              ))}
            </div>
            {starterWeekConfig.assetPaths?.metricsDiagram ? (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Reference: group metrics diagram
                </p>
                <Image
                  src={starterWeekConfig.assetPaths.metricsDiagram}
                  alt="Starter Track week 8 — group metrics diagram"
                  width={640}
                  height={400}
                  className="w-full max-w-lg rounded-md border border-border"
                />
              </div>
            ) : null}
            {starterWeekConfig.assetPaths?.churchCircleDiagram ? (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Reference: church circle diagram
                </p>
                <Image
                  src={starterWeekConfig.assetPaths.churchCircleDiagram}
                  alt="Starter Track week 8 — church circle diagram"
                  width={640}
                  height={400}
                  className="w-full max-w-lg rounded-md border border-border"
                />
              </div>
            ) : null}
            <p className="text-sm text-muted-foreground">
              Work through this together in twos or threes as your group usually
              does for practice.
            </p>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              The facilitator can assign a practice activity for the group.
            </p>
            {practice.length > 0 ? (
              <ul className="space-y-2">
                {practice.map((p, i) => (
                  <li
                    key={i}
                    className="text-sm text-foreground/90 flex items-center gap-2"
                  >
                    <span className="font-medium">
                      {(p as { practice_type: string }).practice_type.replace(
                        /_/g,
                        " "
                      )}
                    </span>
                    {(p as { assigned_user_id?: string }).assigned_user_id && (
                      <span className="text-muted-foreground">
                        →
                        {displayNameForMeetingUser(
                          (p as { assigned_user_id: string }).assigned_user_id,
                          memberDisplayNames,
                          participants
                        )}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              participants.length > 0 && (
                <Button
                  variant="outline"
                  className="border-[#1c252e] text-[#1c252e] bg-transparent hover:bg-[#f6f4f1]"
                  onClick={handleAssignPractice}
                >
                  <Shuffle className="size-4 mr-2" />
                  Assign random practice
                </Button>
              )
            )}
          </>
        )}
      </div>

      <div
        ref={prayerGuidanceRef}
        id="lf-prayer-guide"
        className={cn(
          "scroll-mt-24 rounded-xl border border-[#d8d4d0] border-l-4 border-l-[#83b0da] bg-white",
          meetingSectionPadding
        )}
      >
        <h2 className="text-lg font-medium text-[#1c252e]">Prayer</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Pray together for obedience, for those you will share with, and for
          courage to train others. Keep it simple and brief; pray for specific
          people and needs as the group shares.
        </p>
      </div>

      <div
        ref={commissioningRef}
        id="lf-commissioning"
        className={cn(
          "scroll-mt-24 rounded-xl border border-[#d8d4d0] border-l-4 border-l-[#83b0da] bg-white",
          meetingSectionPadding
        )}
      >
        <h2 className="text-lg font-medium text-[#1c252e]">Go — commissioning</h2>
        <p className="text-sm text-[#1c252e]/90 leading-relaxed mt-2">
          You’ve heard God’s Word, shared commitments, and prayed together. Now
          go — step out in faith this week and live what you’ve received.
        </p>
        <p className="text-sm font-medium text-[#1c252e] mt-4">
          Fulfill the vision God has given your group!
        </p>
        <p className="mt-2 border-l-2 border-[#83b0da]/60 pl-4 text-sm text-[#1c252e] leading-snug">
          {formatCommissioningVisionLine(groupVisionStatement?.trim() ?? "")}
        </p>
      </div>

      <div
        ref={prayerRef}
        id="lf-prayer"
        className="rounded-xl border border-[#d8d4d0] border-l-4 border-l-[#edb73e] bg-white p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 scroll-mt-24"
      >
        <p className="text-sm text-muted-foreground">
          When your group is done with Look Forward, wrap up your 3/3rds time and
          open the meeting summary.
        </p>
        <Link
          href={`/app/groups/${groupId}/meetings/${meetingId}/summary`}
          className="shrink-0"
        >
          <Button
            size="lg"
            className="w-full sm:w-auto bg-[#edb73e] text-[#1c252e] hover:bg-[#e5ad38] border-0"
          >
            Finish
          </Button>
        </Link>
      </div>
    </div>
  );
}
