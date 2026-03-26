/**
 * Commissioning slide: turn stored group vision into a “Go and …” charge.
 * e.g. "We will obey Jesus… multiply our group." → "Go and obey Jesus… multiply your group."
 */
const ONBOARDING_PLACEHOLDER_RE =
  /add your group'?s vision statement in starter track onboarding/i;

export function formatCommissioningVisionLine(vision: string): string {
  const v = vision.trim();
  if (!v || ONBOARDING_PLACEHOLDER_RE.test(v)) {
    return "Go and obey Jesus, sharing the Gospel with boldness, and seek to multiply your group.";
  }
  let s = v;
  if (/^we will\b/i.test(s)) {
    s = "Go and " + s.replace(/^we will\s+/i, "");
  } else if (!/^go and\b/i.test(s)) {
    const first = s.charAt(0);
    const rest = s.slice(1);
    s = `Go and ${first.toLowerCase()}${rest}`;
  }
  s = s.replace(/\bour group\b/gi, "your group");
  return s;
}
