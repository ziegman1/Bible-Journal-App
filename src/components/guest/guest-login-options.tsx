"use client";

import Link from "next/link";
import { GuestContinueEntry } from "@/components/guest/guest-continue-entry";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export function GuestLoginOptions({ signupHref }: { signupHref: string }) {
  return (
    <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
      <p className="text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
        New here?
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Link href={signupHref} className={cn(buttonVariants({ size: "default" }), "w-full touch-manipulation")}>
          Sign Up
        </Link>
        <GuestContinueEntry variant="outline" fullWidth />
      </div>
      <p className="text-center text-xs text-muted-foreground">Already have an account? Sign in below.</p>
    </div>
  );
}

export function GuestHomeEntryRow() {
  return (
    <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
      <Link href="/signup" className="min-h-11 inline-flex flex-1">
        <Button size="lg" className="w-full min-h-11 touch-manipulation">
          Sign Up
        </Button>
      </Link>
      <Link href="/login" className="min-h-11 inline-flex flex-1">
        <Button variant="outline" size="lg" className="w-full min-h-11 touch-manipulation">
          Sign In
        </Button>
      </Link>
      <GuestContinueEntry
        variant="secondary"
        size="lg"
        className="min-h-11 flex-1 touch-manipulation"
      />
    </div>
  );
}
