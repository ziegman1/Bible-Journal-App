"use server";

import { revalidatePath } from "next/cache";
import {
  EVANGELISTIC_PRAYER_FOCUS_MAX,
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
    .select("line_number, name, invite_planned_date, spiritual_status, is_evangelistic_prayer_focus")
    .eq("user_id", user.id)
    .order("line_number", { ascending: true });

  if (error) return { error: error.message };

  const lines: NetworkListLineDTO[] = (data ?? []).map((r) => ({
    lineNumber: r.line_number,
    name: r.name ?? "",
    invitePlannedDate: r.invite_planned_date ?? null,
    spiritualStatus: isSpiritualStatus(r.spiritual_status) ? r.spiritual_status : null,
    isEvangelisticPrayerFocus: Boolean(r.is_evangelistic_prayer_focus),
  }));

  return { lines };
}

/** Names currently marked for weekly CHAT evangelistic prayer (ordered by line). */
export async function getEvangelisticPrayerFocusNames(): Promise<
  { error: string } | { names: string[] }
> {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("relational_network_list_entries")
    .select("name, line_number")
    .eq("user_id", user.id)
    .eq("is_evangelistic_prayer_focus", true)
    .order("line_number", { ascending: true });

  if (error) return { error: error.message };

  const names = (data ?? [])
    .map((r) => String(r.name ?? "").trim())
    .filter((n) => n.length > 0);

  return { names };
}

export async function toggleEvangelisticPrayerFocus(input: {
  lineNumber: number;
  selected: boolean;
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

  const { data: row, error: rowErr } = await supabase
    .from("relational_network_list_entries")
    .select("name, is_evangelistic_prayer_focus")
    .eq("user_id", user.id)
    .eq("line_number", n)
    .maybeSingle();

  if (rowErr) return { error: rowErr.message };

  const name = String(row?.name ?? "").trim();
  if (!name) {
    return { error: "Add a name on this line before marking it for prayer focus." };
  }

  const currently = Boolean(row?.is_evangelistic_prayer_focus);

  if (input.selected) {
    if (currently) {
      return { success: true as const };
    }
    const { count, error: cntErr } = await supabase
      .from("relational_network_list_entries")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_evangelistic_prayer_focus", true);

    if (cntErr) return { error: cntErr.message };
    if ((count ?? 0) >= EVANGELISTIC_PRAYER_FOCUS_MAX) {
      return {
        error: `You can select up to ${EVANGELISTIC_PRAYER_FOCUS_MAX} people for this week. Uncheck one to choose someone else.`,
      };
    }
  } else if (!currently) {
    return { success: true as const };
  }

  const { error: upErr } = await supabase
    .from("relational_network_list_entries")
    .update({
      is_evangelistic_prayer_focus: input.selected,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .eq("line_number", n);

  if (upErr) return { error: upErr.message };

  revalidatePath("/app/list-of-100");
  revalidatePath("/app/chat", "layout");
  return { success: true as const };
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
    revalidatePath("/app/chat", "layout");
    return { success: true as const };
  }

  const { data: existing } = await supabase
    .from("relational_network_list_entries")
    .select("is_evangelistic_prayer_focus")
    .eq("user_id", user.id)
    .eq("line_number", n)
    .maybeSingle();

  const { error } = await supabase.from("relational_network_list_entries").upsert(
    {
      user_id: user.id,
      line_number: n,
      name,
      invite_planned_date: inviteDate,
      spiritual_status: status,
      is_evangelistic_prayer_focus: Boolean(existing?.is_evangelistic_prayer_focus),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,line_number" }
  );

  if (error) return { error: error.message };
  revalidatePath("/app/list-of-100");
  revalidatePath("/app/chat", "layout");
  return { success: true as const };
}
