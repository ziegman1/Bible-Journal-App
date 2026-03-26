import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

/** Placeholder until Share workflow is implemented (dashboard links here). */
export default function SharePlaceholderPage() {
  return (
    <div className="mx-auto max-w-lg space-y-4 p-6">
      <h1 className="text-2xl font-serif font-light text-foreground">Share</h1>
      <p className="text-sm text-muted-foreground">
        This area will hold sharing tools and invitations. For now, use journal export or
        group invites from your existing flows.
      </p>
      <Link href="/app" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
        ← Dashboard
      </Link>
    </div>
  );
}
