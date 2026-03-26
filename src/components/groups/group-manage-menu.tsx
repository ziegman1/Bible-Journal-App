"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  archiveGroup,
  deleteGroup,
  unarchiveGroup,
  updateGroupName,
} from "@/app/actions/groups";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialogBackdrop,
  AlertDialogDescription,
  AlertDialogPopup,
  AlertDialogPortal,
  AlertDialogRoot,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Archive,
  ChevronDown,
  Loader2,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

export interface GroupManageMenuProps {
  groupId: string;
  groupName: string;
  variant: "active" | "archived";
  afterDeleteHref?: string;
  /** After archiving, go here (e.g. workspace → main list). */
  afterArchiveHref?: string;
  trigger?: "icon" | "labeled";
}

export function GroupManageMenu({
  groupId,
  groupName,
  variant,
  afterDeleteHref = "/app/groups",
  afterArchiveHref,
  trigger = "icon",
}: GroupManageMenuProps) {
  const router = useRouter();
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [unarchiveOpen, setUnarchiveOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState(groupName);
  const [renameBusy, setRenameBusy] = useState(false);

  useEffect(() => {
    if (renameOpen) setRenameValue(groupName);
  }, [renameOpen, groupName]);

  async function onRenameSave() {
    setRenameBusy(true);
    try {
      const r = await updateGroupName(groupId, renameValue);
      if ("error" in r && r.error) {
        toast.error(r.error);
        return;
      }
      toast.success("Group name updated");
      setRenameOpen(false);
      router.refresh();
    } finally {
      setRenameBusy(false);
    }
  }

  async function onArchive() {
    const r = await archiveGroup(groupId);
    if ("error" in r && r.error) {
      toast.error(r.error);
      throw new Error(r.error);
    }
    toast.success("Group archived");
    if (afterArchiveHref) router.push(afterArchiveHref);
    router.refresh();
  }

  async function onUnarchive() {
    const r = await unarchiveGroup(groupId);
    if ("error" in r && r.error) {
      toast.error(r.error);
      throw new Error(r.error);
    }
    toast.success("Group restored");
    router.refresh();
  }

  async function onDelete() {
    const r = await deleteGroup(groupId);
    if ("error" in r && r.error) {
      toast.error(r.error);
      throw new Error(r.error);
    }
    toast.success("Group deleted");
    router.push(afterDeleteHref);
    router.refresh();
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={
            trigger === "icon"
              ? "inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 outline-none hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800"
              : undefined
          }
          aria-label={trigger === "icon" ? `Options for ${groupName}` : undefined}
          render={
            trigger === "labeled" ? (
              <Button type="button" variant="outline" size="sm" className="gap-1">
                Group options
                <ChevronDown className="size-3.5 opacity-70" />
              </Button>
            ) : undefined
          }
        >
          {trigger === "icon" ? <MoreHorizontal className="size-4" /> : null}
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            onClick={() => setRenameOpen(true)}
            className="text-stone-800 dark:text-stone-200"
          >
            <Pencil className="size-4 shrink-0" />
            Rename group
          </DropdownMenuItem>
          {variant === "active" && (
            <DropdownMenuItem
              onClick={() => setArchiveOpen(true)}
              className="text-stone-800 dark:text-stone-200"
            >
              <Archive className="size-4 shrink-0" />
              Archive group
            </DropdownMenuItem>
          )}
          {variant === "archived" && (
            <DropdownMenuItem
              onClick={() => setUnarchiveOpen(true)}
              className="text-stone-800 dark:text-stone-200"
            >
              <RotateCcw className="size-4 shrink-0" />
              Restore to active groups
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={() => setDeleteOpen(true)}
            className="text-red-700 dark:text-red-400"
          >
            <Trash2 className="size-4 shrink-0" />
            Delete group
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {variant === "active" && (
        <ConfirmDialog
          open={archiveOpen}
          onOpenChange={setArchiveOpen}
          title="Archive this group?"
          description={`“${groupName}” will move to Archived groups. Members can still open it from there; you can restore it anytime.`}
          confirmLabel="Archive"
          cancelLabel="Cancel"
          onConfirm={onArchive}
        />
      )}
      {variant === "archived" && (
        <ConfirmDialog
          open={unarchiveOpen}
          onOpenChange={setUnarchiveOpen}
          title="Restore this group?"
          description={`“${groupName}” will appear again on your main Groups list.`}
          confirmLabel="Restore"
          cancelLabel="Cancel"
          onConfirm={onUnarchive}
        />
      )}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this group?"
        description={`Permanently delete “${groupName}” for everyone? All meetings and data will be removed. This cannot be undone.`}
        confirmLabel="Delete group"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={onDelete}
      />

      <AlertDialogRoot open={renameOpen} onOpenChange={setRenameOpen}>
        <AlertDialogPortal>
          <AlertDialogBackdrop />
          <AlertDialogPopup>
            <AlertDialogTitle>Rename group</AlertDialogTitle>
            <AlertDialogDescription>
              This name is shown to everyone in the group.
            </AlertDialogDescription>
            <div className="mt-4 space-y-2">
              <Label htmlFor="group-rename-input">Group name</Label>
              <Input
                id="group-rename-input"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                maxLength={120}
                disabled={renameBusy}
                autoComplete="off"
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                disabled={renameBusy}
                onClick={() => setRenameOpen(false)}
              >
                Cancel
              </Button>
              <Button type="button" disabled={renameBusy} onClick={() => void onRenameSave()}>
                {renameBusy ? <Loader2 className="size-4 animate-spin" /> : null}
                Save
              </Button>
            </div>
          </AlertDialogPopup>
        </AlertDialogPortal>
      </AlertDialogRoot>
    </>
  );
}
