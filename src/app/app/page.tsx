import { CommunityRingSection } from "@/components/dashboard/community-ring-section";
import { ContextInsightSection } from "@/components/dashboard/context-insight-section";
import { DailyPracticeSection } from "@/components/dashboard/daily-practice-section";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { GrowthJourneySection } from "@/components/dashboard/growth-journey-section";
import { IdentityCoreSection } from "@/components/dashboard/identity-core-section";
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
  if (user && supabase) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle();
    displayName =
      profile?.display_name?.trim() ||
      user.email?.split("@")[0]?.trim() ||
      displayName;
  }

  return (
    <DashboardLayout
      header={<DashboardHeader />}
      identity={<IdentityCoreSection displayName={displayName} />}
      daily={<DailyPracticeSection />}
      context={<ContextInsightSection />}
      community={<CommunityRingSection />}
      growth={<GrowthJourneySection />}
    />
  );
}
