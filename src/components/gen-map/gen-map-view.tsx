"use client";

import { GenMapDetailPanel } from "./gen-map-detail-panel";
import { GenMapHealthIconSpriteDefs } from "./gen-map-health-icon-sprite-defs";
import { GenMapSubtree } from "./gen-map-subtree";
import { PeopleGroupModal } from "./people-group-modal";
import { GEN_MAP_ROOT_ID, nodeDisplayName } from "@/lib/gen-map/types";
import { loadGenMapTree, saveGenMapTree } from "@/lib/gen-map/storage";
import {
  findNodeById,
  normalizeHealthIconToggles,
  updateNodeById,
} from "@/lib/gen-map/tree-utils";
import type { GenMapTreeNode } from "@/lib/gen-map/types";
import * as React from "react";

export function GenMapView() {
  const [tree, setTree] = React.useState<GenMapTreeNode | null>(null);
  const [selectedId, setSelectedId] = React.useState<string | null>(GEN_MAP_ROOT_ID);
  const [peopleModalOpen, setPeopleModalOpen] = React.useState(false);

  React.useEffect(() => {
    setTree(loadGenMapTree());
  }, []);

  React.useEffect(() => {
    if (tree == null) return;
    saveGenMapTree(tree);
  }, [tree]);

  const selected =
    tree && selectedId ? findNodeById(tree, selectedId) : null;

  const applyNodePatch = React.useCallback(
    (id: string, patch: Parameters<typeof updateNodeById>[2]) => {
      setTree((t) => (t == null ? t : updateNodeById(t, id, patch)));
    },
    []
  );

  const handleCloseDetailPanel = React.useCallback(() => {
    setPeopleModalOpen(false);
    setSelectedId(null);
  }, []);

  const handleToggleHealthIcon = React.useCallback((nodeId: string, iconIndex: number) => {
    setTree((t) => {
      if (t == null) return t;
      const n = findNodeById(t, nodeId);
      if (!n) return t;
      const cur = normalizeHealthIconToggles(n.healthIconToggles);
      const next = [...cur];
      next[iconIndex] = !next[iconIndex];
      return updateNodeById(t, nodeId, { healthIconToggles: next });
    });
  }, []);

  if (tree == null) {
    return (
      <>
        <GenMapHealthIconSpriteDefs />
        <div
          className="flex h-[min(72vh,calc(100dvh-10rem))] min-h-0 w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/10"
          aria-busy="true"
          aria-label="Loading Gen Map"
        >
          <div className="h-10 w-10 animate-pulse rounded-full bg-muted-foreground/20" />
        </div>
      </>
    );
  }

  return (
    <>
      <GenMapHealthIconSpriteDefs />
      <div className="flex h-[min(72vh,calc(100dvh-10rem))] min-h-0 w-full flex-col overflow-hidden rounded-xl border border-border bg-muted/10 lg:flex-row">
      <div className="flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-y-auto overflow-x-hidden px-4 py-10 sm:px-8">
        <GenMapSubtree
          node={tree}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onToggleHealthIcon={handleToggleHealthIcon}
          isRoot
        />
      </div>

      {selected ? (
        <aside className="flex min-h-0 w-full shrink-0 flex-col overflow-hidden border-t border-border bg-background max-lg:max-h-[min(52vh,28rem)] lg:h-full lg:max-h-full lg:w-[min(100%,28rem)] lg:border-t-0 lg:border-l">
          <GenMapDetailPanel
            node={selected}
            onPatch={(patch) => applyNodePatch(selected.id, patch)}
            onOpenPeopleGroupModal={() => setPeopleModalOpen(true)}
            onClose={handleCloseDetailPanel}
          />
        </aside>
      ) : null}

      <PeopleGroupModal
        open={peopleModalOpen}
        onOpenChange={setPeopleModalOpen}
        node={selected}
        onSave={({ peopleGroup, metrics }) => {
          if (!selected) return;
          const merged = { ...selected, peopleGroup, metrics };
          applyNodePatch(selected.id, {
            peopleGroup,
            metrics,
            name: nodeDisplayName(merged),
          });
        }}
      />
    </div>
    </>
  );
}
