"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  saveLookBackResponse,
  saveMeetingCommitmentCheckoff,
  savePriorObedienceFollowup,
} from "@/app/actions/meetings";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Heart, Scale, Target } from "lucide-react";
import { toast } from "sonner";
import type { StarterTrackLookBackPayload } from "@/lib/groups/starter-track/starter-track-lookback";
import { WEEK1_ACCOUNTABILITY_TEACHING } from "@/lib/groups/starter-track/week1-accountability-teaching";
import { normalizeMeetingUserId } from "@/lib/groups/member-display-name";
import {
  accountabilityLineKey,
  type AccountabilityCheckupLine,
} from "@/lib/groups/accountability-checkup";
import {
  meetingLiveBody,
  meetingLiveEmpty,
  meetingLiveLabel,
  meetingLiveName,
  meetingLiveRegion,
  meetingLiveRow,
  meetingReferenceBox,
  meetingSectionPadding,
  meetingTextareaClass,
  meetingYourLabel,
  meetingYourRegion,
} from "@/components/groups/meeting-input-layout";

interface LookBackSectionProps {
  meetingId: string;
  /** Used to label the pastoral “You” row in the live group list. */
  currentUserId: string;
  groupId?: string;
  priorCommitments: {
    obedience: string;
    sharing: string;
    train?: string;
  } | null;
  /** When set, Starter Track–specific Look Back (group vision + check-up modes). */
  starterTrackLookBack?: StarterTrackLookBackPayload | null;
  myLookback?: {
    pastoral_care_response?: string;
    accountability_response?: string;
    vision_casting_response?: string;
  };
  myPriorFollowup?: Record<string, unknown>;
  priorFollowups: Record<string, unknown>[];
  participants: { user_id: string; display_name: string }[];
  displayNames: Record<string, string>;
  /** Advance the meeting stepper to Look Up */
  onGoToLookUp?: () => void;
  /** Other members&apos; pastoral responses (realtime), excluding current user */
  othersPastoralLive?: { userId: string; displayName: string; text: string }[];
  /** Other members&apos; accountability / check-up text (lookback.accountability_response) */
  othersAccountabilityLive?: { userId: string; displayName: string; text: string }[];
  /** Other members&apos; vision / multiplication reflections */
  othersVisionLive?: { userId: string; displayName: string; text: string }[];
  /** Other members&apos; accountability follow-ups (realtime) */
  othersPriorFollowupLive?: {
    userId: string;
    displayName: string;
    obedienceText: string;
    sharingText: string;
  }[];
  /** Prior obey/share/train lines for this meeting’s check-up (with optional carry-forward). */
  accountabilityCheckupLines?: AccountabilityCheckupLine[];
  commitmentCompleteByKey?: Record<string, boolean>;
  patchCommitmentComplete?: (key: string, complete: boolean) => void;
  /** When true, checkboxes are disabled (e.g. completed meeting). */
  readOnly?: boolean;
}

