"use client";

import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface AppHeaderProps {
  displayName?: string;
}

export function AppHeader({ displayName }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-10 shrink-0 border-b border-border bg-background/95 backdrop-blur pt-[env(safe-area-inset-top)]">
      <div className="flex h-14 items-center justify-between px-6">
        <span className="text-sm text-stone-600 dark:text-stone-400">
          {displayName ? `Welcome, ${displayName}` : "BADWR"}
        </span>
        <form action={signOut}>
          <Button type="submit" variant="ghost" size="sm">
            <LogOut className="size-4 mr-2" />
            Sign out
          </Button>
        </form>
      </div>
    </header>
  );
}
