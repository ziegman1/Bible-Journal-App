import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

/** Consistent return link from prayer tool sub-routes to the hub. */
export function PrayerHubBackLink({ className }: { className?: string }) {
  return (
    <Link
      href="/app/prayer"
      className={cn(
        buttonVariants({ variant: "ghost", size: "sm" }),
        "gap-1.5 text-muted-foreground touch-manipulation",
        className
      )}
    >
      <ArrowLeft className="size-4 shrink-0" aria-hidden />
      Back to Prayer
    </Link>
  );
}
