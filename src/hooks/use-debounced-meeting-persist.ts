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
 *
 * Persists are queued on a shared tail promise so overlapping saves (e.g. debounce firing
 * while a prior persist is still in flight) are not dropped.
 */
export function useDebouncedMeetingPersist({
  debounceMs,
  dirtyKey,
  skip,
  persist,
  savedHoldMs = DEFAULT_SAVED_HOLD_MS,
  onPersistError,
}: {
  debounceMs: number;
  dirtyKey: string;
  skip: boolean;
  persist: () => Promise<{ error?: string } | undefined>;
  savedHoldMs?: number;
  onPersistError?: (message: string) => void;
}): MeetingPersistStatus {
  const [status, setStatus] = useState<MeetingPersistStatus>("idle");
  const persistRef = useRef(persist);
  persistRef.current = persist;
  const onPersistErrorRef = useRef(onPersistError);
  onPersistErrorRef.current = onPersistError;
  const tailRef = useRef(Promise.resolve());

  useEffect(() => {
    if (skip) {
      setStatus("idle");
      return;
    }
    setStatus((s) => (s === "saving" ? s : "pending"));
    const timer = window.setTimeout(() => {
      tailRef.current = tailRef.current.then(async () => {
        setStatus("saving");
        try {
          const r = await persistRef.current();
          if (r?.error) {
            setStatus("error");
            onPersistErrorRef.current?.(r.error);
          } else {
            setStatus("saved");
            window.setTimeout(() => setStatus("idle"), savedHoldMs);
          }
        } catch (e) {
          setStatus("error");
          onPersistErrorRef.current?.(
            e instanceof Error ? e.message : "Couldn’t save"
          );
        }
      });
    }, debounceMs);
    return () => window.clearTimeout(timer);
  }, [dirtyKey, skip, debounceMs, savedHoldMs]);

  return status;
}
