"use client";

import { useMemo } from "react";
import { ThirdsPersonalWorkspace } from "@/components/groups/thirds-personal-workspace";
import { loadThirdsState } from "@/lib/guest/thirds-personal-guest-persistence";

export function ThirdsPersonalWorkspaceGuestBootstrap({
  currentWeekMondayYmd,
}: {
  currentWeekMondayYmd: string;
}) {
  const initial = useMemo(() => loadThirdsState(currentWeekMondayYmd), [currentWeekMondayYmd]);
  return <ThirdsPersonalWorkspace initial={initial} persistence="guest" />;
}
