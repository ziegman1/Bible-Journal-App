import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getScriptureReviewPageData } from "@/app/actions/scripture-module";
import { ScriptureTypedReviewFlow } from "@/components/scripture-module/scripture-typed-review-flow";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

type PageProps = { params: Promise<{ id: string }> };

export default async function ScriptureItemReviewPage({ params }: PageProps) {
  const { id } = await params;
  const data = await getScriptureReviewPageData(id);

  if ("error" in data) {
    if (data.error === "Verse not found.") notFound();
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {data.error}
      </div>
    );
  }

  if (!("item" in data)) {
    redirect(`/scripture/items/${id}/memorize`);
  }

  return (
    <div className="space-y-6">
      <ScriptureTypedReviewFlow
        item={data.item}
        phraseSegments={data.phrases}
        initialMemory={data.memory}
      />
      <p>
        <Link href="/scripture/review" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
          ← Review queue
        </Link>
      </p>
    </div>
  );
}
