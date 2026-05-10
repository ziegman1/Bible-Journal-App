import { JourneyToolGateLayout } from "@/components/journey/journey-tool-gate-layout";

export default async function GroupsLayout({ children }: { children: React.ReactNode }) {
  return <JourneyToolGateLayout requirement="thirds">{children}</JourneyToolGateLayout>;
}
