import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  getMemorizeQueueRedirectIfNeeded,
  getScriptureMemorizePageData,
} from "@/app/actions/scripture-module";
import { MemorizeFlow } from "@/components/scripture-module/memorize-flow";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

type PageProps = { params: Promise<{ id: string }> };

export default async function ScriptureMemorizePage({ params }: PageProps) {
  const { id } = await params;
  const data = await getScriptureMemorizePageData(id);
  if ("error" in data) {
    notFound();
  }

  const queue = await getMemorizeQueueRedirectIfNeeded(id);
  if (!("error" in queue) && queue.href) {
    redirect(queue.href);
  }

  return (
    <div>
      <MemorizeFlow
        key={`${data.memory.id}-${data.memory.lastStepAt ?? ""}-${data.memory.memorizeStage}`}
        item={data.item}
        memory={data.memory}
        inMyVerses={data.inMyVerses}
      />
      <p className="mt-10">
        <Link href="/scripture" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
          ← Scripture Home
        </Link>
      </p>
    </div>
  );
}
