import type { GeneratedProblem, StepContext } from "@/lib/ai/types";
import type { Diagnosis } from "@/lib/ai/diagnose";

/**
 * Prompt builders. Every prompt is fed STRUCTURED JSON derived from lesson state
 * and the deterministic engine — never raw lesson prose — so the model stays
 * grounded in verified facts.
 */

export const HINT_SYSTEM = `You are a patient, encouraging circuit-electronics tutor for a beginner course.
You receive a JSON object: the question, the givens, what to solve for, and "workedSteps" — the deterministic process that leads to the answer (with the final number redacted as "?"). "learnerAttempts" is how many times they've already missed it.
Give a HINT that moves the learner forward — never solve it for them.
Write 2-4 short sentences of plain text:
- If learnerAttempts > 0, gently point at the step they are most likely getting stuck on. If "learnerAnswer" is present, use it to guess what they did and steer them off that path.
- Name the specific rule or relationship that applies right now (e.g. "these two resistors are in series, so add them first").
- Tell them the very next thing to set up or compute — then stop, so they take the step themselves.
HARD RULES:
- Never state the final numeric answer or do the last calculation that produces it.
- You MAY name an intermediate setup ("find the total resistance first") but not reveal a value shown as "?".
- Warm, concrete, specific to THIS problem. Plain text only — no markdown, no headings, no preamble.`;

export const EXPLAIN_SYSTEM = `You are a patient, encouraging circuit-electronics tutor for a beginner course.
You receive a JSON object: the question, the givens, what to solve for, the learner's WRONG answer ("learnerAnswer"), "workedSteps" (the correct deterministic process with the final number redacted as "?"), and "diagnosis" (a best guess at their mistake; it may be "unclear").
Write a focused explanation in plain language with these THREE parts, in order:
1. WHAT YOU DID: Name the specific mistake the learner most likely made. If "diagnosis.misconception" is not "unclear", build on it. Otherwise infer the most likely misstep by comparing their answer to the worked steps (e.g. they stopped early, used the wrong rule, divided the wrong way, used one resistor instead of the combination). Never assert a calculation you cannot support from the data.
2. WHY IT'S WRONG: Briefly explain the concept they tripped on, in one or two sentences.
3. HOW TO DO IT: Walk through the correct steps in order using the givens — but STOP before the final calculation so they finish it themselves.
HARD RULES:
- Never state the final correct number or perform the last step that yields it. Intermediate setup values are fine; a value shown as "?" must stay hidden.
- Keep it tight: 4-7 short sentences. You may put each step of part 3 on its own line.
- Encouraging, never condescending. Plain text only — no markdown headings, no preamble.`;

export const SCENARIO_SYSTEM = `You rewrite beginner circuit word-problems with vivid, concrete real-world framing (flashlights, phone chargers, electric kettles, e-bikes, string lights, etc.).
You will receive a JSON object with the original "prompt", the list of "givens", and a "reference" (a formula sheet + realistic device/value bank for this topic).
Return STRICT JSON: {"scenario": string, "prompt": string}.
HARD RULES:
- Use the "reference" only to pick realistic devices and authentic framing. It must NOT change any number.
- Keep EVERY numeric value and unit exactly as given. Do not add, remove, or change any number.
- Write all numbers as digits exactly as given (e.g., "3 Ω", never "three ohms").
- Keep the same quantity being solved for and the same question.
- "scenario" is one short sentence of real-world setup. "prompt" is the rewritten question (one or two sentences) and must contain every given number as a digit.
- Do not include the answer. Output JSON only.`;

/**
 * Replaces the final answer wherever it appears in the worked steps with "?",
 * so the model can see the full reasoning process without parroting the result.
 * Intermediate values are kept; only tokens equal to the answer are hidden.
 */
export function redactAnswerInSteps(steps: string[], answer: number): string[] {
  const rounded = Math.round(answer * 100) / 100;
  const tol = Math.max(0.05, Math.abs(rounded) * 0.02);
  return (steps ?? []).map((step) =>
    step.replace(/-?\d+(?:\.\d+)?/g, (tok) => {
      const n = parseFloat(tok);
      return Number.isFinite(n) && Math.abs(n - rounded) <= tol ? "?" : tok;
    })
  );
}

export function hintUserPrompt(ctx: StepContext): string {
  return JSON.stringify(
    {
      topic: ctx.topicLabel,
      question: ctx.prompt,
      givens: ctx.givens,
      solveFor: ctx.solveFor,
      answerUnit: ctx.answerUnit,
      workedSteps: redactAnswerInSteps(ctx.steps, ctx.correctAnswer),
      learnerAttempts: ctx.attempts ?? 0,
      ...(ctx.learnerAnswer !== undefined ? { learnerAnswer: ctx.learnerAnswer } : {}),
    },
    null,
    2
  );
}

export function explainUserPrompt(ctx: StepContext, diagnosis: Diagnosis | null): string {
  return JSON.stringify(
    {
      topic: ctx.topicLabel,
      question: ctx.prompt,
      givens: ctx.givens,
      solveFor: ctx.solveFor,
      answerUnit: ctx.answerUnit,
      learnerAnswer: ctx.learnerAnswer,
      workedSteps: redactAnswerInSteps(ctx.steps, ctx.correctAnswer),
      diagnosis: diagnosis
        ? { misconception: diagnosis.label, explanation: diagnosis.detail }
        : { misconception: "unclear", explanation: "No specific pattern detected." },
    },
    null,
    2
  );
}

export function scenarioUserPrompt(problem: GeneratedProblem, reference?: string): string {
  return JSON.stringify(
    {
      prompt: problem.prompt,
      givens: problem.interaction.givens,
      solveFor: problem.interaction.solveFor,
      ...(reference ? { reference } : {}),
    },
    null,
    2
  );
}

/**
 * Guardrail: returns true if the hint text leaks the final numeric answer.
 * Used to reject (and fall back) on hints that give away the result.
 */
export function hintLeaksAnswer(hint: string, answer: number): boolean {
  const rounded = Math.round(answer * 100) / 100;
  // Match standalone numbers in the hint and compare against the answer.
  const numbers = hint.match(/-?\d+(?:\.\d+)?/g);
  if (!numbers) return false;
  return numbers.some((token) => {
    const n = parseFloat(token);
    if (!Number.isFinite(n)) return false;
    return Math.abs(n - rounded) <= Math.max(0.05, Math.abs(rounded) * 0.02);
  });
}

/** Verifies a scenario rewrite kept all the original numbers intact. */
export function scenarioPreservesNumbers(
  rewritten: string,
  givens: { value: number }[]
): boolean {
  const present = new Set(
    (rewritten.match(/-?\d+(?:\.\d+)?/g) ?? []).map((t) => Math.round(parseFloat(t) * 100) / 100)
  );
  return givens.every((g) => present.has(Math.round(g.value * 100) / 100));
}
