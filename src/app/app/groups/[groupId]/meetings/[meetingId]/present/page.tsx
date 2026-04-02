import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStarterTrackPromptGateForGroup } from "@/app/actions/groups";
import { getMeetingDetail } from "@/app/actions/meetings";
import { getChapter } from "@/lib/scripture/provider";
import { getBookIdFromName } from "@/lib/scripture/books";
import { FacilitatorMeetingView } from "@/components/groups/facilitator-meeting-view";

interface PageProps {
  params: Promise<{ groupId: string; meetingId: string }>;
}

export default async function FacilitatorPresentPage({ params }: PageProps) {
  const { groupId, meetingId } = await params;
  const supabase = await createClient();
  if (!supabase) redirect("/setup");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const gate = await getStarterTrackPromptGateForGroup(groupId);
  if ("error" in gate) {
    if (gate.error === "Not a member of this group") redirect("/app/groups");
    notFound();
  }
  if (gate.needsPrompt) {
    redirect(`/app/groups/${groupId}/onboarding`);
  }

  const result = await getMeetingDetail(meetingId);
  if (result.error || !result.meeting) {
    notFound();
  }

  if (result.meeting.group_id !== groupId) {
    notFound();
  }

  const meeting = result.meeting;
  const passage =
    meeting.story_source_type === "preset_story" && meeting.preset_stories
      ? (meeting.preset_stories as {
          book: string;
          chapter: number;
          verse_start: number;
          verse_end: number;
        })
      : meeting.book
        ? {
            book: meeting.book,
            chapter: meeting.chapter!,
            verse_start: meeting.verse_start!,
            verse_end: meeting.verse_end!,
          }
        : null;

  let passageVerses: { verse: number; text: string }[] = [];
  if (passage) {
    const bookId = getBookIdFromName(passage.book);
    if (bookId) {
      const chapter = await getChapter(bookId, passage.chapter);
      if (chapter) {
        passageVerses = chapter.verses.filter(
          (v) =>
            v.verse >= passage.verse_start && v.verse <= passage.verse_end
        );
      }
    }
  }

  const passageRef = passage
    ? `${passage.book} ${passage.chapter}:${passage.verse_start}${
        passage.verse_start !== passage.verse_end
          ? `-${passage.verse_end}`
          : ""
      }`
    : null;

  return (
    <FacilitatorMeetingView
      meeting={result.meeting}
      participants={result.participants ?? []}
      memberDisplayNames={result.memberDisplayNames ?? {}}
      currentUserId={user.id}
      groupMemberRole={
        result.role === "admin" || result.role === "member"
          ? result.role
          : "member"
      }
      groupId={groupId}
      meetingId={meetingId}
      priorCommitments={result.priorCommitments ?? null}
      starterTrackLookBack={result.starterTrackLookBack ?? null}
      accountabilityCheckupLines={result.accountabilityCheckupLines ?? []}
      commitmentCheckoffs={result.commitmentCheckoffs ?? []}
      retell={result.retell ?? null}
      practice={result.practice ?? []}
      passageVerses={passageVerses}
      passageRef={passageRef}
      presenterStateRow={result.presenterState ?? null}
      starterTrackMeetingOrdinal={result.starterTrackMeetingOrdinal ?? null}
    />
  );
}
