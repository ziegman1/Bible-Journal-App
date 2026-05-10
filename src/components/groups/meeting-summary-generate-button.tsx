"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateMeetingSummary } from "@/app/actions/meetings";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function GenerateMeetingSummaryButton({ meetingId }: { meetingId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onClick() {
    setPending(true);
    const r = await generateMeetingSummary(meetingId);
    setPending(false);
    if ("error" in r && r.error) toast.error(r.error);
    else {
      toast.success("Summary generated");
      console.log("[BADWR DEBUG] router.refresh triggered from: src/components/groups/meeting-summary-generate-button.tsx — #1");
      router.refresh();
    }
  }

  return (
    <Button onClick={onClick} disabled={pending}>
      {pending ? "Generating…" : "Generate summary"}
    </Button>
  );
}
