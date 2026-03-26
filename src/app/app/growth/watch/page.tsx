import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

/** Placeholder: Watch Phase (dashboard links here). */
export default function GrowthWatchPlaceholderPage() {
  return (
    <div className="mx-auto max-w-lg space-y-4 p-6">
      <h1 className="text-2xl font-serif font-light text-foreground">Watch phase</h1>
      <p className="text-sm text-muted-foreground">
        Observational growth tracking will live here.
      </p>
      <Link href="/app/growth" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
        ← Growth
      </Link>
    </div>
  );
}
