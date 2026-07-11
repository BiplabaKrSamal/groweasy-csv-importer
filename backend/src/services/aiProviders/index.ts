import { config } from "../../config";
import { callAnthropic } from "./anthropic";
import { callOpenAI } from "./openai";
import { callGemini } from "./gemini";

export async function callAiProvider(system: string, user: string): Promise<string> {
  switch (config.aiProvider) {
    case "anthropic":
      return callAnthropic(system, user);
    case "openai":
      return callOpenAI(system, user);
    case "gemini":
      return callGemini(system, user);
    default:
      throw new Error(`Unknown AI_PROVIDER "${config.aiProvider}"`);
  }
}

// strips markdown fences before JSON.parse since models don't always listen
export function extractJson(raw: string): unknown {
  const cleaned = raw.trim().replace(/^```(json)?/i, "").replace(/```$/, "").trim();
  return JSON.parse(cleaned);
}
