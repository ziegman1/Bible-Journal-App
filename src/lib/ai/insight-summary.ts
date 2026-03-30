import OpenAI from "openai";
import type { InsightsSummary } from "@/lib/insights/types";
import type { InsightSummaryJSON } from "@/lib/insights/types";

const MODEL = "gpt-4o-mini";

function buildInsightPrompt(summary: InsightsSummary): string {
  const { dateRange, overview, themesAndTags, booksAndPassages, repeatedWords, samplesForAI } =
    summary;

  const topTags = themesAndTags.topTags.map((t) => `${t.name} (${t.count})`).join(", ") || "None";
  const topBooks = booksAndPassages.topBooks
    .slice(0, 8)
    .map((b) => `${b.book} (${b.count})`)
    .join(", ") || "None";
  const topPassages = booksAndPassages.passagesMostRevisited
    .slice(0, 5)
    .map((p) => `${p.reference} (${p.count}×)`)
    .join(", ") || "None";
  const keywords = repeatedWords.topKeywords.map((k) => `${k.word} (${k.count})`).join(", ") || "None";

  const reflections = samplesForAI?.reflections?.join("\n\n") || "None provided.";
  const prayers = samplesForAI?.prayers?.join("\n\n") || "None provided.";
  const applications = samplesForAI?.applications?.join("\n\n") || "None provided.";
  const threadInsights = samplesForAI?.threadInsights?.join("\n\n") || "None provided.";

  return `You are a gentle, Scripture-sensitive spiritual reflection assistant. Your role is to synthesize a user's Scripture journal data into a meaningful, reflective summary. You must ONLY draw from what the user has actually written and the patterns in their data. Do NOT invent spiritual experiences, insights, or growth. Do NOT be preachy, manipulative, or generic. Be specific to their words and patterns.

CRITICAL RULES:
- Base every observation on the data provided. If something isn't in the data, don't mention it.
- Use the user's own words and themes. Paraphrase or quote when it illuminates.
- Avoid spiritual clichés and generic encouragement. Be genuine and specific.
- Do not assume growth, transformation, or spiritual maturity unless the data clearly suggests it.
- Be respectful of the user's tradition and avoid dogmatic claims.
- Keep the tone calm, reflective, and supportive—not performative.

DATE RANGE: ${dateRange.start} to ${dateRange.end}

AGGREGATED DATA:
- Journal entries: ${overview.totalJournalEntries}
- Study threads: ${overview.totalStudyThreads}
- AI questions asked: ${overview.totalAIQuestions}
- Books studied: ${overview.booksStudied.join(", ") || "None"}

TOP TAGS/THEMES: ${topTags}
TOP BOOKS (by engagement): ${topBooks}
PASSAGES MOST REVISITED: ${topPassages}
MOST REPEATED WORDS: ${keywords}

USER'S REFLECTIONS (excerpts):
${reflections}

USER'S PRAYERS (excerpts):
${prayers}

USER'S APPLICATIONS (excerpts):
${applications}

STUDY THREAD INSIGHTS (AI summaries from their questions):
${threadInsights}

Respond with valid JSON only, no markdown or extra text. Use this exact structure:

{
  "headline": "A single, specific sentence capturing the essence of their journaling in this period. Base it on their actual themes and words.",
  "recurringThemes": ["Theme 1 from their data", "Theme 2", "Theme 3"],
  "keyLearnings": ["Learning 1 drawn from their reflections/threads", "Learning 2", "Learning 3"],
  "prayerPatterns": "2-4 sentences on patterns in their prayers. Be specific. If none, say so gently.",
  "applicationPatterns": "2-4 sentences on how they're applying Scripture. Be specific. If none, say so gently.",
  "spiritualTrajectory": "2-4 sentences on what their data suggests about their focus and journey. Only describe what the data shows.",
  "encouragement": "2-3 sentences of genuine, specific encouragement based on what they've written. Not generic."
}`;
}

export async function generateInsightSummary(
  summary: InsightsSummary
): Promise<{ success: true; data: InsightSummaryJSON } | { success: false; error: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { success: false, error: "AI is not configured. Add OPENAI_API_KEY to enable insight summaries." };
  }

  try {
    const client = new OpenAI({ apiKey });
    const userPrompt = buildInsightPrompt(summary);

    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            "You synthesize Scripture journal data into a reflective summary. Respond with valid JSON only. Do not invent or assume. Base everything on the provided data.",
        },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.4,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return { success: false, error: "No response from AI." };
    }

    const parsed = JSON.parse(content) as InsightSummaryJSON;
    if (
      typeof parsed.headline !== "string" ||
      !Array.isArray(parsed.recurringThemes) ||
      !Array.isArray(parsed.keyLearnings) ||
      typeof parsed.prayerPatterns !== "string" ||
      typeof parsed.applicationPatterns !== "string" ||
      typeof parsed.spiritualTrajectory !== "string" ||
      typeof parsed.encouragement !== "string"
    ) {
      return { success: false, error: "Invalid AI response format." };
    }

    return { success: true, data: parsed };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("rate limit") || message.includes("429")) {
      return { success: false, error: "Rate limit reached. Please try again in a moment." };
    }
    if (message.includes("API key") || message.includes("401") || message.includes("Incorrect API key")) {
      return { success: false, error: "AI service is not configured correctly." };
    }
    if (message.includes("JSON") || message.includes("parse")) {
      return { success: false, error: "Could not parse AI response. Please try again." };
    }
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
