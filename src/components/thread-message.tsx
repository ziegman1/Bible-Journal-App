"use client";

import Link from "next/link";
import { AIResponseSections } from "./ai-response-sections";
import type { ThreadMessage as ThreadMessageType } from "@/types/database";

interface ThreadMessageProps {
  message: ThreadMessageType;
  threadReference: string;
}

export function ThreadMessage({ message, threadReference }: ThreadMessageProps) {
  const isUser = message.role === "user";
  const aiData = message.structured_ai_response as Record<string, unknown> | null;

  return (
    <div
      className={`py-4 border-b border-border/50 last:border-0 ${
        isUser ? "" : "bg-card -mx-4 px-4"
      }`}
    >
      <div className="flex gap-3">
        <div className="shrink-0 w-8">
          <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
            {isUser ? "You" : "AI"}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          {isUser ? (
            <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
              {message.content}
            </p>
          ) : aiData ? (
            <AIResponseSections data={aiData} />
          ) : (
            <p className="text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
          )}
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-2">
            {new Date(message.created_at).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
