import Link from "next/link";
import { getEvangelisticPrayerFocusNames } from "@/app/actions/list-of-100";
import { ChatAccountabilityGuide } from "@/components/chat/chat-accountability-guide";

export default async function ChatAccountabilityQuestionsPage() {
  const focusRes = await getEvangelisticPrayerFocusNames();
  const evangelisticFocusNames = "error" in focusRes ? [] : focusRes.names;

  return (
    <div className="mx-auto max-w-3xl p-6 pb-16">
      <Link
        href="/app/chat"
        className="mb-6 inline-block text-sm text-stone-600 underline-offset-2 hover:underline dark:text-stone-400"
      >
        ← Back to CHAT overview
      </Link>

      <ChatAccountabilityGuide
        variant="standalone"
        evangelisticFocusNames={evangelisticFocusNames}
      />
    </div>
  );
}
