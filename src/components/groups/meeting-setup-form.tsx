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
  const [bySeries, setBySeries] = useState<
    Record<string, { id: string; title: string; book: string; chapter: number; verse_start: number; verse_end: number }[]>
  >({});
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
      if (r.stories) {
        const res = r as { bySeries?: Record<string, { id: string; title: string; book: string; chapter: number; verse_start: number; verse_end: number }[]> };
        setBySeries(res.bySeries ?? {});
        const first = r.stories[0] as { id: string } | undefined;
        if (first) setSelectedPresetId(first.id);
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

  const seriesNames = Object.keys(bySeries).sort();

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
          <div className="space-y-3 mt-4">
            {seriesNames.map((series) => (
              <div key={series}>
                <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-2">
                  {series}
                </p>
                <div className="space-y-1">
                  {bySeries[series]?.map((s) => (
                    <label
                      key={s.id}
                      className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800/50"
                    >
                      <input
                        type="radio"
                        name="preset"
                        checked={selectedPresetId === s.id}
                        onChange={() => setSelectedPresetId(s.id)}
                      />
                      <span className="text-sm">
                        {s.title} ({s.book} {s.chapter}:{s.verse_start}
                        {s.verse_start !== s.verse_end ? `-${s.verse_end}` : ""})
                      </span>
                    </label>
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
