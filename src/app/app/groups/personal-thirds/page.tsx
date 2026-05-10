import Link from "next/link";
import { isGuestRequest } from "@/lib/guest/guest-request.server";
import { getThirdsPersonalWorkspace } from "@/app/actions/thirds-personal";
import { ThirdsPersonalWorkspaceGuestBootstrap } from "@/components/guest/thirds-personal-workspace-guest-bootstrap";
import { ThirdsPersonalWorkspace } from "@/components/groups/thirds-personal-workspace";
import { currentUtcWeekMondayYmd } from "@/lib/groups/thirds-personal-helpers";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { parseAdminTestToolQuery } from "@/lib/admin/admin-test-preview-params";

export default async function PersonalThirdsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  if (await isGuestRequest()) {
    const currentWeekMondayYmd = currentUtcWeekMondayYmd();
    return (
      <div className="p-6 pb-16">
        <Link
          href="/app/groups"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2 mb-4 inline-flex")}
        >
          ← 3/3rds Groups
        </Link>
        <ThirdsPersonalWorkspaceGuestBootstrap currentWeekMondayYmd={currentWeekMondayYmd} />
      </div>
    );
  }

  const supabase = await createClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  const adminToolPreview = parseAdminTestToolQuery(sp, user);

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
      <ThirdsPersonalWorkspace
        initial={ws}
        adminTestHarnessActive={Boolean(adminToolPreview?.testHarnessActive)}
        adminPreviewLookUpMode={adminToolPreview?.lookUpMode ?? null}
      />
    </div>
  );
}
