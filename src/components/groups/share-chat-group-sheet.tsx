"use client";

import { useState, type FormEvent } from "react";
import { sendChatGrowthInvite } from "@/app/actions/chat-growth-invite";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Props = {
  senderDisplayName: string;
};

export function ShareChatGroupSheet({ senderDisplayName }: Props) {
  const [open, setOpen] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [personalNote, setPersonalNote] = useState("");
  const [clientError, setClientError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  function resetForm() {
    setRecipientName("");
    setRecipientEmail("");
    setPersonalNote("");
    setClientError(null);
    setSent(false);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setClientError(null);
      setPending(false);
      if (sent) resetForm();
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setClientError(null);
    const name = recipientName.trim();
    const email = recipientEmail.trim().toLowerCase();
    if (!name) {
      setClientError("Recipient name is required.");
      return;
    }
    if (!email || !EMAIL_RE.test(email)) {
      setClientError("Please enter a valid email address.");
      return;
    }
    setPending(true);
    const fd = new FormData();
    fd.set("recipientName", name);
    fd.set("recipientEmail", email);
    fd.set("personalNote", personalNote.trim());
    const res = await sendChatGrowthInvite(fd);
    setPending(false);
    if (!res.ok) {
      setClientError(res.error);
      return;
    }
    setSent(true);
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "inline-flex")}
      >
        Share CHAT Group
      </SheetTrigger>
      <SheetContent side="right" className="w-full max-h-dvh overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Share CHAT Group</SheetTitle>
          <SheetDescription>
            Send a warm invitation to explore CHAT. No group details are shared — only a link
            to learn more and get started.
          </SheetDescription>
        </SheetHeader>

        {sent ? (
          <div className="space-y-4 px-4 pb-4">
            <p className="text-sm text-stone-700 dark:text-stone-300">Invitation sent.</p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetForm();
                }}
              >
                Send another
              </Button>
              <Button type="button" variant="default" onClick={() => setOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={(ev) => void handleSubmit(ev)} className="flex flex-col gap-4 px-4 pb-4">
            {clientError && (
              <p className="text-sm text-destructive" role="alert">
                {clientError}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="share-recipient-name">Recipient name</Label>
              <Input
                id="share-recipient-name"
                name="recipientName"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Their first name"
                required
                maxLength={200}
                autoComplete="name"
                className="bg-white dark:bg-stone-900"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="share-recipient-email">Recipient email</Label>
              <Input
                id="share-recipient-email"
                name="recipientEmail"
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="friend@example.com"
                required
                autoComplete="email"
                className="bg-white dark:bg-stone-900"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="share-personal-note">Personal note (optional)</Label>
              <Textarea
                id="share-personal-note"
                name="personalNote"
                value={personalNote}
                onChange={(e) => setPersonalNote(e.target.value)}
                placeholder="A short encouragement or context…"
                rows={3}
                maxLength={2000}
                className="resize-y bg-white dark:bg-stone-900"
              />
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              The message will show you as{" "}
              <strong className="font-medium">{senderDisplayName}</strong>.
            </p>
            <SheetFooter className="flex-row flex-wrap gap-2 sm:justify-start p-0">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Sending…" : "Send Invite"}
              </Button>
            </SheetFooter>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
