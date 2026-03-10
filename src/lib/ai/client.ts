import OpenAI from "openai";
import { buildSystemPrompt } from "./prompt";
import { parseAIResponse } from "./transform";
import type { AIStyle } from "@/types/database";
import type { AIResponseJSON } from "@/types/database";

const MODEL = "gpt-4o-mini";

export async function askAIAboutPassage(
  reference: string,
  passageText: string,
  question: string,
  aiStyle: AIStyle = "balanced"
): Promise<{ success: true; data: AIResponseJSON } | { success: false; error: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { success: false, error: "OpenAI API key is not configured." };
  }

  try {
    const client = new OpenAI({ apiKey });
    const systemPrompt = buildSystemPrompt(reference, passageText, aiStyle);
    const userPrompt = question.trim() || "Please help me understand this passage.";

    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.5,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return { success: false, error: "No response from AI." };
    }

    const parsed = parseAIResponse(content);
    return { success: true, data: parsed };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("rate limit") || message.includes("429")) {
      return { success: false, error: "Rate limit reached. Please try again in a moment." };
    }
    if (message.includes("API key") || message.includes("401") || message.includes("Incorrect API key")) {
      return { success: false, error: "AI service is not configured. Add OPENAI_API_KEY to your environment." };
    }
    if (message.includes("context length") || message.includes("maximum context")) {
      return { success: false, error: "Passage is too long. Try selecting fewer verses." };
    }
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
