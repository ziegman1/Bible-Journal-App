"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { askPassageQuestion } from "@/app/actions/ai";
import { createJournalEntry } from "@/app/actions/journal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, BookMarked, MessageSquare, RotateCcw } from "lucide-react";
import type { AIResponseJSON, ThreadMessage } from "@/types/database";
import { toast } from "sonner";
import { AIResponseSections } from "./ai-response-sections";
import { ThreadMessage as ThreadMessageComponent } from "./thread-message";

interface AskAIPanelProps {
  bookId: string;
  bookName: string;
  chapter: number;
  verseStart: number | null;
  verseEnd: number | null;
  reference: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aiStyle?: "concise" | "balanced" | "in-depth";
  defaultToReflection?: boolean;
  initialThreadId?: string | null;
  initialMessages?: ThreadMessage[];
}

export function AskAIPanel({
  bookId,
  bookName,
  chapter,
  verseStart,
  verseEnd,
  reference,
  open,
  onOpenChange,
  aiStyle = "balanced",
  defaultToReflection = false,
  initialThreadId = null,
  initialMessages = [],
}: AskAIPanelProps) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AIResponseJSON | null>(null);
  const [aiResponseId, setAiResponseId] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(initialThreadId);
  const [messages, setMessages] = useState<ThreadMessage[]>(initialMessages);
  const [savingToJournal, setSavingToJournal] = useState(false);
  const [savedEntryId, setSavedEntryId] = useState<string | null>(null);
  const [reflection, setReflection] = useState("");
  const [prayer, setPrayer] = useState("");
  const [application, setApplication] = useState("");
  const [tags, setTags] = useState("");
  const [lastError, setLastError] = useState<string | null>(null);

  const prevThreadIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (prevThreadIdRef.current !== initialThreadId) {
      prevThreadIdRef.current = initialThreadId;
      setThreadId(initialThreadId);
      setMessages(initialMessages);
    }
  }, [initialThreadId, initialMessages]);

  const prevReferenceRef = useRef(reference);
  useEffect(() => {
    if (prevReferenceRef.current !== reference && !initialThreadId) {
      prevReferenceRef.current = reference;
      setThreadId(null);
      setMessages([]);
      setResponse(null);
      setLastError(null);
    }
  }, [reference, initialThreadId]);

  async function handleAsk() {
    if (!question.trim()) return;
    setLoading(true);
    setResponse(null);
    setAiResponseId(null);
    setLastError(null);

    const createNewThread = !threadId;
    const result = await askPassageQuestion(
      bookId,
      bookName,
      chapter,
      verseStart,
      verseEnd,
      question.trim(),
      aiStyle,
      { createStudyThread: createNewThread, threadId: threadId ?? undefined }
    );

    setLoading(false);

    if (result?.error) {
      setLastError(result.error);
      toast.error(result.error);
      return;
    }

    if (result?.success && result.response) {
      setLastError(null);
      setResponse(result.response);
      setAiResponseId(result.aiResponseId ?? null);
      setSavedEntryId(null);
      if (result.threadId) {
        setThreadId(result.threadId);
        setMessages((prev) => [
          ...prev,
          {
            id: `user-${Date.now()}`,
            thread_id: result.threadId!,
            role: "user",
            content: question.trim(),
            structured_ai_response: null,
            created_at: new Date().toISOString(),
          },
          {
            id: `ai-${Date.now()}`,
            thread_id: result.threadId!,
            role: "assistant",
            content: JSON.stringify(result.response),
            structured_ai_response: result.response,
            created_at: new Date().toISOString(),
          },
        ]);
      }
      setQuestion("");
      toast.success("Response received");
    }
  }

  async function handleSaveToJournal() {
    setSavingToJournal(true);

    const result = await createJournalEntry({
      reference,
      book: bookName,
      chapter,
      verseStart,
      verseEnd,
      userQuestion: question || undefined,
      userReflection: reflection || undefined,
      prayer: prayer || undefined,
      application: application || undefined,
      aiResponseId: aiResponseId ?? undefined,
      studyThreadId: threadId ?? undefined,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });

    setSavingToJournal(false);

    if (result?.error) {
      toast.error(result.error);
      return;
    }

    setSavedEntryId(result.entryId ?? null);
    toast.success("Saved to journal");
    setReflection("");
    setPrayer("");
    setApplication("");
    setTags("");
    setResponse(null);
    setAiResponseId(null);
    setQuestion("");
  }

  if (!open) {
    return (
      <div className="p-4 text-center text-stone-500 dark:text-stone-400 text-sm space-y-2">
        <p>Tap a verse for actions.</p>
        <p>Ask AI, add reflection, highlight, or favorite.</p>
      </div>
    );
  }

  const showReflectionFirst = defaultToReflection && !response && !savedEntryId;
  const hasMessages = messages.length > 0;

  return (
    <div className="p-4 space-y-4 flex flex-col min-h-0">
      {!showReflectionFirst && (
        <>
          {lastError && (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-900/20 px-3 py-2 shrink-0">
              <p className="text-sm text-amber-800 dark:text-amber-200">{lastError}</p>
              <Button variant="outline" size="sm" onClick={handleAsk} disabled={loading}>
                <RotateCcw className="size-4 mr-1" />
                Try again
              </Button>
            </div>
          )}
          <div className="space-y-2 shrink-0">
            <Label htmlFor="question">Ask about {reference}</Label>
            <div className="flex gap-2">
              <Input
                id="question"
                placeholder="e.g. What does this mean in context?"
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
              <Button onClick={handleAsk} disabled={loading}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : "Ask"}
              </Button>
            </div>
          </div>

          {threadId && (
            <Link
              href={`/app/thread/${threadId}`}
              className="text-xs text-stone-500 dark:text-stone-400 hover:underline flex items-center gap-1 shrink-0"
            >
              <MessageSquare className="size-3" />
              View full thread
            </Link>
          )}

          {hasMessages && (
            <div className="flex-1 overflow-auto min-h-0 space-y-0 -mx-4">
              <div className="px-4 divide-y divide-stone-100 dark:divide-stone-800/50">
                {messages
                  .filter((m) => m.role !== "system")
                  .map((m) => (
                    <ThreadMessageComponent
                      key={m.id}
                      message={m}
                      threadReference={reference}
                    />
                  ))}
              </div>
            </div>
          )}

          {response && !hasMessages && (
            <div className="flex-1 overflow-auto min-h-0">
              <div className="space-y-4">
                <div className="rounded-lg border border-stone-200 dark:border-stone-800 p-4 bg-stone-50/50 dark:bg-stone-900/30">
                  <h3 className="text-sm font-medium text-stone-600 dark:text-stone-400 mb-3">
                    AI Insight
                  </h3>
                  <AIResponseSections data={response} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reflection">Your reflection</Label>
                  <Textarea
                    id="reflection"
                    placeholder="Your thoughts and insights..."
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value)}
                    rows={2}
                    className="resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prayer">Prayer</Label>
                  <Textarea
                    id="prayer"
                    placeholder="A prayer inspired by this passage..."
                    value={prayer}
                    onChange={(e) => setPrayer(e.target.value)}
                    rows={2}
                    className="resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="application">Application</Label>
                  <Textarea
                    id="application"
                    placeholder="How will you apply this?"
                    value={application}
                    onChange={(e) => setApplication(e.target.value)}
                    rows={2}
                    className="resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    placeholder="faith, hope, love"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveToJournal}
                    disabled={savingToJournal}
                    className="flex-1"
                  >
                    {savingToJournal ? (
                      <Loader2 className="size-4 animate-spin mr-2" />
                    ) : (
                      <BookMarked className="size-4 mr-2" />
                    )}
                    Save to journal
                  </Button>
                  {savedEntryId && (
                    <Link href={`/app/journal/${savedEntryId}`}>
                      <Button variant="outline">View entry</Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}

          {response && hasMessages && (
            <div className="space-y-4 shrink-0">
              <div className="space-y-2">
                <Label htmlFor="reflection">Your reflection</Label>
                <Textarea
                  id="reflection"
                  placeholder="Your thoughts and insights..."
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  rows={2}
                  className="resize-none"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveToJournal}
                  disabled={savingToJournal}
                  className="flex-1"
                >
                  {savingToJournal ? (
                    <Loader2 className="size-4 animate-spin mr-2" />
                  ) : (
                    <BookMarked className="size-4 mr-2" />
                  )}
                  Save to journal
                </Button>
                {savedEntryId && (
                  <Link href={`/app/journal/${savedEntryId}`}>
                    <Button variant="outline">View entry</Button>
                  </Link>
                )}
              </div>
            </div>
          )}

          {savedEntryId && !response && (
            <p className="text-sm text-stone-600 dark:text-stone-400 shrink-0">
              <Link href={`/app/journal/${savedEntryId}`} className="underline">
                View saved entry →
              </Link>
            </p>
          )}

          {!response && !savedEntryId && (reflection || prayer || application) && (
            <div className="space-y-2 shrink-0">
              <Label>Quick add (no AI)</Label>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Add reflection, prayer, or application and save without asking AI.
              </p>
              <div className="space-y-2">
                <Textarea
                  placeholder="Your reflection..."
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  rows={2}
                  className="resize-none"
                />
                <Textarea
                  placeholder="Prayer..."
                  value={prayer}
                  onChange={(e) => setPrayer(e.target.value)}
                  rows={1}
                  className="resize-none"
                />
                <Textarea
                  placeholder="Application..."
                  value={application}
                  onChange={(e) => setApplication(e.target.value)}
                  rows={1}
                  className="resize-none"
                />
                <Input
                  placeholder="Tags (comma-separated)"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
                <Button
                  onClick={handleSaveToJournal}
                  disabled={savingToJournal}
                  variant="outline"
                  className="w-full"
                >
                  {savingToJournal ? <Loader2 className="size-4 animate-spin mr-2" /> : <BookMarked className="size-4 mr-2" />}
                  Save to journal (no AI)
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {showReflectionFirst && (
        <div className="space-y-2">
          <Label>Add reflection for {reference}</Label>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Save your thoughts without asking AI.
          </p>
          <div className="space-y-2">
            <Textarea
              placeholder="Your reflection..."
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              rows={2}
              className="resize-none"
            />
            <Textarea
              placeholder="Prayer..."
              value={prayer}
              onChange={(e) => setPrayer(e.target.value)}
              rows={1}
              className="resize-none"
            />
            <Textarea
              placeholder="Application..."
              value={application}
              onChange={(e) => setApplication(e.target.value)}
              rows={1}
              className="resize-none"
            />
            <Input
              placeholder="Tags (comma-separated)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
            <Button
              onClick={handleSaveToJournal}
              disabled={savingToJournal}
              variant="outline"
              className="w-full"
            >
              {savingToJournal ? <Loader2 className="size-4 animate-spin mr-2" /> : <BookMarked className="size-4 mr-2" />}
              Save to journal
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
