"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ReadingMode, AIStyle } from "@/types/database";

export async function updateProfile(data: {
  display_name?: string;
  reading_mode?: ReadingMode;
  journal_year?: number;
  ai_style?: AIStyle;
  onboarding_complete?: boolean;
}) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const updates: Record<string, unknown> = {
    id: user.id,
    updated_at: new Date().toISOString(),
  };
  if (data.display_name !== undefined) updates.display_name = data.display_name;
  if (data.reading_mode !== undefined) updates.reading_mode = data.reading_mode;
  if (data.journal_year !== undefined) updates.journal_year = data.journal_year;
  if (data.ai_style !== undefined) updates.ai_style = data.ai_style;
  if (data.onboarding_complete !== undefined) updates.onboarding_complete = data.onboarding_complete;

  if (Object.keys(updates).length <= 2) return { success: true };

  const { error } = await supabase
    .from("profiles")
    .upsert(updates, {
      onConflict: "id",
    });

  if (error) return { error: error.message };

  revalidatePath("/app");
  revalidatePath("/app/settings");
  revalidatePath("/onboarding");
  return { success: true };
}
