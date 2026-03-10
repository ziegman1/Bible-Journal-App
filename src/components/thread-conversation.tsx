"use client";

import { useState } from "react";
import { askPassageQuestion } from "@/app/actions/ai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import type { ThreadMessage } from "@/types/database";
import { ThreadMessage as ThreadMessageComponent } from "./thread-message";

interface ThreadConversationProps {
  threadId: string;
  threadReference: string;
  bookId: string;
  bookName: string;
  chapter: number;
  verseStart?: number;
  verseEnd?: number;
  initialMessages: ThreadMessage[];
  aiStyle?: "concise" | "balanced" | "in-depth";
}

export function ThreadConversation({
  threadId,
  threadReference,
  bookId,
  bookName,
  chapter,
  verseStart,
  verseEnd,
  initialMessages,
  aiStyle = "balanced",
}: ThreadConversationProps) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ThreadMessage[]>(initialMessages);
  const [lastError, setLastError] = useState<string | null>(null);

  async function handleAsk(q?: string) {
    const text = (q ?? question).trim();
    if (!text) return;
    setLoading(true);
    setLastError(null);

    const result = await askPassageQuestion(
      bookId,
      bookName,
      chapter,
      verseStart ?? null,
      verseEnd ?? null,
      text,
      aiStyle,
      { threadId }
    );

    setLoading(false);

    if (result?.error) {
      setLastError(result.error);
      toast.error(result.error);
      return;
    }

    if (result?.success && result.response) {
      setLastError(null);
      setMessages((prev) => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          thread_id: threadId,
          role: "user",
          content: text,
          structured_ai_response: null,
          created_at: new Date().toISOString(),
        },
        {
          id: `ai-${Date.now()}`,
          thread_id: threadId,
          role: "assistant",
          content: JSON.stringify(result.response),
          structured_ai_response: result.response,
          created_at: new Date().toISOString(),
        },
      ]);
      setQuestion("");
      toast.success("Response received");
    }
  }

  function handleRetry() {
    if (lastError) {
      handleAsk(question || undefined);
    }
  }

  const visibleMessages = messages.filter((m) => m.role !== "system");
  const isEmpty = visibleMessages.length === 0;

  return (
    <div className="space-y-8">
      <div className="space-y-0 divide-y divide-stone-100 dark:divide-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden bg-white dark:bg-stone-950/50">
        {isEmpty ? (
          <div className="px-6 py-12 text-center">
            <p className="text-stone-500 dark:text-stone-400 font-serif">
              No messages yet.
            </p>
            <p className="text-stone-400 dark:text-stone-500 text-sm mt-2">
              Ask a question below to start the conversation.
            </p>
          </div>
        ) : (
          visibleMessages.map((m) => (
            <div key={m.id} className="px-6">
              <ThreadMessageComponent message={m} threadReference={threadReference} />
            </div>
          ))
        )}
      </div>

      <div className="space-y-3">
        {lastError && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-900/20 px-4 py-2">
            <p className="text-sm text-amber-800 dark:text-amber-200">{lastError}</p>
            <Button variant="outline" size="sm" onClick={handleRetry} disabled={loading}>
              <RotateCcw className="size-4 mr-1" />
              Try again
            </Button>
          </div>
        )}
        <Label htmlFor="follow-up" className="text-stone-600 dark:text-stone-400">
          Ask a follow-up
        </Label>
        <div className="flex gap-3">
          <Input
            id="follow-up"
            placeholder="e.g. Can you explain that further?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleAsk();
              }
            }}
            disabled={loading}
            className="flex-1"
          />
          <Button onClick={() => handleAsk()} disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : "Ask"}
          </Button>
        </div>
      </div>
    </div>
  );
}
