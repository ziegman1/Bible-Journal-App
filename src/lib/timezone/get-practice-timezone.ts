import "server-only";

import { cookies } from "next/headers";
import {
  FALLBACK_PRACTICE_TIMEZONE,
  normalizePracticeTimeZone,
  PRACTICE_TIMEZONE_COOKIE,
} from "@/lib/timezone/practice-timezone-shared";

/**
 * Practice week boundaries, streak “today”, and weekly stats use this timezone (browser cookie).
 */
export async function getPracticeTimeZone(): Promise<string> {
  const jar = await cookies();
  const raw = jar.get(PRACTICE_TIMEZONE_COOKIE)?.value;
  return normalizePracticeTimeZone(raw, FALLBACK_PRACTICE_TIMEZONE);
}
