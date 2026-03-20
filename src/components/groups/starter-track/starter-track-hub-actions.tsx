"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  enrollInStarterTrack,
  completeStarterTrackIntro,
  createStarterTrackWeekMeeting,
} from "@/app/actions/group-starter-track";

export function EnrollStarterTrackButton({ groupId }: { groupId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onClick() {
    setPending(true);
    const r = await enrollInStarterTrack(groupId);
    setPending(false);
    if ("error" in r && r.error) {
      toast.error(r.error);
      return;
    }
    toast.success("Starter Track enabled for this group");
    router.refresh();
    router.push(`/app/groups/${groupId}/starter-track/intro`);
  }

  return (
    <Button onClick={onClick} disabled={pending} size="lg">
      {pending ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
      Start Starter Track
    </Button>
  );
}

export function CompleteIntroButton({ groupId }: { groupId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onClick() {
    setPending(true);
    const r = await completeStarterTrackIntro(groupId);
    setPending(false);
    if ("error" in r && r.error) {
      toast.error(r.error);
      return;
    }
    toast.success("Introduction marked complete");
    router.refresh();
    router.push(`/app/groups/${groupId}/starter-track/vision`);
  }

  return (
    <Button onClick={onClick} disabled={pending} size="lg">
      {pending ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
      We have read this — continue to vision
    </Button>
  );
}

export function StartStarterWeekMeetingButton({
  groupId,
  week,
}: {
  groupId: string;
  week: number;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onClick() {
    setPending(true);
    const r = await createStarterTrackWeekMeeting(groupId, week);
    setPending(false);
    if ("error" in r && r.error) {
      toast.error(r.error);
      return;
    }
    if ("meetingId" in r && r.meetingId) {
      toast.success("Opening meeting room…");
      router.push(`/app/groups/${groupId}/meetings/${r.meetingId}`);
      router.refresh();
    }
  }

  return (
    <Button onClick={onClick} disabled={pending} size="lg">
      {pending ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
      Start Week {week} meeting
    </Button>
  );
}
