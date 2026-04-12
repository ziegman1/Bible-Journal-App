"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";
import {
  saveRelationalNetworkLine,
  toggleEvangelisticPrayerFocus,
} from "@/app/actions/list-of-100";
import { ListOf100Instructions } from "@/components/list-of-100/list-of-100-instructions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button-variants";
import {
  EVANGELISTIC_PRAYER_FOCUS_MAX,
  LIST_OF_100_MAX_LINES,
  type NetworkListLineDTO,
  type SpiritualStatus,
} from "@/lib/list-of-100/types";
import { cn } from "@/lib/utils";

type RowDraft = {
  name: string;
  inviteDate: string;
  spiritualStatus: SpiritualStatus | null;
  evangelisticFocus: boolean;
};

function initialVisibleCount(lines: NetworkListLineDTO[]): number {
  let lastWithContent = 0;
  for (const l of lines) {
    const has =
      l.name.trim() ||
      (l.invitePlannedDate ?? "").trim() ||
      l.spiritualStatus != null;
    if (has) lastWithContent = Math.max(lastWithContent, l.lineNumber);
  }
  if (lastWithContent === 0) return 1;
  return Math.min(LIST_OF_100_MAX_LINES, lastWithContent + 1);
}

function dtoToRows(lines: NetworkListLineDTO[], count: number): RowDraft[] {
  const m = new Map(lines.map((l) => [l.lineNumber, l]));
  return Array.from({ length: count }, (_, i) => {
    const ln = i + 1;
    const L = m.get(ln);
    return {
      name: L?.name ?? "",
      inviteDate: L?.invitePlannedDate ?? "",
      spiritualStatus: L?.spiritualStatus ?? null,
      evangelisticFocus: L?.isEvangelisticPrayerFocus ?? false,
    };
  });
}

