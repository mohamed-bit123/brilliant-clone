/**
 * Server-only by construction: this module is imported exclusively by route
 * handlers under app/api/, and every key it reads is a non-NEXT_PUBLIC_ env var,
 * so nothing here is ever inlined into the client bundle.
 *
 * Provider-agnostic LLM access. Switch providers with AI_PROVIDER:
 *   - AI_PROVIDER=openai    + OPENAI_API_KEY      → OpenAI (default model gpt-4o-mini)
 *   - AI_PROVIDER=anthropic + ANTHROPIC_API_KEY   → Claude
 *   - AI_PROVIDER=gemini    + GEMINI_API_KEY       → Gemini
 * No other code changes are needed. All keys are read from server-only env vars
 * and never reach the client bundle.
 */

type AIProvider = "gemini" | "anthropic" | "openai";

type GenerateOptions = {
  system: string;
  user: string;
  /** Ask the provider to return strict JSON. */
  json?: boolean;
  temperature?: number;
  maxTokens?: number;
};

function getConfig() {
  // Default to whichever provider has a key, preferring an explicit AI_PROVIDER.
  const explicit = process.env.AI_PROVIDER as AIProvider | undefined;
  const provider: AIProvider =
    explicit ||
    (process.env.OPENAI_API_KEY
      ? "openai"
      : process.env.ANTHROPIC_API_KEY
        ? "anthropic"
        : "gemini");
  return {
    provider,
    geminiKey: process.env.GEMINI_API_KEY,
    geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    anthropicKey: process.env.ANTHROPIC_API_KEY,
    anthropicModel: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-latest",
    openaiKey: process.env.OPENAI_API_KEY,
    openaiModel: process.env.OPENAI_MODEL || "gpt-4o-mini",
  };
}

/** Whether a usable AI key is configured for the active provider. */
export function isAIConfigured(): boolean {
  const c = getConfig();
  if (c.provider === "openai") return Boolean(c.openaiKey);
  if (c.provider === "anthropic") return Boolean(c.anthropicKey);
  return Boolean(c.geminiKey);
}

export async function generateText(opts: GenerateOptions): Promise<string> {
  const c = getConfig();

  if (c.provider === "openai") {
    if (!c.openaiKey) throw new Error("OPENAI_API_KEY is not set");
    return callOpenAI(c.openaiModel, c.openaiKey, opts);
  }

  if (c.provider === "anthropic") {
    if (!c.anthropicKey) throw new Error("ANTHROPIC_API_KEY is not set");
    return callAnthropic(c.anthropicModel, c.anthropicKey, opts);
  }

  if (!c.geminiKey) throw new Error("GEMINI_API_KEY is not set");
  return callGemini(c.geminiModel, c.geminiKey, opts);
}

async function callOpenAI(
  model: string,
  apiKey: string,
  { system, user, json, temperature, maxTokens }: GenerateOptions
): Promise<string> {
  // OpenAI's JSON mode requires the word "json" to appear in the prompt.
  const sys =
    json && !/json/i.test(system + user)
      ? `${system}\n\nRespond with a single valid JSON object.`
      : system;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: temperature ?? 0.7,
      max_tokens: maxTokens ?? 800,
      ...(json ? { response_format: { type: "json_object" } } : {}),
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`OpenAI request failed (${res.status}): ${detail.slice(0, 300)}`);
  }

  const data = await res.json();
  return (data?.choices?.[0]?.message?.content ?? "").trim();
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
