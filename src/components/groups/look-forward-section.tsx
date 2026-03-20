"use client";

import { useState } from "react";
import {
  saveLookForwardResponse,
  assignPracticeActivity,
} from "@/app/actions/meetings";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Shuffle } from "lucide-react";
import { toast } from "sonner";

const PRACTICE_TYPES = [
  { id: "share_story", label: "Share the story just studied" },
  { id: "share_testimony", label: "Share personal testimony" },
  { id: "share_gospel", label: "Share God's story / the gospel" },
  { id: "role_play_obedience", label: "Role-play obedience/application" },
] as const;

interface LookForwardSectionProps {
  meetingId: string;
  myLookforward?: {
    obedience_statement?: string;
    sharing_commitment?: string;
  };
  participants: { user_id: string; display_name: string }[];
  practice: Record<string, unknown>[];
  currentUserId: string;
  isAdmin: boolean;
}

export function LookForwardSection({
  meetingId,
  myLookforward,
  participants,
  practice,
  currentUserId,
  isAdmin,
}: LookForwardSectionProps) {
  const [obedience, setObedience] = useState(
    myLookforward?.obedience_statement ?? ""
  );
  const [sharing, setSharing] = useState(
    myLookforward?.sharing_commitment ?? ""
  );
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!obedience.trim() || !sharing.trim()) {
      toast.error("Please fill in both obedience and sharing commitment");
      return;
    }
    setSaving(true);
    const r = await saveLookForwardResponse(meetingId, {
      obedienceStatement: obedience.trim(),
      sharingCommitment: sharing.trim(),
    });
    setSaving(false);
    if (r.error) toast.error(r.error);
    else toast.success("Saved");
  }

  async function handleAssignPractice() {
    const type = PRACTICE_TYPES[
      Math.floor(Math.random() * PRACTICE_TYPES.length)
    ];
    const idx = Math.floor(Math.random() * participants.length);
    const r = await assignPracticeActivity(meetingId, {
      practiceType: type.id,
      assignedUserId: participants[idx]?.user_id,
      assignedByMode: "random",
    });
    if (r.error) toast.error(r.error);
    else {
      toast.success(
        `Assigned ${type.label} to ${participants[idx]?.display_name ?? "someone"}`
      );
      window.location.reload();
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-stone-200 dark:border-stone-800 p-6 bg-white dark:bg-stone-900/50 space-y-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-800 dark:text-stone-200">
          Obedience & Sharing
        </h2>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          How will you obey what you learned? Who will you share with this
          week?
        </p>
        <div className="space-y-4">
          <div>
            <Label>How will you obey?</Label>
            <Textarea
              value={obedience}
              onChange={(e) => setObedience(e.target.value)}
              placeholder="I will..."
              rows={3}
              className="resize-none mt-1"
            />
          </div>
          <div>
            <Label>Who will you share with?</Label>
            <Textarea
              value={sharing}
              onChange={(e) => setSharing(e.target.value)}
              placeholder="I will share with..."
              rows={2}
              className="resize-none mt-1"
            />
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
            Save commitment
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-stone-200 dark:border-stone-800 p-6 bg-white dark:bg-stone-900/50 space-y-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-800 dark:text-stone-200">
          Practice
        </h2>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          The facilitator can assign a practice activity for the group.
        </p>
        {practice.length > 0 ? (
          <ul className="space-y-2">
            {practice.map((p, i) => (
              <li
                key={i}
                className="text-sm text-stone-700 dark:text-stone-300 flex items-center gap-2"
              >
                <span className="font-medium">
                  {(p as { practice_type: string }).practice_type.replace(
                    /_/g,
                    " "
                  )}
                </span>
                {(p as { assigned_user_id?: string }).assigned_user_id && (
                  <span className="text-stone-500">
                    →
                    {
                      participants.find(
                        (m) =>
                          m.user_id ===
                          (p as { assigned_user_id: string }).assigned_user_id
                      )?.display_name
                    }
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          isAdmin &&
          participants.length > 0 && (
            <Button variant="outline" onClick={handleAssignPractice}>
              <Shuffle className="size-4 mr-2" />
              Assign random practice
            </Button>
          )
        )}
      </div>
    </div>
  );
}
