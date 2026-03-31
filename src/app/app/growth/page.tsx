import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

/** Placeholder: Transformed Person / growth hub (dashboard links here). */
export default function GrowthPlaceholderPage() {
  return (
    <div className="mx-auto max-w-lg space-y-4 p-6">
      <h1 className="text-2xl font-serif font-light text-foreground">Growth</h1>
      <p className="text-sm text-muted-foreground">
        Reflection on transformation and next steps will live here.
      </p>
      <div>
        <Link href="/app" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          ← Dashboard
        </Link>
      </div>
    </div>
  );
}
