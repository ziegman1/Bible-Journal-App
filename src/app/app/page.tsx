import { CommunityRingSection } from "@/components/dashboard/community-ring-section";
import { CustomDashboardHome } from "@/components/dashboard/custom-dashboard-home";
import { DailyPracticeSection } from "@/components/dashboard/daily-practice-section";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { IdentityCoreSection } from "@/components/dashboard/identity-core-section";
import { MultiplicationSection } from "@/components/dashboard/multiplication-section";
import { getSoapsHomeActionHref } from "@/app/actions/soaps-home-action";
import { listGroupsForUser } from "@/app/actions/groups";
import { getGrowthModePresentation, normalizeGrowthMode } from "@/lib/growth-mode/model";
import { createClient } from "@/lib/supabase/server";
import { normalizeAppExperienceMode } from "@/lib/app-experience-mode/model";
import { resolveCustomDashboardItemIds } from "@/lib/app-experience-mode/dashboard-items";
import { redirect } from "next/navigation";

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
  let experienceMode = null as ReturnType<typeof normalizeAppExperienceMode>;
  let customItemIds = null as ReturnType<typeof resolveCustomDashboardItemIds> | null;

  if (user && supabase) {
    const { data: profile } = await supabase
      .from("profiles")
      .select(
        "display_name, growth_mode, app_experience_mode, custom_dashboard_items, custom_dashboard_modules"
      )
      .eq("id", user.id)
      .maybeSingle();
    presentation = getGrowthModePresentation(normalizeGrowthMode(profile?.growth_mode));
    experienceMode = normalizeAppExperienceMode(profile?.app_experience_mode);
    customItemIds = resolveCustomDashboardItemIds(
      experienceMode,
      profile?.custom_dashboard_items,
      profile?.custom_dashboard_modules
    );
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

    if (experienceMode === "custom" && customItemIds.length === 0) {
      redirect("/app/dashboard-setup");
    }
  }

  if (experienceMode === "custom" && customItemIds && customItemIds.length > 0) {
    return (
      <CustomDashboardHome
        itemIds={customItemIds}
        displayName={displayName}
        soapsActionHref={soapsActionHref}
        soapsActionLabel={soapsActionLabel}
        primaryChatGroupId={primaryChatGroupId}
        presentation={presentation}
      />
    );
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
