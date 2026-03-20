"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6 bg-stone-50 dark:bg-stone-950">
      <h1 className="text-xl font-serif text-stone-800 dark:text-stone-200">
        Something went wrong
      </h1>
      <p className="text-sm text-stone-600 dark:text-stone-400 text-center max-w-md">
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
      <div className="flex gap-3">
        <Button onClick={reset} variant="default">
          Try again
        </Button>
        <Link href="/app">
          <Button variant="outline">Go to home</Button>
        </Link>
      </div>
    </div>
  );
}
