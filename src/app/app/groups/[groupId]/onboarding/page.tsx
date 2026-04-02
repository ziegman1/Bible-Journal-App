import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getGroup, getStarterTrackPromptGateForGroup } from "@/app/actions/groups";
import { GroupOnboardingChoice } from "@/components/groups/group-onboarding-choice";

interface PageProps {
  params: Promise<{ groupId: string }>;
}

type GroupRow = {
  name: string;
  group_kind?: string | null;
};

export default async function GroupOnboardingPage({ params }: PageProps) {
  const { groupId } = await params;
  const supabase = await createClient();
  if (!supabase) redirect("/setup");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Gate first so we redirect without rendering the choice UI (avoids flicker).
  const gate = await getStarterTrackPromptGateForGroup(groupId);
  if ("error" in gate) {
    if (gate.error === "Not a member of this group") redirect("/app");
    notFound();
  }
  if (!gate.needsPrompt) {
    redirect(`/app/groups/${groupId}`);
  }

  const result = await getGroup(groupId);
  if (result.error || !result.group) {
    if (result.error === "Not a member of this group") redirect("/app");
    notFound();
  }

  const group = result.group as GroupRow;
  if ((group.group_kind ?? "thirds") === "chat") {
    redirect(`/app/chat/groups/${groupId}`);
  }

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          <Link
            href="/app/groups"
            className="text-sm text-stone-600 dark:text-stone-400 hover:underline"
          >
            3/3rds Groups
          </Link>
        </div>
        <GroupOnboardingChoice groupId={groupId} groupName={group.name} />
        <p className="text-center text-xs text-stone-500 dark:text-stone-400 max-w-xl mx-auto">
          This choice applies to the whole group. You can still invite more people from
          Members &amp; invites anytime.
        </p>
      </div>
    </div>
  );
}
