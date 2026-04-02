import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  getGroup,
  getGroupMembers,
  getStarterTrackPromptGateForGroup,
} from "@/app/actions/groups";
import { MeetingSetupForm } from "@/components/groups/meeting-setup-form";

interface PageProps {
  params: Promise<{ groupId: string }>;
}

export default async function NewMeetingPage({ params }: PageProps) {
  const { groupId } = await params;
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

  const groupResult = await getGroup(groupId);
  if (groupResult.error || !groupResult.group) {
    if (groupResult.error === "Not a member of this group")
      redirect("/app/groups");
    notFound();
  }

  const membersResult = await getGroupMembers(groupId);
  const members = membersResult.members ?? [];

  if (members.length < 2) {
    redirect(`/app/groups/${groupId}/members?needMembers=1`);
  }

  const onboardingPath = (
    groupResult.group as { onboarding_path?: string | null }
  ).onboarding_path;

  return (
    <div className="p-6 max-w-xl mx-auto space-y-8">
      <div>
        <Link
          href={`/app/groups/${groupId}`}
          className="text-sm text-stone-600 dark:text-stone-400 hover:underline"
        >
          ← Back to {groupResult.group.name}
        </Link>
        <span className="text-stone-400 dark:text-stone-600 mx-2">·</span>
        <Link
          href={`/app/groups/${groupId}/meetings`}
          className="text-sm text-stone-600 dark:text-stone-400 hover:underline"
        >
          All meetings
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-serif font-light text-stone-800 dark:text-stone-200">
          Start a new meeting
        </h1>
        <p className="text-stone-600 dark:text-stone-400 text-sm mt-1">
          Choose a passage or preset story. We&apos;ll open a <strong>draft</strong>{" "}
          meeting you can use with your group in the meeting room.
        </p>
        {onboardingPath === "experienced" && (
          <p className="text-sm text-stone-700 dark:text-stone-300 mt-3 rounded-lg border border-border bg-muted px-3 py-2">
            Your group chose to use <strong>story sets</strong> (preset series like Foundations,
            Gospel, Mission) and custom passages—pick any option below.
          </p>
        )}
      </div>

      <MeetingSetupForm groupId={groupId} members={members} />
    </div>
  );
}
