import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMeetingDetail } from "@/app/actions/meetings";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";

interface PageProps {
  params: Promise<{ groupId: string; meetingId: string }>;
}

export default async function MeetingSummaryPage({ params }: PageProps) {
  const { groupId, meetingId } = await params;
  const supabase = await createClient();
  if (!supabase) redirect("/setup");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const result = await getMeetingDetail(meetingId);
  if (result.error || !result.meeting) notFound();
  if (result.meeting.group_id !== groupId) notFound();

  const { data: summary } = await supabase
    .from("meeting_summaries")
    .select("summary_json, prayer_summary")
    .eq("meeting_id", meetingId)
    .single();

  const meeting = result.meeting;
  const passage =
    meeting.story_source_type === "preset_story" && meeting.preset_stories
      ? (meeting.preset_stories as { title: string; book: string; chapter: number; verse_start: number; verse_end: number })
      : meeting.book
        ? {
            title: `${meeting.book} ${meeting.chapter}:${meeting.verse_start}-${meeting.verse_end}`,
            book: meeting.book,
            chapter: meeting.chapter,
            verse_start: meeting.verse_start,
            verse_end: meeting.verse_end,
          }
        : null;

  const sj = summary?.summary_json as {
    passage?: { title: string };
    lookback?: { user: string; pastoralCare?: string; accountability?: string; visionCasting?: string }[];
    lookforward?: { user: string; obedience: string; sharing: string }[];
    prayer_summary?: string;
  } | null;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <Link
          href={`/app/groups/${groupId}/meetings/${meetingId}`}
          className="text-sm text-stone-600 dark:text-stone-400 hover:underline flex items-center gap-1"
        >
          <ArrowLeft className="size-4" />
          Back to meeting
        </Link>
      </div>

      <header>
        <h1 className="text-2xl font-serif font-light text-stone-800 dark:text-stone-200 flex items-center gap-2">
          <FileText className="size-5" />
          Meeting summary
        </h1>
        <p className="text-stone-600 dark:text-stone-400 mt-1">
          {meeting.title ||
            new Date(meeting.meeting_date).toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
        </p>
      </header>

      {!summary ? (
        <div className="rounded-xl border border-stone-200 dark:border-stone-800 p-8 text-center bg-stone-50/50 dark:bg-stone-900/30">
          <p className="text-stone-600 dark:text-stone-400 mb-4">
            No summary generated yet. Complete the meeting to generate a
            summary.
          </p>
          <Link href={`/app/groups/${groupId}/meetings/${meetingId}`}>
            <Button>Go to meeting</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {passage && (
            <section className="rounded-xl border border-stone-200 dark:border-stone-800 p-6">
              <h2 className="text-sm font-medium text-stone-500 dark:text-stone-400 mb-2">
                Passage
              </h2>
              <p className="font-medium text-stone-800 dark:text-stone-200">
                {passage.title}
              </p>
            </section>
          )}

          {sj?.lookback && sj.lookback.length > 0 && (
            <section className="rounded-xl border border-stone-200 dark:border-stone-800 p-6">
              <h2 className="text-sm font-medium text-stone-500 dark:text-stone-400 mb-4">
                Look Back
              </h2>
              <ul className="space-y-4">
                {sj.lookback.map((r, i) => (
                  <li key={i} className="border-l-2 border-stone-200 dark:border-stone-700 pl-4">
                    <p className="font-medium text-stone-800 dark:text-stone-200">
                      {r.user}
                    </p>
                    {r.pastoralCare && (
                      <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
                        {r.pastoralCare}
                      </p>
                    )}
                    {r.accountability && (
                      <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
                        Accountability: {r.accountability}
                      </p>
                    )}
                    {r.visionCasting && (
                      <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
                        Vision: {r.visionCasting}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {sj?.lookforward && sj.lookforward.length > 0 && (
            <section className="rounded-xl border border-stone-200 dark:border-stone-800 p-6">
              <h2 className="text-sm font-medium text-stone-500 dark:text-stone-400 mb-4">
                Look Forward — Commitments
              </h2>
              <ul className="space-y-4">
                {sj.lookforward.map((r, i) => (
                  <li key={i} className="border-l-2 border-amber-200 dark:border-amber-800 pl-4">
                    <p className="font-medium text-stone-800 dark:text-stone-200">
                      {r.user}
                    </p>
                    <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
                      Obedience: {r.obedience}
                    </p>
                    <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
                      Sharing: {r.sharing}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {summary.prayer_summary && (
            <section className="rounded-xl border border-stone-200 dark:border-stone-800 p-6 bg-rose-50/30 dark:bg-rose-900/10">
              <h2 className="text-sm font-medium text-stone-500 dark:text-stone-400 mb-4">
                Prayer
              </h2>
              <p className="text-stone-700 dark:text-stone-300 whitespace-pre-wrap">
                {summary.prayer_summary}
              </p>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
