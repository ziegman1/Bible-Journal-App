"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { createJournalEntry } from "@/app/actions/journal";
import { recordChatSoapsChapterComplete } from "@/app/actions/chat-soaps-progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SoapsFieldRow } from "@/components/soaps-field-row";
import { Loader2, BookMarked } from "lucide-react";
import { toast } from "sonner";
import { formatSoapsShareBody, type SoapsFields } from "@/lib/format-soaps-share";
import { ShareViaEmailTextButtons } from "@/components/entry-share";

interface InlinePassageReflectionFormProps {
  reference: string;
  bookName: string;
  bookId: string;
  chapter: number;
  verseStart: number | null;
  verseEnd: number | null;
  passageText?: React.ReactNode;
  /** Dashboard CHAT SOAPS flow: marks this chapter complete for resume link only. */
  chatSoapsGroupId?: string;
  compact?: boolean;
  onSaved?: (entryId: string) => void;
  onClose?: () => void;
}

export function InlinePassageReflectionForm({
  reference,
  bookName,
  bookId,
  chapter,
  verseStart,
  verseEnd,
  passageText,
  chatSoapsGroupId,
  compact = false,
  onSaved,
  onClose,
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
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, []);

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

    if (chatSoapsGroupId) {
      const prog = await recordChatSoapsChapterComplete(
        chatSoapsGroupId,
        bookId,
        chapter
      );
      if ("error" in prog) {
        toast.message(
          "Journal saved — CHAT reading spot could not be updated (try again after refresh)."
        );
      }
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

  return (
    <div
      ref={formRef}
      className={`flex gap-4 rounded-lg border border-border bg-card p-4 ${compact ? "flex-col" : "flex-col md:flex-row"} ${!compact ? "mt-2 mb-4" : ""}`}
    >
      {passageText && (
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
      )}
      <div
        className={`flex-1 min-w-0 space-y-5 ${
          passageText
            ? compact
              ? "border-t border-border pt-4"
              : "md:border-l md:border-stone-200 md:dark:border-stone-800 md:pl-4"
            : ""
        }`}
      >
        <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200">
          SOAPS{passageText ? "" : ` — ${reference}`}
        </h3>

        <div className="space-y-4">
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
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={handleSave} disabled={saving || !hasAnySoaps}>
            {saving ? (
              <Loader2 className="size-4 animate-spin mr-2" />
            ) : (
              <BookMarked className="size-4 mr-2" />
            )}
            Save to journal
          </Button>
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