export function LookBackSection({
  meetingId,
  currentUserId,
  groupId,
  priorCommitments,
  starterTrackLookBack,
  myLookback,
  myPriorFollowup,
  priorFollowups,
  participants,
  displayNames,
  onGoToLookUp,
  othersPastoralLive = [],
  othersAccountabilityLive = [],
  othersVisionLive = [],
  othersPriorFollowupLive = [],
  accountabilityCheckupLines = [],
  commitmentCompleteByKey = {},
  patchCommitmentComplete = () => {},
  readOnly = false,
}: LookBackSectionProps) {
  const [pastoral, setPastoral] = useState(myLookback?.pastoral_care_response ?? "");
  const [accountability, setAccountability] = useState(
    myLookback?.accountability_response ?? ""
  );
  const [vision, setVision] = useState(myLookback?.vision_casting_response ?? "");
  const [obedienceFollowup, setObedienceFollowup] = useState(
    (myPriorFollowup as { obedience_followup_response?: string } | undefined)
      ?.obedience_followup_response ?? ""
  );
  const [sharingFollowup, setSharingFollowup] = useState(
    (myPriorFollowup as { sharing_followup_response?: string } | undefined)
      ?.sharing_followup_response ?? ""
  );
  const [saving, setSaving] = useState(false);
  const [checkoffPending, setCheckoffPending] = useState<Record<string, boolean>>(
    {}
  );

  const isStarter = starterTrackLookBack != null;

  const pillarOrder: Record<string, number> = {
    obedience: 0,
    sharing: 1,
    train: 2,
  };

  const groupedAccountabilityLines = useMemo(() => {
    const m = new Map<string, AccountabilityCheckupLine[]>();
    for (const line of accountabilityCheckupLines) {
      const k = normalizeMeetingUserId(line.subjectUserId) ?? line.subjectUserId;
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(line);
    }
    const entries = [...m.entries()].map(([, lines]) => ({
      userId: normalizeMeetingUserId(lines[0]!.subjectUserId) ?? lines[0]!.subjectUserId,
      displayName: lines[0]!.displayName,
      lines: [...lines].sort(
        (a, b) => pillarOrder[a.pillar] - pillarOrder[b.pillar]
      ),
    }));
    entries.sort((a, b) => a.displayName.localeCompare(b.displayName));
    return entries;
  }, [accountabilityCheckupLines]);

  async function handleCommitmentToggle(
    line: AccountabilityCheckupLine,
    checked: boolean
  ) {
    if (readOnly) return;
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

  function renderAccountabilityChecklistCard(options: {
    title: string;
    intro: string;
    showReflection?: boolean;
    accountabilityPlaceholder?: string;
  }) {
    return (
      <div
        className={cn(
          "rounded-xl border border-[#d8d4d0] border-l-4 border-l-[#83b0da] bg-white",
          meetingSectionPadding
        )}
      >
        <h2 className="text-lg font-medium text-[#1c252e] flex items-center gap-2">
          <Scale className="size-5 text-[#83b0da]" />
          {options.title}
        </h2>
        <p className="text-sm text-muted-foreground">{options.intro}</p>
        <div className="mt-4 overflow-hidden rounded-lg border border-[#e5e1dc]/80 bg-[#fafaf9]/50">
          {groupedAccountabilityLines.map((group) => (
            <div
              key={group.userId}
              className="border-b border-[#ebe9e6] px-4 py-4 last:border-b-0"
            >
              <p className="text-sm font-semibold text-[#1c252e]">{group.displayName}</p>
              <ul className="mt-3 space-y-3 list-none p-0 m-0">
                {group.lines.map((line) => {
                  const key = accountabilityLineKey(meetingId, line);
                  const checked = commitmentCompleteByKey[key] ?? false;
                  const pending = checkoffPending[key];
                  return (
                    <li key={key} className="flex gap-3 text-sm leading-snug">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={readOnly || pending}
                        onChange={(e) =>
                          void handleCommitmentToggle(line, e.target.checked)
                        }
                        className="mt-0.5 size-[1.15rem] shrink-0 cursor-pointer rounded border-[#c5c0ba] disabled:cursor-not-allowed [accent-color:#83b0da]"
                        aria-label={`Mark ${line.pillarLabel} complete for ${group.displayName}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#5c6570]">
                          {line.pillarLabel}
                          {line.isCarryForward ? (
                            <span className="ml-2 font-normal normal-case text-[#83b0da]">
                              · carried forward
                            </span>
                          ) : null}
                        </p>
                        <p className="mt-1 text-muted-foreground leading-relaxed">
                          {line.text}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Anyone in the group can check these off as you hear updates. Unchecked items stay
          on the list for your next meeting.
        </p>
        {options.showReflection ? (
          <div className="mt-8 border-t border-[#e8e4df] pt-6">
            <p className="text-sm font-medium text-[#1c252e]">Reflection</p>
            <p className="text-sm text-muted-foreground mt-1">
              Share how you&apos;re walking with God and how the group can encourage you.
            </p>
            {renderAccountabilityLiveBlock(
              options.accountabilityPlaceholder ??
                "Reflections for the group…"
            )}
          </div>
        ) : null}
      </div>
    );
  }

  useEffect(() => {
    setPastoral(myLookback?.pastoral_care_response ?? "");
  }, [myLookback?.pastoral_care_response]);

  useEffect(() => {
    setAccountability(myLookback?.accountability_response ?? "");
  }, [myLookback?.accountability_response]);

  useEffect(() => {
    setVision(myLookback?.vision_casting_response ?? "");
  }, [myLookback?.vision_casting_response]);

  useEffect(() => {
    setObedienceFollowup(
      (myPriorFollowup as { obedience_followup_response?: string } | undefined)
        ?.obedience_followup_response ?? ""
    );
  }, [
    (myPriorFollowup as { obedience_followup_response?: string } | undefined)
      ?.obedience_followup_response,
  ]);

  useEffect(() => {
    setSharingFollowup(
      (myPriorFollowup as { sharing_followup_response?: string } | undefined)
        ?.sharing_followup_response ?? ""
    );
  }, [
    (myPriorFollowup as { sharing_followup_response?: string } | undefined)
      ?.sharing_followup_response,
  ]);

  function selfDisplayName() {
    const id = normalizeMeetingUserId(currentUserId) ?? currentUserId;
    return (
      displayNames[id] ??
      participants.find(
        (p) => normalizeMeetingUserId(p.user_id) === normalizeMeetingUserId(currentUserId)
      )?.display_name ??
      "You"
    );
  }

  function renderPastoralCareLiveBlock() {
    return (
      <div className="mt-7 space-y-0">
        <div className={cn(meetingYourRegion, "space-y-3")}>
          <p className={meetingYourLabel}>
            Your response
            <span className="sr-only"> ({selfDisplayName()})</span>
          </p>
          <Textarea
            value={pastoral}
            onChange={(e) => setPastoral(e.target.value)}
            placeholder="Share how you're doing and any prayer needs..."
            rows={3}
            className={meetingTextareaClass("mt-1")}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-2"
            onClick={handleSaveLookback}
            disabled={saving}
          >
            {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Save
          </Button>
        </div>
        <div className={meetingLiveRegion}>
          <p className={meetingLiveLabel}>Group (live)</p>
          {othersPastoralLive.length === 0 ? (
            <p className={meetingLiveEmpty}>No one else has shared yet.</p>
          ) : (
            <ul className="m-0 list-none space-y-0 p-0">
              {othersPastoralLive.map((o) => (
                <li key={o.userId} className={meetingLiveRow}>
                  <p className={meetingLiveName}>{o.displayName}</p>
                  <p className={meetingLiveBody}>{o.text}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  function renderAccountabilityLiveBlock(
    placeholder = "Share how you followed through…"
  ) {
    return (
      <div className="mt-7 space-y-0">
        <div className={cn(meetingYourRegion, "space-y-3")}>
          <p className={meetingYourLabel}>
            Your response
            <span className="sr-only"> ({selfDisplayName()})</span>
          </p>
          <Textarea
            value={accountability}
            onChange={(e) => setAccountability(e.target.value)}
            placeholder={placeholder}
            rows={3}
            className={meetingTextareaClass("mt-1")}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-2"
            onClick={handleSaveLookback}
            disabled={saving}
          >
            {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Save
          </Button>
        </div>
        <div className={meetingLiveRegion}>
          <p className={meetingLiveLabel}>Group (live)</p>
          {othersAccountabilityLive.length === 0 ? (
            <p className={meetingLiveEmpty}>No one else has shared yet.</p>
          ) : (
            <ul className="m-0 list-none space-y-0 p-0">
              {othersAccountabilityLive.map((o) => (
                <li key={o.userId} className={meetingLiveRow}>
                  <p className={meetingLiveName}>{o.displayName}</p>
                  <p className={meetingLiveBody}>{o.text}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  function renderVisionLiveBlock() {
    return (
      <div className="mt-7 space-y-0">
        <div className={cn(meetingYourRegion, "space-y-3")}>
          <p className={meetingYourLabel}>
            Your response
            <span className="sr-only"> ({selfDisplayName()})</span>
          </p>
          <Textarea
            value={vision}
            onChange={(e) => setVision(e.target.value)}
            placeholder="Share your vision and multiplication…"
            rows={3}
            className={meetingTextareaClass("mt-1")}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-2"
            onClick={handleSaveLookback}
            disabled={saving}
          >
            {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Save Look Back
          </Button>
        </div>
        <div className={meetingLiveRegion}>
          <p className={meetingLiveLabel}>Group (live)</p>
          {othersVisionLive.length === 0 ? (
            <p className={meetingLiveEmpty}>No one else has shared yet.</p>
          ) : (
            <ul className="m-0 list-none space-y-0 p-0">
              {othersVisionLive.map((o) => (
                <li key={o.userId} className={meetingLiveRow}>
                  <p className={meetingLiveName}>{o.displayName}</p>
                  <p className={meetingLiveBody}>{o.text}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  function renderPriorFollowupLiveBlock() {
    return (
      <div className="mt-7 space-y-0">
        <div className={cn(meetingYourRegion, "space-y-4")}>
          <p className={meetingYourLabel}>
            Your follow-up
            <span className="sr-only"> ({selfDisplayName()})</span>
          </p>
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-medium text-[#5c6570]">
                Obedience follow-up
              </Label>
              <Textarea
                value={obedienceFollowup}
                onChange={(e) => setObedienceFollowup(e.target.value)}
                placeholder="How did you obey?"
                rows={2}
                className={meetingTextareaClass("mt-1.5")}
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-[#5c6570]">
                Sharing follow-up
              </Label>
              <Textarea
                value={sharingFollowup}
                onChange={(e) => setSharingFollowup(e.target.value)}
                placeholder="Did you share with who you intended?"
                rows={2}
                className={meetingTextareaClass("mt-1.5")}
              />
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-1"
            onClick={handleSaveFollowup}
            disabled={saving}
          >
            {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Save accountability
          </Button>
        </div>
        <div className={meetingLiveRegion}>
          <p className={meetingLiveLabel}>Group (live)</p>
          {othersPriorFollowupLive.length === 0 ? (
            <p className={meetingLiveEmpty}>No one else has shared yet.</p>
          ) : (
            <ul className="m-0 list-none space-y-0 p-0">
              {othersPriorFollowupLive.map((o) => (
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
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  async function handleSaveLookback() {
    setSaving(true);
    const r = await saveLookBackResponse(meetingId, {
      pastoralCareResponse: pastoral || undefined,
      accountabilityResponse: accountability || undefined,
      visionCastingResponse: vision || undefined,
    });
    setSaving(false);
    if (r.error) toast.error(r.error);
    else toast.success("Look Back responses saved");
  }

  async function handleSaveFollowup() {
    if (!priorCommitments) return;
    setSaving(true);
    const base = `Obey: ${priorCommitments.obedience}. Share: ${priorCommitments.sharing}`;
    const summary = priorCommitments.train?.trim()
      ? `${base}. Train: ${priorCommitments.train.trim()}.`
      : `${base}.`;
    const r = await savePriorObedienceFollowup(meetingId, {
      priorCommitmentSummary: summary,
      obedienceFollowupResponse: obedienceFollowup || undefined,
      sharingFollowupResponse: sharingFollowup || undefined,
    });
    setSaving(false);
    if (r.error) toast.error(r.error);
    else toast.success("Accountability follow-up saved");
  }

  function renderLegacyAccountability() {
    if (accountabilityCheckupLines.length > 0) {
      return (
        <div className="space-y-10">
          {renderAccountabilityChecklistCard({
            title: "Loving Accountability",
            intro:
              "Review what each person committed (obey · share · train). Check off what was followed through; anything left unchecked will show again next week.",
            showReflection: true,
            accountabilityPlaceholder: "Share how you're following through…",
          })}
        </div>
      );
    }

    return (
      <div className="space-y-10">
        {priorCommitments && (
          <div
            className={cn(
              "rounded-xl border border-[#d8d4d0] border-l-4 border-l-[#83b0da] bg-white",
              meetingSectionPadding
            )}
          >
            <h2 className="text-lg font-medium text-[#1c252e] flex items-center gap-2">
              <Scale className="size-5 text-[#83b0da]" />
              Loving Accountability
            </h2>
            <div className={cn(meetingReferenceBox, "text-muted-foreground")}>
              <p className="font-medium text-foreground/90 mb-2">
                Last week you committed:
              </p>
              <p className="text-muted-foreground">
                <strong>Obey:</strong> {priorCommitments.obedience}
              </p>
              <p className="text-muted-foreground mt-1">
                <strong>Share:</strong> {priorCommitments.sharing}
              </p>
              {priorCommitments.train?.trim() ? (
                <p className="text-muted-foreground mt-1">
                  <strong>Train:</strong> {priorCommitments.train}
                </p>
              ) : null}
            </div>
            <p className="text-sm text-muted-foreground">
              How did you obey? Did you follow through on sharing and training?
            </p>
            {renderAccountabilityLiveBlock(
              "Share how you followed through and how the group can encourage you…"
            )}
          </div>
        )}

        {!priorCommitments && (
          <div
            className={cn(
              "rounded-xl border border-[#d8d4d0] border-l-4 border-l-[#83b0da] bg-white",
              meetingSectionPadding
            )}
          >
            <h2 className="text-lg font-medium text-[#1c252e] flex items-center gap-2">
              <Scale className="size-5 text-[#83b0da]" />
              Loving Accountability
            </h2>
            <p className="text-sm text-muted-foreground">
              How did you obey last week&apos;s teaching? Did you follow through on your
              obedience commitment? Did you share with the person(s) you intended?
              How did you train or equip others?
            </p>
            {renderAccountabilityLiveBlock()}
          </div>
        )}
      </div>
    );
  }

  function renderStarterCheckUp() {
    if (!starterTrackLookBack) return null;

    if (starterTrackLookBack.checkUpMode === "week1_teaching") {
      return (
        <div
          className={cn(
            "rounded-xl border border-[#d8d4d0] border-l-4 border-l-[#83b0da] bg-white",
            meetingSectionPadding
          )}
        >
          <h2 className="text-lg font-medium text-[#1c252e] flex items-center gap-2">
            <Scale className="size-5 text-[#83b0da]" />
            Check-up
          </h2>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#1c252e] bg-white border border-[#d8d4d0] border-l-4 border-l-[#edb73e] rounded-md px-2 py-1.5 inline-block">
            First Starter Track meeting — use this instead of reviewing last week&apos;s
            commitments
          </p>
          <div>
            <p className="font-medium text-foreground">
              {WEEK1_ACCOUNTABILITY_TEACHING.title}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {WEEK1_ACCOUNTABILITY_TEACHING.lead}
            </p>
            <div className="mt-3 space-y-3 text-sm text-foreground/90 leading-relaxed">
              {WEEK1_ACCOUNTABILITY_TEACHING.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Scriptures: {WEEK1_ACCOUNTABILITY_TEACHING.scriptureRefs.join(" · ")}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Briefly share any reflections as you begin this rhythm of mutual care and
            accountability together.
          </p>
          {renderAccountabilityLiveBlock("Reflections for the group…")}
        </div>
      );
    }

    // prior_group_commitments
    if (accountabilityCheckupLines.length > 0) {
      return (
        <div className="space-y-10">
          {renderAccountabilityChecklistCard({
            title: "Check-up — accountability",
            intro:
              "From your previous meeting(s), review each person’s obey · share · train commitments. Check them off as you hear updates; unchecked items carry to next week.",
            showReflection: true,
            accountabilityPlaceholder: "Reflections for the group…",
          })}
        </div>
      );
    }

    return (
      <div className="space-y-10">
        <div
          className={cn(
            "rounded-xl border border-[#d8d4d0] border-l-4 border-l-[#83b0da] bg-white",
            meetingSectionPadding
          )}
        >
          <h2 className="text-lg font-medium text-[#1c252e] flex items-center gap-2">
            <Scale className="size-5 text-[#83b0da]" />
            Check-up — last week&apos;s commitments
          </h2>
          <p className="text-sm text-muted-foreground">
            From your previous Starter Track meeting, review what each person committed
            to (obey · share · train). Then follow up personally below.
          </p>
          <div className="overflow-hidden rounded-lg border border-[#e5e1dc]/80 divide-y divide-[#ebe9e6] bg-[#fafaf9]/50">
            {starterTrackLookBack.priorWeekByMember.map((m) => (
              <div key={m.userId} className="px-4 py-4 text-sm">
                <p className="font-semibold text-[#1c252e]">{m.displayName}</p>
                <p className="mt-2 text-muted-foreground leading-relaxed">
                  <span className="font-medium text-foreground/80">Obey:</span>{" "}
                  {m.obedience || "—"}
                </p>
                <p className="mt-1.5 text-muted-foreground leading-relaxed">
                  <span className="font-medium text-foreground/80">Share:</span>{" "}
                  {m.sharing || "—"}
                </p>
                <p className="mt-1.5 text-muted-foreground leading-relaxed">
                  <span className="font-medium text-foreground/80">Train:</span>{" "}
                  {m.train?.trim() || "—"}
                </p>
              </div>
            ))}
          </div>
        </div>

        {priorCommitments && (
          <div
            className={cn(
              "rounded-xl border border-[#d8d4d0] border-l-4 border-l-[#83b0da] bg-white",
              meetingSectionPadding
            )}
          >
            <h2 className="text-lg font-medium text-[#1c252e] flex items-center gap-2">
              <Scale className="size-5 text-[#83b0da]" />
              Your follow-up
            </h2>
            <div className={cn(meetingReferenceBox, "text-muted-foreground")}>
              <p className="font-medium text-foreground/90 mb-2">
                You committed last week:
              </p>
              <p className="text-muted-foreground">
                <strong>Obey:</strong> {priorCommitments.obedience}
              </p>
              <p className="text-muted-foreground mt-1">
                <strong>Share:</strong> {priorCommitments.sharing}
              </p>
              {priorCommitments.train?.trim() ? (
                <p className="text-muted-foreground mt-1">
                  <strong>Train:</strong> {priorCommitments.train}
                </p>
              ) : null}
            </div>
            <p className="text-sm text-muted-foreground">
              How did you obey? Did you follow through on sharing and training?
            </p>
            {renderPriorFollowupLiveBlock()}
          </div>
        )}

        {!priorCommitments && (
          <div
            className={cn(
              "rounded-xl border border-[#d8d4d0] border-l-4 border-l-[#83b0da] bg-white",
              meetingSectionPadding
            )}
          >
            <h2 className="text-lg font-medium text-[#1c252e] flex items-center gap-2">
              <Scale className="size-5 text-[#83b0da]" />
              Your check-up
            </h2>
            <p className="text-sm text-muted-foreground">
              You didn&apos;t have recorded commitments from last week&apos;s meeting. Share
              how you&apos;re walking with God and how the group can pray for you.
            </p>
            {renderAccountabilityLiveBlock("Share with the group…")}
          </div>
        )}
      </div>
    );
  }

  function renderVisionSection() {
    if (isStarter && starterTrackLookBack) {
      return (
        <div
          className={cn(
            "rounded-xl border border-[#d8d4d0] border-l-4 border-l-[#83b0da] bg-white",
            meetingSectionPadding
          )}
        >
          <h2 className="text-lg font-medium text-[#1c252e] flex items-center gap-2">
            <Target className="size-5 text-[#83b0da]" />
            Vision
          </h2>
          <p className="text-sm text-muted-foreground">
            <strong>Read together:</strong> each week in Look Back, read your group&apos;s
            vision statement out loud. It reminds you why you exist and keeps
            multiplication in view.
          </p>
          {starterTrackLookBack.groupVisionStatement ? (
            <div className="rounded-lg border border-[#d8d4d0]/90 border-l-4 border-l-[#83b0da] bg-[#fafaf9]/90 px-4 py-4 text-sm text-[#1c252e] leading-relaxed whitespace-pre-wrap">
              {starterTrackLookBack.groupVisionStatement}
            </div>
          ) : (
            <div className="rounded-lg border border-[#d8d4d0]/90 border-l-4 border-l-[#edb73e] bg-[#fafaf9]/90 px-4 py-4 text-sm text-[#1c252e]/90">
              <p>
                Your group hasn&apos;t saved a vision statement yet. Complete the vision
                step on the Starter Track hub so it can appear here each week.
              </p>
              {groupId && (
                <Link
                  href={`/app/groups/${groupId}/starter-track`}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-3 inline-flex")}
                >
                  Open Starter Track
                </Link>
              )}
            </div>
          )}
          <div className="border-t border-[#e8e4df] pt-6 space-y-2">
            <p className="text-sm font-semibold text-[#1c252e]">
              Personal vision (optional)
            </p>
            <p className="text-sm text-muted-foreground">
              How are you multiplying disciples? Any opportunities to start or multiply
              a group?
            </p>
          </div>
          {renderVisionLiveBlock()}
        </div>
      );
    }

    return (
      <div
        className={cn(
          "rounded-xl border border-[#d8d4d0] border-l-4 border-l-[#83b0da] bg-white",
          meetingSectionPadding
        )}
      >
        <h2 className="text-lg font-medium text-[#1c252e] flex items-center gap-2">
          <Target className="size-5 text-[#83b0da]" />
          Vision Casting
        </h2>
        <p className="text-sm text-muted-foreground">
          How are you multiplying disciples? Have you shared the gospel or your story this
          week? Are there opportunities to start or multiply a group?
        </p>
        {renderVisionLiveBlock()}
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div
        className={cn(
          "rounded-xl border border-[#d8d4d0] border-l-4 border-l-[#83b0da] bg-white",
          meetingSectionPadding
        )}
      >
        <h2 className="text-lg font-medium text-[#1c252e] flex items-center gap-2">
          <Heart className="size-5 text-[#8c191b]" />
          Pastoral Care
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          How are you doing? What do you need prayer for? How can the group care for you?
        </p>
        {renderPastoralCareLiveBlock()}
      </div>

      {isStarter ? renderStarterCheckUp() : renderLegacyAccountability()}

      {renderVisionSection()}

      {onGoToLookUp && (
        <div className="flex justify-start pt-2">
          <Button type="button" onClick={onGoToLookUp}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
