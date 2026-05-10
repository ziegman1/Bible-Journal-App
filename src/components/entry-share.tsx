"use client";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatSoapsBodyFields, type SoapsFields } from "@/lib/format-soaps-share";
import { appendSharePromoToPlainText } from "@/lib/share-promo";
import { Share2, Mail, MessageCircle } from "lucide-react";

type ShareViaEmailTextButtonsProps = {
  subject: string;
  body: string;
  className?: string;
  /** When false, the body is used as-is (no “Sent from … / URL” footer). Default true. */
  appendProductFooter?: boolean;
  /** Prefill the To: line (e.g. journey invite email). */
  mailtoRecipient?: string;
  /** Prefill the SMS recipient (optional; body still opens if empty). */
  smsRecipient?: string;
  /** Override default button labels. */
  emailButtonLabel?: string;
  smsButtonLabel?: string;
  /** When true, links are inert and do not open mail or SMS. */
  disabled?: boolean;
  /** Fires when the user chooses Email or Text (before the OS handoff). Ignored if `beforeShareNavigate` is set. */
  onShareChannelIntent?: (channel: "email" | "sms") => void;
  /**
   * When set, click is intercepted: await this (e.g. persist share intent), then navigate to mailto/sms.
   * Return false to cancel opening the share sheet.
   */
  beforeShareNavigate?: (channel: "email" | "sms") => Promise<boolean>;
};

export function ShareViaEmailTextButtons({
  subject,
  body,
  className,
  appendProductFooter = true,
  mailtoRecipient,
  smsRecipient,
  emailButtonLabel = "Share via Email",
  smsButtonLabel = "Share via Text",
  disabled = false,
  onShareChannelIntent,
  beforeShareNavigate,
}: ShareViaEmailTextButtonsProps) {
  const bodyWithPromo = appendProductFooter ? appendSharePromoToPlainText(body) : body.trimEnd();
  const to = mailtoRecipient?.trim();
  const mailtoUrl = to
    ? `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyWithPromo)}`
    : `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyWithPromo)}`;
  const smsTo = smsRecipient?.trim();
  const smsUrl = smsTo
    ? `sms:${smsTo.replace(/\s+/g, "")}?body=${encodeURIComponent(bodyWithPromo)}`
    : `sms:?body=${encodeURIComponent(bodyWithPromo)}`;

  async function handleClick(
    e: React.MouseEvent<HTMLAnchorElement>,
    channel: "email" | "sms",
    url: string
  ) {
    if (beforeShareNavigate) {
      e.preventDefault();
      const ok = await beforeShareNavigate(channel);
      if (ok) {
        onShareChannelIntent?.(channel);
        window.location.href = url;
      }
      return;
    }
    onShareChannelIntent?.(channel);
  }

  if (disabled) {
    return (
      <div className={cn("flex flex-wrap gap-2", className)} aria-disabled="true">
        <span
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "pointer-events-none cursor-not-allowed opacity-50"
          )}
        >
        <Mail className="size-4 mr-2" />
        {emailButtonLabel}
      </span>
        <span
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "pointer-events-none cursor-not-allowed opacity-50"
          )}
        >
          <MessageCircle className="size-4 mr-2" />
          {smsButtonLabel}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <a
        href={mailtoUrl}
        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        onClick={(e) => void handleClick(e, "email", mailtoUrl)}
      >
        <Mail className="size-4 mr-2" />
        {emailButtonLabel}
      </a>
      <a
        href={smsUrl}
        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        onClick={(e) => void handleClick(e, "sms", smsUrl)}
      >
        <MessageCircle className="size-4 mr-2" />
        {smsButtonLabel}
      </a>
    </div>
  );
}

interface EntryShareProps {
  reference: string;
  entryDate: string;
  title: string | null;
  scriptureText: string | null;
  observation: string | null;
  application: string | null;
  prayer: string | null;
  soapsShare: string | null;
  userQuestion: string | null;
  tags: string[];
}

function formatEntryForShare(props: EntryShareProps): string {
  const soaps: SoapsFields = {
    scriptureText: props.scriptureText ?? "",
    observation: props.observation ?? "",
    application: props.application ?? "",
    prayer: props.prayer ?? "",
    share: props.soapsShare ?? "",
  };
  const hasSoaps = Object.values(soaps).some((s) => s.trim().length > 0);

  const lines: string[] = [];
  lines.push(props.reference);
  lines.push(props.entryDate);
  if (props.title) lines.push(props.title);
  lines.push("");

  if (props.userQuestion) {
    lines.push("Question: " + props.userQuestion);
    lines.push("");
  }

  if (hasSoaps) {
    lines.push(formatSoapsBodyFields(soaps));
    lines.push("");
  } else {
    if (props.observation) {
      lines.push("Observation: " + props.observation);
      lines.push("");
    }
    if (props.application) {
      lines.push("Application: " + props.application);
      lines.push("");
    }
    if (props.prayer) {
      lines.push("Prayer: " + props.prayer);
      lines.push("");
    }
  }

  if (props.tags.length > 0) {
    lines.push("Tags: " + props.tags.join(", "));
  }
  return lines.join("\n").trimEnd();
}

export function EntryShare(props: EntryShareProps) {
  const body = formatEntryForShare(props);
  const subject = `BADWR: ${props.reference}`;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-stone-600 dark:text-stone-400 flex items-center gap-2">
        <Share2 className="size-4" />
        Share
      </h3>
      <p className="text-xs text-stone-500 dark:text-stone-400">
        Share this entry via email or text message
      </p>
      <ShareViaEmailTextButtons subject={subject} body={body} />
    </div>
  );
}
