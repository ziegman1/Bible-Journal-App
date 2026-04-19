"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { removeVerseFromList } from "@/app/actions/scripture-module";
import { Button } from "@/components/ui/button";

export function RemoveFromListButton({
  listId,
  itemId,
  label = "Remove from list",
}: {
  listId: string;
  itemId: string;
  label?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      const res = await removeVerseFromList(listId, itemId);
      if ("error" in res) {
        alert(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={onClick}
    >
      {pending ? "…" : label}
    </Button>
  );
}
