import { customDashboardNavHrefsFromItemIds } from "@/lib/app-experience-mode/custom-sidebar-nav";
import { effectiveGuidedJourneyTools, journeyDashboardItemIds } from "@/lib/app-experience-mode/guided-journey";
import { parseJourneyProgress } from "@/lib/app-experience-mode/journey-progress";
import {
  isLinearDiscipleshipPathGraduated,
  linearDiscipleshipNavHrefs,
} from "@/lib/app-experience-mode/linear-discipleship-path";

/** Ordered hrefs for the app shell when `app_experience_mode = journey`. */
export function journeyFilteredNavHrefList(journeyProgressRaw: unknown): readonly string[] {
  const jp = parseJourneyProgress(journeyProgressRaw);
  const linear = jp.linearDiscipleshipPath;
  if (linear && !isLinearDiscipleshipPathGraduated(linear)) {
    return linearDiscipleshipNavHrefs(linear);
  }
  const unlocked = effectiveGuidedJourneyTools(jp);
  const itemIds = journeyDashboardItemIds(unlocked);
  return Array.from(customDashboardNavHrefsFromItemIds(itemIds));
}
