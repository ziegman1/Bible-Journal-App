import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStarterTrackPromptGateForGroup } from "@/app/actions/groups";
import { getMeetingDetail } from "@/app/actions/meetings";
import { getChapter } from "@/lib/scripture/provider";
import { getBookIdFromName } from "@/lib/scripture/books";
import { loadPresetStoryVerseLines } from "@/lib/groups/preset-story-passage";
import {
  buildPresetLookUpLoadCaption,
  countLoadedSegmentsFromLines,
  formatPresetPassageHeader,
  wrapChapterVersesAsLines,
  type PassageVerseLine,
  type PresetStoryPassageRow,
} from "@/lib/groups/preset-story-passage.shared";
import { LiveMeetingView } from "@/components/groups/live-meeting-view";
import { isBadwrAdminTestUser } from "@/lib/admin/badwr-admin-test-access";
import {
  effectiveGroupRoleForSandboxPreview,
  parseSandboxRoleQuery,
} from "@/lib/admin/admin-sandbox-third-constants";
import { isSandboxThirdsGroupRow } from "@/lib/groups/is-sandbox-thirds-group";

interface PageProps {
  params: Promise<{ groupId: string; meetingId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function MeetingPage({ params, searchParams }: PageProps) {
  const { groupId, meetingId } = await params;
  const sp = (await searchParams) ?? {};
  const supabase = await createClient();
  if (!supabase) redirect("/setup");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Run before getMeetingDetail so we redirect without loading the full meeting payload.
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

  const { data: gRow } = await supabase
    .from("groups")
    .select("group_kind, badwr_admin_sandbox")
    .eq("id", groupId)
    .maybeSingle();

  const isSandboxGroup = isSandboxThirdsGroupRow(gRow);
  const isAdminTester = isBadwrAdminTestUser(user);
  const sandboxRole = parseSandboxRoleQuery(sp.sandboxRole);
  const effectiveGroupRole = effectiveGroupRoleForSandboxPreview({
    dbRole: result.role === "admin" ? "admin" : "member",
    sandboxGroup: isSandboxGroup,
    isAdminTester,
    sandboxRole,
  });

  const sandboxDeepLinkQuery =
    isSandboxGroup && isAdminTester
      ? new URLSearchParams({
          testMode: "1",
          sandboxRole: sandboxRole === "participant" ? "participant" : "facilitator",
        }).toString()
      : null;

  const meeting = result.meeting;
  const presetRow =
    meeting.story_source_type === "preset_story" && meeting.preset_stories
      ? (meeting.preset_stories as PresetStoryPassageRow)
      : null;

  const manualPassage =
    !presetRow && meeting.book
      ? {
          book: meeting.book,
          chapter: meeting.chapter!,
          verse_start: meeting.verse_start!,
          verse_end: meeting.verse_end!,
        }
      : null;

  let passageVerses: PassageVerseLine[] = [];
  let passageLookUpCaption: string | null = null;
  if (presetRow) {
    passageVerses = await loadPresetStoryVerseLines(presetRow);
    passageLookUpCaption = buildPresetLookUpLoadCaption(presetRow, {
      loadedSegmentCount: countLoadedSegmentsFromLines(passageVerses),
    });
  } else if (manualPassage) {
    const bookId = getBookIdFromName(manualPassage.book);
    if (bookId) {
      const chapter = await getChapter(bookId, manualPassage.chapter);
      if (chapter) {
        const slice = chapter.verses.filter(
          (v) =>
            v.verse >= manualPassage.verse_start &&
            v.verse <= manualPassage.verse_end
        );
        passageVerses = wrapChapterVersesAsLines(
          manualPassage.book,
          manualPassage.chapter,
          slice
        );
      }
    }
  }

  const passageRef = presetRow
    ? formatPresetPassageHeader(presetRow)
    : manualPassage
      ? `${manualPassage.book} ${manualPassage.chapter}:${manualPassage.verse_start}${
          manualPassage.verse_start !== manualPassage.verse_end
            ? `-${manualPassage.verse_end}`
            : ""
        }`
      : null;

  return (
    <LiveMeetingView
      meeting={result.meeting}
      participants={result.participants ?? []}
      memberDisplayNames={result.memberDisplayNames ?? {}}
      groupMemberRole={effectiveGroupRole}
      groupId={groupId}
      meetingId={meetingId}
      currentUserId={user.id}
      priorCommitments={result.priorCommitments ?? null}
      starterTrackLookBack={result.starterTrackLookBack ?? null}
      lookback={result.lookback ?? []}
      lookforward={result.lookforward ?? []}
      passageObservations={result.observations ?? []}
      retell={result.retell ?? null}
      practice={result.practice ?? []}
      priorFollowups={result.priorFollowups ?? []}
      accountabilityCheckupLines={result.accountabilityCheckupLines ?? []}
      commitmentCheckoffs={result.commitmentCheckoffs ?? []}
      passageVerses={passageVerses}
      passageLookUpCaption={passageLookUpCaption}
      passageRef={passageRef}
      presenterStateRow={result.presenterState ?? null}
      starterTrackMeetingOrdinal={result.starterTrackMeetingOrdinal ?? null}
      groupKind={gRow?.group_kind ?? "thirds"}
      isSandboxThirdsGroup={isSandboxGroup}
      sandboxDeepLinkQuery={sandboxDeepLinkQuery}
    />
  );
}
