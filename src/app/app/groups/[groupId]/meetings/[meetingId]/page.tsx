import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMeetingDetail } from "@/app/actions/meetings";
import { getChapter } from "@/lib/scripture/provider";
import { getBookIdFromName } from "@/lib/scripture/books";
import { LiveMeetingView } from "@/components/groups/live-meeting-view";

interface PageProps {
  params: Promise<{ groupId: string; meetingId: string }>;
}

export default async function MeetingPage({ params }: PageProps) {
  const { groupId, meetingId } = await params;
  const supabase = await createClient();
  if (!supabase) redirect("/setup");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

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
      ? (meeting.preset_stories as { book: string; chapter: number; verse_start: number; verse_end: number })
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

  return (
    <LiveMeetingView
      meeting={result.meeting}
      participants={result.participants ?? []}
      groupId={groupId}
      meetingId={meetingId}
      currentUserId={user.id}
      isAdmin={result.role === "admin"}
      priorCommitments={result.priorCommitments ?? null}
      lookback={result.lookback ?? []}
      lookforward={result.lookforward ?? []}
      observations={result.observations ?? []}
      retell={result.retell ?? null}
      practice={result.practice ?? []}
      priorFollowups={result.priorFollowups ?? []}
      passageVerses={passageVerses}
      passageRef={passage ? `${passage.book} ${passage.chapter}:${passage.verse_start}${passage.verse_start !== passage.verse_end ? `-${passage.verse_end}` : ""}` : null}
    />
  );
}
