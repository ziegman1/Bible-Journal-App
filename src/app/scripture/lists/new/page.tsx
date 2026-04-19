import Link from "next/link";
import { CreateListForm } from "@/components/scripture-module/create-list-form";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

type PageProps = {
  searchParams: Promise<{ returnTo?: string }>;
};

export default async function ScriptureNewListPage({ searchParams }: PageProps) {
  const q = await searchParams;
  const returnTo =
    typeof q.returnTo === "string" && q.returnTo.startsWith("/scripture") ? q.returnTo : undefined;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            New list
          </p>
          <h1 className="text-xl font-serif font-light text-foreground">Create list</h1>
        </div>
        <Link href="/scripture/lists" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
          All lists
        </Link>
      </div>
      <CreateListForm returnTo={returnTo} />
    </div>
  );
}
