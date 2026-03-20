import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { acceptGroupInvite } from "@/app/actions/groups";
import { Button } from "@/components/ui/button";
import { InviteAcceptForm } from "@/components/groups/invite-accept-form";
import { InviteWrongAccountHelp } from "@/components/groups/invite-wrong-account-help";

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
    const preview = await supabase.rpc("get_invite_preview_public", {
      p_token: token,
    });
    const data = preview.data as {
      group_name?: string;
      inviter_name?: string;
      expires_at?: string;
    } | null;

    if (!data) {
      return (
        <div className="p-6 max-w-xl mx-auto space-y-6">
          <h1 className="text-xl font-serif text-stone-800 dark:text-stone-200">
            Invite link expired or invalid
          </h1>
          <p className="text-stone-600 dark:text-stone-400">
            This invite may have expired, been cancelled, or already been used.
          </p>
          <Link href="/login">
            <Button>Sign in</Button>
          </Link>
        </div>
      );
    }

    const loginUrl = `/login?redirectTo=${encodeURIComponent(`/app/groups/invite/${token}`)}`;
    return (
      <div className="p-6 max-w-xl mx-auto space-y-6">
        <h1 className="text-xl font-serif text-stone-800 dark:text-stone-200">
          You&apos;re invited to join a 3/3rds Group
        </h1>
        <p className="text-stone-600 dark:text-stone-400">
          <strong>{data.inviter_name}</strong> invited you to join{" "}
          <strong>{data.group_name}</strong>.
        </p>
        <p className="text-stone-600 dark:text-stone-400">
          Sign in or create an account to accept this invitation.
        </p>
        {data.expires_at && (
          <p className="text-xs text-stone-500 dark:text-stone-400">
            This link expires{" "}
            {new Date(data.expires_at).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
            .
          </p>
        )}
        <div className="flex gap-3">
          <Link href={loginUrl}>
            <Button>Sign in to accept</Button>
          </Link>
          <Link
            href={`/signup?redirectTo=${encodeURIComponent(`/app/groups/invite/${token}`)}`}
          >
            <Button variant="outline">Create account</Button>
          </Link>
        </div>
      </div>
    );
  }

  const result = await acceptGroupInvite(token);
  if ("error" in result && result.error === "NEED_NAME") {
    return (
      <div className="p-6 max-w-xl mx-auto space-y-6">
        <h1 className="text-xl font-serif text-stone-800 dark:text-stone-200">
          Finish joining the group
        </h1>
        <InviteAcceptForm token={token} />
      </div>
    );
  }

  if ("error" in result && result.error) {
    const code = result.code;
    const title =
      code === "EMAIL_MISMATCH"
        ? "Wrong account for this invite"
        : code === "CANCELLED"
          ? "Invite cancelled"
          : code === "EXPIRED"
            ? "Invite expired"
            : code === "ALREADY_ACCEPTED"
              ? "Invite already used"
              : code === "ALREADY_MEMBER"
                ? "Already a member"
                : code === "INVALID_TOKEN"
                  ? "Invite link invalid"
                  : result.error.includes("expired")
                    ? "Invite expired"
                    : result.error.includes("invalid") ||
                        result.error.includes("no longer")
                      ? "Invite link invalid"
                      : result.error.includes("already been used") ||
                          result.error.includes("already used")
                        ? "Invite already used"
                        : result.error.includes("already a member")
                          ? "Already a member"
                          : result.error.includes("cancelled")
                            ? "Invite cancelled"
                            : "Unable to join group";

    const redirectToPath = `/app/groups/invite/${token}`;

    return (
      <div className="p-6 max-w-xl mx-auto space-y-6">
        <h1 className="text-xl font-serif text-stone-800 dark:text-stone-200">
          {title}
        </h1>
        <p className="text-stone-600 dark:text-stone-400">{result.error}</p>
        {code === "EMAIL_MISMATCH" && (
          <InviteWrongAccountHelp redirectTo={redirectToPath} />
        )}
        <div className="flex flex-wrap gap-3">
          <Link href="/app/groups">
            <Button variant={code === "EMAIL_MISMATCH" ? "default" : "outline"}>
              Back to groups
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if ("success" in result && result.success && result.groupId) {
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
