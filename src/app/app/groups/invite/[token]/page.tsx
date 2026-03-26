import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { InviteAcceptGate } from "@/components/groups/invite-accept-gate";
import { getCanonicalSiteHost } from "@/lib/public-site-url";
import { inviteTokenMeta, logGroupInvite } from "@/lib/group-invite-log";

interface PageProps {
  params: Promise<{ token: string }>;
}

function isValidInviteToken(raw: unknown): raw is string {
  if (typeof raw !== "string") return false;
  const t = raw.trim();
  if (!t || t.length > 200) return false;
  return /^[a-zA-Z0-9_-]+$/.test(t);
}

export default async function InviteAcceptPage({ params }: PageProps) {
  const resolved = await params;
  const rawToken = resolved?.token;

  if (!isValidInviteToken(rawToken)) {
    logGroupInvite("page_invalid_token_param", inviteTokenMeta(typeof rawToken === "string" ? rawToken : ""));
    return (
      <div className="p-6 max-w-xl mx-auto space-y-6">
        <h1 className="text-xl font-serif text-stone-800 dark:text-stone-200">
          Invite link invalid
        </h1>
        <p className="text-stone-600 dark:text-stone-400">
          This URL doesn&apos;t look like a valid group invite. Ask your group admin for a new
          link.
        </p>
        <Link href="/login">
          <Button>Sign in</Button>
        </Link>
      </div>
    );
  }

  const token = rawToken.trim();
  const supabase = await createClient();
  if (!supabase) {
    logGroupInvite("page_no_supabase", inviteTokenMeta(token));
    return (
      <div className="p-6 max-w-xl mx-auto space-y-6">
        <h1 className="text-xl font-serif text-stone-800 dark:text-stone-200">Setup required</h1>
        <p className="text-stone-600 dark:text-stone-400">This app isn&apos;t fully configured.</p>
        <Link href="/setup">
          <Button>Setup</Button>
        </Link>
      </div>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const { data, error: previewError } = await supabase.rpc("get_invite_preview_public", {
      p_token: token,
    });

    if (previewError) {
      logGroupInvite("preview_rpc_error", {
        ...inviteTokenMeta(token),
        message: previewError.message,
        code: previewError.code,
      });
      return (
        <div className="p-6 max-w-xl mx-auto space-y-6">
          <h1 className="text-xl font-serif text-stone-800 dark:text-stone-200">
            Invite link expired or invalid
          </h1>
          <p className="text-stone-600 dark:text-stone-400">
            We couldn&apos;t load this invitation ({previewError.message || "unknown error"}). It may
            have expired, been cancelled, or the link may be broken.
          </p>
          <Link href="/login">
            <Button>Sign in</Button>
          </Link>
        </div>
      );
    }

    const row = data as {
      group_name?: string;
      inviter_name?: string;
      expires_at?: string;
      group_kind?: string;
    } | null;

    if (!row || typeof row !== "object") {
      logGroupInvite("preview_no_data", inviteTokenMeta(token));
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
    const isChat = row.group_kind === "chat";
    return (
      <div className="p-6 max-w-xl mx-auto space-y-6">
        <h1 className="text-xl font-serif text-stone-800 dark:text-stone-200">
          {isChat
            ? "You’re invited to a CHAT accountability group"
            : "You’re invited to join a 3/3rds Group"}
        </h1>
        <p className="text-stone-600 dark:text-stone-400">
          <strong>{row.inviter_name ?? "Someone"}</strong> invited you to join{" "}
          <strong>{row.group_name ?? "a group"}</strong>
          {isChat ? " on Logosflow" : ""}.
        </p>
        {isChat && (
          <p className="text-stone-600 dark:text-stone-400 text-sm leading-relaxed">
            CHAT groups are 2–3 people meeting weekly for accountability: check your
            progress, hear the Word, act on it, and tell others. You’ll use the same sign-in
            or sign-up as any other Logosflow invite.
          </p>
        )}
        <p className="text-stone-600 dark:text-stone-400">
          Sign in or create an account to accept this invitation.
        </p>
        {row.expires_at && (
          <p className="text-xs text-stone-500 dark:text-stone-400">
            This link expires{" "}
            {new Date(row.expires_at).toLocaleString(undefined, {
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

  const siteBase = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "";
  const canonicalHost = getCanonicalSiteHost();

  return (
    <InviteAcceptGate token={token} siteBase={siteBase} canonicalHost={canonicalHost} />
  );
}
