"use client";

/**
 * Manual weekly CHAT log on Manage: corrects `chat_reading_check_ins` for weeks before Q18 existed.
 * Discipleship momentum reads only that table—edits apply on next engine run automatically.
 */

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { ChatWeeklyLogRow } from "@/app/actions/chat-weekly-log";
import { saveChatWeeklyLogEntry } from "@/app/actions/chat-weekly-log";
import { cn } from "@/lib/utils";

type RowStatus = ChatWeeklyLogRow["status"];

type Props = {
  groupId: string;
  rows: ChatWeeklyLogRow[];
  meetingHint: string | null;
  error?: string;
};

export function ChatWeeklyLogSection({ groupId, rows, meetingHint, error }: Props) {
  const router = useRouter();
  /** Optimistic picks: controlled selects revert if we only use server `r.status` before refresh completes. */
  const [optimistic, setOptimistic] = useState<Partial<Record<string, RowStatus>>>({});
  const [savingWeek, setSavingWeek] = useState<string | null>(null);
  const rowsSig = useRef<string>("");

  useEffect(() => {
    setOptimistic({});
    rowsSig.current = "";
  }, [groupId]);

  const serializedRows = rows.map((r) => `${r.weekStartYmd}:${r.status}`).join("|");
  useEffect(() => {
    if (serializedRows === rowsSig.current) return;
    rowsSig.current = serializedRows;
    setOptimistic((prev) => {
      const next = { ...prev };
      for (const k of Object.keys(next)) {
        const row = rows.find((r) => r.weekStartYmd === k);
        if (row && row.status === next[k]) {
          delete next[k];
        }
      }
      return next;
    });
  }, [serializedRows, rows]);

  function displayStatus(r: ChatWeeklyLogRow): RowStatus {
    return optimistic[r.weekStartYmd] ?? r.status;
  }

  async function onStatusChange(weekStartYmd: string, next: RowStatus) {
    setOptimistic((o) => ({ ...o, [weekStartYmd]: next }));
    setSavingWeek(weekStartYmd);
    try {
      const res = await saveChatWeeklyLogEntry(groupId, weekStartYmd, next);
      if ("error" in res) {
        setOptimistic((o) => {
          const n = { ...o };
          delete n[weekStartYmd];
          return n;
        });
        toast.error(res.error);
        return;
      }
      toast.success("Saved");
      router.refresh();
    } catch (e) {
      setOptimistic((o) => {
        const n = { ...o };
        delete n[weekStartYmd];
        return n;
      });
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSavingWeek(null);
    }
  }

  if (error) {
    return (
      <section className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-destructive">
        Weekly log could not load: {error}
      </section>
    );
  }

  return (
    <section className="space-y-3 rounded-lg border border-dashed border-border bg-muted/20 px-4 py-4">
      <div>
        <h2 className="text-sm font-medium text-foreground">Weekly CHAT log</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Backfill and fix historical weeks. Uses the same weekly records as Q18 (
          <code className="rounded bg-muted px-1">chat_reading_check_ins</code>) so discipleship momentum
          stays aligned.
        </p>
        {meetingHint ? (
          <p className="mt-1 text-xs text-muted-foreground">{meetingHint}</p>
        ) : null}
      </div>

      <div
        className={cn(
          "max-h-80 overflow-auto rounded-md border border-border bg-background",
          savingWeek != null && "opacity-90"
        )}
      >
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 bg-muted/90 text-[10px] uppercase tracking-wide text-muted-foreground backdrop-blur-sm">
            <tr>
              <th className="px-2 py-1.5 font-medium">Week (pillar Sun–Sat)</th>
              <th className="px-2 py-1.5 font-medium">Status</th>
              <th className="px-2 py-1.5 font-medium">Set</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const st = displayStatus(r);
              return (
                <tr key={r.weekStartYmd} className="border-t border-border/60">
                  <td className="px-2 py-1.5 align-top">
                    <div className="font-medium text-foreground">{r.rangeLabel}</div>
                    <div className="text-[10px] text-muted-foreground">Sun {r.weekStartYmd}</div>
                  </td>
                  <td className="px-2 py-1.5 align-top text-muted-foreground">
                    {st === "completed" && "Recorded: completed"}
                    {st === "missed" && "Recorded: missed"}
                    {st === "none" && "No record"}
                  </td>
                  <td className="px-2 py-1.5 align-top">
                    <label className="sr-only" htmlFor={`chat-week-${r.weekStartYmd}`}>
                      Status for week {r.weekStartYmd}
                    </label>
                    <select
                      id={`chat-week-${r.weekStartYmd}`}
                      className="w-full max-w-[13rem] rounded border border-input bg-background px-2 py-1 text-xs"
                      value={st}
                      disabled={savingWeek === r.weekStartYmd}
                      onChange={(e) => {
                        const v = e.target.value as RowStatus;
                        void onStatusChange(r.weekStartYmd, v);
                      }}
                    >
                      <option value="none">No record</option>
                      <option value="completed">Completed</option>
                      <option value="missed">Missed (not completed)</option>
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-muted-foreground">
        <strong>Completed</strong> = kept up (same as Q18 “yes”).{" "}
        <strong>Missed (not completed)</strong> = you did not complete that week.{" "}
        <strong>No record</strong> removes the row (unknown / not logged).
      </p>
      <p className="text-[10px] text-muted-foreground border-t border-border/60 pt-2">
        <strong>Discipleship momentum / Formation:</strong> the home card shows <strong>benchmark bands</strong>{" "}
        (e.g. Steady → Strong) from a <strong>blend of all practices</strong>, not a single “Formation %.”
        CHAT adds mass to Formation, but older weeks are <strong>recency-weighted</strong>, so fixing history
        may move the score only a little until totals cross the next band. Refresh the home dashboard after
        saving to reload metrics.
      </p>
    </section>
  );
}
