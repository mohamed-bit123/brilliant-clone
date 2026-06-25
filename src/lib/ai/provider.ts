/**
 * Server-only by construction: this module is imported exclusively by route
 * handlers under app/api/, and every key it reads is a non-NEXT_PUBLIC_ env var,
 * so nothing here is ever inlined into the client bundle.
 *
 * Provider-agnostic LLM access. Today this talks to Gemini; setting
 * AI_PROVIDER=anthropic + ANTHROPIC_API_KEY switches to Claude with no other
 * code changes. All keys are read from server-only env vars and never reach
 * the client bundle.
 */

type AIProvider = "gemini" | "anthropic";

type GenerateOptions = {
  system: string;
  user: string;
  /** Ask the provider to return strict JSON. */
  json?: boolean;
  temperature?: number;
  maxTokens?: number;
};

function getConfig() {
  const provider = (process.env.AI_PROVIDER as AIProvider) || "gemini";
  return {
    provider,
    geminiKey: process.env.GEMINI_API_KEY,
    geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    anthropicKey: process.env.ANTHROPIC_API_KEY,
    anthropicModel: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-latest",
  };
}

/** Whether a usable AI key is configured for the active provider. */
export function isAIConfigured(): boolean {
  const c = getConfig();
  return c.provider === "anthropic" ? Boolean(c.anthropicKey) : Boolean(c.geminiKey);
}

export async function generateText(opts: GenerateOptions): Promise<string> {
  const c = getConfig();

  if (c.provider === "anthropic") {
    if (!c.anthropicKey) throw new Error("ANTHROPIC_API_KEY is not set");
    return callAnthropic(c.anthropicModel, c.anthropicKey, opts);
  }

  if (!c.geminiKey) throw new Error("GEMINI_API_KEY is not set");
  return callGemini(c.geminiModel, c.geminiKey, opts);
}

async function callGemini(
  model: string,
  apiKey: string,
  { system, user, json, temperature, maxTokens }: GenerateOptions
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const body = {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: "user", parts: [{ text: user }] }],
    generationConfig: {
      temperature: temperature ?? 0.7,
      maxOutputTokens: maxTokens ?? 800,
      // These tasks are short and constrained; disabling "thinking" keeps
      // responses fast and stops thinking tokens from starving the output.
      thinkingConfig: { thinkingBudget: 0 },
      ...(json ? { responseMimeType: "application/json" } : {}),
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify(body),
    // AI responses must never be cached.
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Gemini request failed (${res.status}): ${detail.slice(0, 300)}`);
  }

  const data = await res.json();
  const parts: { text?: string }[] =
    data?.candidates?.[0]?.content?.parts ?? [];
  return parts.map((p) => p.text ?? "").join("").trim();
}

async function callAnthropic(
  model: string,
  apiKey: string,
  { system, user, temperature, maxTokens }: GenerateOptions
): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens ?? 800,
      temperature: temperature ?? 0.7,
      system,
      messages: [{ role: "user", content: user }],
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Anthropic request failed (${res.status}): ${detail.slice(0, 300)}`);
  }

  const data = await res.json();
  const blocks: { type: string; text?: string }[] = data?.content ?? [];
  return blocks
    .filter((b) => b.type === "text")
    .map((b) => b.text ?? "")
    .join("")
    .trim();
}

/** Best-effort JSON extraction from a model response (handles code fences). */
export function parseJsonResponse<T>(text: string): T | null {
  if (!text) return null;
  let cleaned = text.trim();
  const fence = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) cleaned = fence[1].trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}
