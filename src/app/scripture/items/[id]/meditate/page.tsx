import Link from "next/link";
import { notFound } from "next/navigation";
import { getScriptureMemorizePageData } from "@/app/actions/scripture-module";
import { MeditationFlow } from "@/components/scripture-module/meditation-flow";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

type PageProps = { params: Promise<{ id: string }> };

export default async function ScriptureMeditatePage({ params }: PageProps) {
  const { id } = await params;
  const data = await getScriptureMemorizePageData(id);
  if ("error" in data) {
    notFound();
  }

  return (
    <div>
      <MeditationFlow key={`${data.memory.id}-${data.memory.lastStepAt ?? ""}`} item={data.item} memory={data.memory} />
      <p className="mt-10">
        <Link href="/scripture" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
          ← Scripture Home
        </Link>
      </p>
    </div>
  );
}
