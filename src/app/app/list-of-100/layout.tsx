import { JourneyToolGateLayout } from "@/components/journey/journey-tool-gate-layout";

export default async function ListOf100Layout({ children }: { children: React.ReactNode }) {
  return (
    <JourneyToolGateLayout requirement="list_of_100">{children}</JourneyToolGateLayout>
  );
}
