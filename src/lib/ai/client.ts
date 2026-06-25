import type {
  Difficulty,
  ExplainResponse,
  GeneratedProblem,
  HintResponse,
  PracticeTopic,
  StepContext,
} from "@/lib/ai/types";

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Request to ${url} failed (${res.status})`);
  return res.json() as Promise<T>;
}

export function requestHint(ctx: StepContext): Promise<HintResponse> {
  return postJson<HintResponse>("/api/ai/hint", ctx);
}

export function requestExplanation(ctx: StepContext): Promise<ExplainResponse> {
  return postJson<ExplainResponse>("/api/ai/explain", ctx);
}

export function requestPractice(
  topic: PracticeTopic,
  difficulty: Difficulty
): Promise<GeneratedProblem> {
  return postJson<GeneratedProblem>("/api/ai/practice", { topic, difficulty });
}
