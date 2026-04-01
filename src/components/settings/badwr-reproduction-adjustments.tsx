"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  resetBadwrReproductionCountAdjustments,
  saveBadwrReproductionCountAdjustments,
} from "@/app/actions/badwr-reproduction-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BADWR_COUNT_ADJUSTMENT_FIELDS,
  clampBadwrCountAdjustment,
  type BadwrReproductionCountAdjustments,
} from "@/lib/dashboard/badwr-reproduction-count-adjustments";
import { toast } from "sonner";

type FieldKey = keyof BadwrReproductionCountAdjustments;

function buildFieldsFromAdjustments(
  d: BadwrReproductionCountAdjustments
): Record<FieldKey, string> {
  const o = {} as Record<FieldKey, string>;
  for (const { key } of BADWR_COUNT_ADJUSTMENT_FIELDS) {
    const v = d[key];
    o[key] = v != null && v !== 0 ? String(v) : "";
  }
  return o;
}

function parseFieldsToAdjustments(
  fields: Record<FieldKey, string>
): BadwrReproductionCountAdjustments {
  const out: BadwrReproductionCountAdjustments = {};
  for (const { key } of BADWR_COUNT_ADJUSTMENT_FIELDS) {
    const t = fields[key].trim();
    if (t === "") continue;
    const n = parseInt(t, 10);
    if (!Number.isFinite(n)) continue;
    const c = clampBadwrCountAdjustment(n);
    if (c !== 0) out[key] = c;
  }
  return out;
}

export function BadwrReproductionAdjustmentsSettings({
  initialAdjustments,
}: {
  initialAdjustments: BadwrReproductionCountAdjustments;
}) {
  const router = useRouter();
  const initialSerialized = useMemo(
    () => JSON.stringify(initialAdjustments),
    [initialAdjustments]
  );
  const [fields, setFields] = useState(() => buildFieldsFromAdjustments(initialAdjustments));
  const prevSerialized = useRef(initialSerialized);

  useEffect(() => {
    if (initialSerialized !== prevSerialized.current) {
      prevSerialized.current = initialSerialized;
      setFields(
        buildFieldsFromAdjustments(
          JSON.parse(initialSerialized) as BadwrReproductionCountAdjustments
        )
      );
    }
  }, [initialSerialized]);

  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  function setField(key: FieldKey, raw: string) {
    setFields((prev) => ({ ...prev, [key]: raw }));
  }

  async function handleSave() {
    const adjustments = parseFieldsToAdjustments(fields);
    setSaving(true);
    const result = await saveBadwrReproductionCountAdjustments(adjustments);
    setSaving(false);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    setFields(buildFieldsFromAdjustments(adjustments));
    toast.success("Reproduction adjustments saved");
    router.refresh();
  }

  async function handleReset() {
    if (
      !window.confirm(
        "Clear all manual count adjustments? The reproduction check will use only your logged activity again."
      )
    ) {
      return;
    }
    setResetting(true);
    const result = await resetBadwrReproductionCountAdjustments();
    setResetting(false);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    setFields(buildFieldsFromAdjustments({}));
    toast.success("Adjustments cleared");
    router.refresh();
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-base">Reproduction check adjustments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Add or subtract from the <span className="font-medium">totals</span> that feed your
          cumulative reproduction averages—without editing journals, prayer logs, shares, or group
          records. Rhythm totals are split evenly across every week included in your average (same
          weeks as the reproduction card). For 3/3rds with a participation start date, use
          &quot;3/3rds weeks&quot; to add or remove counted participated weeks (like a meeting you
          forgot to log).
        </p>
        <div className="space-y-4">
          {BADWR_COUNT_ADJUSTMENT_FIELDS.map(({ key, label, description }) => (
            <div key={key} className="space-y-1.5 border-b border-border/60 pb-3 last:border-0">
              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
                <Label htmlFor={`badwr-adj-${key}`} className="sm:w-48 shrink-0 text-sm">
                  {label}
                </Label>
                <Input
                  id={`badwr-adj-${key}`}
                  type="number"
                  min={-10000}
                  max={10000}
                  step={1}
                  inputMode="numeric"
                  placeholder="0"
                  value={fields[key]}
                  onChange={(e) => setField(key, e.target.value)}
                  className="sm:max-w-[140px] bg-white dark:bg-stone-900"
                />
              </div>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 pt-2">
          <Button type="button" onClick={handleSave} disabled={saving || resetting}>
            {saving ? "Saving…" : "Save adjustments"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={
              saving ||
              resetting ||
              Object.keys(parseFieldsToAdjustments(fields)).length === 0
            }
          >
            {resetting ? "Resetting…" : "Reset all adjustments"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
