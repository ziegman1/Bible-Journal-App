import { CommunityRingSection } from "@/components/dashboard/community-ring-section";
import { DailyPracticeSection } from "@/components/dashboard/daily-practice-section";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { IdentityCoreSection } from "@/components/dashboard/identity-core-section";
import { MultiplicationSection } from "@/components/dashboard/multiplication-section";
import { getSoapsHomeActionHref } from "@/app/actions/soaps-home-action";
import { listGroupsForUser } from "@/app/actions/groups";
import { getGrowthModePresentation, normalizeGrowthMode } from "@/lib/growth-mode/model";
import { createClient } from "@/lib/supabase/server";

/**
 * App home: dashboard shell (mock data). Previous “Scripture journey” home lived here;
 * restore from git history if you need that layout alongside this dashboard.
 */
export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  let displayName = "Reader";
  let soapsActionHref = "/app/read/matthew/1";
  let soapsActionLabel = "Start today's SOAPS";
  let primaryChatGroupId: string | null = null;
  let presentation = getGrowthModePresentation("focused");

  if (user && supabase) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, growth_mode")
      .eq("id", user.id)
      .maybeSingle();
    presentation = getGrowthModePresentation(normalizeGrowthMode(profile?.growth_mode));
    displayName =
      profile?.display_name?.trim() ||
      user.email?.split("@")[0]?.trim() ||
      displayName;

    const soaps = await getSoapsHomeActionHref();
    soapsActionHref = soaps.href;
    soapsActionLabel = soaps.label;

    const listResult = await listGroupsForUser({ groupKind: "chat" });
    const chatGroups = "groups" in listResult ? (listResult.groups ?? []) : [];
    const primaryChat = chatGroups[0];
    if (primaryChat) {
      primaryChatGroupId = primaryChat.id;
    }
  }

  return (
    <DashboardLayout
      header={<DashboardHeader />}
      identity={
        <IdentityCoreSection
          displayName={displayName}
          nextActionHref={soapsActionHref}
          nextActionLabel={soapsActionLabel}
          presentation={presentation}
        />
      }
      daily={
        <DailyPracticeSection
          primaryChatGroupId={primaryChatGroupId}
          presentation={presentation}
        />
      }
      community={<CommunityRingSection />}
      multiplication={<MultiplicationSection />}
    />
  );
}
