import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getStarterTrackPromptGateForGroup } from "@/app/actions/groups";
import { getMeetingDetail } from "@/app/actions/meetings";
import { Button } from "@/components/ui/button";
import { CompleteThirdsStreakButton } from "@/components/groups/complete-thirds-streak-button";
import { GenerateMeetingSummaryButton } from "@/components/groups/meeting-summary-generate-button";
import { MarkMeetingCompleteButton } from "@/components/groups/mark-meeting-complete-button";
import { ArrowLeft, FileText } from "lucide-react";
import {
  lookbackItemsFromRows,
  lookforwardItemsFromRows,
  observationsForSummaryFromRows,
} from "@/lib/groups/meeting-summary-from-responses";

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

  // Same prompt gate as live / present (getStarterTrackPromptGateForGroup → groupNeedsStarterTrackPrompt).
  const gate = await getStarterTrackPromptGateForGroup(groupId);
  if ("error" in gate) {
    if (gate.error === "Not a member of this group") redirect("/app/groups");
    notFound();
  }
  if (gate.needsPrompt) {
    redirect(`/app/groups/${groupId}/onboarding`);
  }

  const result = await getMeetingDetail(meetingId);
  if (result.error || !result.meeting) notFound();
  if (result.meeting.group_id !== groupId) notFound();

  const { data: summary } = await supabase
    .from("meeting_summaries")
    .select("meeting_id")
    .eq("meeting_id", meetingId)
    .maybeSingle();

  const meeting = result.meeting;

  const { data: gRow } = await supabase
    .from("groups")
    .select("group_kind")
    .eq("id", groupId)
    .maybeSingle();
  const groupKind = gRow?.group_kind ?? "thirds";
  const showThirdsStreakCta =
    groupKind === "thirds" && meeting.status === "completed";

  /** Full group roster from getMeetingDetail (normalized ids + RLS-safe names). */
  const nameCtx = {
    memberDisplayNames: result.memberDisplayNames ?? {},
    participants: result.participants ?? [],
  };

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

  let lookbackForDisplay: ReturnType<typeof lookbackItemsFromRows> = [];
  let lookUpObservations: ReturnType<typeof observationsForSummaryFromRows> =
    [];
  let lookforwardForDisplay: ReturnType<typeof lookforwardItemsFromRows> = [];

  if (summary) {
    const [
      { data: lookbackRows },
      { data: lookforwardRows },
      { data: observationRows },
    ] = await Promise.all([
      supabase.from("lookback_responses").select("*").eq("meeting_id", meetingId),
      supabase.from("lookforward_responses").select("*").eq("meeting_id", meetingId),
      supabase.from("passage_observations").select("*").eq("meeting_id", meetingId),
    ]);

    lookbackForDisplay = lookbackItemsFromRows(lookbackRows ?? [], nameCtx);
    lookUpObservations = observationsForSummaryFromRows(
      observationRows ?? [],
      nameCtx
    );
    lookforwardForDisplay = lookforwardItemsFromRows(
      lookforwardRows ?? [],
      nameCtx
    );
  }

  /** Canvas from global --background; cards stay white + gray borders */
  const shellClass = "min-h-full pb-10";
  const innerClass = "mx-auto max-w-2xl space-y-8 px-4 py-6 sm:px-6";
  const navLinkClass =
    "text-sm text-muted-foreground hover:text-foreground hover:underline";
  const cardBase =
    "rounded-xl border border-border bg-card p-6 shadow-sm sm:p-7";

  return (
    <div className={shellClass}>
      <div className={innerClass}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link
            href={`/app/groups/${groupId}/meetings/${meetingId}`}
            className={`${navLinkClass} flex items-center gap-1`}
          >
            <ArrowLeft className="size-4 shrink-0" />
            Back to meeting
          </Link>
          <Link href={`/app/groups/${groupId}`} className={navLinkClass}>
            Group workspace
          </Link>
          <Link href={`/app/groups/${groupId}/meetings`} className={navLinkClass}>
            All meetings
          </Link>
        </div>
      </div>

      <header>
        <h1 className="flex items-center gap-2 font-serif text-2xl font-light text-foreground">
          <FileText className="size-5 text-muted-foreground" />
          Meeting summary
        </h1>
        <p className="mt-1 text-muted-foreground">
          {meeting.title ||
            new Date(meeting.meeting_date).toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
        </p>
        {showThirdsStreakCta ? (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
            <p className="text-sm text-foreground">
              Tap when you’ve finished this 3/3rds meeting—this records your weekly streak (one per
              pillar week).
            </p>
            <CompleteThirdsStreakButton meetingId={meetingId} groupId={groupId} />
          </div>
        ) : null}
      </header>

      {!summary ? (
        <div className={`${cardBase} p-8 text-center space-y-4`}>
          <p className="text-muted-foreground">
            No summary yet. Generate one from the responses saved in this meeting
            (Look Back, Look Forward, etc.).
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <GenerateMeetingSummaryButton meetingId={meetingId} />
            <Link href={`/app/groups/${groupId}/meetings/${meetingId}`}>
              <Button variant="outline">Back to meeting</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {passage && (
            <section
              className={`${cardBase} border-l-4 border-l-[#1c252e]`}
            >
              <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Passage
              </h2>
              <p className="font-medium text-foreground">
                {passage.title}
              </p>
            </section>
          )}

          {lookbackForDisplay.length > 0 && (
            <section
              className={`${cardBase} border-l-4 border-l-[#83b0da]`}
            >
              <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Look Back
              </h2>
              <p className="mb-4 text-xs text-muted-foreground">
                Check-in, accountability, vision, and pastoral care / prayer
                needs from Look Back.
              </p>
              <ul className="space-y-4">
                {lookbackForDisplay.map((r, i) => {
                  const acc = r.accountability && String(r.accountability).trim();
                  const vis =
                    r.visionCasting && String(r.visionCasting).trim();
                  const pastoral =
                    r.pastoralCare && String(r.pastoralCare).trim();

                  return (
                    <li key={i} className="border-l-2 border-border pl-4">
                      <p className="font-medium text-foreground">{r.user}</p>
                      {pastoral ? (
                        <p className="mt-1 text-sm text-muted-foreground">
                          <span className="font-medium text-foreground/80">
                            Pastoral care & prayer:{" "}
                          </span>
                          <span className="whitespace-pre-wrap">{pastoral}</span>
                        </p>
                      ) : null}
                      {acc ? (
                        <p className="mt-1 text-sm text-muted-foreground">
                          Accountability / check-in:{" "}
                          <span className="whitespace-pre-wrap">{r.accountability}</span>
                        </p>
                      ) : null}
                      {vis ? (
                        <p className="mt-1 text-sm text-muted-foreground">
                          Vision:{" "}
                          <span className="whitespace-pre-wrap">{r.visionCasting}</span>
                        </p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {lookUpObservations.length > 0 && (
            <section
              className={`${cardBase} border-l-4 border-l-[#1c252e]`}
            >
              <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Look Up
              </h2>
              <ul className="space-y-4">
                {lookUpObservations.map((o, i) => (
                  <li
                    key={i}
                    className="space-y-1 border-l-2 border-border pl-4"
                  >
                    <p className="font-medium text-foreground">{o.user}</p>
                    <p className="text-xs font-medium text-muted-foreground">
                      {o.typeLabel}
                    </p>
                    {o.verseRef ? (
                      <p className="text-xs font-semibold text-[#83b0da]">
                        {o.verseRef}
                      </p>
                    ) : null}
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                      {o.note}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {lookforwardForDisplay.length > 0 && (
            <section
              className={`${cardBase} border-l-4 border-l-[#edb73e]`}
            >
              <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Look Forward — Commitments
              </h2>
              <ul className="space-y-4">
                {lookforwardForDisplay.map((r, i) => (
                  <li
                    key={i}
                    className="border-l-2 border-[#edb73e]/50 pl-4"
                  >
                    <p className="font-medium text-foreground">{r.user}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Obey: {r.obedience ?? "—"}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Share: {r.sharing ?? "—"}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Train: {r.train?.trim() || "—"}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      <section
        className={`${cardBase} mt-8 border-dashed border-border/80 bg-muted/20`}
        aria-label="Meeting completion"
      >
        <MarkMeetingCompleteButton
          meetingId={meetingId}
          groupId={groupId}
          initialStatus={
            meeting.status === "completed"
              ? "completed"
              : meeting.status === "draft"
                ? "draft"
                : "active"
          }
        />
      </section>
      </div>
    </div>
  );
}
