"use client";

import { useEffect, useState, useTransition } from "react";
import { useActionState } from "react";
import {
  inviteGroupMemberFormAction,
  cancelGroupInvite,
  resendGroupInvite,
} from "@/app/actions/groups";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Copy, Check, X, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface Invite {
  id: string;
  email: string;
  invitee_name?: string | null;
  status: string;
  created_at: string;
  expires_at: string;
  token?: string;
  last_sent_at?: string | null;
  accepted_at?: string | null;
}

interface GroupInviteManagerProps {
  groupId: string;
  initialInvites: Invite[];
  /** Public site origin for invite links (no trailing slash). Falls back to window.location.origin in browser. */
  inviteLinkBase?: string;
}

function isPastExpiry(iso: string): boolean {
  return new Date(iso).getTime() <= Date.now();
}

function pendingRowBadge(inv: Invite): { label: string; urgent: boolean } {
  if (isPastExpiry(inv.expires_at)) {
    return { label: "Link expired", urgent: true };
  }
  const msLeft = new Date(inv.expires_at).getTime() - Date.now();
  const twoDays = 2 * 24 * 60 * 60 * 1000;
  if (msLeft < twoDays) return { label: "Expires soon", urgent: true };
  return { label: "Pending", urgent: false };
}

function pastStatusLabel(status: string): string {
  switch (status) {
    case "accepted":
      return "Accepted";
    case "cancelled":
      return "Cancelled";
    case "expired":
      return "Expired";
    default:
      return status;
  }
}

