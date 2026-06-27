import { generateText, isAIConfigured } from "@/lib/ai/provider";
import { EXPLAIN_SYSTEM, explainUserPrompt, leaksComputedValue } from "@/lib/ai/prompts";
import { diagnose, fallbackExplanation } from "@/lib/ai/diagnose";
import type { ExplainResponse, StepContext } from "@/lib/ai/types";

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

  // Diagnose deterministically first — the model only rephrases this.
  const diagnosis = diagnose(ctx);

  if (!isAIConfigured()) {
    const fb = fallbackExplanation(ctx);
    return Response.json({ ...fb, source: "fallback" } satisfies ExplainResponse);
  }

  try {
    const raw = await generateText({
      system: EXPLAIN_SYSTEM,
      user: explainUserPrompt(ctx, diagnosis),
      temperature: 0.4,
      maxTokens: 220,
    });
    const explanation = raw.trim();

    // Values the explanation may mention: the givens + the learner's own answer
    // (they already know it). Everything else computed must stay hidden.
    const allowed = [
      ...ctx.givens.map((g) => g.value),
      ...(ctx.learnerAnswer !== undefined ? [ctx.learnerAnswer] : []),
    ];

    // Guardrail: an explanation should help them retry, not hand over the final
    // answer OR any intermediate subproblem result they still need to compute.
    if (!explanation || leaksComputedValue(explanation, ctx.steps, ctx.correctAnswer, allowed)) {
      const fb = fallbackExplanation(ctx);
      return Response.json({ ...fb, source: "fallback" } satisfies ExplainResponse);
    }

    return Response.json({
      explanation,
      misconception: diagnosis?.label,
      source: "ai",
    } satisfies ExplainResponse);
  } catch {
    const fb = fallbackExplanation(ctx);
    return Response.json({ ...fb, source: "fallback" } satisfies ExplainResponse);
  }
}
