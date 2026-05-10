import { JourneyToolGateLayout } from "@/components/journey/journey-tool-gate-layout";

export default async function ShareLayout({ children }: { children: React.ReactNode }) {
  return <JourneyToolGateLayout requirement="share">{children}</JourneyToolGateLayout>;
}
