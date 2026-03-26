import Link from "next/link";
import { ProcessMap } from "@/components/dashboard/process-map/process-map";

export const metadata = {
  title: "BADWR Pathway",
};

export default function ProcessMapPage() {
  return (
    <div className="mx-auto max-w-[1300px] space-y-4 px-4 py-6 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-wide sm:text-xl">
            BADWR Pathway
          </h1>
          <p className="text-sm text-muted-foreground">
            Be a Disciple Worth Reproducing
          </p>
        </div>
        <Link
          href="/app"
          className="text-sm text-muted-foreground underline decoration-dotted hover:text-foreground"
        >
          Back to Dashboard
        </Link>
      </div>

      <ProcessMap />
    </div>
  );
}
