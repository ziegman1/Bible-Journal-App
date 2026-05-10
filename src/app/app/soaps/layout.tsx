import { JourneyToolGateLayout } from "@/components/journey/journey-tool-gate-layout";

export default async function SoapsLayout({ children }: { children: React.ReactNode }) {
  return <JourneyToolGateLayout requirement="soaps">{children}</JourneyToolGateLayout>;
}
