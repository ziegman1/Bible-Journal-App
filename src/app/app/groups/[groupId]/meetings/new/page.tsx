import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getGroup, getGroupMembers } from "@/app/actions/groups";
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

  return (
    <div className="p-6 max-w-xl mx-auto space-y-8">
      <div>
        <Link
          href={`/app/groups/${groupId}/meetings`}
          className="text-sm text-stone-600 dark:text-stone-400 hover:underline"
        >
          ← Back to meetings
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-serif font-light text-stone-800 dark:text-stone-200">
          Start new meeting
        </h1>
        <p className="text-stone-600 dark:text-stone-400 text-sm mt-1">
          Choose a passage or preset story for this 3/3rds meeting.
        </p>
      </div>

      <MeetingSetupForm groupId={groupId} members={members} />
    </div>
  );
}
