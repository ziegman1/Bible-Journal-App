import Link from "next/link";
import { ShareEncounterLogSheet } from "@/components/share/share-encounter-log-sheet";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export default function SharePage() {
  return (
    <div className="mx-auto max-w-lg space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-serif font-light text-foreground">Share</h1>
        <p className="text-sm text-muted-foreground">
          Log each gospel or testimony conversation. Your dashboard shows weekly pace (goal: five
          people) and how people responded—red, yellow, green, or already a Christian.
        </p>
      </div>
      <ShareEncounterLogSheet />
      <Link href="/app" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
        ← Dashboard
      </Link>
    </div>
  );
}
