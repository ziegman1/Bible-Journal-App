"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteStudyThread } from "@/app/actions/threads";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

interface ThreadPageClientProps {
  threadId: string;
}

export function ThreadPageClient({ threadId }: ThreadPageClientProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteStudyThread(threadId);
    setDeleting(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Thread deleted");
    router.push("/app/read");
    router.refresh();
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.preventDefault();
          setDialogOpen(true);
        }}
        disabled={deleting}
        className="text-stone-500 hover:text-red-600 dark:hover:text-red-400"
        title="Delete thread"
      >
        <Trash2 className="size-4" />
      </Button>
      <ConfirmDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Delete study thread"
        description="This cannot be undone. The thread and all its messages will be permanently removed."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  );
}
