"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { InsightsDateRange } from "@/lib/insights/types";

const LABELS: Record<InsightsDateRange, string> = {
  last30: "Last 30 days",
  last90: "Last 90 days",
  thisYear: "This year",
  custom: "Custom range",
};

export function InsightsDateRangeSelect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const range = (searchParams.get("range") as InsightsDateRange) ?? "last30";

  function handleChange(value: InsightsDateRange | string | null) {
    if (!value || value === "custom") return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", value);
    if (value !== "custom") {
      params.delete("start");
      params.delete("end");
    }
    router.push(`/app/insights?${params.toString()}`);
  }

  return (
    <Select value={range} onValueChange={handleChange}>
      <SelectTrigger className="w-[180px] bg-stone-50 dark:bg-stone-900/50 border-stone-200 dark:border-stone-800">
        <SelectValue placeholder="Select range" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="last30">{LABELS.last30}</SelectItem>
        <SelectItem value="last90">{LABELS.last90}</SelectItem>
        <SelectItem value="thisYear">{LABELS.thisYear}</SelectItem>
      </SelectContent>
    </Select>
  );
}
