import { addMonths, subDays } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

/** Current calendar month bounds (inclusive) in practice timezone, yyyy-MM-dd. */
export function practiceMonthStartEndYmd(now: Date, practiceTimeZone: string): {
  monthStartYmd: string;
  monthEndYmd: string;
} {
  const y = formatInTimeZone(now, practiceTimeZone, "yyyy");
  const m = formatInTimeZone(now, practiceTimeZone, "MM");
  const monthStartYmd = `${y}-${m}-01`;
  const anchor = fromZonedTime(`${monthStartYmd}T12:00:00`, practiceTimeZone);
  const nextMonthStart = addMonths(anchor, 1);
  const lastOfMonth = subDays(nextMonthStart, 1);
  const monthEndYmd = formatInTimeZone(lastOfMonth, practiceTimeZone, "yyyy-MM-dd");
  return { monthStartYmd, monthEndYmd };
}

export function clampMeterRatio(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.min(1, numerator / denominator);
}
