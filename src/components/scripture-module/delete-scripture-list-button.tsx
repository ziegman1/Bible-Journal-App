"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteScriptureList } from "@/app/actions/scripture-module";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";

export function DeleteScriptureListButton({
  listId,
  listName,
  variant = "outline",
}: {
  listId: string;
  listName: string;
  variant?: "outline" | "ghost";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant={variant === "ghost" ? "ghost" : "outline"} onClick={() => setOpen(true)}>
        Delete list
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete this list?"
        description={`Removes the list "${listName}" only. Your verses stay in the library.`}
        confirmLabel="Delete list"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={async () => {
          const res = await deleteScriptureList(listId);
          if ("error" in res) {
            window.alert(res.error);
            throw new Error(res.error);
          }
          router.push("/scripture/lists");
          router.refresh();
        }}
      />
    </>
  );
}
