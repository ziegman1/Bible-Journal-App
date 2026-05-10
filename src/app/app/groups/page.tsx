import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listGroupsForUser } from "@/app/actions/groups";
import { listGroupMeetings } from "@/app/actions/meetings";
import { GroupCard } from "@/components/groups/group-card";
import { GroupsHubPersonalJourneyCard } from "@/components/groups/groups-hub-personal-journey-card";
import { GroupsHubPageShell } from "@/components/groups/groups-hub-page-shell";
import { getIdentityStreakStats } from "@/app/actions/identity-streaks";
import { STREAK_LABELS } from "@/lib/app-experience-mode/dashboard-items";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { isBrandNewAccountForThirdsInstruction } from "@/lib/groups/groups-hub-instructional-policy";
import { normalizeAppExperienceMode } from "@/lib/app-experience-mode/model";

export default async function GroupsPage() {
  const supabase = await createClient();
  if (!supabase) redirect("/setup");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    pillarRow,
    groupTap,
    identityStats,
    lastFinalPersonal,
    inProgressPersonal,
    profileRow,
  ] = await Promise.all([
    supabase.from("pillar_week_streak_completions").select("id").eq("user_id", user.id).limit(1).maybeSingle(),
    supabase.from("thirds_personal_group_completions").select("id").eq("user_id", user.id).limit(1).maybeSingle(),
    getIdentityStreakStats().catch(() => [] as { label: string; value: string }[]),
    supabase
      .from("thirds_personal_weeks")
      .select("week_start_monday, finalized_at")
      .eq("user_id", user.id)
      .not("finalized_at", "is", null)
      .order("finalized_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("thirds_personal_weeks")
      .select("week_start_monday, updated_at")
      .eq("user_id", user.id)
      .is("finalized_at", null)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("profiles").select("app_experience_mode").eq("id", user.id).maybeSingle(),
  ]);

  const weeklyStreakLabel =
    identityStats.find((s) => s.label === STREAK_LABELS.thirdsWeekly)?.value ?? "—";

  const result = await listGroupsForUser({ groupKind: "thirds" });
  if (result.error) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <p className="text-amber-600 dark:text-amber-400">{result.error}</p>
      </div>
    );
  }

  const groups = result.groups ?? [];
  const groupsWithMeetings = await Promise.all(
    groups.map(async (g) => {
      const mResult = await listGroupMeetings(g.id);
      const meetings = mResult.meetings ?? [];
      const nextMeeting = meetings.find((m) => m.status === "draft" || m.status === "active");
      const lastMeeting = meetings.find((m) => m.status === "completed");
      return {
        ...g,
        meetings,
        nextMeeting: nextMeeting ?? null,
        lastMeeting: lastMeeting ?? null,
      };
    })
  );

  const hasCompletedGroupMeeting = groupsWithMeetings.some((g) =>
    g.meetings.some((m) => m.status === "completed")
  );
  const hasDbThirdsCompletion =
    Boolean(lastFinalPersonal.data) || Boolean(pillarRow.data) || Boolean(groupTap.data);
  const hasAnyThirdsCompletion = hasDbThirdsCompletion || hasCompletedGroupMeeting;

  const isBrandNewAccount = isBrandNewAccountForThirdsInstruction(user.created_at);
  const hasNoGroups = groups.length === 0;
  const isJourneyMode = normalizeAppExperienceMode(profileRow.data?.app_experience_mode) === "journey";

  /** Surface the learn sheet once on load for users who need orientation; skip for guided journey (journey hub is primary). */
  const initialLearnOpen =
    !isJourneyMode && (hasNoGroups || !hasAnyThirdsCompletion || isBrandNewAccount);

  const resumeTarget = groupsWithMeetings.find((g) => g.nextMeeting);
  const resumeHref = resumeTarget?.nextMeeting
    ? `/app/groups/${resumeTarget.id}/meetings/${resumeTarget.nextMeeting.id}`
    : null;

  const subtitle = (
    <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
      Your personal journey, groups, and weekly rhythm. Tap <span className="font-medium text-stone-700 dark:text-stone-300">Learn</span> or{" "}
      <span className="font-medium text-stone-700 dark:text-stone-300">What is 3/3rds?</span> anytime for a full primer.
    </p>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <GroupsHubPageShell resumeHref={resumeHref} initialLearnOpen={initialLearnOpen} subtitle={subtitle}>
        <GroupsHubPersonalJourneyCard
          weeklyStreakLabel={weeklyStreakLabel}
          lastFinalized={
            lastFinalPersonal.data
              ? {
                  week_start_monday: String(lastFinalPersonal.data.week_start_monday),
                  finalized_at: String(lastFinalPersonal.data.finalized_at),
                }
              : null
          }
          inProgressWeek={
            inProgressPersonal.data
              ? { week_start_monday: String(inProgressPersonal.data.week_start_monday) }
              : null
          }
        />

        {groupsWithMeetings.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-10 text-center sm:p-12">
            <p className="mb-4 text-stone-600 dark:text-stone-400">You are not in any 3/3rds groups yet.</p>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link href="/app/groups/new">
                <Button>
                  <Plus className="mr-2 size-4" />
                  Create your first group
                </Button>
              </Link>
              <Link href="/app/groups/personal-thirds">
                <Button variant="outline">Open personal journey</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {groupsWithMeetings.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                nextMeeting={group.nextMeeting}
                lastMeeting={group.lastMeeting}
              />
            ))}
          </div>
        )}

        {process.env.NEXT_PUBLIC_VERCEL_DEPLOYMENT_ID ? (
          <p
            className="border-t border-border pt-4 font-mono text-[10px] text-stone-400 dark:text-stone-500"
            title="If this list is empty on www.badwr.app but shows data on your *.vercel.app preview, the custom domain may point at a different Vercel project or deployment."
          >
            Deploy: {process.env.NEXT_PUBLIC_VERCEL_DEPLOYMENT_ID}
          </p>
        ) : null}
      </GroupsHubPageShell>
    </div>
  );
}
