import { CommunityRingSection } from "@/components/dashboard/community-ring-section";
import { ContextInsightSection } from "@/components/dashboard/context-insight-section";
import { DailyPracticeSection } from "@/components/dashboard/daily-practice-section";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { GrowthJourneySection } from "@/components/dashboard/growth-journey-section";
import { IdentityCoreSection } from "@/components/dashboard/identity-core-section";
import { listGroupsForUser } from "@/app/actions/groups";
import { createClient } from "@/lib/supabase/server";
import { nextReadAfterChatSoapsComplete } from "@/lib/chat-soaps/next-read";

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
  const soapsActionLabel = "Start today's SOAPS";
  let primaryChatGroupId: string | null = null;

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

    const listResult = await listGroupsForUser({ groupKind: "chat" });
    const chatGroups = "groups" in listResult ? (listResult.groups ?? []) : [];
    const primaryChat = chatGroups[0];
    if (primaryChat) {
      primaryChatGroupId = primaryChat.id;
      const { data: progress } = await supabase
        .from("chat_soaps_reading_progress")
        .select("book_id, last_completed_chapter")
        .eq("user_id", user.id)
        .eq("group_id", primaryChat.id)
        .maybeSingle();

      const target = nextReadAfterChatSoapsComplete(
        progress?.book_id,
        progress?.last_completed_chapter
      );
      soapsActionHref = `/app/read/${target.bookId}/${target.chapter}?chatSoapsGroup=${encodeURIComponent(primaryChat.id)}`;
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
        />
      }
      daily={<DailyPracticeSection primaryChatGroupId={primaryChatGroupId} />}
      context={<ContextInsightSection />}
      community={<CommunityRingSection />}
      growth={<GrowthJourneySection />}
    />
  );
}
