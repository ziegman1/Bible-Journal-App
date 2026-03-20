"use client";

import { useState } from "react";
import {
  savePassageObservation,
  assignStoryReteller,
} from "@/app/actions/meetings";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Shuffle, ThumbsUp, HelpCircle, Users, Church } from "lucide-react";
import { toast } from "sonner";

type ObservationType =
  | "like"
  | "difficult"
  | "teaches_about_people"
  | "teaches_about_god";

interface LookUpSectionProps {
  meetingId: string;
  passageVerses: { verse: number; text: string }[];
  passageRef: string | null;
  facilitator?: string;
  reteller?: string;
  participants: { user_id: string; display_name: string }[];
  observations: Record<string, unknown>[];
  currentUserId: string;
  book: string;
  chapter: number;
}

const OBSERVATION_PROMPTS: Record<
  ObservationType,
  { label: string; icon: typeof ThumbsUp }
> = {
  like: { label: "What do you like?", icon: ThumbsUp },
  difficult: { label: "What is difficult?", icon: HelpCircle },
  teaches_about_people: { label: "Teaches about people", icon: Users },
  teaches_about_god: { label: "Teaches about God", icon: Church },
};

export function LookUpSection({
  meetingId,
  passageVerses,
  passageRef,
  facilitator,
  reteller,
  participants,
  observations,
  currentUserId,
  book,
  chapter,
}: LookUpSectionProps) {
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const [observationType, setObservationType] =
    useState<ObservationType | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const myObservations = observations.filter(
    (o) => o.user_id === currentUserId
  ) as { observation_type: string; verse_number: number; note?: string }[];

  async function handleAssignReteller() {
    if (participants.length === 0) return;
    const idx = Math.floor(Math.random() * participants.length);
    const r = await assignStoryReteller(
      meetingId,
      participants[idx].user_id,
      "random"
    );
    if (r.error) toast.error(r.error);
    else {
      toast.success(`Assigned ${participants[idx].display_name} to retell`);
      window.location.reload();
    }
  }

  async function handleSaveObservation() {
    if (!selectedVerse || !observationType) {
      toast.error("Select a verse and observation type");
      return;
    }
    setSaving(true);
    const r = await savePassageObservation(meetingId, {
      observationType,
      book,
      chapter,
      verseNumber: selectedVerse,
      note: note.trim() || undefined,
    });
    setSaving(false);
    if (r.error) toast.error(r.error);
    else {
      toast.success("Observation saved");
      setSelectedVerse(null);
      setObservationType(null);
      setNote("");
      window.location.reload();
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-stone-200 dark:border-stone-800 p-6 bg-white dark:bg-stone-900/50 space-y-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-800 dark:text-stone-200">
          Look Up — Discovery Bible Study
        </h2>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          Read and discuss the passage together, then note observations below.
        </p>
        {facilitator && (
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Facilitator: {facilitator}
          </p>
        )}
        {reteller ? (
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Retelling: {reteller}
          </p>
        ) : (
          participants.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleAssignReteller}>
              <Shuffle className="size-4 mr-2" />
              Randomly assign reteller
            </Button>
          )
        )}
      </div>

      {passageRef && passageVerses.length > 0 && (
        <div className="rounded-xl border border-stone-200 dark:border-stone-800 p-6 bg-white dark:bg-stone-900/50 space-y-4 shadow-sm">
          <h3 className="font-medium text-stone-800 dark:text-stone-200">
            {passageRef}
          </h3>
          <div className="font-serif text-stone-700 dark:text-stone-300 leading-relaxed space-y-2">
            {passageVerses.map((v) => (
              <p
                key={v.verse}
                className={`cursor-pointer py-1 px-2 -mx-2 rounded ${
                  selectedVerse === v.verse
                    ? "bg-amber-100 dark:bg-amber-900/30"
                    : "hover:bg-stone-100 dark:hover:bg-stone-800/50"
                }`}
                onClick={() =>
                  setSelectedVerse(selectedVerse === v.verse ? null : v.verse)
                }
              >
                <span className="text-stone-400 dark:text-stone-500 text-sm mr-2">
                  {v.verse}
                </span>
                {v.text}
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-stone-200 dark:border-stone-800 p-6 bg-white dark:bg-stone-900/50 space-y-6 shadow-sm">
        <h3 className="font-medium text-stone-800 dark:text-stone-200">
          Your observations
        </h3>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          Tap a verse above, then choose an observation type and add your
          response.
        </p>
        <div className="flex flex-wrap gap-2">
          {(Object.entries(OBSERVATION_PROMPTS) as [ObservationType, { label: string }][]).map(
            ([type, { label }]) => (
              <button
                key={type}
                type="button"
                onClick={() =>
                  setObservationType(observationType === type ? null : type)
                }
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                  observationType === type
                    ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200"
                    : "border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800/50"
                }`}
              >
                {label}
              </button>
            )
          )}
        </div>
        {selectedVerse && observationType && (
          <div className="space-y-2">
            <Label>
              Note for verse {selectedVerse} —{" "}
              {OBSERVATION_PROMPTS[observationType].label}
            </Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Your observation..."
              rows={2}
              className="resize-none"
            />
            <Button onClick={handleSaveObservation} disabled={saving}>
              {saving ? "Saving..." : "Save observation"}
            </Button>
          </div>
        )}
        {myObservations.length > 0 && (
          <div className="pt-4 border-t border-stone-200 dark:border-stone-800">
            <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-2">
              Your observations
            </p>
            <ul className="space-y-1 text-sm">
              {myObservations.map((o, i) => (
                <li key={i} className="text-stone-700 dark:text-stone-300">
                  v{o.verse_number} — {o.observation_type}: {o.note || "(no note)"}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
