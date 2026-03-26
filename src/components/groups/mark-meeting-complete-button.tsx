"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateMeetingStatus } from "@/app/actions/meetings";
import { Button, buttonVariants } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

type MeetingStatus = "draft" | "active" | "completed";

export function MarkMeetingCompleteButton({
  meetingId,
  groupId,
  initialStatus,
}: {
  meetingId: string;
  groupId: string;
  initialStatus: MeetingStatus;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [localStatus, setLocalStatus] = useState<MeetingStatus>(initialStatus);

  async function onMarkComplete() {
    setPending(true);
    const r = await updateMeetingStatus(meetingId, "completed");
    setPending(false);
    if ("error" in r && r.error) {
      toast.error(r.error);
      return;
    }
    setLocalStatus("completed");
    toast.success("Meeting marked complete");
    router.refresh();
  }

  if (localStatus === "completed") {
    return (
      <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
        <p className="flex items-center justify-center gap-2 text-sm font-medium text-foreground sm:justify-start">
          <CheckCircle2
            className="size-5 shrink-0 text-emerald-600 dark:text-emerald-500"
            aria-hidden
          />
          This meeting is marked complete.
        </p>
        <Link
          href={`/app/groups/${groupId}/meetings`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Back to meetings
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        When you&apos;re finished reviewing, mark this meeting complete. The live
        meeting view will switch to read-only for everyone.
      </p>
      <Button
        type="button"
        className="shrink-0"
        onClick={() => void onMarkComplete()}
        disabled={pending}
      >
        {pending ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
            Saving…
          </>
        ) : (
          "Mark meeting complete"
        )}
      </Button>
    </div>
  );
}
