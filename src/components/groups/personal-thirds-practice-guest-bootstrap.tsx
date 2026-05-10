"use client";

import { useMemo } from "react";
import { loadThirdsState } from "@/lib/guest/thirds-personal-guest-persistence";
import { PersonalThirdsPracticeClient } from "@/components/groups/personal-thirds-practice-client";

export function PersonalThirdsPracticeGuestBootstrap({
  currentWeekMondayYmd,
}: {
  currentWeekMondayYmd: string;
}) {
  const initial = useMemo(() => loadThirdsState(currentWeekMondayYmd), [currentWeekMondayYmd]);
  return <PersonalThirdsPracticeClient initial={initial} persistence="guest" />;
}
