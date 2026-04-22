import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { ThirdsParticipationPanel } from "@/components/groups/thirds-participation-panel";
import { buttonVariants } from "@/components/ui/button-variants";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export default async function GroupsProgressPage() {
  const supabase = await createClient();
  if (!supabase) redirect("/setup");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <Link
        href="/app/groups"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "inline-flex gap-1.5 text-muted-foreground touch-manipulation"
        )}
      >
        <ArrowLeft className="size-4 shrink-0" aria-hidden />
        Back to Groups
      </Link>
      <ThirdsParticipationPanel />
    </div>
  );
}
