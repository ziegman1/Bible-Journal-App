"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { recordThirdsCompletionFromGroupMeeting } from "@/app/actions/pillar-third-completion";
import { Button } from "@/components/ui/button";

export function CompleteThirdsStreakButton({
  meetingId,
  groupId,
}: {
  meetingId: string;
  groupId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  return (
    <Button
      type="button"
      size="sm"
      disabled={pending || done}
      className="min-h-10"
      onClick={() => {
        startTransition(async () => {
          const res = await recordThirdsCompletionFromGroupMeeting({ meetingId, groupId });
          if ("error" in res && res.error) {
            toast.error(res.error);
            return;
          }
          toast.success("3/3 week recorded for your streak.");
          setDone(true);
          router.refresh();
        });
      }}
    >
      {done ? "Complete 3/3 ✓" : pending ? "Saving…" : "Complete 3/3"}
    </Button>
  );
}