export function GroupInviteManager({
  groupId,
  initialInvites,
  inviteLinkBase,
}: GroupInviteManagerProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [invites, setInvites] = useState(initialInvites);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [inlineSuccess, setInlineSuccess] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const [state, formAction, isPending] = useActionState(
    inviteGroupMemberFormAction.bind(null, groupId),
    null
  );

  function resolveLinkBase(): string {
    if (inviteLinkBase?.trim()) return inviteLinkBase.replace(/\/$/, "");
    if (typeof window !== "undefined") return window.location.origin;
    return "";
  }

  function inviteUrlForToken(token: string): string | null {
    const base = resolveLinkBase();
    if (!base) return null;
    return `${base}/app/groups/invite/${token}`;
  }

  useEffect(() => {
    if (!state) return;
    setInlineError(null);
    setInlineSuccess(null);
    if ("error" in state && state.error) {
      setInlineError(state.error);
      toast.error(state.error);
      return;
    }
    if ("emailSent" in state && state.emailSent) {
      const addr = email.trim();
      const msg = name.trim()
        ? `Invite email sent to ${addr} (${name.trim()})`
        : `Invite email sent to ${addr}`;
      setInlineSuccess(msg);
      toast.success(msg);
      setLastInviteUrl(null);
      setTimeout(() => setInlineSuccess(null), 5000);
    } else {
      const err = "emailError" in state ? state.emailError : undefined;
      toast.warning(
        err
          ? `Invite created — ${err}`
          : "Invite created — email could not be sent. Copy the link below."
      );
      setLastInviteUrl("acceptUrl" in state ? state.acceptUrl ?? null : null);
    }
    setEmail("");
    setName("");
    if ("inviteId" in state && state.inviteId) {
      const inviteId = state.inviteId;
      const expiresAt = "expiresAt" in state ? state.expiresAt : null;
      const lastSentAt =
        "lastSentAt" in state ? state.lastSentAt : new Date().toISOString();
      const token = "token" in state ? state.token : undefined;
      setInvites((prev) =>
        prev.some((i) => i.id === inviteId)
          ? prev
          : [
              ...prev,
              {
                id: inviteId,
                email: email.trim(),
                invitee_name: name.trim() || null,
                status: "pending",
                created_at: new Date().toISOString(),
                expires_at: expiresAt ?? new Date().toISOString(),
                last_sent_at: lastSentAt,
                token: typeof token === "string" ? token : undefined,
              },
            ]
      );
    }
  }, [state, name, email]);

  const sending = isPending;

  function handleCancelInvite(inviteId: string) {
    setCancellingId(inviteId);
    startTransition(async () => {
      const res = await cancelGroupInvite(groupId, inviteId);
      setCancellingId(null);
      if ("error" in res && res.error) {
        toast.error(res.error);
        return;
      }
      setInvites((prev) =>
        prev.map((i) =>
          i.id === inviteId ? { ...i, status: "cancelled" } : i
        )
      );
      toast.success("Invite cancelled");
    });
  }

  function handleResendInvite(inv: Invite) {
    if (inv.status !== "pending") {
      toast.error("Only pending invites can be resent");
      return;
    }
    setResendingId(inv.id);
    startTransition(async () => {
      const res = await resendGroupInvite(groupId, inv.id);
      setResendingId(null);
      if ("error" in res && res.error) {
        toast.error(res.error);
        return;
      }
      if (!("success" in res) || !res.success) return;

      setInvites((prev) =>
        prev.map((i) =>
          i.id === res.inviteId
            ? {
                ...i,
                token: res.token,
                expires_at: res.expires_at,
                last_sent_at: res.last_sent_at,
              }
            : i
        )
      );

      if (res.emailSent) {
        toast.success(`Invite resent to ${res.resentToEmail}`);
      } else {
        toast.warning(
          res.emailError
            ? `Invite updated — ${res.emailError}`
            : "Invite updated — email could not be sent."
        );
        setLastInviteUrl(res.acceptUrl);
      }
    });
  }

  async function copyInviteLink(inv: Invite) {
    const token = inv.token;
    if (!token) {
      toast.error("Invite link is not available");
      return;
    }
    const url = inviteUrlForToken(token);
    if (!url) {
      toast.error("Set NEXT_PUBLIC_SITE_URL to copy invite links from here.");
      return;
    }
    await copyUrl(url);
  }

  async function copyUrl(url: string) {
    await navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopiedUrl(null), 2000);
  }

  const outstanding = invites.filter((i) => i.status === "pending");
  const pastInvites = invites
    .filter((i) => i.status !== "pending")
    .slice(0, 25);

  return (
    <div className="space-y-6 rounded-xl border border-stone-200 dark:border-stone-800 p-6 bg-stone-50/30 dark:bg-stone-900/20">
      <h2 className="text-sm font-medium text-stone-700 dark:text-stone-300">
        Invite by email
      </h2>
      <form action={formAction} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Smith"
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="friend@example.com"
              required
            />
          </div>
        </div>
        <Button type="submit" disabled={sending}>
          {sending ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
          Send invite
        </Button>
      </form>
      {inlineError && (
        <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
          {inlineError}
        </p>
      )}
      {inlineSuccess && (
        <p className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
          {inlineSuccess}
        </p>
      )}
      <p className="text-xs text-stone-500 dark:text-stone-400">
        An invite email will be sent with a link to join. They must sign in with
        the same email to accept.
      </p>

      {lastInviteUrl && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Copy this link if the email was not sent:
        </p>
      )}
      {lastInviteUrl && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-stone-100 dark:bg-stone-800">
          <code className="flex-1 text-xs truncate text-stone-700 dark:text-stone-300">
            {lastInviteUrl}
          </code>
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyUrl(lastInviteUrl)}
          >
            {copiedUrl === lastInviteUrl ? (
              <Check className="size-4" />
            ) : (
              <Copy className="size-4" />
            )}
          </Button>
        </div>
      )}

      {outstanding.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-stone-600 dark:text-stone-400">
            Outstanding invites
          </h3>
          <ul className="space-y-3">
            {outstanding.map((inv) => {
              const badge = pendingRowBadge(inv);
              return (
                <li
                  key={inv.id}
                  className="rounded-lg border border-stone-200 dark:border-stone-700 bg-white/60 dark:bg-stone-900/40 p-3 space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm text-stone-800 dark:text-stone-200 truncate">
                        {inv.invitee_name
                          ? `${inv.invitee_name} (${inv.email})`
                          : inv.email}
                      </p>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                        Expires{" "}
                        {new Date(inv.expires_at).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                        {inv.last_sent_at && (
                          <>
                            {" · "}
                            Last sent{" "}
                            {new Date(inv.last_sent_at).toLocaleString(
                              undefined,
                              {
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </>
                        )}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded w-fit ${
                        badge.urgent
                          ? "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200"
                          : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400"
                      }`}
                    >
                      {badge.label}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8"
                      disabled={resendingId === inv.id}
                      onClick={() => handleResendInvite(inv)}
                    >
                      {resendingId === inv.id ? (
                        <Loader2 className="size-4 animate-spin mr-1" />
                      ) : (
                        <RefreshCw className="size-4 mr-1" />
                      )}
                      Resend
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8"
                      disabled={!inv.token || !resolveLinkBase()}
                      onClick={() => copyInviteLink(inv)}
                    >
                      {inv.token &&
                      copiedUrl === inviteUrlForToken(inv.token) ? (
                        <Check className="size-4 mr-1" />
                      ) : (
                        <Copy className="size-4 mr-1" />
                      )}
                      Copy link
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 text-stone-500"
                      disabled={cancellingId === inv.id}
                      onClick={() => handleCancelInvite(inv.id)}
                      aria-label={`Cancel invite to ${inv.email}`}
                    >
                      {cancellingId === inv.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <X className="size-4" />
                      )}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {pastInvites.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-stone-600 dark:text-stone-400">
            Past invites
          </h3>
          <ul className="space-y-1.5 text-sm">
            {pastInvites.map((inv) => (
              <li
                key={inv.id}
                className="flex items-center justify-between gap-2 text-stone-600 dark:text-stone-400"
              >
                <span className="truncate">
                  {inv.invitee_name
                    ? `${inv.invitee_name} (${inv.email})`
                    : inv.email}
                </span>
                <span className="flex items-center gap-2 shrink-0 text-xs">
                  <span
                    className={`px-2 py-0.5 rounded ${
                      inv.status === "accepted"
                        ? "bg-emerald-100/80 dark:bg-emerald-900/25 text-emerald-800 dark:text-emerald-300"
                        : inv.status === "cancelled"
                          ? "bg-stone-100 dark:bg-stone-800 text-stone-600"
                          : "bg-stone-200/80 dark:bg-stone-800 text-stone-600 dark:text-stone-400"
                    }`}
                  >
                    {pastStatusLabel(inv.status)}
                  </span>
                  {inv.accepted_at && inv.status === "accepted" && (
                    <span className="text-stone-400 dark:text-stone-500 hidden sm:inline">
                      {new Date(inv.accepted_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
