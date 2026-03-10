"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createJournalEntry } from "@/app/actions/journal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BookMarked, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SaveThreadToJournalProps {
  threadId: string;
  reference: string;
  bookName: string;
  chapter: number;
  verseStart: number | null;
  verseEnd: number | null;
  firstQuestion?: string | null;
}

export function SaveThreadToJournal({
  threadId,
  reference,
  bookName,
  chapter,
  verseStart,
  verseEnd,
  firstQuestion,
}: SaveThreadToJournalProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState("");
  const [reflection, setReflection] = useState("");
  const [prayer, setPrayer] = useState("");
  const [application, setApplication] = useState("");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);

    const result = await createJournalEntry({
      reference,
      book: bookName,
      chapter,
      verseStart,
      verseEnd,
      title: title.trim() || undefined,
      userQuestion: firstQuestion ?? undefined,
      userReflection: reflection || undefined,
      prayer: prayer || undefined,
      application: application || undefined,
      studyThreadId: threadId,
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

    toast.success("Saved to journal");
    if (result.entryId) {
      router.push(`/app/journal/${result.entryId}`);
    }
  }

  if (!expanded) {
    return (
      <Button
        variant="outline"
        onClick={() => setExpanded(true)}
        className="w-full sm:w-auto"
      >
        <BookMarked className="size-4 mr-2" />
        Save to journal
      </Button>
    );
  }

  return (
    <div className="rounded-lg border border-stone-200 dark:border-stone-800 p-4 space-y-4 bg-stone-50/50 dark:bg-stone-900/30">
      <h3 className="text-sm font-medium text-stone-700 dark:text-stone-300">
        Save this study to your journal
      </h3>
      <div className="space-y-2">
        <Label htmlFor="title">Title (optional)</Label>
        <Input
          id="title"
          placeholder={reference}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="reflection">Reflection</Label>
        <Textarea
          id="reflection"
          placeholder="Your thoughts and insights..."
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          rows={2}
          className="resize-none"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="prayer">Prayer</Label>
        <Textarea
          id="prayer"
          placeholder="A prayer inspired by this passage..."
          value={prayer}
          onChange={(e) => setPrayer(e.target.value)}
          rows={2}
          className="resize-none"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="application">Application</Label>
        <Textarea
          id="application"
          placeholder="How will you apply this?"
          value={application}
          onChange={(e) => setApplication(e.target.value)}
          rows={2}
          className="resize-none"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="tags">Tags (comma-separated)</Label>
        <Input
          id="tags"
          placeholder="faith, hope, love"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin mr-2" /> : <BookMarked className="size-4 mr-2" />}
          Save to journal
        </Button>
        <Button variant="ghost" onClick={() => setExpanded(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
