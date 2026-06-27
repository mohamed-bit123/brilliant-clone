import { generateText, isAIConfigured } from "@/lib/ai/provider";
import {
  HINT_SYSTEM,
  hintUserPrompt,
  leaksComputedValue,
  redactComputedValues,
} from "@/lib/ai/prompts";
import type { HintResponse, StepContext } from "@/lib/ai/types";

function fallbackHint(ctx: StepContext): string {
  // Use the first worked step as a method nudge, but redact any computed value
  // so the fallback itself never leaks an intermediate or final answer.
  const [first] = redactComputedValues(
    ctx.steps ?? [],
    ctx.correctAnswer,
    (ctx.givens ?? []).map((g) => g.value)
  );
  return (
    first ??
    "Start from the formula that links the given quantities to what you're solving for, then substitute one value at a time."
  );
}

export async function POST(req: Request) {
  let ctx: StepContext;
  try {
    ctx = (await req.json()) as StepContext;
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!ctx?.prompt || ctx.correctAnswer === undefined) {
    return Response.json({ error: "Missing required context" }, { status: 400 });
  }

  if (!isAIConfigured()) {
    return Response.json({ hint: fallbackHint(ctx), source: "fallback" } satisfies HintResponse);
  }

  try {
    const raw = await generateText({
      system: HINT_SYSTEM,
      user: hintUserPrompt(ctx),
      temperature: 0.5,
      maxTokens: 220,
    });
    const hint = raw.trim();

    const allowed = [
      ...ctx.givens.map((g) => g.value),
      ...(ctx.learnerAnswer !== undefined ? [ctx.learnerAnswer] : []),
    ];

    // Guardrail: never let a hint give away the final answer OR any intermediate
    // subproblem result the learner still has to compute.
    if (!hint || leaksComputedValue(hint, ctx.steps, ctx.correctAnswer, allowed)) {
      return Response.json({ hint: fallbackHint(ctx), source: "fallback" } satisfies HintResponse);
    }

    return Response.json({ hint, source: "ai" } satisfies HintResponse);
  } catch {
    return Response.json({ hint: fallbackHint(ctx), source: "fallback" } satisfies HintResponse);
  }
}
