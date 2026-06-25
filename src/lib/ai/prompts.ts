import type { GeneratedProblem, StepContext } from "@/lib/ai/types";
import type { Diagnosis } from "@/lib/ai/diagnose";

/**
 * Prompt builders. Every prompt is fed STRUCTURED JSON derived from lesson state
 * and the deterministic engine — never raw lesson prose — so the model stays
 * grounded in verified facts.
 */

export const HINT_SYSTEM = `You are a patient circuit-electronics tutor for a beginner course.
You will receive a JSON object describing a problem the learner is stuck on, including the verified correct answer and the worked steps.
Give exactly ONE hint, at most two short sentences, that nudges the learner toward the NEXT step of reasoning.
HARD RULES:
- Never state the final numeric answer or perform the final calculation.
- Never reveal the exact number in "correctAnswer".
- Point at the relevant formula or relationship, not the result.
- Be warm and concise. Output plain text only (no markdown, no preamble).`;

export const EXPLAIN_SYSTEM = `You are a patient circuit-electronics tutor for a beginner course.
You will receive a JSON object with a problem, the learner's wrong answer, and a diagnosed misconception.
Explain, in 2-3 short sentences and plain language, WHY their specific approach was wrong and what to do differently.
HARD RULES:
- Base your explanation on the provided "diagnosis" — do not invent a different reason.
- Do NOT state the final correct number; guide them to recompute it themselves.
- Be encouraging, never condescending. Output plain text only (no markdown, no preamble).`;

export const SCENARIO_SYSTEM = `You rewrite beginner circuit word-problems with vivid, concrete real-world framing (flashlights, phone chargers, electric kettles, e-bikes, string lights, etc.).
You will receive a JSON object with the original "prompt" and the list of "givens".
Return STRICT JSON: {"scenario": string, "prompt": string}.
HARD RULES:
- Keep EVERY numeric value and unit exactly as given. Do not add, remove, or change any number.
- Write all numbers as digits exactly as given (e.g., "3 Ω", never "three ohms").
- Keep the same quantity being solved for and the same question.
- "scenario" is one short sentence of real-world setup. "prompt" is the rewritten question (one or two sentences) and must contain every given number as a digit.
- Do not include the answer. Output JSON only.`;

export function hintUserPrompt(ctx: StepContext): string {
  return JSON.stringify(
    {
      topic: ctx.topicLabel,
      question: ctx.prompt,
      givens: ctx.givens,
      solveFor: ctx.solveFor,
      answerUnit: ctx.answerUnit,
      correctAnswer: ctx.correctAnswer,
      workedSteps: ctx.steps,
      learnerAttempts: ctx.attempts ?? 0,
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
      diagnosis: diagnosis
        ? { misconception: diagnosis.label, explanation: diagnosis.detail }
        : { misconception: "unclear", explanation: "No specific pattern detected." },
    },
    null,
    2
  );
}

export function scenarioUserPrompt(problem: GeneratedProblem): string {
  return JSON.stringify(
    {
      prompt: problem.prompt,
      givens: problem.interaction.givens,
      solveFor: problem.interaction.solveFor,
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
