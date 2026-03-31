"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startChatGroupWithInvite } from "@/app/actions/groups";
import { buildChatInviteShareText } from "@/lib/chat-group-invite";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ListedGroup } from "@/app/actions/groups";

export function StartChatGroupPanel({
  inviterDisplayName,
  currentUserEmail,
  primaryChat,
}: {
  inviterDisplayName: string;
  /** Blocks inviting your own email (group exists but invite fails). */
  currentUserEmail?: string | null;
  /** When set, user already has a CHAT group — show link instead of create form. */
  primaryChat?: ListedGroup | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [groupName, setGroupName] = useState("Our CHAT group");
  const [email, setEmail] = useState("");
  const [inviteeFirstName, setInviteeFirstName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<{
    acceptUrl: string;
    groupId?: string;
    groupNameUsed: string;
    emailSent?: boolean;
    emailError?: string;
    inviteFailed?: boolean;
  } | null>(null);

  const shareBody =
    result &&
    buildChatInviteShareText({
      inviterName: inviterDisplayName,
      groupName: result.groupNameUsed,
      acceptUrl: result.acceptUrl,
    });

  const smsHref =
    shareBody && `sms:?&body=${encodeURIComponent(shareBody)}`;

  const submit = () => {
    setErr(null);
    setResult(null);
    const gn = groupName.trim() || "Our CHAT group";
    const em = email.trim().toLowerCase();
    if (!em) {
      setErr("Invitee email is required.");
      return;
    }
    if (currentUserEmail && em === currentUserEmail) {
      setErr(
        "Use a different email than your BADWR account. Invite a friend’s address, or create the group and share the invite link to another device/account."
      );
      return;
    }
    startTransition(async () => {
      const out = await startChatGroupWithInvite({
        groupName: gn,
        inviteeEmail: em,
        inviteeName: inviteeFirstName.trim() || undefined,
      });
      if ("error" in out) {
        setErr(out.error ?? "Something went wrong");
        if ("groupId" in out && out.groupId) {
          setResult({
            acceptUrl: "",
            groupNameUsed: gn,
            inviteFailed: true,
            groupId: out.groupId,
          });
          router.refresh();
        }
        return;
      }
      setResult({
        acceptUrl: out.acceptUrl,
        groupId: out.groupId,
        groupNameUsed: gn,
        emailSent: out.emailSent,
        emailError: out.emailError,
      });
      router.refresh();
    });
  };

  const copyShare = async () => {
    if (!shareBody || typeof navigator === "undefined" || !navigator.clipboard) return;
    await navigator.clipboard.writeText(shareBody);
  };

  if (primaryChat) {
    return (
      <Card className="mt-10 border-stone-200 bg-stone-50/80 dark:border-stone-700 dark:bg-stone-900/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-stone-900 dark:text-stone-100 text-lg">
            Start a CHAT group
          </CardTitle>
          <CardDescription className="text-stone-600 dark:text-stone-400">
            You already have a CHAT group ({primaryChat.name}). One is enough — open it to
            invite people, set your weekly time, and agree on a reading plan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href={`/app/chat/groups/${primaryChat.id}`}
            className={cn(buttonVariants({ variant: "default", size: "sm" }), "inline-flex")}
          >
            Open your CHAT group
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-10 border-stone-200 bg-stone-50/80 dark:border-stone-700 dark:bg-stone-900/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-stone-900 dark:text-stone-100 text-lg">
          Start a CHAT group
        </CardTitle>
        <CardDescription className="text-stone-600 dark:text-stone-400">
          Create a small accountability group (up to three people), email an invite, then
          share the same link by text if you like. They sign up or sign in with BADWR
          like any other invite.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!open ? (
          <Button type="button" onClick={() => setOpen(true)} variant="default">
            Start a CHAT group
          </Button>
        ) : (
          <div className="space-y-4">
            {err && (
              <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                {err}
              </p>
            )}

            {!result?.acceptUrl && !result?.inviteFailed && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="chat-gn">Group name</Label>
                  <Input
                    id="chat-gn"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Our CHAT group"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chat-em">Invitee email</Label>
                  <Input
                    id="chat-em"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="friend@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chat-fn">Invitee first name (optional)</Label>
                  <Input
                    id="chat-fn"
                    value={inviteeFirstName}
                    onChange={(e) => setInviteeFirstName(e.target.value)}
                    placeholder="Alex"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" onClick={submit} disabled={pending}>
                    {pending ? "Working…" : "Create group & send email invite"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setOpen(false);
                      setErr(null);
                      setResult(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </>
            )}

            {result?.inviteFailed && result.groupId && (
              <div className="space-y-2 text-sm text-stone-700 dark:text-stone-300">
                <p>
                  Your CHAT group was created, but the email invite could not be sent. Open
                  members to try again or copy an invite link.
                </p>
                <Link
                  href={`/app/groups/${result.groupId}/members`}
                  className={cn(buttonVariants({ size: "sm" }))}
                >
                  Open members & invites
                </Link>
              </div>
            )}

            {result?.acceptUrl ? (
              <div className="space-y-3 text-sm text-stone-700 dark:text-stone-300">
                <p className="font-medium text-stone-900 dark:text-stone-100">
                  {result.emailSent === false
                    ? "Group created — email was not sent (check your email provider settings)."
                    : "Group created and invite email sent."}
                </p>
                {result.emailError && (
                  <p className="text-amber-700 dark:text-amber-400">{result.emailError}</p>
                )}
                <div className="rounded-md border border-stone-200 dark:border-stone-600 bg-white/60 dark:bg-stone-950/40 p-3 font-mono text-xs break-all">
                  {result.acceptUrl}
                </div>
                <div className="flex flex-wrap gap-2">
                  {smsHref && (
                    <a
                      href={smsHref}
                      className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
                    >
                      Open Messages (SMS)
                    </a>
                  )}
                  <Button type="button" size="sm" variant="outline" onClick={() => void copyShare()}>
                    Copy invite message
                  </Button>
                  {result.groupId && (
                    <Link
                      href={`/app/chat/groups/${result.groupId}`}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                    >
                      Open group workspace
                    </Link>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
