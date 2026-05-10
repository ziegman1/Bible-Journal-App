import Link from "next/link";
import { isGuestRequest } from "@/lib/guest/guest-request.server";
import { getThirdsPersonalWorkspace } from "@/app/actions/thirds-personal";
import { PersonalThirdsPracticeGuestBootstrap } from "@/components/groups/personal-thirds-practice-guest-bootstrap";
import { PersonalThirdsPracticeClient } from "@/components/groups/personal-thirds-practice-client";
import { currentUtcWeekMondayYmd } from "@/lib/groups/thirds-personal-helpers";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export default async function PersonalThirdsPracticePage() {
  if (await isGuestRequest()) {
    const currentWeekMondayYmd = currentUtcWeekMondayYmd();
    return (
      <div className="p-6 pb-16">
        <Link
          href="/app/groups/personal-thirds"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2 mb-4 inline-flex")}
        >
          ← Personal 3/3rds
        </Link>
        <PersonalThirdsPracticeGuestBootstrap currentWeekMondayYmd={currentWeekMondayYmd} />
      </div>
    );
  }

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
        href="/app/groups/personal-thirds"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2 mb-4 inline-flex")}
      >
        ← Personal 3/3rds
      </Link>
      <PersonalThirdsPracticeClient initial={ws} />
    </div>
  );
}
