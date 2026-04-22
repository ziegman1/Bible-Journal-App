"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GEN_MAP_HEALTH_ICON_CELLS } from "@/lib/gen-map/health-icons";
import { nodeDisplayName, type GenMapTreeNode } from "@/lib/gen-map/types";
import { normalizeHealthIconToggles, type GenMapNodePatch } from "@/lib/gen-map/tree-utils";
import { cn } from "@/lib/utils";
import { MapPin, Smile, XIcon } from "lucide-react";
import * as React from "react";

type Tab = "info" | "people";

type Props = {
  node: GenMapTreeNode;
  onPatch: (patch: GenMapNodePatch) => void;
  onOpenPeopleGroupModal: () => void;
  onClose: () => void;
  className?: string;
};

function clampGospelShares(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(99999, Math.max(0, Math.floor(n)));
}

function RowSwitch({
  id,
  checked,
  onCheckedChange,
  disabled,
}: {
  id?: string;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-7 w-11 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        checked ? "bg-teal-600 dark:bg-teal-500" : "bg-muted-foreground/25 dark:bg-muted-foreground/35",
        disabled && "pointer-events-none opacity-50"
      )}
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute left-0.5 top-1/2 block size-5 -translate-y-1/2 rounded-full bg-background shadow-sm transition-transform dark:bg-background",
          checked ? "translate-x-[1.25rem]" : "translate-x-0"
        )}
      />
    </button>
  );
}

function HealthElementRow({
  cell,
  checked,
  onCheckedChange,
}: {
  cell: (typeof GEN_MAP_HEALTH_ICON_CELLS)[number];
  checked: boolean;
  onCheckedChange: (on: boolean) => void;
}) {
  return (
    <li className="flex items-center justify-between gap-3 py-2.5">
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <svg
          viewBox="0 0 24 24"
          className="size-8 shrink-0 text-foreground"
          aria-hidden
        >
          <use href={`#${cell.id}`} />
        </svg>
        <span className="min-w-0 text-sm leading-snug text-foreground">
          <span className="text-muted-foreground">Element: </span>
          <span className="font-medium">{cell.label}</span>
        </span>
      </div>
      <RowSwitch checked={checked} onCheckedChange={onCheckedChange} />
    </li>
  );
}

