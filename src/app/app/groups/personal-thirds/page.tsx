import Link from "next/link";
import { getThirdsPersonalWorkspace } from "@/app/actions/thirds-personal";
import { ThirdsPersonalWorkspace } from "@/components/groups/thirds-personal-workspace";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export default async function PersonalThirdsPage() {
  const ws = await getThirdsPersonalWorkspace();

  if ("error" in ws) {
    return (
      <div className="p-6">
        <p className="text-destructive">{ws.error}</p>
        <Link href="/app/groups" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4 inline-flex")}>
          ← 3/3rds Groups
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 pb-16">
      <Link
        href="/app/groups"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2 mb-4 inline-flex")}
      >
        ← 3/3rds Groups
      </Link>
      <ThirdsPersonalWorkspace initial={ws} />
    </div>
  );
}
