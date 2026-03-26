import Link from "next/link";
import { ChatAccountabilityGuide } from "@/components/chat/chat-accountability-guide";

/** Auth is enforced by `app/layout.tsx`; keep this page static so content always renders. */
export default function ChatAccountabilityQuestionsPage() {
  return (
    <div className="mx-auto max-w-3xl p-6 pb-16">
      <Link
        href="/app/chat"
        className="mb-6 inline-block text-sm text-stone-600 underline-offset-2 hover:underline dark:text-stone-400"
      >
        ← Back to CHAT overview
      </Link>

      <ChatAccountabilityGuide variant="standalone" />
    </div>
  );
}
