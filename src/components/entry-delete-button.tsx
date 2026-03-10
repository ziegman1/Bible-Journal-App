"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteJournalEntry } from "@/app/actions/journal";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

interface EntryDeleteButtonProps {
  entryId: string;
}

export function EntryDeleteButton({ entryId }: EntryDeleteButtonProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteJournalEntry(entryId);
    setDeleting(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Entry deleted");
    router.push("/app/journal");
    router.refresh();
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setDialogOpen(true)}
        disabled={deleting}
        className="text-stone-500 hover:text-red-600 dark:hover:text-red-400"
        title="Delete entry"
      >
        <Trash2 className="size-4" />
      </Button>
      <ConfirmDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Delete journal entry"
        description="This cannot be undone. The entry and all its content will be permanently removed."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  );
}