export function GenMapDetailPanel({
  node,
  onPatch,
  onOpenPeopleGroupModal,
  onClose,
  className,
}: Props) {
  const [tab, setTab] = React.useState<Tab>("info");
  const toggles = normalizeHealthIconToggles(node.healthIconToggles);
  const active = node.active !== false;
  const newGeneration = node.newGeneration === true;
  const isChurch = node.isChurch === true;

  const setHealthToggle = (index: number, on: boolean) => {
    const next = [...toggles];
    next[index] = on;
    onPatch({ healthIconToggles: next });
  };

  return (
    <div className={cn("flex h-full max-h-full min-h-0 flex-col", className)}>
      <div className="flex shrink-0 items-center gap-1 border-b border-border/80 bg-muted/30 p-1 pr-0.5">
        <div className="flex min-w-0 flex-1 rounded-lg p-0.5" role="tablist" aria-label="Node details">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "info"}
            className={cn(
              "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              tab === "info"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setTab("info")}
          >
            Info
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "people"}
            className={cn(
              "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              tab === "people"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setTab("people")}
          >
            People
          </button>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="shrink-0 text-muted-foreground hover:text-foreground"
          aria-label="Close details"
          onClick={onClose}
        >
          <XIcon className="size-4" />
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 [-webkit-overflow-scrolling:touch]">
        {tab === "info" ? (
          <div className="space-y-6 text-sm">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Display name
              </p>
              <p className="mt-1 font-medium text-foreground">{nodeDisplayName(node)}</p>
              <p className="mt-1 text-xs text-muted-foreground tabular-nums">Generation {node.generation}</p>
            </div>

            <div className="space-y-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="gen-map-new-gen" className="text-foreground">
                  New generation
                </Label>
                <RowSwitch
                  id="gen-map-new-gen"
                  checked={newGeneration}
                  onCheckedChange={(v) => onPatch({ newGeneration: v })}
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="gen-map-active" className="text-foreground">
                  Active
                </Label>
                <RowSwitch
                  id="gen-map-active"
                  checked={active}
                  onCheckedChange={(v) => onPatch({ active: v })}
                />
              </div>
            </div>

            <section>
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Elements
              </h3>
              <ul className="divide-y divide-border/80 rounded-lg border border-border/60 bg-background/80">
                {GEN_MAP_HEALTH_ICON_CELLS.map((cell, i) => (
                  <HealthElementRow
                    key={cell.id}
                    cell={cell}
                    checked={toggles[i] === true}
                    onCheckedChange={(on) => setHealthToggle(i, on)}
                  />
                ))}
              </ul>
            </section>

            <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/15 px-3 py-2.5">
              <span className="inline-flex items-center gap-2 text-foreground">
                <Smile className="size-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
                <span>People ({node.metrics.attendees})</span>
              </span>
              <Button type="button" variant="outline" size="sm" onClick={onOpenPeopleGroupModal}>
                Edit
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gen-map-gospel-shares">Gospel shares per day</Label>
              <Input
                id="gen-map-gospel-shares"
                inputMode="numeric"
                className="tabular-nums"
                value={node.gospelSharesPerDay == null ? "" : String(node.gospelSharesPerDay)}
                placeholder="0"
                onChange={(e) => {
                  const raw = e.target.value.trim();
                  if (raw === "") {
                    onPatch({ gospelSharesPerDay: 0 });
                    return;
                  }
                  onPatch({ gospelSharesPerDay: clampGospelShares(Number(raw)) });
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gen-map-group-name">Group name</Label>
              <Input
                id="gen-map-group-name"
                value={node.peopleGroup === "Unknown" ? "" : node.peopleGroup}
                onChange={(e) => {
                  const v = e.target.value;
                  onPatch({
                    peopleGroup: v.trim() || "Unknown",
                    name: nodeDisplayName({ ...node, peopleGroup: v.trim() || "Unknown" }),
                  });
                }}
                placeholder="Group name"
                autoComplete="organization"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gen-map-leader">Leader&apos;s name</Label>
              <Input
                id="gen-map-leader"
                value={node.leaderName ?? ""}
                onChange={(e) => onPatch({ leaderName: e.target.value })}
                placeholder="Leader name"
                autoComplete="name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gen-map-email">Email</Label>
              <Input
                id="gen-map-email"
                type="email"
                value={node.email ?? ""}
                onChange={(e) => onPatch({ email: e.target.value })}
                placeholder="email@example.com"
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gen-map-start">Date of start (e.g. 2017-01)</Label>
              <Input
                id="gen-map-start"
                type="month"
                value={node.dateOfStart ?? ""}
                onChange={(e) => onPatch({ dateOfStart: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gen-map-country">Country</Label>
              <Input
                id="gen-map-country"
                value={node.country}
                onChange={(e) => onPatch({ country: e.target.value })}
                placeholder="Country"
                autoComplete="country-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gen-map-place">Place (city, state)</Label>
              <Input
                id="gen-map-place"
                value={node.place ?? ""}
                onChange={(e) => onPatch({ place: e.target.value })}
                placeholder="City, state"
                autoComplete="address-level2"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gen-map-geo" className="inline-flex items-center gap-1.5">
                <MapPin className="size-3.5 text-muted-foreground" aria-hidden />
                Geo location
              </Label>
              <Input
                id="gen-map-geo"
                value={node.geoLocation ?? ""}
                onChange={(e) => onPatch({ geoLocation: e.target.value })}
                placeholder="Lat/long or map link"
              />
            </div>

            <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/15 px-3 py-2.5">
              <Label htmlFor="gen-map-is-church" className="text-foreground">
                Is church?
              </Label>
              <RowSwitch
                id="gen-map-is-church"
                checked={isChurch}
                onCheckedChange={(v) => onPatch({ isChurch: v })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gen-map-church-type">Church type</Label>
              <Input
                id="gen-map-church-type"
                value={node.churchType ?? ""}
                onChange={(e) => onPatch({ churchType: e.target.value })}
                placeholder="e.g. New believers"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gen-map-elements-process">Elements of 3/3 process</Label>
              <Input
                id="gen-map-elements-process"
                value={node.elementsProcess ?? ""}
                onChange={(e) => onPatch({ elementsProcess: e.target.value })}
                placeholder="e.g. 3/3"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gen-map-note">Note</Label>
              <Textarea
                id="gen-map-note"
                value={node.note ?? ""}
                onChange={(e) => onPatch({ note: e.target.value })}
                placeholder="Notes for this group…"
                rows={4}
              />
            </div>

            <p className="text-xs text-muted-foreground">
              Edits save automatically on this device (Gen Map is stored locally).
            </p>
          </div>
        ) : (
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Current group name
              </p>
              <p className="mt-1 font-medium text-foreground">
                {node.peopleGroup?.trim() ? node.peopleGroup : "Unknown"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Metrics
              </p>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                <li>Attendees: {node.metrics.attendees}</li>
                <li>Believers: {node.metrics.believers}</li>
                <li>Baptized: {node.metrics.baptized}</li>
                <li>New baptized: {node.metrics.newBaptized}</li>
              </ul>
            </div>
            <Button type="button" className="w-full" onClick={onOpenPeopleGroupModal}>
              Change people group
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
