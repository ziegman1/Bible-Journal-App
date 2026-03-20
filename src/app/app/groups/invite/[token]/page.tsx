import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { acceptGroupInvite } from "@/app/actions/groups";
import { Button } from "@/components/ui/button";
import { InviteAcceptForm } from "@/components/groups/invite-accept-form";

interface PageProps {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ accept?: string }>;
}

export default async function InviteAcceptPage({
  params,
  searchParams,
}: PageProps) {
  const { token } = await params;
  const supabase = await createClient();
  if (!supabase) redirect("/setup");
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirectTo=/app/groups/invite/${token}?accept=1`);
  }

  const result = await acceptGroupInvite(token);
  if (result.error === "NEED_NAME") {
    return (
      <div className="p-6 max-w-xl mx-auto space-y-6">
        <h1 className="text-xl font-serif text-stone-800 dark:text-stone-200">
          Join 3/3rds Group
        </h1>
        <InviteAcceptForm token={token} />
      </div>
    );
  }

  if (result.error) {
    const title =
      result.error.includes("expired") || result.error.includes("Invalid")
        ? "Invite link expired or invalid"
        : result.error.includes("already been used")
          ? "Invite already used"
          : result.error.includes("already a member")
            ? "Already a member"
            : "Unable to join group";
    return (
      <div className="p-6 max-w-xl mx-auto space-y-6">
        <h1 className="text-xl font-serif text-stone-800 dark:text-stone-200">
          {title}
        </h1>
        <p className="text-stone-600 dark:text-stone-400">{result.error}</p>
        <Link href="/app/groups">
          <Button>Back to groups</Button>
        </Link>
      </div>
    );
  }

  if (result.success && result.groupId) {
    redirect(`/app/groups/${result.groupId}`);
  }

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <h1 className="text-xl font-serif text-stone-800 dark:text-stone-200">
        Unable to join group
      </h1>
      <p className="text-stone-600 dark:text-stone-400">
        Something went wrong. Please try again.
      </p>
      <Link href="/app/groups">
        <Button>Back to groups</Button>
      </Link>
    </div>
  );
}
