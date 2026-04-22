import type { AppExperienceMode } from "./types";

const MODES: readonly AppExperienceMode[] = ["journey", "custom", "full"];

export function isAppExperienceMode(value: unknown): value is AppExperienceMode {
  return typeof value === "string" && (MODES as readonly string[]).includes(value);
}

export function normalizeAppExperienceMode(value: unknown): AppExperienceMode | null {
  return isAppExperienceMode(value) ? value : null;
}

export const APP_EXPERIENCE_MODE_LABEL: Record<AppExperienceMode, string> = {
  journey: "Guided Journey",
  custom: "Build Your Dashboard",
  full: "Full Experience",
};

export function postExperienceModePath(mode: AppExperienceMode): string {
  switch (mode) {
    case "journey":
      return "/app/journey";
    case "custom":
      return "/app/dashboard-setup";
    case "full":
      return "/app";
    default: {
      const _exhaustive: never = mode;
      return _exhaustive;
    }
  }
}
