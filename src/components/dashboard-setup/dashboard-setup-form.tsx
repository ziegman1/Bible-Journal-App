"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { saveCustomDashboardItems } from "@/app/actions/app-experience";
import {
  DASHBOARD_ITEM_IDS,
  dashboardItemsByGroup,
  DASHBOARD_ITEM_GROUP_LABEL,
  type DashboardItemGroupId,
  type DashboardItemId,
} from "@/lib/app-experience-mode/dashboard-items";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const GROUP_ORDER: readonly DashboardItemGroupId[] = [
  "rhythms",
  "growth_gauges",
  "extras",
  "reproduction",
];

interface DashboardSetupFormProps {
  initialSelected: DashboardItemId[];
}

export function DashboardSetupForm({ initialSelected }: DashboardSetupFormProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<DashboardItemId>>(
    () => new Set(initialSelected)
  );
  const [saving, setSaving] = useState(false);

  const orderedSelection = useMemo(() => {
    return DASHBOARD_ITEM_IDS.filter((id) => selected.has(id));
  }, [selected]);

  function toggle(id: DashboardItemId, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function handleSave() {
    if (orderedSelection.length === 0) {
      toast.error("Select at least one item. Your dashboard can be as minimal as a single tool.");
      return;
    }
    setSaving(true);
    const result = await saveCustomDashboardItems(orderedSelection);
    setSaving(false);
    if ("error" in result && result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Dashboard saved");
    router.push("/app");
    router.refresh();
  }

  const byGroup = dashboardItemsByGroup();

  return (
    <div className="space-y-10">
      <p className="text-xs text-muted-foreground -mt-2 mb-2">
        The dashboard header and Me / BADWR name always appear. Below, each checkbox adds a full
        feature bundle (quick action, streak, and card together where that applies).
      </p>
      {GROUP_ORDER.map((groupId) => {
        const items = byGroup.get(groupId) ?? [];
        if (items.length === 0) return null;
        return (
          <section key={groupId} aria-labelledby={`dash-group-${groupId}`}>
            <h2
              id={`dash-group-${groupId}`}
              className="text-sm font-semibold text-foreground mb-3"
            >
              {DASHBOARD_ITEM_GROUP_LABEL[groupId]}
            </h2>
            <div className="space-y-3">
              {items.map((mod) => (
                <div
                  key={mod.id}
                  className="flex gap-3 rounded-lg border border-border bg-card p-4 items-start"
                >
                  <input
                    id={mod.id}
                    type="checkbox"
                    className="mt-1 h-4 w-4 shrink-0 rounded border border-input accent-primary"
                    checked={selected.has(mod.id)}
                    onChange={(e) => toggle(mod.id, e.target.checked)}
                  />
                  <div className="space-y-1 min-w-0 flex-1">
                    <Label htmlFor={mod.id} className="text-base font-medium cursor-pointer">
                      {mod.title}
                    </Label>
                    <p className="text-sm text-muted-foreground">{mod.description}</p>
                    <p className="text-xs text-muted-foreground/80" data-help-slot={mod.helpKey} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button type="button" onClick={() => void handleSave()} disabled={saving}>
          {saving ? "Saving…" : "Save and go to dashboard"}
        </Button>
      </div>
    </div>
  );
}
