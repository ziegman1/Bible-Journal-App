import { appendSharePromoToPlainText } from "@/lib/share-promo";

/** Short explanation for SMS / share text (keep under typical SMS length when possible). */
export const CHAT_GROUP_INVITE_SUMMARY =
  "CHAT group: 2–3 same-gender friends meet weekly for accountability—Check progress, Hear the Word, Act on it, Tell others. Join me on Logosflow to read and grow together.";

export function buildChatInviteShareText(params: {
  inviterName: string;
  groupName: string;
  acceptUrl: string;
}): string {
  const who = params.inviterName.trim() || "A friend";
  const core = `${who} invited you to a CHAT accountability group "${params.groupName}" on Logosflow.\n\n${CHAT_GROUP_INVITE_SUMMARY}\n\nAccept (sign up with this invite link):\n${params.acceptUrl}`;
  return appendSharePromoToPlainText(core);
}
