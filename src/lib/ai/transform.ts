import type { AIResponseJSON } from "@/types/database";

const AI_RESPONSE_JSON_SCHEMA = {
  summary: "",
  context: "",
  meaning: "",
  themes: [] as string[],
  crossReferences: [] as { reference: string; note: string }[],
  reflectionPrompt: "",
  applicationInsight: "",
};

export function parseAIResponse(text: string): AIResponseJSON {
  try {
    const cleaned = text.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
    const parsed = JSON.parse(cleaned) as Partial<AIResponseJSON>;

    return {
      summary: typeof parsed.summary === "string" ? parsed.summary : AI_RESPONSE_JSON_SCHEMA.summary,
      context: typeof parsed.context === "string" ? parsed.context : AI_RESPONSE_JSON_SCHEMA.context,
      meaning: typeof parsed.meaning === "string" ? parsed.meaning : AI_RESPONSE_JSON_SCHEMA.meaning,
      themes: Array.isArray(parsed.themes) ? parsed.themes : AI_RESPONSE_JSON_SCHEMA.themes,
      crossReferences: Array.isArray(parsed.crossReferences)
        ? parsed.crossReferences.filter(
            (x): x is { reference: string; note: string } =>
              x && typeof x.reference === "string" && typeof x.note === "string"
          )
        : AI_RESPONSE_JSON_SCHEMA.crossReferences,
      reflectionPrompt:
        typeof parsed.reflectionPrompt === "string"
          ? parsed.reflectionPrompt
          : AI_RESPONSE_JSON_SCHEMA.reflectionPrompt,
      applicationInsight:
        typeof parsed.applicationInsight === "string"
          ? parsed.applicationInsight
          : AI_RESPONSE_JSON_SCHEMA.applicationInsight,
    };
  } catch {
    return {
      ...AI_RESPONSE_JSON_SCHEMA,
      summary: "Unable to parse the AI response. The passage may still offer rich meaning for reflection.",
    };
  }
}
