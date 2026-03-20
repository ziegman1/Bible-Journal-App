"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { inviteGroupMemberFormAction } from "@/app/actions/groups";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface Invite {
  id: string;
  email: string;
  invitee_name?: string | null;
  status: string;
  created_at: string;
  expires_at: string;
}

interface GroupInviteManagerProps {
  groupId: string;
  initialInvites: Invite[];
}

export function GroupInviteManager({
  groupId,
  initialInvites,
}: GroupInviteManagerProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [invites, setInvites] = useState(initialInvites);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null);

  const [state, formAction, isPending] = useActionState(
    inviteGroupMemberFormAction.bind(null, groupId),
    null
  );

  useEffect(() => {
    if (!state) return;
    if ("error" in state && state.error) {
      toast.error(state.error);
      return;
    }
    if ("emailSent" in state && state.emailSent) {
      toast.success(`Invite sent to ${name || email}`);
      setLastInviteUrl(null);
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
              },
            ]
      );
    }
  }, [state, name, email]);

  const sending = isPending;

  async function copyUrl(url: string) {
    await navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopiedUrl(null), 2000);
  }

  const pendingInvites = invites.filter((i) => i.status === "pending");

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

      {pendingInvites.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-stone-600 dark:text-stone-400">
            Pending invites
          </h3>
          <ul className="space-y-2">
            {pendingInvites.map((inv) => (
              <li
                key={inv.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-stone-700 dark:text-stone-300">
                  {inv.invitee_name ? `${inv.invitee_name} (${inv.email})` : inv.email}
                </span>
                <span className="text-stone-500 dark:text-stone-400 text-xs">
                  Expires{" "}
                  {new Date(inv.expires_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
