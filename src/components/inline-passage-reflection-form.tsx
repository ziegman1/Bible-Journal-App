"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { createJournalEntry } from "@/app/actions/journal";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SoapsFieldRow } from "@/components/soaps-field-row";
import { Loader2, BookMarked, Link2 } from "lucide-react";
import { toast } from "sonner";
import { formatSoapsShareBody, type SoapsFields } from "@/lib/format-soaps-share";
import { ShareViaEmailTextButtons } from "@/components/entry-share";
import { appendSharePromoToPlainText } from "@/lib/share-promo";
import { cn } from "@/lib/utils";

function publicTryStorageKey(reference: string): string {
  return `badwr-public-try-soaps-draft-v1:${reference}`;
}

type PersistenceMode = "journal" | "public-try";

interface InlinePassageReflectionFormProps {
  reference: string;
  bookName: string;
  bookId: string;
  chapter: number;
  verseStart: number | null;
  verseEnd: number | null;
  passageText?: React.ReactNode;
  /** Passed through for future use; bookmark is updated from reader scroll/end-of-chapter only. */
  chatSoapsGroupId?: string;
  compact?: boolean;
  onSaved?: (entryId: string) => void;
  onClose?: () => void;
  /** `journal` (default): save to Supabase. `public-try`: same UI, local/session draft, finish → conversion. */
  persistenceMode?: PersistenceMode;
  /** Signup URL after public try completion (e.g. `/signup?redirectTo=...`). */
  signupConversionHref?: string;
}

type PublicDraft = {
  reference: string;
  scripture: string;
  observation: string;
  application: string;
  prayer: string;
  share: string;
  tags: string;
};

function readPublicDraft(reference: string): PublicDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(publicTryStorageKey(reference));
    if (!raw) return null;
    const o = JSON.parse(raw) as Partial<PublicDraft>;
    if (typeof o.reference !== "string") return null;
    return {
      reference: o.reference,
      scripture: typeof o.scripture === "string" ? o.scripture : "",
      observation: typeof o.observation === "string" ? o.observation : "",
      application: typeof o.application === "string" ? o.application : "",
      prayer: typeof o.prayer === "string" ? o.prayer : "",
      share: typeof o.share === "string" ? o.share : "",
      tags: typeof o.tags === "string" ? o.tags : "",
    };
  } catch {
    return null;
  }
}

function writePublicDraft(d: PublicDraft) {
  try {
    sessionStorage.setItem(publicTryStorageKey(d.reference), JSON.stringify(d));
  } catch {
    /* quota / private mode */
  }
}

function clearPublicDraft(reference: string) {
  try {
    sessionStorage.removeItem(publicTryStorageKey(reference));
  } catch {
    /* ignore */
  }
}

