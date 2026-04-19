import Link from "next/link";
import { notFound } from "next/navigation";
import { getScriptureItemDetail, getScriptureListsForUser } from "@/app/actions/scripture-module";
import { EditVerseForm } from "@/components/scripture-module/edit-verse-form";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

type PageProps = { params: Promise<{ id: string }> };

export default async function ScriptureItemEditPage({ params }: PageProps) {
  const { id } = await params;
  const [detail, listsRes] = await Promise.all([
    getScriptureItemDetail(id),
    getScriptureListsForUser(),
  ]);

  if ("error" in detail) {
    notFound();
  }
  if ("error" in listsRes) {
    return <p className="text-sm text-destructive">{listsRes.error}</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Edit verse
          </p>
          <h1 className="text-xl font-serif font-light text-foreground">{detail.item.reference}</h1>
        </div>
        <Link
          href={`/scripture/items/${id}`}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          Cancel
        </Link>
      </div>
      <EditVerseForm item={detail.item} listIds={detail.listIds} lists={listsRes.lists} />
    </div>
  );
}
