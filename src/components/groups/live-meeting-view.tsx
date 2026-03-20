"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  updateMeetingStatus,
  saveLookBackResponse,
  savePriorObedienceFollowup,
  savePassageObservation,
  saveLookForwardResponse,
  assignStoryReteller,
  assignPracticeActivity,
  generateMeetingSummary,
} from "@/app/actions/meetings";
import { ThreeThirdsStepper } from "@/components/groups/three-thirds-stepper";
import { LookBackSection } from "@/components/groups/look-back-section";
import { LookUpSection } from "@/components/groups/look-up-section";
import { LookForwardSection } from "@/components/groups/look-forward-section";
import { StarterTrackMeetingBanner } from "@/components/groups/starter-track/starter-track-meeting-banner";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, CheckCircle, FileText } from "lucide-react";
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
  preset_stories?: { title: string; book: string; chapter: number; verse_start: number; verse_end: number } | null;
  starter_track_week?: number | null;
}

interface Participant {
  user_id: string;
  display_name: string;
}

interface LiveMeetingViewProps {
  meeting: Meeting;
  participants: Participant[];
  groupId: string;
  meetingId: string;
  currentUserId: string;
  priorCommitments: { obedience: string; sharing: string } | null;
  lookback: Record<string, unknown>[];
  lookforward: Record<string, unknown>[];
  observations: Record<string, unknown>[];
  retell: { assigned_user_id: string } | null;
  practice: Record<string, unknown>[];
  priorFollowups: Record<string, unknown>[];
  passageVerses: { verse: number; text: string }[];
  passageRef: string | null;
}

