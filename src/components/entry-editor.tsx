"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateJournalEntry } from "@/app/actions/journal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface EntryEditorProps {
  entryId: string;
  initialTitle?: string | null;
  initialReflection: string | null;
  initialPrayer: string | null;
  initialApplication: string | null;
  initialTags: string[];
}

export function EntryEditor({
  entryId,
  initialTitle = "",
  initialReflection,
  initialPrayer,
  initialApplication,
  initialTags,
}: EntryEditorProps) {
  const [title, setTitle] = useState(initialTitle ?? "");
  const [reflection, setReflection] = useState(initialReflection ?? "");
  const [prayer, setPrayer] = useState(initialPrayer ?? "");
  const [application, setApplication] = useState(initialApplication ?? "");
  const [tags, setTags] = useState(initialTags.join(", "));
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function handleSave() {
    setSaving(true);
    const tagList = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const result = await updateJournalEntry(entryId, {
      title: title.trim() || undefined,
      userReflection: reflection,
      prayer,
      application,
      tags: tagList,
    });

    setSaving(false);

    if (result?.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Entry updated");
    router.refresh();
  }

  return (
    <div className="space-y-6 rounded-lg border border-stone-200 dark:border-stone-800 p-6 bg-stone-50/30 dark:bg-stone-900/20">
      <h2 className="text-sm font-medium text-stone-600 dark:text-stone-400">
        Your notes
      </h2>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title (optional)</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="A short title for this entry"
            className="font-serif"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="reflection">Observation</Label>
          <Textarea
            id="reflection"
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="What do you observe in this passage?"
            rows={4}
            className="resize-none font-serif"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="application">Application</Label>
          <Textarea
            id="application"
            value={application}
            onChange={(e) => setApplication(e.target.value)}
            placeholder="How will you apply this?"
            rows={2}
            className="resize-none font-serif"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="prayer">Prayer</Label>
          <Textarea
            id="prayer"
            value={prayer}
            onChange={(e) => setPrayer(e.target.value)}
            placeholder="A prayer inspired by this passage..."
            rows={3}
            className="resize-none font-serif"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tags">Tags (comma-separated)</Label>
          <Input
            id="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="faith, hope, love"
          />
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
          Save changes
        </Button>
      </div>
    </div>
  );
}
