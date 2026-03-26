"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateJournalEntry } from "@/app/actions/journal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SoapsFieldRow } from "@/components/soaps-field-row";
import { ShareViaEmailTextButtons } from "@/components/entry-share";
import { formatSoapsBodyFields, type SoapsFields } from "@/lib/format-soaps-share";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface EntryEditorProps {
  entryId: string;
  reference: string;
  entryDate: string;
  initialTitle?: string | null;
  initialScripture: string | null;
  initialReflection: string | null;
  initialPrayer: string | null;
  initialApplication: string | null;
  initialSoapsShare: string | null;
  initialTags: string[];
  userQuestion?: string | null;
}

export function EntryEditor({
  entryId,
  reference,
  entryDate,
  initialTitle = "",
  initialScripture,
  initialReflection,
  initialPrayer,
  initialApplication,
  initialSoapsShare,
  initialTags,
  userQuestion = null,
}: EntryEditorProps) {
  const [title, setTitle] = useState(initialTitle ?? "");
  const [scripture, setScripture] = useState(initialScripture ?? "");
  const [reflection, setReflection] = useState(initialReflection ?? "");
  const [prayer, setPrayer] = useState(initialPrayer ?? "");
  const [application, setApplication] = useState(initialApplication ?? "");
  const [soapsShare, setSoapsShare] = useState(initialSoapsShare ?? "");
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
      scriptureText: scripture,
      userReflection: reflection,
      prayer,
      application,
      soapsShare,
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

  const soapsForShare: SoapsFields = {
    scriptureText: scripture,
    observation: reflection,
    application,
    prayer,
    share: soapsShare,
  };

  const shareBody = (() => {
    const lines: string[] = [reference, entryDate];
    if (title.trim()) lines.push(title.trim());
    lines.push("");
    if (userQuestion?.trim()) {
      lines.push("Question: " + userQuestion.trim());
      lines.push("");
    }
    lines.push(formatSoapsBodyFields(soapsForShare));
    const tagList = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (tagList.length > 0) {
      lines.push("");
      lines.push("Tags: " + tagList.join(", "));
    }
    return lines.join("\n").trimEnd();
  })();

  const shareSubject = `SOAPS — ${reference}`;

  return (
    <div className="space-y-6 rounded-lg border border-border p-6 bg-muted/80 dark:bg-muted/40">
      <h2 className="text-sm font-medium text-stone-600 dark:text-stone-400">
        SOAPS
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

        <SoapsFieldRow letter="S" label="Scripture" htmlFor="entry-scripture">
          <Textarea
            id="entry-scripture"
            value={scripture}
            onChange={(e) => setScripture(e.target.value)}
            placeholder="Type the passage word for word…"
            rows={4}
            className="resize-none font-serif text-[0.95rem] leading-relaxed"
          />
        </SoapsFieldRow>

        <SoapsFieldRow letter="O" label="Observation" htmlFor="reflection">
          <Textarea
            id="reflection"
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="What do you observe in this passage?"
            rows={4}
            className="resize-none font-serif"
          />
        </SoapsFieldRow>

        <SoapsFieldRow letter="A" label="Application" htmlFor="application">
          <Textarea
            id="application"
            value={application}
            onChange={(e) => setApplication(e.target.value)}
            placeholder="How will you apply this?"
            rows={2}
            className="resize-none font-serif"
          />
        </SoapsFieldRow>

        <SoapsFieldRow letter="P" label="Prayer" htmlFor="prayer">
          <Textarea
            id="prayer"
            value={prayer}
            onChange={(e) => setPrayer(e.target.value)}
            placeholder="A prayer inspired by this passage…"
            rows={3}
            className="resize-none font-serif"
          />
        </SoapsFieldRow>

        <SoapsFieldRow letter="S" label="Share" htmlFor="soaps-share">
          <Textarea
            id="soaps-share"
            value={soapsShare}
            onChange={(e) => setSoapsShare(e.target.value)}
            placeholder="Who will you share this with, and how?"
            rows={2}
            className="resize-none font-serif"
          />
        </SoapsFieldRow>

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

        <div className="space-y-2 border-t border-border pt-6">
          <p className="text-xs font-medium text-stone-700 dark:text-stone-300">
            Share this SOAPS (email or text)
          </p>
          <p className="text-[0.7rem] text-stone-500 dark:text-stone-500">
            Opens your mail app or Messages with the fields below included in the message.
          </p>
          <ShareViaEmailTextButtons subject={shareSubject} body={shareBody} />
        </div>
      </div>
    </div>
  );
}
