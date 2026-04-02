import { useEffect, useRef, useState } from "react";

export type MeetingPersistStatus =
  | "idle"
  | "pending"
  | "saving"
  | "saved"
  | "error";

const DEFAULT_SAVED_HOLD_MS = 2800;

/**
 * When `dirtyKey` stops changing for `debounceMs`, runs `persist()`.
 * Use `skip: true` when there is nothing to save (e.g. local matches server, read-only).
 * `persist` should return `{ error?: string }` on failure.
 */
export function useDebouncedMeetingPersist({
  debounceMs,
  dirtyKey,
  skip,
  persist,
  savedHoldMs = DEFAULT_SAVED_HOLD_MS,
}: {
  debounceMs: number;
  dirtyKey: string;
  skip: boolean;
  persist: () => Promise<{ error?: string } | undefined>;
  savedHoldMs?: number;
}): MeetingPersistStatus {
  const [status, setStatus] = useState<MeetingPersistStatus>("idle");
  const persistRef = useRef(persist);
  persistRef.current = persist;
  const inFlightRef = useRef(false);

  useEffect(() => {
    if (skip) {
      setStatus("idle");
      return;
    }
    setStatus((s) => (s === "saving" ? s : "pending"));
    const timer = window.setTimeout(async () => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      setStatus("saving");
      try {
        const r = await persistRef.current();
        if (r?.error) {
          setStatus("error");
        } else {
          setStatus("saved");
          window.setTimeout(() => setStatus("idle"), savedHoldMs);
        }
      } catch {
        setStatus("error");
      } finally {
        inFlightRef.current = false;
      }
    }, debounceMs);
    return () => window.clearTimeout(timer);
  }, [dirtyKey, skip, debounceMs, savedHoldMs]);

  return status;
}
