import Link from "next/link";
import { getScriptureListsForUser } from "@/app/actions/scripture-module";
import { AddVerseForm } from "@/components/scripture-module/add-verse-form";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export default async function ScriptureNewPage() {
  const listsRes = await getScriptureListsForUser();
  if ("error" in listsRes) {
    return <p className="text-sm text-destructive">{listsRes.error}</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Add verse
          </p>
          <h1 className="text-xl font-serif font-light text-foreground">New passage</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Save text to your library. You can attach it to one or more lists now or edit later.
          </p>
        </div>
        <Link href="/scripture" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
          Scripture Home
        </Link>
      </div>
      <AddVerseForm lists={listsRes.lists} />
    </div>
  );
}
