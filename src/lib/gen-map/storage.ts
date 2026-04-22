"use client";

import { createDefaultGenMapTree, syncNodeTreeNames } from "./types";
import { parseGenMapTree } from "./tree-utils";
import type { GenMapTreeNode } from "./types";

const STORAGE_KEY = "badwr-gen-map-tree-v1";

export function loadGenMapTree(): GenMapTreeNode {
  if (typeof window === "undefined") return createDefaultGenMapTree();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultGenMapTree();
    const parsed = parseGenMapTree(JSON.parse(raw));
    if (!parsed) return createDefaultGenMapTree();
    return syncNodeTreeNames(parsed);
  } catch {
    return createDefaultGenMapTree();
  }
}

export function saveGenMapTree(tree: GenMapTreeNode): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tree));
  } catch {
    /* ignore quota / private mode */
  }
}
