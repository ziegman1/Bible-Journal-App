import { JourneyToolGateLayout } from "@/components/journey/journey-tool-gate-layout";

export default async function PrayerLayout({ children }: { children: React.ReactNode }) {
  return <JourneyToolGateLayout requirement="prayer">{children}</JourneyToolGateLayout>;
}
