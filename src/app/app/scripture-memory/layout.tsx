import { JourneyToolGateLayout } from "@/components/journey/journey-tool-gate-layout";

export default async function ScriptureMemoryLayout({ children }: { children: React.ReactNode }) {
  return (
    <JourneyToolGateLayout requirement="scripture_memory">{children}</JourneyToolGateLayout>
  );
}
