"use client";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Share2, Mail, MessageCircle } from "lucide-react";

interface EntryShareProps {
  reference: string;
  entryDate: string;
  title: string | null;
  observation: string | null;
  application: string | null;
  prayer: string | null;
  userQuestion: string | null;
  tags: string[];
}

function formatEntryForShare(props: EntryShareProps): string {
  const lines: string[] = [];
  lines.push(props.reference);
  lines.push(props.entryDate);
  if (props.title) lines.push(props.title);
  lines.push("");
  if (props.userQuestion) {
    lines.push("Question: " + props.userQuestion);
    lines.push("");
  }
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
  if (props.tags.length > 0) {
    lines.push("Tags: " + props.tags.join(", "));
  }
  return lines.join("\n");
}

export function EntryShare(props: EntryShareProps) {
  const body = formatEntryForShare(props);
  const subject = `Bible Journal: ${props.reference}`;

  const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const smsUrl = `sms:?body=${encodeURIComponent(body)}`;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-stone-600 dark:text-stone-400 flex items-center gap-2">
        <Share2 className="size-4" />
        Share
      </h3>
      <p className="text-xs text-stone-500 dark:text-stone-400">
        Share this entry via email or text message
      </p>
      <div className="flex gap-2">
        <a
          href={mailtoUrl}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          <Mail className="size-4 mr-2" />
          Email
        </a>
        <a
          href={smsUrl}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          <MessageCircle className="size-4 mr-2" />
          Text
        </a>
      </div>
    </div>
  );
}
