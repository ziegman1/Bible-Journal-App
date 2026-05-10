import { JourneyToolGateLayout } from "@/components/journey/journey-tool-gate-layout";

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  return <JourneyToolGateLayout requirement="chat">{children}</JourneyToolGateLayout>;
}
