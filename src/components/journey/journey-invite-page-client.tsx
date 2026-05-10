"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { commitGuidedJourneyInviteSend, removeGuidedJourneyInvite } from "@/app/actions/linear-journey";
import { ShareViaEmailTextButtons } from "@/components/entry-share";
import { buttonVariants } from "@/components/ui/button-variants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inviteWasSent, type GuidedJourneyInvite } from "@/lib/app-experience-mode/linear-discipleship-path";
import { journeyInviteEmailSubject, journeyInviteShareBody } from "@/lib/guided-journey/journey-invite-share";
import { cn } from "@/lib/utils";

export function JourneyInvitePageClient({
  invites,
  blockingAfterSoaps,
}: {
  invites: GuidedJourneyInvite[];
  blockingAfterSoaps: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [removeId, setRemoveId] = useState<string | null>(null);

  const sentInvites = useMemo(() => invites.filter(inviteWasSent), [invites]);
  const shareBody = useMemo(() => journeyInviteShareBody(name), [name]);
  const subject = useMemo(() => journeyInviteEmailSubject(), []);

  async function beforeShare(channel: "email" | "sms"): Promise<boolean> {
    setFormError(null);
    const res = await commitGuidedJourneyInviteSend({
      name,
      phone,
      email,
      channel: channel === "sms" ? "sms" : "email",
    });
    if ("error" in res && res.error) {
      setFormError(res.error);
      return false;
    }
    console.log("[BADWR DEBUG] router.refresh triggered from: src/components/journey/journey-invite-page-client.tsx — #1");
    router.refresh();
    return true;
  }

  async function onRemove(id: string) {
    setFormError(null);
    setRemoveId(id);
    const res = await removeGuidedJourneyInvite({ id });
    setRemoveId(null);
    if ("error" in res && res.error) {
      setFormError(res.error);
      return;
    }
    console.log("[BADWR DEBUG] router.refresh triggered from: src/components/journey/journey-invite-page-client.tsx — #2");
    router.refresh();
  }

  const canHandoff = name.trim().length >= 1;

  return (
    <div className="space-y-10">
      <div className="rounded-2xl border border-sky-200/80 bg-gradient-to-br from-white via-sky-50/40 to-blue-50/30 p-6 shadow-sm dark:border-sky-900/35 dark:from-stone-950 dark:via-sky-950/15 dark:to-blue-950/10 sm:p-8">
        <h1 className="font-serif text-2xl font-light text-stone-900 dark:text-stone-100 sm:text-3xl">
          Invite Someone Into the Journey
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-stone-700 dark:text-stone-300">
          God rarely grows us in isolation. Think of one person you can share this journey with as you
          go. You do not need to have it all figured out. Just invite someone to walk with you.
        </p>
      </div>

      {sentInvites.length >= 1 ? (
        <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-5 text-sm text-emerald-950 dark:border-emerald-900/40 dark:bg-emerald-950/25 dark:text-emerald-100">
          <p className="font-medium">You opened a real invite—that counts.</p>
          <p className="mt-2 text-emerald-900/90 dark:text-emerald-100/90">
            You can keep naming people here anytime. Your journey home always has your next step.
          </p>
          <Link
            href="/app/journey"
            className={cn(buttonVariants({ variant: "default" }), "mt-4 inline-flex min-h-10")}
          >
            Return to journey home
          </Link>
        </div>
      ) : null}

      <section className="rounded-2xl border border-stone-200 bg-stone-50/80 p-6 dark:border-stone-800 dark:bg-stone-900/30 sm:p-8">
        {blockingAfterSoaps && sentInvites.length === 0 ? (
          <p className="mb-4 rounded-lg border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-sm text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/25 dark:text-amber-100">
            To open your next lesson after SOAPS, send one invite below—text or email is fine.
          </p>
        ) : null}
        <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100">Who are you bringing along?</h2>
        <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
          Add their name, then choose text or email. We only count an invite when you actually open your
          message app from here—same rhythm as sharing a lesson.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="ji-name">Name</Label>
            <Input
              id="ji-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="First name or nickname"
              autoComplete="name"
              className="bg-white dark:bg-stone-950"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ji-phone">Phone (optional)</Label>
            <Input
              id="ji-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="For text invite"
              type="tel"
              autoComplete="tel"
              className="bg-white dark:bg-stone-950"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ji-email">Email (optional)</Label>
            <Input
              id="ji-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="For email invite"
              type="email"
              autoComplete="email"
              className="bg-white dark:bg-stone-950"
            />
          </div>
        </div>

        {formError ? (
          <p className="mt-4 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{formError}</p>
        ) : null}

        <div className="mt-6">
          <ShareViaEmailTextButtons
            subject={subject}
            body={shareBody}
            mailtoRecipient={email.trim() || undefined}
            smsRecipient={phone.trim() || undefined}
            emailButtonLabel="Invite by Email"
            smsButtonLabel="Invite by Text"
            disabled={!canHandoff}
            beforeShareNavigate={async (ch) => {
              if (ch === "email" && !email.trim().includes("@")) {
                setFormError("Add their email, or use Invite by Text instead.");
                return false;
              }
              return beforeShare(ch);
            }}
          />
        </div>

        <p className="mt-8 text-xs text-muted-foreground leading-relaxed">
          Start with one person now. You will add more later.
        </p>
      </section>

      {sentInvites.length > 0 ? (
        <section className="rounded-2xl border border-stone-200 bg-white/90 p-6 dark:border-stone-800 dark:bg-stone-950/40 sm:p-8">
          <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100">Invites you&apos;ve sent</h2>
          <ul className="mt-4 space-y-3">
            {sentInvites.map((p) => (
              <li
                key={p.id}
                className="flex items-start justify-between gap-3 border-b border-stone-100 pb-3 text-sm last:border-0 last:pb-0 dark:border-stone-800"
              >
                <div>
                  <p className="font-medium text-stone-900 dark:text-stone-100">{p.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {p.sentVia === "sms" ? "Text" : "Email"}
                    {p.phone ? ` · ${p.phone}` : ""}
                    {p.email ? ` · ${p.email}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  className="shrink-0 rounded-md p-1.5 text-stone-500 hover:bg-stone-100 hover:text-destructive dark:hover:bg-stone-900"
                  onClick={() => void onRemove(p.id)}
                  disabled={removeId === p.id}
                  aria-label={`Remove ${p.name}`}
                >
                  {removeId === p.id ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <Trash2 className="size-4" aria-hidden />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Link
          href="/app/journey"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "min-h-10 inline-flex items-center")}
        >
          Back to journey home
        </Link>
      </div>
    </div>
  );
}
