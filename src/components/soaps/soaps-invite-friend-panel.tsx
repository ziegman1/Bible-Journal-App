"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { Mail, MessageSquare, Link2 } from "lucide-react";

type Props = {
  /** Public try-SOAPS URL (no signup required). */
  inviteUrl: string;
};

export function SoapsInviteFriendPanel({ inviteUrl }: Props) {
  const [copied, setCopied] = useState(false);

  const { mailtoHref, smsHref, shareBlurb } = useMemo(() => {
    const subject = "Try SOAPS (no signup)";
    const body = `I've been using this simple SOAPS Bible journaling method. You can try it here (no signup required):\n\n${inviteUrl}`;
    const mailtoHref = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    const smsBody = encodeURIComponent(
      `I've been using SOAPS for Bible journaling—you can try it free, no signup: ${inviteUrl}`
    );
    const smsHref = `sms:&body=${smsBody}`;
    return { mailtoHref, smsHref, shareBlurb: body };
  }, [inviteUrl]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast.success("Invite link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy—copy the link manually below.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-muted/30 p-4 dark:bg-muted/15">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
          Invite link
        </p>
        <p className="text-sm font-mono text-foreground break-all">{inviteUrl}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button type="button" variant="default" className="gap-2" onClick={() => void copyLink()}>
          <Link2 className="size-4" aria-hidden />
          {copied ? "Copied" : "Copy invite link"}
        </Button>
        <a
          href={mailtoHref}
          className={cn(buttonVariants({ variant: "outline", size: "default" }), "inline-flex gap-2")}
        >
          <Mail className="size-4" aria-hidden />
          Draft email
        </a>
        <a
          href={smsHref}
          className={cn(buttonVariants({ variant: "outline", size: "default" }), "inline-flex gap-2")}
        >
          <MessageSquare className="size-4" aria-hidden />
          Open Messages (SMS)
        </a>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        &quot;Open Messages&quot; works best on a phone; on desktop you can copy the link or use Draft email. They can
        try SOAPS in the browser first—signup is only needed if they want to save entries and build a rhythm in the
        app.
      </p>

      <details className="rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground">
        <summary className="cursor-pointer font-medium text-foreground">Suggested message (copy)</summary>
        <pre className="mt-3 whitespace-pre-wrap font-sans text-xs leading-relaxed text-foreground/90">
          {shareBlurb}
        </pre>
      </details>
    </div>
  );
}
