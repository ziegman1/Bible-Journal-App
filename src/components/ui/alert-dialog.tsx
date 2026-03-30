"use client";

import * as React from "react";
import { AlertDialog } from "@base-ui/react/alert-dialog";
import { cn } from "@/lib/utils";

function AlertDialogRoot(props: AlertDialog.Root.Props) {
  return <AlertDialog.Root data-slot="alert-dialog" {...props} />;
}

function AlertDialogPortal(props: AlertDialog.Portal.Props) {
  return <AlertDialog.Portal {...props} />;
}

function AlertDialogBackdrop({
  className,
  ...props
}: AlertDialog.Backdrop.Props) {
  return (
    <AlertDialog.Backdrop
      data-slot="alert-dialog-backdrop"
      className={cn(
        "fixed inset-0 z-50 bg-black/20 dark:bg-black/40 backdrop-blur-[2px] transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0",
        className
      )}
      {...props}
    />
  );
}

function AlertDialogPopup({
  className,
  ...props
}: AlertDialog.Popup.Props) {
  return (
    <AlertDialog.Popup
      data-slot="alert-dialog-popup"
      className={cn(
        "fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-white dark:bg-stone-950 p-6 shadow-xl transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0",
        className
      )}
      {...props}
    />
  );
}

function AlertDialogTitle({
  className,
  ...props
}: AlertDialog.Title.Props) {
  return (
    <AlertDialog.Title
      data-slot="alert-dialog-title"
      className={cn("text-base font-medium text-stone-900 dark:text-stone-100", className)}
      {...props}
    />
  );
}

function AlertDialogDescription({
  className,
  ...props
}: AlertDialog.Description.Props) {
  return (
    <AlertDialog.Description
      data-slot="alert-dialog-description"
      className={cn("text-sm text-stone-600 dark:text-stone-400 mt-2", className)}
      {...props}
    />
  );
}

export {
  AlertDialogRoot,
  AlertDialogPortal,
  AlertDialogBackdrop,
  AlertDialogPopup,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialog,
};