export function ListOf100Editor({ initialLines }: { initialLines: NetworkListLineDTO[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(() => dtoToRows(initialLines, initialVisibleCount(initialLines)));
  const [savingLine, setSavingLine] = useState<number | null>(null);
  const [focusMessage, setFocusMessage] = useState<string | null>(null);
  const nameInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const rowsRef = useRef(rows);

  useLayoutEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  useEffect(() => {
    queueMicrotask(() => {
      const count = initialVisibleCount(initialLines);
      setRows(dtoToRows(initialLines, count));
    });
  }, [initialLines]);

  const persist = useCallback(async (lineNumber: number, draft: RowDraft) => {
    setSavingLine(lineNumber);
    const res = await saveRelationalNetworkLine({
      lineNumber,
      name: draft.name,
      invitePlannedDate: draft.inviteDate.trim() || null,
      spiritualStatus: draft.spiritualStatus,
    });
    setSavingLine(null);
    return res;
  }, []);

  const updateRow = useCallback((index: number, patch: Partial<RowDraft>) => {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  }, []);

  const toggleStatus = useCallback(
    async (index: number, status: SpiritualStatus) => {
      const lineNumber = index + 1;
      const row = rowsRef.current[index];
      const nextStatus = row.spiritualStatus === status ? null : status;
      const updated = { ...row, spiritualStatus: nextStatus };
      updateRow(index, { spiritualStatus: nextStatus });
      await persist(lineNumber, updated);
    },
    [persist, updateRow]
  );

  const onNameKeyDown = useCallback(
    async (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
      if (e.key !== "Enter" || e.shiftKey) return;
      const row = rowsRef.current[index];
      if (!row.name.trim()) return;
      e.preventDefault();
      await persist(index + 1, row);
      const len = rowsRef.current.length;
      if (index === len - 1 && len < LIST_OF_100_MAX_LINES) {
        setRows((prev) => [
          ...prev,
          { name: "", inviteDate: "", spiritualStatus: null, evangelisticFocus: false },
        ]);
        requestAnimationFrame(() => {
          nameInputRefs.current[index + 1]?.focus();
        });
      }
    },
    [persist]
  );

  const onBlurRow = useCallback(
    async (index: number) => {
      await persist(index + 1, rowsRef.current[index]);
    },
    [persist]
  );

  const rowBusy = useCallback((index: number) => savingLine === index + 1, [savingLine]);

  const onToggleEvangelisticFocus = useCallback(
    async (index: number, selected: boolean) => {
      const lineNumber = index + 1;
      const row = rowsRef.current[index];
      if (!row.name.trim()) {
        setFocusMessage("Add a name and leave the field to save this line before selecting it.");
        return;
      }
      setFocusMessage(null);
      setSavingLine(lineNumber);
      const saveRes = await persist(lineNumber, row);
      if (saveRes && "error" in saveRes) {
        setSavingLine(null);
        setFocusMessage(saveRes.error);
        return;
      }
      const res = await toggleEvangelisticPrayerFocus({ lineNumber, selected });
      setSavingLine(null);
      if ("error" in res) {
        setFocusMessage(res.error);
        return;
      }
      updateRow(index, { evangelisticFocus: selected });
      router.refresh();
    },
    [persist, router, updateRow]
  );

  const focusSelectedCount = rows.filter((r) => r.evangelisticFocus).length;

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
      <ListOf100Instructions />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">List of 100 training</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Zúme Training introduces relational stewardship and the List of 100—with video,
            transcript, and prompts for engaging people God has already put in your life.
          </p>
          <a
            href="https://zume.training/relational-stewardship-list-of-100"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "inline-flex items-center gap-2"
            )}
          >
            Open Relational Stewardship – List of 100 on Zúme
            <ExternalLink className="size-3.5 opacity-70" aria-hidden />
          </a>
        </CardContent>
      </Card>

      <div className="overflow-x-auto rounded-lg border border-border shadow-sm">
        <table className="w-full min-w-[700px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left">
              <th className="w-10 px-2 py-3 text-center font-semibold text-foreground">#</th>
              <th
                className="w-11 px-1 py-3 text-center font-semibold text-foreground"
                title={`This week — evangelistic prayer focus (max ${EVANGELISTIC_PRAYER_FOCUS_MAX})`}
              >
                <span className="sr-only">This week</span>
                <span className="text-[11px] font-medium leading-tight text-muted-foreground">
                  Week
                </span>
              </th>
              <th className="min-w-[180px] px-3 py-3 font-semibold text-foreground">Name</th>
              <th className="w-36 px-2 py-3 font-semibold text-foreground">Date</th>
              <th className="w-24 px-2 py-3 text-center font-semibold text-foreground">
                Believer
              </th>
              <th className="w-24 px-2 py-3 text-center font-semibold text-foreground">
                Unknown
              </th>
              <th className="w-28 px-2 py-3 text-center font-semibold text-foreground">
                Unbeliever
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={index}
                className={cn(
                  "border-b border-border/80",
                  rowBusy(index) ? "bg-muted/20" : "hover:bg-muted/10",
                  row.evangelisticFocus && "bg-violet-50/50 dark:bg-violet-950/20"
                )}
              >
                <td className="px-2 py-2 text-center tabular-nums text-muted-foreground">
                  {index + 1}.
                </td>
                <td className="px-1 py-2 text-center align-middle">
                  <input
                    type="checkbox"
                    aria-label={`Prayer focus this week row ${index + 1}`}
                    checked={row.evangelisticFocus}
                    disabled={rowBusy(index) || !row.name.trim()}
                    onChange={(e) => onToggleEvangelisticFocus(index, e.target.checked)}
                    className="size-4 cursor-pointer rounded border-input accent-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
                    title={
                      !row.name.trim()
                        ? "Add a name and save this line first"
                        : `This week (${focusSelectedCount}/${EVANGELISTIC_PRAYER_FOCUS_MAX} selected)`
                    }
                  />
                </td>
                <td className="px-2 py-2">
                  <Input
                    ref={(el) => {
                      nameInputRefs.current[index] = el;
                    }}
                    aria-label={`Name row ${index + 1}`}
                    value={row.name}
                    onChange={(e) => updateRow(index, { name: e.target.value })}
                    onBlur={() => onBlurRow(index)}
                    onKeyDown={(e) => onNameKeyDown(e, index)}
                    placeholder="Name"
                    className="h-9"
                    disabled={rowBusy(index)}
                  />
                </td>
                <td className="px-2 py-2">
                  <Input
                    type="date"
                    aria-label={`Planned invite date row ${index + 1}`}
                    value={row.inviteDate}
                    onChange={(e) => updateRow(index, { inviteDate: e.target.value })}
                    onBlur={() => onBlurRow(index)}
                    className="h-9 font-mono text-xs sm:text-sm"
                    disabled={rowBusy(index)}
                  />
                </td>
                {(["believer", "unknown", "unbeliever"] as const).map((st) => (
                  <td key={st} className="px-2 py-2 text-center align-middle">
                    <input
                      type="checkbox"
                      aria-label={`${st} row ${index + 1}`}
                      checked={row.spiritualStatus === st}
                      disabled={rowBusy(index)}
                      onChange={() => toggleStatus(index, st)}
                      className="size-4 cursor-pointer rounded border-input accent-emerald-700"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {focusMessage ? (
        <p className="text-sm text-amber-800 dark:text-amber-200" role="status">
          {focusMessage}
        </p>
      ) : null}
      <p className="text-xs text-muted-foreground">
        Prayer focus:{" "}
        <span className="font-medium text-foreground">
          {focusSelectedCount}/{EVANGELISTIC_PRAYER_FOCUS_MAX}
        </span>{" "}
        selected for this week.
      </p>

      <p className="text-xs text-muted-foreground">
        Press <kbd className="rounded border px-1 py-0.5 font-mono text-[10px]">Enter</kbd> in a
        name field when that line is filled to add the next row (up to {LIST_OF_100_MAX_LINES}).
        Changes save when you leave a field or toggle a status.
      </p>

      {rows.length >= LIST_OF_100_MAX_LINES ? (
        <p className="text-sm text-amber-800 dark:text-amber-200">
          You have reached the maximum of {LIST_OF_100_MAX_LINES} lines.
        </p>
      ) : null}
    </div>
  );
}
