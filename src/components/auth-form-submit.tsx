"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function AuthFormSubmit({
  label,
  pendingLabel = "Please wait…",
}: {
  label: string;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full min-h-11 text-base sm:text-sm"
      aria-busy={pending}
    >
      {pending ? (
        <span className="inline-flex items-center justify-center gap-2">
          <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
          {pendingLabel}
        </span>
      ) : (
        label
      )}
    </Button>
  );
}
