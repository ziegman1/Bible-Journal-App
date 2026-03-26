import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getGroup } from "@/app/actions/groups";
import { getStarterTrackEnrollment } from "@/app/actions/group-starter-track";
import { StarterTrackIntroContent } from "@/components/groups/starter-track/starter-track-intro-content";
import { CompleteIntroButton } from "@/components/groups/starter-track/starter-track-hub-actions";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: Promise<{ groupId: string }>;
}

export default async function StarterTrackIntroPage({ params }: PageProps) {
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

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8 pb-16">
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
          Starter Track introduction
        </h1>
        <p className="text-sm text-stone-600 dark:text-stone-400 mt-2 max-w-2xl">
          Read this together as a group. When you are ready, continue to the vision step.
        </p>
      </header>

      <StarterTrackIntroContent />

      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
        {enrollment.intro_completed_at ? (
          <Link href={`/app/groups/${groupId}/starter-track/vision`}>
            <Button size="lg">
              {enrollment.vision_completed_at
                ? "Back to vision step"
                : "Continue to group vision"}
            </Button>
          </Link>
        ) : (
          <CompleteIntroButton groupId={groupId} />
        )}
        <Link href={`/app/groups/${groupId}/starter-track`}>
          <Button variant="outline" size="lg">
            Back to overview
          </Button>
        </Link>
      </div>
    </div>
  );
}
