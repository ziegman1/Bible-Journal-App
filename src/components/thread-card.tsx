"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteStudyThread } from "@/app/actions/threads";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

interface ThreadCardProps {
  id: string;
  reference: string;
  title?: string | null;
  created_at: string;
}

export function ThreadCard({ id, reference, title, created_at }: ThreadCardProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteStudyThread(id);
    setDeleting(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Thread deleted");
    router.refresh();
  }

  return (
    <>
      <Card className="group relative hover:bg-muted/60 dark:hover:bg-muted/40 transition-colors">
        <Link href={`/app/thread/${id}`} className="block">
          <CardHeader className="pb-2 pr-12">
            <CardTitle className="text-base font-medium">
              {reference}
            </CardTitle>
            {title && (
              <p className="text-sm text-stone-500 dark:text-stone-400 truncate">
                {title}
              </p>
            )}
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-stone-400 dark:text-stone-500">
              {new Date(created_at).toLocaleDateString()}
            </p>
          </CardContent>
        </Link>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDialogOpen(true);
          }}
          disabled={deleting}
          className="absolute top-3 right-3 text-stone-400 hover:text-red-600 dark:hover:text-red-400 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
          title="Delete thread"
        >
          <Trash2 className="size-4" />
        </Button>
      </Card>
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
