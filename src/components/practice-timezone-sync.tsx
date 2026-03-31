"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PILLAR_WEEK_TIMEZONE } from "@/lib/dashboard/pillar-week";
import {
  normalizePracticeTimeZone,
  PRACTICE_TIMEZONE_COOKIE,
} from "@/lib/timezone/practice-timezone-shared";

/**
 * Writes the device IANA timezone to a cookie so server-side stats match local calendar
 * days and DST. Refreshes once when the cookie is missing or out of date.
 */
export function PracticeTimeZoneSync() {
  const router = useRouter();

  useEffect(() => {
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const tz = normalizePracticeTimeZone(detected, PILLAR_WEEK_TIMEZONE);

      const match = document.cookie
        .split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith(`${PRACTICE_TIMEZONE_COOKIE}=`));
      const current = match?.slice(PRACTICE_TIMEZONE_COOKIE.length + 1);
      const decoded = current ? decodeURIComponent(current) : "";

      if (decoded === tz) return;

      const maxAge = 60 * 60 * 24 * 400;
      document.cookie = `${PRACTICE_TIMEZONE_COOKIE}=${encodeURIComponent(tz)}; path=/; max-age=${maxAge}; SameSite=Lax`;
      router.refresh();
    } catch {
      /* ignore */
    }
  }, [router]);

  return null;
}
