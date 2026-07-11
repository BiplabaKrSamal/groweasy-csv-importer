import "dotenv/config";

function int(name: string, fallback: number): number {
  const v = process.env[name];
  if (!v) return fallback;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

export const config = {
  port: int("PORT", 8080),
  aiProvider: (process.env.AI_PROVIDER || "anthropic") as "anthropic" | "openai" | "gemini",
  batchSize: int("BATCH_SIZE", 15),
  batchConcurrency: int("BATCH_CONCURRENCY", 3),
  batchMaxRetries: int("BATCH_MAX_RETRIES", 3),
  corsOrigin: (process.env.CORS_ORIGIN || "*").split(",").map((s) => s.trim()),
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || "",
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || "",
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || "",
    model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
  },
};
