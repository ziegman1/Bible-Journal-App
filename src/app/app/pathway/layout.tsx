import { assertGuidedJourneyNotBlockedPath } from "@/lib/app-experience-mode/journey-access.server";

export default async function PathwayLayout({ children }: { children: React.ReactNode }) {
  await assertGuidedJourneyNotBlockedPath("/app/pathway");
  return <>{children}</>;
}
