"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AnnualJournalYearSelectorProps {
  currentYear: number;
}

export function AnnualJournalYearSelector({ currentYear }: AnnualJournalYearSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const years = [
    currentYear,
    currentYear - 1,
    currentYear - 2,
    currentYear + 1,
  ].sort((a, b) => b - a);

  const handleChange = (value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("year", value);
    router.push(`/app/journal?${next.toString()}`);
  };

  return (
    <Select
      value={String(currentYear)}
      onValueChange={(v) => {
        if (v != null) handleChange(v);
      }}
    >
      <SelectTrigger className="w-[100px]">
        <SelectValue placeholder="Year" />
      </SelectTrigger>
      <SelectContent>
        {years.map((y) => (
          <SelectItem key={y} value={String(y)}>
            {y}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
