"use server";

import {
  parseBadwrReproductionCountAdjustments,
  type BadwrReproductionCountAdjustments,
} from "@/lib/dashboard/badwr-reproduction-count-adjustments";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function normalizeFromClient(raw: unknown): BadwrReproductionCountAdjustments {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  return parseBadwrReproductionCountAdjustments(raw);
}

export async function saveBadwrReproductionCountAdjustments(
  raw: unknown
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const adjustments = normalizeFromClient(raw);

  const { error } = await supabase
    .from("profiles")
    .update({
      badwr_reproduction_count_adjustments: adjustments,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/app");
  revalidatePath("/app/settings");
  return { success: true };
}

export async function resetBadwrReproductionCountAdjustments(): Promise<
  { success: true } | { error: string }
> {
  return saveBadwrReproductionCountAdjustments({});
}
