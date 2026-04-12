import { ExternalLink } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

const PRAYER_WHEEL_ZUME_URL = "https://zume.training/how-to-spend-an-hour-in-prayer";

/**
 * Zúme “hour in prayer” training — shown with the Prayer Wheel tool (same twelve movements).
 */
export function PrayerWheelZumeTraining() {
  return (
    <div className="rounded-xl border border-border border-dashed bg-muted/25 px-4 py-4">
      <h3 className="text-sm font-medium text-foreground">Prayer hour training</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Zúme Training walks through the twelve-step Prayer Cycle—an hour in prayer with the same
        kinds of movements as this wheel—with video and a read-along transcript.
      </p>
      <a
        href={PRAYER_WHEEL_ZUME_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "mt-3 inline-flex items-center gap-2"
        )}
      >
        Open How to Spend an Hour in Prayer on Zúme
        <ExternalLink className="size-3.5 opacity-70" aria-hidden />
      </a>
    </div>
  );
}
