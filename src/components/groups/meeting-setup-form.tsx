"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createGroupMeeting, getPresetStories } from "@/app/actions/meetings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Shuffle } from "lucide-react";
import { toast } from "sonner";
import { BIBLE_BOOKS } from "@/lib/scripture/books";
import type { PresetCatalogSeries } from "@/lib/groups/preset-stories-picker";

interface Member {
  id: string;
  user_id: string;
  display_name: string;
}

interface MeetingSetupFormProps {
  groupId: string;
  members: Member[];
}

export function MeetingSetupForm({ groupId, members }: MeetingSetupFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [storySource, setStorySource] = useState<"manual_passage" | "preset_story">("preset_story");
  const [catalog, setCatalog] = useState<PresetCatalogSeries[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>("");
  const [book, setBook] = useState("");
  const [chapter, setChapter] = useState("");
  const [verseStart, setVerseStart] = useState("");
  const [verseEnd, setVerseEnd] = useState("");
  const [meetingDate, setMeetingDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [title, setTitle] = useState("");
  const [facilitatorMode, setFacilitatorMode] = useState<"manual" | "random">("random");
  const [facilitatorId, setFacilitatorId] = useState<string>("");

  useEffect(() => {
    getPresetStories().then((r) => {
      if (r.stories?.length) {
        const cat = (r as { catalog?: PresetCatalogSeries[] }).catalog ?? [];
        setCatalog(cat);
        const firstId = cat[0]?.phases[0]?.lessons[0]?.id;
        if (firstId) setSelectedPresetId(firstId);
      }
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    let facilitatorUserId: string | undefined;
    if (facilitatorMode === "random" && members.length > 0) {
      const idx = Math.floor(Math.random() * members.length);
      facilitatorUserId = members[idx].user_id;
    } else if (facilitatorMode === "manual" && facilitatorId) {
      facilitatorUserId = facilitatorId;
    }

    const payload: Parameters<typeof createGroupMeeting>[1] = {
      meetingDate,
      title: title.trim() || undefined,
      storySourceType: storySource,
      facilitatorUserId,
    };

    if (storySource === "manual_passage") {
      const ch = parseInt(chapter, 10);
      const vs = parseInt(verseStart, 10);
      const ve = parseInt(verseEnd, 10);
      if (!book || !ch || !vs || !ve) {
        toast.error("Please fill in book, chapter, and verse range");
        setSaving(false);
        return;
      }
      payload.book = book;
      payload.chapter = ch;
      payload.verseStart = vs;
      payload.verseEnd = ve;
    } else {
      if (!selectedPresetId) {
        toast.error("Please select a preset story");
        setSaving(false);
        return;
      }
      payload.presetStoryId = selectedPresetId;
    }

    const result = await createGroupMeeting(groupId, payload);
    setSaving(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Draft meeting created — opening meeting room");
    router.push(`/app/groups/${groupId}/meetings/${result.meetingId}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-4">
        <Label>Meeting date</Label>
        <Input
          type="date"
          value={meetingDate}
          onChange={(e) => setMeetingDate(e.target.value)}
          required
        />
      </div>

      <div className="space-y-4">
        <Label>Title (optional)</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Tuesday evening study"
        />
      </div>

      <div className="space-y-4">
        <Label>Passage</Label>
        <p className="text-xs text-stone-500 dark:text-stone-400 -mt-2">
          Use a curated preset or enter any Bible passage.
        </p>
        <div className="flex gap-4 flex-wrap">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="storySource"
              checked={storySource === "preset_story"}
              onChange={() => setStorySource("preset_story")}
            />
            <span>Preset story</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="storySource"
              checked={storySource === "manual_passage"}
              onChange={() => setStorySource("manual_passage")}
            />
            <span>Custom passage</span>
          </label>
        </div>

        {storySource === "preset_story" && (
          <div className="space-y-6 mt-4 max-h-[min(70vh,520px)] overflow-y-auto pr-1">
            {catalog.map((series) => (
              <div key={series.seriesName}>
                <p className="text-sm font-semibold text-stone-800 dark:text-stone-100 mb-3">
                  {series.seriesName}
                </p>
                <div className="space-y-5 pl-0 sm:pl-1">
                  {series.phases.map((phase) => (
                    <div key={`${series.seriesName}::${phase.phaseTitle}`}>
                      <p className="text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400 mb-2">
                        {phase.phaseTitle}
                      </p>
                      <div className="space-y-1">
                        {phase.lessons.map((s) => (
                          <label
                            key={s.id}
                            className="flex flex-col gap-0.5 cursor-pointer p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800/50"
                          >
                            <span className="flex items-start gap-2">
                              <input
                                type="radio"
                                name="preset"
                                className="mt-1 shrink-0"
                                checked={selectedPresetId === s.id}
                                onChange={() => setSelectedPresetId(s.id)}
                              />
                              <span className="text-sm leading-snug">
                                <span className="font-medium text-stone-800 dark:text-stone-100">
                                  {s.title}
                                </span>
                                {s.storySubtitle ? (
                                  <span className="block text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                                    Story: {s.storySubtitle}
                                  </span>
                                ) : null}
                                <span className="block text-xs text-stone-600 dark:text-stone-300 mt-1">
                                  {s.passageRefLabel}
                                </span>
                              </span>
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {storySource === "manual_passage" && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="col-span-2 md:col-span-1">
              <Label>Book</Label>
              <select
                value={book}
                onChange={(e) => setBook(e.target.value)}
                className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm"
              >
                <option value="">Select...</option>
                {BIBLE_BOOKS.map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Chapter</Label>
              <Input
                type="number"
                min={1}
                value={chapter}
                onChange={(e) => setChapter(e.target.value)}
                placeholder="1"
              />
            </div>
            <div>
              <Label>Verse start</Label>
              <Input
                type="number"
                min={1}
                value={verseStart}
                onChange={(e) => setVerseStart(e.target.value)}
                placeholder="1"
              />
            </div>
            <div>
              <Label>Verse end</Label>
              <Input
                type="number"
                min={1}
                value={verseEnd}
                onChange={(e) => setVerseEnd(e.target.value)}
                placeholder="1"
              />
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <Label>Facilitator</Label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="facilitatorMode"
              checked={facilitatorMode === "random"}
              onChange={() => setFacilitatorMode("random")}
            />
            <Shuffle className="size-4" />
            <span>Random</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="facilitatorMode"
              checked={facilitatorMode === "manual"}
              onChange={() => setFacilitatorMode("manual")}
            />
            <span>Pick facilitator</span>
          </label>
        </div>
        {facilitatorMode === "manual" && members.length > 0 && (
          <select
            value={facilitatorId}
            onChange={(e) => setFacilitatorId(e.target.value)}
            className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm mt-2"
          >
            <option value="">Choose who’s facilitating…</option>
            {members.map((m) => (
              <option key={m.id} value={m.user_id}>
                {m.display_name}
              </option>
            ))}
          </select>
        )}
      </div>

      <Button type="submit" disabled={saving}>
        {saving ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
        Continue to meeting room
      </Button>
    </form>
  );
}
