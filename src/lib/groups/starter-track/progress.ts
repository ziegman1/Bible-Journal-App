import type { StarterTrackEnrollmentRow } from "./types";

export function getStarterTrackProgressLabel(
  enrollment: StarterTrackEnrollmentRow | null
) {
  if (!enrollment) return "not_started" as const;
  if (!enrollment.intro_completed_at) return "intro" as const;
  if (!enrollment.vision_completed_at) return "vision" as const;
  if (enrollment.weeks_completed >= 8) return "completed" as const;
  return "active" as const;
}
