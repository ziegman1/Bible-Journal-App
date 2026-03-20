"use client";

import { signOutWithLoginRedirect } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export function InviteWrongAccountHelp({ redirectTo }: { redirectTo: string }) {
  return (
    <form action={signOutWithLoginRedirect} className="pt-2">
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <Button type="submit" variant="outline">
        Sign out and sign in with the invited email
      </Button>
    </form>
  );
}
