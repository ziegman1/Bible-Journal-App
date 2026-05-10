import { assertGuidedJourneyNotBlockedPath } from "@/lib/app-experience-mode/journey-access.server";

export default async function GrowthLayout({ children }: { children: React.ReactNode }) {
  await assertGuidedJourneyNotBlockedPath("/app/growth");
  return <>{children}</>;
}
