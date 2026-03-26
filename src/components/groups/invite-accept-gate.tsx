"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { acceptGroupInvite, type AcceptGroupInviteResult } from "@/app/actions/groups";
import { Button } from "@/components/ui/button";
import { InviteAcceptForm } from "@/components/groups/invite-accept-form";
import { InviteWrongAccountHelp } from "@/components/groups/invite-wrong-account-help";
import { logGroupInvite, inviteTokenMeta } from "@/lib/group-invite-log";

function errorTitle(code: string | undefined, message: string): string {
  if (code === "NOT_AUTHENTICATED") return "Session not ready yet";
  if (code === "RPC_ERROR") return "Unable to join group";
  if (code === "EMAIL_MISMATCH") return "Wrong account for this invite";
  if (code === "CANCELLED") return "Invite cancelled";
  if (code === "EXPIRED") return "Invite expired";
  if (code === "ALREADY_ACCEPTED") return "Invite already used";
  if (code === "ALREADY_MEMBER") return "Already in this group";
  if (code === "CHAT_GROUP_FULL") return "CHAT group is full";
  if (code === "INVALID_TOKEN") return "Invite link invalid";
  if (message.toLowerCase().includes("expired")) return "Invite expired";
  if (
    message.toLowerCase().includes("invalid") ||
    message.toLowerCase().includes("no longer")
  )
    return "Invite link invalid";
  if (
    message.toLowerCase().includes("already been used") ||
    message.toLowerCase().includes("already used")
  )
    return "Invite already used";
  if (message.toLowerCase().includes("already a member"))
    return "Already in this group";
  if (message.toLowerCase().includes("cancelled")) return "Invite cancelled";
  return "Unable to join group";
}

interface InviteAcceptGateProps {
  token: string;
  siteBase: string;
  canonicalHost: string | null;
}

export function InviteAcceptGate({
  token,
  siteBase,
  canonicalHost,
}: InviteAcceptGateProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<"loading" | "need_name" | "failed">("loading");
  const [result, setResult] = useState<AcceptGroupInviteResult | null>(null);

  const runAccept = useCallback(async () => {
    setPhase("loading");
    setResult(null);
    try {
      const out = await acceptGroupInvite(token);

      if ("success" in out && out.success && out.groupId) {
        logGroupInvite("gate_redirect_group", {
          ...inviteTokenMeta(token),
          groupId: out.groupId,
        });
        router.push(`/app/groups/${out.groupId}`);
        router.refresh();
        return;
      }

      if ("error" in out && out.error === "NEED_NAME") {
        setResult(null);
        setPhase("need_name");
        return;
      }

      setResult(out);

      if ("error" in out && out.error) {
        setPhase("failed");
        return;
      }

      setPhase("failed");
      setResult({ error: "Something went wrong. Please try again.", code: "INVALID_TOKEN" });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unexpected error";
      logGroupInvite("gate_client_throw", {
        ...inviteTokenMeta(token),
        message,
      });
      setPhase("failed");
      setResult({
        error: "Something went wrong. Please try again or use the button below.",
        code: "RPC_ERROR",
      });
    }
  }, [router, token]);

  useEffect(() => {
    void runAccept();
  }, [runAccept]);

  if (phase === "loading" && !result) {
    return (
      <div className="p-6 max-w-xl mx-auto space-y-4">
        <h1 className="text-xl font-serif text-stone-800 dark:text-stone-200">
          Joining your group…
        </h1>
        <p className="text-stone-600 dark:text-stone-400 text-sm">
          Confirming your invitation. This usually takes just a moment after email verification.
        </p>
        <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-stone-200 dark:bg-stone-700">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-stone-400 dark:bg-stone-500" />
        </div>
      </div>
    );
  }

  if (phase === "need_name") {
    return (
      <div className="p-6 max-w-xl mx-auto space-y-6">
        <h1 className="text-xl font-serif text-stone-800 dark:text-stone-200">
          Finish joining the group
        </h1>
        <InviteAcceptForm token={token} />
      </div>
    );
  }

  if (phase === "failed" && result && "error" in result && result.error) {
    const code = result.code;
    const title = errorTitle(code, result.error);
    const redirectToPath = `/app/groups/invite/${token}`;

    const requestHost =
      typeof window !== "undefined" ? window.location.hostname.toLowerCase() : "";
    const showTryCanonical =
      code === "INVALID_TOKEN" &&
      !!siteBase &&
      !!canonicalHost &&
      !!requestHost &&
      canonicalHost !== requestHost;

    return (
      <div className="p-6 max-w-xl mx-auto space-y-6">
        <h1 className="text-xl font-serif text-stone-800 dark:text-stone-200">{title}</h1>
        <p className="text-stone-600 dark:text-stone-400">{result.error}</p>

        {code === "NOT_AUTHENTICATED" && (
          <p className="text-sm text-stone-500 dark:text-stone-400">
            If you just confirmed your email, your session may still be loading. Try again in a
            moment.
          </p>
        )}

        {code === "INVALID_TOKEN" && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
            <p className="font-medium">Common causes</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-amber-900/90 dark:text-amber-100/90">
              <li>
                The link was shortened or broken by email—use &quot;Copy link&quot; from the
                original message if you can.
              </li>
              <li>
                The invite was created using a <strong>different</strong> app environment (e.g.
                local dev vs production). The database has to match where the invite was sent
                from.
              </li>
              <li>
                The admin may have cancelled the invite or sent a newer one—ask for a fresh
                invite.
              </li>
            </ul>
            {showTryCanonical && (
              <p className="mt-3">
                <Link
                  href={`${siteBase}/app/groups/invite/${encodeURIComponent(token)}`}
                  className="font-medium text-amber-950 underline underline-offset-2 dark:text-amber-50"
                >
                  Open this same invite on your main site ({canonicalHost})
                </Link>
              </p>
            )}
          </div>
        )}

        {code === "EMAIL_MISMATCH" && (
          <InviteWrongAccountHelp redirectTo={redirectToPath} />
        )}

        <div className="flex flex-wrap gap-3">
          {(code === "NOT_AUTHENTICATED" || code === "RPC_ERROR") && (
            <Button type="button" onClick={() => void runAccept()}>
              Try again
            </Button>
          )}
          <Link href="/app">
            <Button variant={code === "EMAIL_MISMATCH" ? "default" : "outline"}>
              Back to app
            </Button>
          </Link>
          <Link href="/app">
            <Button variant="ghost">Go home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <h1 className="text-xl font-serif text-stone-800 dark:text-stone-200">
        Unable to join group
      </h1>
      <p className="text-stone-600 dark:text-stone-400">Something went wrong. Please try again.</p>
      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={() => void runAccept()}>
          Try again
        </Button>
        <Link href="/app">
          <Button variant="outline">Back to app</Button>
        </Link>
      </div>
    </div>
  );
}
