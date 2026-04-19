"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteScriptureItem } from "@/app/actions/scripture-module";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";

export function DeleteScriptureItemButton({
  itemId,
  reference,
  variant = "outline",
}: {
  itemId: string;
  reference: string;
  variant?: "outline" | "ghost";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant={variant === "ghost" ? "ghost" : "outline"} onClick={() => setOpen(true)}>
        Delete verse
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete this verse?"
        description={`This removes "${reference}" from your library, including memorization progress. This can’t be undone.`}
        confirmLabel="Delete verse"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={async () => {
          const res = await deleteScriptureItem(itemId);
          if ("error" in res) {
            window.alert(res.error);
            throw new Error(res.error);
          }
          router.push("/scripture");
          router.refresh();
        }}
      />
    </>
  );
}
