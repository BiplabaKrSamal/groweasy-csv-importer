import "dotenv/config";

function int(name: string, fallback: number): number {
  const v = process.env[name];
  if (!v) return fallback;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

// "*" must stay the bare string "*" for the cors package to treat it as a
// true wildcard. Wrapping it in an array (["*"]) makes cors check for literal
// membership instead, which no real Origin header ever matches, so every
// cross-origin request silently loses its Access-Control-Allow-Origin header.
export function parseCorsOrigin(raw: string | undefined): string | string[] {
  const value = (raw || "*").trim();
  if (value === "*") return "*";
  return value.split(",").map((s) => s.trim());
}

export const config = {
  port: int("PORT", 8080),
  aiProvider: (process.env.AI_PROVIDER || "anthropic") as "anthropic" | "openai" | "gemini" | "mock",
  batchSize: int("BATCH_SIZE", 15),
  batchConcurrency: int("BATCH_CONCURRENCY", 3),
  batchMaxRetries: int("BATCH_MAX_RETRIES", 3),
  corsOrigin: parseCorsOrigin(process.env.CORS_ORIGIN),
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
