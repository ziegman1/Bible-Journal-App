export type SoapsFields = {
  scriptureText: string;
  observation: string;
  application: string;
  prayer: string;
  share: string;
};

/** SOAPS sections only (no passage reference line). */
export function formatSoapsBodyFields(f: SoapsFields): string {
  const lines: string[] = ["SOAPS", ""];

  const push = (title: string, body: string) => {
    const t = body.trim();
    if (!t) return;
    lines.push(title, t, "");
  };

  push("Scripture", f.scriptureText);
  push("Observation", f.observation);
  push("Application", f.application);
  push("Prayer", f.prayer);
  push("Share", f.share);

  return lines.join("\n").trimEnd();
}

/** Full plain-text body for email/SMS when sharing only SOAPS (e.g. from reader). */
export function formatSoapsShareBody(reference: string, f: SoapsFields): string {
  const core = formatSoapsBodyFields(f);
  return core ? `${reference}\n\n${core}` : reference;
}
