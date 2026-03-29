"use server";

import { revalidatePath } from "next/cache";
import {
  LIST_OF_100_MAX_LINES,
  type NetworkListLineDTO,
  type SpiritualStatus,
} from "@/lib/list-of-100/types";
import { createClient } from "@/lib/supabase/server";

function isSpiritualStatus(v: string | null | undefined): v is SpiritualStatus {
  return v === "believer" || v === "unknown" || v === "unbeliever";
}

export async function getRelationalNetworkList(): Promise<
  { error: string } | { lines: NetworkListLineDTO[] }
> {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("relational_network_list_entries")
    .select("line_number, name, invite_planned_date, spiritual_status")
    .eq("user_id", user.id)
    .order("line_number", { ascending: true });

  if (error) return { error: error.message };

  const lines: NetworkListLineDTO[] = (data ?? []).map((r) => ({
    lineNumber: r.line_number,
    name: r.name ?? "",
    invitePlannedDate: r.invite_planned_date ?? null,
    spiritualStatus: isSpiritualStatus(r.spiritual_status) ? r.spiritual_status : null,
  }));

  return { lines };
}

export async function saveRelationalNetworkLine(input: {
  lineNumber: number;
  name: string;
  invitePlannedDate: string | null;
  spiritualStatus: SpiritualStatus | null;
}): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const n = Math.floor(input.lineNumber);
  if (!Number.isFinite(n) || n < 1 || n > LIST_OF_100_MAX_LINES) {
    return { error: "Invalid line." };
  }

  const name = input.name.trim().slice(0, 200);
  let inviteDate: string | null = null;
  if (input.invitePlannedDate && /^\d{4}-\d{2}-\d{2}$/.test(input.invitePlannedDate)) {
    inviteDate = input.invitePlannedDate;
  } else if (input.invitePlannedDate?.trim()) {
    return { error: "Use a valid date." };
  }

  const status =
    input.spiritualStatus && isSpiritualStatus(input.spiritualStatus)
      ? input.spiritualStatus
      : null;

  if (!name && !inviteDate && !status) {
    const { error: delErr } = await supabase
      .from("relational_network_list_entries")
      .delete()
      .eq("user_id", user.id)
      .eq("line_number", n);
    if (delErr) return { error: delErr.message };
    revalidatePath("/app/list-of-100");
    return { success: true as const };
  }

  const { error } = await supabase.from("relational_network_list_entries").upsert(
    {
      user_id: user.id,
      line_number: n,
      name,
      invite_planned_date: inviteDate,
      spiritual_status: status,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,line_number" }
  );

  if (error) return { error: error.message };
  revalidatePath("/app/list-of-100");
  return { success: true as const };
}
