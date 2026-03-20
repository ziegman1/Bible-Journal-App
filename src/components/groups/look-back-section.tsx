"use client";

import { useState } from "react";
import { saveLookBackResponse, savePriorObedienceFollowup } from "@/app/actions/meetings";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Heart, Scale, Target } from "lucide-react";
import { toast } from "sonner";

interface LookBackSectionProps {
  meetingId: string;
  priorCommitments: { obedience: string; sharing: string } | null;
  myLookback?: {
    pastoral_care_response?: string;
    accountability_response?: string;
    vision_casting_response?: string;
  };
  myPriorFollowup?: Record<string, unknown>;
  priorFollowups: Record<string, unknown>[];
  participants: { user_id: string; display_name: string }[];
  displayNames: Record<string, string>;
}

export function LookBackSection({
  meetingId,
  priorCommitments,
  myLookback,
  myPriorFollowup,
  priorFollowups,
  participants,
  displayNames,
}: LookBackSectionProps) {
  const [pastoral, setPastoral] = useState(myLookback?.pastoral_care_response ?? "");
  const [accountability, setAccountability] = useState(
    myLookback?.accountability_response ?? ""
  );
  const [vision, setVision] = useState(myLookback?.vision_casting_response ?? "");
  const [obedienceFollowup, setObedienceFollowup] = useState(
    (myPriorFollowup as { obedience_followup_response?: string } | undefined)
      ?.obedience_followup_response ?? ""
  );
  const [sharingFollowup, setSharingFollowup] = useState(
    (myPriorFollowup as { sharing_followup_response?: string } | undefined)
      ?.sharing_followup_response ?? ""
  );
  const [saving, setSaving] = useState(false);

  async function handleSaveLookback() {
    setSaving(true);
    const r = await saveLookBackResponse(meetingId, {
      pastoralCareResponse: pastoral || undefined,
      accountabilityResponse: accountability || undefined,
      visionCastingResponse: vision || undefined,
    });
    setSaving(false);
    if (r.error) toast.error(r.error);
    else toast.success("Saved");
  }

  async function handleSaveFollowup() {
    if (!priorCommitments) return;
    setSaving(true);
    const summary = `Obedience: ${priorCommitments.obedience}. Sharing: ${priorCommitments.sharing}`;
    const r = await savePriorObedienceFollowup(meetingId, {
      priorCommitmentSummary: summary,
      obedienceFollowupResponse: obedienceFollowup || undefined,
      sharingFollowupResponse: sharingFollowup || undefined,
    });
    setSaving(false);
    if (r.error) toast.error(r.error);
    else toast.success("Saved");
  }

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-stone-200 dark:border-stone-800 p-6 bg-white dark:bg-stone-900/50 space-y-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-800 dark:text-stone-200 flex items-center gap-2">
          <Heart className="size-5 text-rose-500" />
          Pastoral Care
        </h2>
        <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
          How are you doing? What do you need prayer for? How can the group care
          for you?
        </p>
        <div className="space-y-2">
          <Label>Your response</Label>
          <Textarea
            value={pastoral}
            onChange={(e) => setPastoral(e.target.value)}
            placeholder="Share how you're doing and any prayer needs..."
            rows={3}
            className="resize-none"
          />
        </div>
      </div>

      {priorCommitments && (
        <div className="rounded-xl border border-stone-200 dark:border-stone-800 p-6 bg-white dark:bg-stone-900/50 space-y-6 shadow-sm">
          <h2 className="text-lg font-medium text-stone-800 dark:text-stone-200 flex items-center gap-2">
            <Scale className="size-5 text-amber-500" />
            Loving Accountability
          </h2>
          <div className="rounded-lg bg-stone-50 dark:bg-stone-800/50 p-4 text-sm">
            <p className="font-medium text-stone-700 dark:text-stone-300 mb-2">
              Last week you committed:
            </p>
            <p className="text-stone-600 dark:text-stone-400">
              <strong>Obedience:</strong> {priorCommitments.obedience}
            </p>
            <p className="text-stone-600 dark:text-stone-400 mt-1">
              <strong>Sharing:</strong> {priorCommitments.sharing}
            </p>
          </div>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            How did you obey? Did you follow through on sharing?
          </p>
          <div className="space-y-4">
            <div>
              <Label>Obedience follow-up</Label>
              <Textarea
                value={obedienceFollowup}
                onChange={(e) => setObedienceFollowup(e.target.value)}
                placeholder="How did you obey?"
                rows={2}
                className="resize-none mt-1"
              />
            </div>
            <div>
              <Label>Sharing follow-up</Label>
              <Textarea
                value={sharingFollowup}
                onChange={(e) => setSharingFollowup(e.target.value)}
                placeholder="Did you share with who you intended?"
                rows={2}
                className="resize-none mt-1"
              />
            </div>
            <Button onClick={handleSaveFollowup} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Save accountability
            </Button>
          </div>
        </div>
      )}

      {!priorCommitments && (
        <div className="rounded-xl border border-stone-200 dark:border-stone-800 p-6 bg-white dark:bg-stone-900/50 space-y-6">
          <h2 className="text-lg font-medium text-stone-800 dark:text-stone-200 flex items-center gap-2">
            <Scale className="size-5 text-amber-500" />
            Loving Accountability
          </h2>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            How did you obey last week's teaching? Did you follow through on your
            obedience commitment? Did you share with the person(s) you intended?
          </p>
          <div className="space-y-2">
            <Label>Your response</Label>
            <Textarea
              value={accountability}
              onChange={(e) => setAccountability(e.target.value)}
              placeholder="Share how you followed through..."
              rows={3}
              className="resize-none"
            />
          </div>
        </div>
      )}

      <div className="rounded-xl border border-stone-200 dark:border-stone-800 p-6 bg-white dark:bg-stone-900/50 space-y-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-800 dark:text-stone-200 flex items-center gap-2">
          <Target className="size-5 text-green-500" />
          Vision Casting
        </h2>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          How are you multiplying disciples? Have you shared the gospel or your
          story this week? Are there opportunities to start or multiply a group?
        </p>
        <div className="space-y-2">
          <Label>Your response</Label>
          <Textarea
            value={vision}
            onChange={(e) => setVision(e.target.value)}
            placeholder="Share your vision and multiplication..."
            rows={3}
            className="resize-none"
          />
        </div>
        <Button onClick={handleSaveLookback} disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
          Save Look Back
        </Button>
      </div>
    </div>
  );
}
