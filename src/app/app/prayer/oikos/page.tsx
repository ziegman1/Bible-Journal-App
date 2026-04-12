import Link from "next/link";
import { ArrowLeft, Heart } from "lucide-react";
import { redirect } from "next/navigation";
import { getEvangelisticPrayerFocusNames } from "@/app/actions/list-of-100";
import { OikosPrayerFlow } from "@/components/prayer/oikos-prayer-flow";
import { buttonVariants } from "@/components/ui/button-variants";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export default async function OikosPrayerPage() {
  const supabase = await createClient();
  if (!supabase) redirect("/setup");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const focusRes = await getEvangelisticPrayerFocusNames();
  const names = "error" in focusRes ? [] : focusRes.names;

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 pt-6 sm:px-6">
        <Link
          href="/app/prayer"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "gap-1.5 text-muted-foreground"
          )}
        >
          <ArrowLeft className="size-4" />
          Prayer tools
        </Link>
        <Link href="/app" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
          Dashboard
        </Link>
      </div>

      <div className="px-4 sm:px-6">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Prayer
        </p>
        <h1 className="mt-1 flex items-center gap-2 text-2xl font-serif font-light text-foreground">
          <Heart className="size-6 text-violet-600 dark:text-violet-400" />
          Pray for your Oikos
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Guided evangelistic prayer for the people you marked on your List of 100.
        </p>
      </div>

      <OikosPrayerFlow names={names} />
    </div>
  );
}
