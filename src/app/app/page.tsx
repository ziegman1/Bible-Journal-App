import { CommunityRingSection } from "@/components/dashboard/community-ring-section";
import { ContextInsightSection } from "@/components/dashboard/context-insight-section";
import { DailyPracticeSection } from "@/components/dashboard/daily-practice-section";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { GrowthJourneySection } from "@/components/dashboard/growth-journey-section";
import { IdentityCoreSection } from "@/components/dashboard/identity-core-section";

/**
 * App home: dashboard shell (mock data). Previous “Scripture journey” home lived here;
 * restore from git history if you need that layout alongside this dashboard.
 */
export default function DashboardPage() {
  return (
    <DashboardLayout
      header={<DashboardHeader />}
      identity={<IdentityCoreSection />}
      daily={<DailyPracticeSection />}
      context={<ContextInsightSection />}
      community={<CommunityRingSection />}
      growth={<GrowthJourneySection />}
    />
  );
}
