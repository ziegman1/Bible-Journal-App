"use server";

import { randomBytes } from "crypto";
import { CHAT_CONTENT } from "@/content/chatContent";
import { sendChatGrowthInviteEmail } from "@/lib/email";
import { getPublicSiteBaseUrl } from "@/lib/public-site-url";
import { getClientOrThrow } from "@/lib/supabase/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitizePersonalNote(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, 2000);
}

export type SendChatGrowthInviteResult =
  | { ok: true }
  | { ok: false; error: string };

export async function sendChatGrowthInvite(formData: FormData): Promise<SendChatGrowthInviteResult> {
  const recipientName = String(formData.get("recipientName") ?? "").trim();
  const recipientEmail = String(formData.get("recipientEmail") ?? "").trim().toLowerCase();
  const personalNoteRaw = String(formData.get("personalNote") ?? "");
  const personalNote = sanitizePersonalNote(personalNoteRaw);

  if (!recipientName || recipientName.length > 200) {
    return { ok: false, error: "Please enter the recipient’s name." };
  }
  if (!recipientEmail || !EMAIL_RE.test(recipientEmail)) {
    return { ok: false, error: "Please enter a valid email address." };
  }

  const supabase = await getClientOrThrow();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) {
    return { ok: false, error: "You need to be signed in to send an invite." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  const senderName =
    profile?.display_name?.trim() || user.email?.split("@")[0]?.trim() || "A friend";
  const senderEmail = user.email?.trim().toLowerCase() ?? null;

  const token = randomBytes(32).toString("base64url");
  const base = getPublicSiteBaseUrl().replace(/\/$/, "");
  const invitePageUrl = `${base}/chat/invite/${encodeURIComponent(token)}`;

  const { error: insertErr } = await supabase.from("chat_growth_invites").insert({
    token,
    sender_user_id: user.id,
    sender_name: senderName,
    recipient_name: recipientName,
    recipient_email: recipientEmail,
    personal_note: personalNote || null,
    status: "sent",
  });

  if (insertErr) {
    return {
      ok: false,
      error:
        insertErr.message ||
        "Could not save the invite. If this persists, confirm migration 036_chat_growth_invites is applied.",
    };
  }

  const emailResult = await sendChatGrowthInviteEmail({
    to: recipientEmail,
    recipientName,
    senderName,
    senderEmail,
    invitePageUrl,
    personalNote: personalNote || null,
    subject: CHAT_CONTENT.growthInvite.emailSubject,
    frameworkBlurb: CHAT_CONTENT.growthInvite.frameworkBlurb,
  });

  if (!emailResult.success) {
    return {
      ok: false,
      error: emailResult.error ?? "The invite was saved but the email could not be sent.",
    };
  }

  return { ok: true };
}
