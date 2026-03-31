import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

/** Placeholder: MAWL (Model, Assist, Watch, Lead)—dashboard Multiplication card links here. */
export default function AssistPlaceholderPage() {
  return (
    <div className="mx-auto max-w-lg space-y-4 p-6">
      <h1 className="text-2xl font-serif font-light text-foreground">MAWL</h1>
      <p className="text-sm text-muted-foreground">
        Model, Assist, Watch, and Lead—content for multiplying helpers will live here.
      </p>
      <Link href="/app" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
        ← Dashboard
      </Link>
    </div>
  );
}
