"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveStarterTrackVision } from "@/app/actions/group-starter-track";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { STARTER_TRACK_VISION_VERSES } from "@/lib/groups/starter-track/starter-track-v1-config";

interface Props {
  groupId: string;
  initialStatement?: string | null;
}

export function StarterTrackVisionForm({ groupId, initialStatement }: Props) {
  const router = useRouter();
  const [text, setText] = useState(initialStatement ?? "");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const r = await saveStarterTrackVision(groupId, text);
    setPending(false);
    if ("error" in r && r.error) {
      toast.error(r.error);
      return;
    }
    toast.success("Vision statement saved");
    router.refresh();
    router.push(`/app/groups/${groupId}/starter-track`);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/30 p-4 text-sm text-stone-700 dark:text-stone-300 space-y-2">
        <p>
          Before Week 1, take time to agree on a short <strong>group vision statement</strong>{" "}
          rooted in Jesus’ heart for multiplying disciples. Use these passages in prayer and
          discussion:
        </p>
        <ul className="list-disc pl-5">
          {STARTER_TRACK_VISION_VERSES.map((v) => (
            <li key={v}>{v}</li>
          ))}
        </ul>
      </div>

      <div className="space-y-2">
        <Label htmlFor="vision">Your group vision statement</Label>
        <Textarea
          id="vision"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          className="resize-none"
          placeholder="e.g. We will obey Jesus, share the gospel boldly, and train others to start new groups…"
          required
          disabled={pending}
        />
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Write at least a few sentences the whole group agrees on. You can refine it later in
          your meetings.
        </p>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
        Save vision & unlock Week 1
      </Button>
    </form>
  );
}
