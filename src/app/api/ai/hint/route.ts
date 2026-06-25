import { generateText, isAIConfigured } from "@/lib/ai/provider";
import { HINT_SYSTEM, hintUserPrompt, hintLeaksAnswer } from "@/lib/ai/prompts";
import type { HintResponse, StepContext } from "@/lib/ai/types";

function fallbackHint(ctx: StepContext): string {
  return (
    ctx.steps?.[0] ??
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
      maxTokens: 120,
    });
    const hint = raw.trim();

    // Guardrail: never let a hint give away the verified answer.
    if (!hint || hintLeaksAnswer(hint, ctx.correctAnswer)) {
      return Response.json({ hint: fallbackHint(ctx), source: "fallback" } satisfies HintResponse);
    }

    return Response.json({ hint, source: "ai" } satisfies HintResponse);
  } catch {
    return Response.json({ hint: fallbackHint(ctx), source: "fallback" } satisfies HintResponse);
  }
}
