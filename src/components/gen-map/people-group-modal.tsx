"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { GenMapNodeMetrics, GenMapTreeNode } from "@/lib/gen-map/types";
import { XIcon, Minus, Plus } from "lucide-react";
import * as React from "react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  node: GenMapTreeNode | null;
  onSave: (payload: { peopleGroup: string; metrics: GenMapNodeMetrics }) => void;
};

function clampInt(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

export function PeopleGroupModal({ open, onOpenChange, node, onSave }: Props) {
  const [peopleGroup, setPeopleGroup] = React.useState("");
  const [attendees, setAttendees] = React.useState(0);
  const [believers, setBelievers] = React.useState(0);
  const [baptized, setBaptized] = React.useState(0);
  const [newBaptized, setNewBaptized] = React.useState(0);

  React.useEffect(() => {
    if (!open || !node) return;
    setPeopleGroup(node.peopleGroup || "Unknown");
    setAttendees(node.metrics.attendees);
    setBelievers(node.metrics.believers);
    setBaptized(node.metrics.baptized);
    setNewBaptized(node.metrics.newBaptized);
  }, [open, node]);

  const bumpAttendees = (delta: number) => {
    setAttendees((a) => clampInt(a + delta, 0, 99999));
  };

  const handleContinue = () => {
    onSave({
      peopleGroup: peopleGroup.trim() || "Unknown",
      metrics: {
        attendees: clampInt(attendees, 0, 99999),
        believers: clampInt(believers, 0, 99999),
        baptized: clampInt(baptized, 0, 99999),
        newBaptized: clampInt(newBaptized, 0, 99999),
      },
    });
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop
          className={cn(
            "fixed inset-0 z-50 bg-black/20 transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0 dark:bg-black/45",
            "supports-backdrop-filter:backdrop-blur-[2px]"
          )}
        />
        <Dialog.Popup
          className={cn(
            "fixed left-1/2 top-1/2 z-50 max-h-[min(90vh,640px)] w-[min(100vw-1.5rem,24rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-border bg-background p-4 shadow-xl sm:p-5",
            "transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0"
          )}
        >
          <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-3">
            <Dialog.Title className="pr-6 text-base font-semibold text-foreground">
              People group
            </Dialog.Title>
            <Dialog.Close
              render={<Button variant="ghost" size="icon-sm" className="shrink-0 -mr-1 -mt-0.5" />}
            >
              <XIcon className="size-4" />
              <span className="sr-only">Close</span>
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">
            Edit people group name and numeric fields for this Gen Map node.
          </Dialog.Description>

          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gen-map-group-name">Group name</Label>
              <Input
                id="gen-map-group-name"
                value={peopleGroup}
                onChange={(e) => setPeopleGroup(e.target.value)}
                placeholder="Unknown"
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <Label>Attendees</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  className="shrink-0"
                  onClick={() => bumpAttendees(-1)}
                  aria-label="Decrease attendees"
                >
                  <Minus className="size-4" />
                </Button>
                <Input
                  inputMode="numeric"
                  className="text-center tabular-nums"
                  value={attendees}
                  onChange={(e) => setAttendees(clampInt(Number(e.target.value), 0, 99999))}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  className="shrink-0"
                  onClick={() => bumpAttendees(1)}
                  aria-label="Increase attendees"
                >
                  <Plus className="size-4" />
                </Button>
              </div>
            </div>

            <MetricField
              id="believers"
              label="Believers"
              value={believers}
              onChange={setBelievers}
            />
            <MetricField
              id="baptized"
              label="Baptized"
              value={baptized}
              onChange={setBaptized}
            />

            <div className="space-y-2">
              <Label htmlFor="new-baptized">New baptized (since church start)</Label>
              <Input
                id="new-baptized"
                inputMode="numeric"
                className="tabular-nums"
                value={newBaptized}
                onChange={(e) => setNewBaptized(clampInt(Number(e.target.value), 0, 99999))}
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-border/60 pt-4">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="button" onClick={handleContinue}>
              Continue
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function MetricField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  const max = Math.max(100, value, 500);
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          id={id}
          inputMode="numeric"
          className="tabular-nums sm:max-w-[7rem]"
          value={value}
          onChange={(e) => onChange(clampInt(Number(e.target.value), 0, 99999))}
        />
        <input
          type="range"
          min={0}
          max={max}
          value={Math.min(value, max)}
          onChange={(e) => onChange(clampInt(Number(e.target.value), 0, 99999))}
          className="min-h-8 flex-1 accent-primary"
          aria-label={`${label} slider`}
        />
      </div>
    </div>
  );
}
