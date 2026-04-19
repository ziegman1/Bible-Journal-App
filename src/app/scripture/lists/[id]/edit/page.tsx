import Link from "next/link";
import { notFound } from "next/navigation";
import { getScriptureListForEdit } from "@/app/actions/scripture-module";
import { DeleteScriptureListButton } from "@/components/scripture-module/delete-scripture-list-button";
import { EditListForm } from "@/components/scripture-module/edit-list-form";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

type PageProps = { params: Promise<{ id: string }> };

export default async function ScriptureListEditPage({ params }: PageProps) {
  const { id } = await params;
  const data = await getScriptureListForEdit(id);
  if ("error" in data) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Edit list
          </p>
          <h1 className="text-xl font-serif font-light text-foreground">{data.name}</h1>
        </div>
        <Link
          href={`/scripture/lists/${id}`}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          Cancel
        </Link>
      </div>
      <EditListForm listId={id} initialName={data.name} initialDescription={data.description} />

      <div className="border-t border-border pt-8">
        <p className="text-sm text-muted-foreground">
          Delete only this list. Verses remain in your library.
        </p>
        <div className="mt-3">
          <DeleteScriptureListButton listId={id} listName={data.name} />
        </div>
      </div>
    </div>
  );
}