export function InlinePassageReflectionForm({
  reference,
  bookName,
  bookId: _bookId,
  chapter,
  verseStart,
  verseEnd,
  passageText,
  chatSoapsGroupId: _chatSoapsGroupId,
  compact = false,
  onSaved,
  onClose,
  persistenceMode = "journal",
  signupConversionHref = "/signup",
}: InlinePassageReflectionFormProps) {
  const [scripture, setScripture] = useState("");
  const [observation, setObservation] = useState("");
  const [application, setApplication] = useState("");
  const [prayer, setPrayer] = useState("");
  const [share, setShare] = useState("");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedEntryId, setSavedEntryId] = useState<string | null>(null);
  const [savedShareBody, setSavedShareBody] = useState<string | null>(null);
  const [publicPhase, setPublicPhase] = useState<"form" | "conversion">("form");
  const [hydrated, setHydrated] = useState(persistenceMode !== "public-try");
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, []);

  useEffect(() => {
    if (persistenceMode !== "public-try") return;
    setPublicPhase("form");
    const d = readPublicDraft(reference);
    if (d && d.reference === reference) {
      setScripture(d.scripture);
      setObservation(d.observation);
      setApplication(d.application);
      setPrayer(d.prayer);
      setShare(d.share);
      setTags(d.tags);
    } else {
      setScripture("");
      setObservation("");
      setApplication("");
      setPrayer("");
      setShare("");
      setTags("");
    }
    setHydrated(true);
  }, [persistenceMode, reference]);

  useEffect(() => {
    if (persistenceMode !== "public-try" || !hydrated) return;
    writePublicDraft({
      reference,
      scripture,
      observation,
      application,
      prayer,
      share,
      tags,
    });
  }, [
    persistenceMode,
    hydrated,
    reference,
    scripture,
    observation,
    application,
    prayer,
    share,
    tags,
  ]);

  const soapsFields: SoapsFields = {
    scriptureText: scripture,
    observation,
    application,
    prayer,
    share,
  };

  const hasAnySoaps =
    scripture.trim() ||
    observation.trim() ||
    application.trim() ||
    prayer.trim() ||
    share.trim();

  const shareSubject = `SOAPS — ${reference}`;
  const draftShareBody = formatSoapsShareBody(reference, soapsFields);
  const shareBodyWithPromo = appendSharePromoToPlainText(draftShareBody);

  const handleStartOverPublic = useCallback(() => {
    setScripture("");
    setObservation("");
    setApplication("");
    setPrayer("");
    setShare("");
    setTags("");
    setPublicPhase("form");
    clearPublicDraft(reference);
  }, [reference]);

  async function handleSave() {
    setSaving(true);
    const result = await createJournalEntry({
      reference,
      book: bookName,
      chapter,
      verseStart,
      verseEnd,
      scriptureText: scripture || undefined,
      userReflection: observation || undefined,
      prayer: prayer || undefined,
      application: application || undefined,
      soapsShare: share || undefined,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });
    setSaving(false);

    if (result?.error) {
      toast.error(result.error);
      return;
    }

    setSavedShareBody(draftShareBody);
    setSavedEntryId(result.entryId ?? null);
    toast.success("Saved to journal");
    setScripture("");
    setObservation("");
    setApplication("");
    setPrayer("");
    setShare("");
    setTags("");
    onSaved?.(result.entryId!);
  }

  function handleFinishPublicTry() {
    setPublicPhase("conversion");
    toast.success("Nice work finishing this SOAPS");
  }

  async function copyShareMessage() {
    try {
      await navigator.clipboard.writeText(shareBodyWithPromo);
      toast.success("Message copied");
    } catch {
      toast.error("Could not copy");
    }
  }

  function handleTagsKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    (e.currentTarget as HTMLInputElement).blur();
  }

  if (persistenceMode === "public-try" && publicPhase === "conversion") {
    return (
      <div className="space-y-5 rounded-lg border border-border bg-card p-4">
        <div className="space-y-2">
          <h3 className="text-lg font-serif font-light text-foreground">Want to keep going?</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Create a free BADWR account to save your entries, pick up where you left off, track your growth over time,
            and use the full discipleship dashboard—including your own Scripture passages whenever you read.
          </p>
        </div>
        <Link
          href={signupConversionHref}
          className={cn(buttonVariants({ size: "lg" }), "inline-flex w-full justify-center sm:w-auto")}
        >
          Create your free account
        </Link>
        <div className="space-y-2 border-t border-border pt-4">
          <p className="text-xs font-medium text-stone-700 dark:text-stone-300">
            Share this SOAPS (email or text)
          </p>
          <ShareViaEmailTextButtons subject={shareSubject} body={draftShareBody} />
          <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => void copyShareMessage()}>
            <Link2 className="size-4" aria-hidden />
            Copy message
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" size="sm" onClick={handleStartOverPublic}>
            Start over
          </Button>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (savedEntryId) {
    return (
      <div className="space-y-4 rounded-lg border border-border bg-card p-4">
        <p className="text-sm text-stone-600 dark:text-stone-400">
          <Link href={`/app/journal/${savedEntryId}`} className="underline">
            View saved entry →
          </Link>
        </p>
        {savedShareBody && (
          <div className="space-y-2 border-t border-border pt-4">
            <p className="text-xs font-medium text-stone-600 dark:text-stone-400">
              Share this SOAPS entry
            </p>
            <ShareViaEmailTextButtons subject={shareSubject} body={savedShareBody} />
          </div>
        )}
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        )}
      </div>
    );
  }

  const primaryAction =
    persistenceMode === "public-try" ? (
      <Button onClick={handleFinishPublicTry} disabled={!hasAnySoaps}>
        Finish SOAPS
      </Button>
    ) : (
      <Button onClick={() => void handleSave()} disabled={saving || !hasAnySoaps}>
        {saving ? (
          <Loader2 className="size-4 animate-spin mr-2" />
        ) : (
          <BookMarked className="size-4 mr-2" />
        )}
        Save to journal
      </Button>
    );

  return (
    <div
      ref={formRef}
      className={`flex gap-4 rounded-lg border border-border bg-card p-4 ${compact ? "flex-col min-h-0" : "flex-col md:flex-row"} ${!compact ? "mt-2 mb-4" : ""}`}
    >
      {passageText ? (
        <div className={compact ? "shrink-0" : "md:w-1/2 md:min-w-0 shrink-0"}>
          <h3 className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
            Selected passage
          </h3>
          <p className="mb-2 text-xs text-stone-500 dark:text-stone-500">
            Type the verses word for word in Scripture below (you can copy from here if
            helpful).
          </p>
          <div className="text-stone-600 dark:text-stone-400 text-sm font-serif leading-relaxed">
            {passageText}
          </div>
        </div>
      ) : null}

      <div
        className={`flex-1 min-w-0 ${
          passageText
            ? compact
              ? "min-h-0 pt-4"
              : "space-y-5 md:border-l md:border-stone-200 md:dark:border-stone-800 md:pl-4"
            : compact
              ? "min-h-0"
              : "space-y-5"
        }`}
      >
        <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200">
          SOAPS{passageText ? "" : ` — ${reference}`}
        </h3>

        <div className={compact ? "space-y-4" : "space-y-4"}>
          <SoapsFieldRow letter="S" label="Scripture" htmlFor="inline-scripture">
            <Textarea
              id="inline-scripture"
              placeholder="Type the passage word for word…"
              value={scripture}
              onChange={(e) => setScripture(e.target.value)}
              rows={4}
              className="resize-none font-serif text-[0.95rem] leading-relaxed"
            />
          </SoapsFieldRow>

          <SoapsFieldRow letter="O" label="Observation" htmlFor="inline-observation">
            <Textarea
              id="inline-observation"
              placeholder="What do you notice in this passage?"
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </SoapsFieldRow>

          <SoapsFieldRow letter="A" label="Application" htmlFor="inline-application">
            <Textarea
              id="inline-application"
              placeholder="How will you apply this?"
              value={application}
              onChange={(e) => setApplication(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </SoapsFieldRow>

          <SoapsFieldRow letter="P" label="Prayer" htmlFor="inline-prayer">
            <Textarea
              id="inline-prayer"
              placeholder="A prayer inspired by this passage…"
              value={prayer}
              onChange={(e) => setPrayer(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </SoapsFieldRow>

          <SoapsFieldRow letter="S" label="Share" htmlFor="inline-share">
            <Textarea
              id="inline-share"
              placeholder="Who will you share this with, and how?"
              value={share}
              onChange={(e) => setShare(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </SoapsFieldRow>
        </div>

        <div className="space-y-2">
          <Label htmlFor="inline-tags">Tags (comma-separated)</Label>
          <Input
            id="inline-tags"
            placeholder="faith, hope, love"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            enterKeyHint="done"
            onKeyDown={handleTagsKeyDown}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {primaryAction}
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </div>

        <div className="space-y-2 border-t border-border pt-4">
          <p className="text-xs font-medium text-stone-700 dark:text-stone-300">
            Share this SOAPS (email or text)
          </p>
          <p className="text-[0.7rem] text-stone-500 dark:text-stone-500">
            Opens your mail app or Messages with this entry filled in. Add content above
            first if the message should include your notes.
          </p>
          <ShareViaEmailTextButtons subject={shareSubject} body={draftShareBody} />
        </div>
      </div>
    </div>
  );
}