export function LiveMeetingView({
  meeting,
  participants,
  groupId,
  meetingId,
  currentUserId,
  priorCommitments,
  lookback,
  lookforward,
  observations,
  retell,
  practice,
  priorFollowups,
  passageVerses,
  passageRef,
}: LiveMeetingViewProps) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<1 | 2 | 3>(1);
  const [status, setStatus] = useState(meeting.status);

  const myLookback = lookback.find((r) => r.user_id === currentUserId) as {
    pastoral_care_response?: string;
    accountability_response?: string;
    vision_casting_response?: string;
  } | undefined;

  const myLookforward = lookforward.find((r) => r.user_id === currentUserId) as {
    obedience_statement?: string;
    sharing_commitment?: string;
  } | undefined;

  const myPriorFollowup = priorFollowups.find((r) => r.user_id === currentUserId);

  async function handleStartMeeting() {
    const r = await updateMeetingStatus(meetingId, "active");
    if (r.error) toast.error(r.error);
    else {
      setStatus("active");
      toast.success("Meeting started — work through Look Back, Look Up, then Look Forward.");
      router.refresh();
    }
  }

  async function handleCompleteMeeting() {
    const r = await updateMeetingStatus(meetingId, "completed");
    if (r.error) toast.error(r.error);
    else {
      setStatus("completed");
      const sum = await generateMeetingSummary(meetingId);
      if (sum.error) toast.error(sum.error);
      else
        toast.success(
          "Meeting ended — summary saved. You can review it from this group’s meetings."
        );
      router.refresh();
    }
  }

  const facilitator = participants.find((p) => p.user_id === meeting.facilitator_user_id);
  const retellerUser = retell
    ? participants.find((p) => p.user_id === retell.assigned_user_id)
    : null;

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      <header className="sticky top-0 z-20 border-b border-stone-200 dark:border-stone-800 bg-background/95 backdrop-blur px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <Link
            href={`/app/groups/${groupId}`}
            className="text-sm text-stone-600 dark:text-stone-400 hover:underline flex items-center gap-1 min-w-0 shrink"
          >
            <ArrowLeft className="size-4 shrink-0" />
            <span className="truncate">Group</span>
          </Link>
          <div className="flex-1 min-w-0 text-center">
            <h1 className="font-serif text-lg text-stone-800 dark:text-stone-200 truncate">
              {meeting.title ||
                new Date(meeting.meeting_date).toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
            </h1>
            {passageRef && (
              <p className="text-sm text-stone-500 dark:text-stone-400 truncate">
                {passageRef}
              </p>
            )}
          </div>
          <div className="w-20" />
        </div>
        <div className="max-w-3xl mx-auto mt-3 flex items-center justify-between">
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              status === "completed"
                ? "bg-stone-200 dark:bg-stone-700"
                : status === "active"
                  ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                  : "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200"
            }`}
          >
            {status === "completed"
              ? "Completed"
              : status === "active"
                ? "In progress"
                : "Draft"}
          </span>
          {status === "draft" && (
            <Button size="sm" onClick={handleStartMeeting}>
              <Play className="size-4 mr-1" />
              Start meeting
            </Button>
          )}
          {status === "active" && (
            <Button size="sm" onClick={handleCompleteMeeting}>
              <CheckCircle className="size-4 mr-1" />
              End meeting
            </Button>
          )}
          {status === "completed" && (
            <Link href={`/app/groups/${groupId}/meetings/${meetingId}/summary`}>
              <Button size="sm" variant="outline">
                <FileText className="size-4 mr-1" />
                Summary
              </Button>
            </Link>
          )}
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <ThreeThirdsStepper
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />

        {meeting.starter_track_week != null && (
          <StarterTrackMeetingBanner
            groupId={groupId}
            starterTrackWeek={meeting.starter_track_week}
          />
        )}

        {status === "draft" && (
          <p className="text-sm text-stone-600 dark:text-stone-400 text-center mb-6 -mt-2 max-w-lg mx-auto">
            When everyone is here, tap <strong>Start meeting</strong> above.
            You can still fill in sections beforehand if you like.
          </p>
        )}
        {status === "active" && (
          <p className="text-sm text-stone-600 dark:text-stone-400 text-center mb-6 -mt-2 max-w-lg mx-auto">
            Use the three steps in order with your group. Tap{" "}
            <strong>End meeting</strong> when you’re finished to save a summary.
          </p>
        )}
        {status === "completed" && (
          <p className="text-sm text-stone-600 dark:text-stone-400 text-center mb-6 -mt-2 max-w-lg mx-auto">
            This meeting is finished. Open the{" "}
            <Link
              href={`/app/groups/${groupId}/meetings/${meetingId}/summary`}
              className="text-amber-800 dark:text-amber-200 underline underline-offset-2"
            >
              summary
            </Link>{" "}
            or return to your{" "}
            <Link
              href={`/app/groups/${groupId}`}
              className="text-amber-800 dark:text-amber-200 underline underline-offset-2"
            >
              group workspace
            </Link>
            .
          </p>
        )}

        {activeSection === 1 && (
          <LookBackSection
            meetingId={meetingId}
            priorCommitments={priorCommitments}
            myLookback={myLookback}
            myPriorFollowup={myPriorFollowup}
            priorFollowups={priorFollowups}
            participants={participants}
            displayNames={Object.fromEntries(
              participants.map((p) => [p.user_id, p.display_name])
            )}
          />
        )}

        {activeSection === 2 && (
          <LookUpSection
            meetingId={meetingId}
            passageVerses={passageVerses}
            passageRef={passageRef}
            facilitator={facilitator?.display_name}
            reteller={retellerUser?.display_name}
            participants={participants}
            observations={observations}
            currentUserId={currentUserId}
            book={meeting.book ?? (meeting.preset_stories as { book: string } | null)?.book ?? ""}
            chapter={meeting.chapter ?? (meeting.preset_stories as { chapter: number } | null)?.chapter ?? 0}
          />
        )}

        {activeSection === 3 && (
          <LookForwardSection
            meetingId={meetingId}
            myLookforward={myLookforward}
            participants={participants}
            practice={practice}
            currentUserId={currentUserId}
          />
        )}
      </div>
    </div>
  );
}
