import Link from "next/link";
import { ProcessMapCanvas } from "@/components/process-map/process-map-canvas";

export const metadata = {
  title: "Process map",
};

export default function ProcessMapPage() {
  return (
    <div className="mx-auto max-w-[1280px] space-y-4 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-lg font-semibold">Process map</h1>
        <Link
          href="/app"
          className="text-sm text-muted-foreground underline decoration-dotted hover:text-foreground"
        >
          Back to app
        </Link>
      </div>
      <ProcessMapCanvas />
    </div>
  );
}
