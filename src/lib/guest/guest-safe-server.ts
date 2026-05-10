import "server-only";

import { createClient } from "@/lib/supabase/server";

/**
 * Use at the start of server actions that must never run without a real Supabase user.
 * Do not trust client-only guest flags for authorization — always verify auth here.
 */
export async function requireAuthenticatedUserId(): Promise<
  { ok: true; userId: string } | { ok: false; error: string }
> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) return { ok: false, error: "Not authenticated" };
  return { ok: true, userId: user.id };
}
