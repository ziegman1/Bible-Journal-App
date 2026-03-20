"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { createJournalEntry } from "@/app/actions/journal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, BookMarked } from "lucide-react";
import { toast } from "sonner";

interface InlinePassageReflectionFormProps {
  reference: string;
  bookName: string;
  bookId: string;
  chapter: number;
  verseStart: number | null;
  verseEnd: number | null;
  /** Optional passage text to show above or beside the form */
  passageText?: React.ReactNode;
  /** When true, use stacked layout (passage above form) - for narrow sidebars */
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
  compact = false,
  onSaved,
  onClose,
}: InlinePassageReflectionFormProps) {
  const [reflection, setReflection] = useState("");
  const [prayer, setPrayer] = useState("");
  const [application, setApplication] = useState("");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedEntryId, setSavedEntryId] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, []);

  async function handleSave() {
    setSaving(true);
    const result = await createJournalEntry({
      reference,
      book: bookName,
      chapter,
      verseStart,
      verseEnd,
      userReflection: reflection || undefined,
      prayer: prayer || undefined,
      application: application || undefined,
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

    setSavedEntryId(result.entryId ?? null);
    toast.success("Saved to journal");
    setReflection("");
    setPrayer("");
    setApplication("");
    setTags("");
    onSaved?.(result.entryId!);
  }

  if (savedEntryId) {
    return (
      <div className="rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/30 p-4">
        <p className="text-sm text-stone-600 dark:text-stone-400">
          <Link href={`/app/journal/${savedEntryId}`} className="underline">
            View saved entry →
          </Link>
        </p>
        {onClose && (
          <Button variant="ghost" size="sm" className="mt-2" onClick={onClose}>
            Close
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      ref={formRef}
      className={`flex gap-4 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/30 p-4 ${compact ? "flex-col" : "flex-col md:flex-row"} ${!compact ? "mt-2 mb-4" : ""}`}
    >
      {passageText && (
        <div className={compact ? "shrink-0" : "md:w-1/2 md:min-w-0 shrink-0"}>
          <h3 className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
            {reference}
          </h3>
          <div className="text-stone-600 dark:text-stone-400 text-sm font-serif leading-relaxed">
            {passageText}
          </div>
        </div>
      )}
      <div
        className={`flex-1 min-w-0 space-y-3 ${
          passageText
            ? compact
              ? "border-t border-stone-200 dark:border-stone-800 pt-4"
              : "md:border-l md:border-stone-200 md:dark:border-stone-800 md:pl-4"
            : ""
        }`}
      >
        <h3 className="text-sm font-medium text-stone-700 dark:text-stone-300">
          {passageText ? "Your reflection" : `Reflection — ${reference}`}
        </h3>
        <div className="space-y-2">
          <Label htmlFor="inline-observation">Observation</Label>
          <Textarea
            id="inline-observation"
            placeholder="What do you notice in this passage?"
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            rows={3}
            className="resize-none"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="inline-application">Application</Label>
          <Textarea
            id="inline-application"
            placeholder="How will you apply this?"
            value={application}
            onChange={(e) => setApplication(e.target.value)}
            rows={2}
            className="resize-none"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="inline-prayer">Prayer</Label>
          <Textarea
            id="inline-prayer"
            placeholder="A prayer inspired by this passage..."
            value={prayer}
            onChange={(e) => setPrayer(e.target.value)}
            rows={2}
            className="resize-none"
          />
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
        <div>
          <Button
            onClick={handleSave}
            disabled={saving || (!reflection && !prayer && !application)}
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin mr-2" />
            ) : (
              <BookMarked className="size-4 mr-2" />
            )}
            Save to journal
          </Button>
          {onClose && (
            <Button variant="ghost" size="sm" className="ml-2" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
