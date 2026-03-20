import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getGroup } from "@/app/actions/groups";
import { getStarterTrackEnrollment } from "@/app/actions/group-starter-track";
import { StarterTrackVisionForm } from "@/components/groups/starter-track/starter-track-vision-form";

interface PageProps {
  params: Promise<{ groupId: string }>;
}

export default async function StarterTrackVisionPage({ params }: PageProps) {
  const { groupId } = await params;
  const supabase = await createClient();
  if (!supabase) redirect("/setup");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const groupResult = await getGroup(groupId);
  if (groupResult.error || !groupResult.group) {
    if (groupResult.error === "Not a member of this group") redirect("/app/groups");
    notFound();
  }

  const { enrollment } = await getStarterTrackEnrollment(groupId);
  if (!enrollment) {
    redirect(`/app/groups/${groupId}/starter-track`);
  }
  if (!enrollment.intro_completed_at) {
    redirect(`/app/groups/${groupId}/starter-track/intro`);
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      <div>
        <Link
          href={`/app/groups/${groupId}/starter-track`}
          className="text-sm text-stone-600 dark:text-stone-400 hover:underline"
        >
          Back to Starter Track
        </Link>
      </div>

      <header>
        <h1 className="text-2xl font-serif font-light text-stone-800 dark:text-stone-200">
          Group vision statement
        </h1>
        <p className="text-stone-600 dark:text-stone-400 text-sm mt-2">
          Before beginning the Starter Track, take time to develop a group vision statement
          rooted in Jesus&apos; heart for multiplying disciples. Use the suggested passages to
          help your group align your vision with the Lord&apos;s vision for the nations.
        </p>
      </header>

      <StarterTrackVisionForm
        groupId={groupId}
        initialStatement={enrollment.vision_statement}
      />

      <Link
        href={`/app/groups/${groupId}/starter-track`}
        className="text-sm text-stone-600 dark:text-stone-400 hover:underline inline-block"
      >
        Back to Starter Track overview
      </Link>
    </div>
  );
}
