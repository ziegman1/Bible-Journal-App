import { assertGuidedJourneyNotBlockedPath } from "@/lib/app-experience-mode/journey-access.server";

export default async function DashboardSetupLayout({ children }: { children: React.ReactNode }) {
  await assertGuidedJourneyNotBlockedPath("/app/dashboard-setup");
  return <>{children}</>;
}
