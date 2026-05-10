import { assertGuidedJourneyNotBlockedPath } from "@/lib/app-experience-mode/journey-access.server";

export default async function ProcessMapLayout({ children }: { children: React.ReactNode }) {
  await assertGuidedJourneyNotBlockedPath("/app/process-map");
  return <>{children}</>;
}
