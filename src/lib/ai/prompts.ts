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
- Never state ANY computed value — not the final answer, and not any intermediate result the learner must work out (equivalent/total resistance, total or branch current, a node voltage, a power, etc.). Any number shown as "?" is hidden on purpose; never guess or fill it in.
- You MAY name WHAT to compute next ("first combine the two resistors", "then find the total current") and you MAY use the GIVEN numbers, but never state the value that a step produces.
- Warm, concrete, specific to THIS problem. Plain text only — no markdown, no headings, no preamble.`;

export const EXPLAIN_SYSTEM = `You are a patient, encouraging circuit-electronics tutor for a beginner course.
You receive a JSON object: the question, the givens, what to solve for, the learner's WRONG answer ("learnerAnswer"), "workedSteps" (the correct method with every computed value hidden as "?"), and "diagnosis" (a deterministic best-guess at their mistake; may be "unclear").
Your job, in 2-4 short sentences:
1. Say what the learner's OWN answer represents and why it isn't the final quantity asked for. Anchor everything on "learnerAnswer" — refer to their actual value. NEVER claim they computed a different number than "learnerAnswer".
2. Point them to the SINGLE next move that fixes it (e.g. "now add the series resistor to that combination"), then stop.
If "diagnosis.misconception" is not "unclear", base your explanation on it. Otherwise infer the most likely slip by comparing "learnerAnswer" to the givens and the method — but never assert a calculation you can't support.
HARD RULES:
- Be brief and targeted. No numbered multi-step walkthrough, no restating the whole solution — just what they did and the one next step.
- Never state ANY computed value (the final answer or any intermediate like an equivalent resistance, total/branch current, voltage drop, or power); values shown as "?" stay hidden. You MAY use the given numbers and the learner's own answer.
- Encouraging, never condescending. Plain text only — no markdown, no headings, no preamble.`;

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

const tolOf = (n: number) => Math.max(0.05, Math.abs(n) * 0.02);
const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * The computed result of each worked step is the LAST number on that line
 * (steps are written "label = formula = substitution = result unit"). These are
 * the subproblem answers — equivalent resistance, total/branch current, a node
 * voltage, etc. — that the learner is supposed to work out, so they must never
 * be shown or stated by the model.
 */
export function stepResultValues(steps: string[]): number[] {
  const out: number[] = [];
  for (const s of steps ?? []) {
    const nums = s.match(/-?\d+(?:\.\d+)?/g);
    if (nums && nums.length) {
      const last = parseFloat(nums[nums.length - 1]);
      if (Number.isFinite(last)) out.push(last);
    }
  }
  return out;
}

/** Values to hide = every step result + the final answer, minus anything that
 *  is actually a given (givens are known to the learner and may be referenced). */
function protectedValues(steps: string[], answer: number, givenValues: number[]): number[] {
  const givens = givenValues.map(round2);
  const isGiven = (n: number) => givens.some((g) => Math.abs(n - g) <= tolOf(g));
  return [...stepResultValues(steps), round2(answer)].filter((v) => !isGiven(v));
}

/**
 * Hides EVERY computed value in the worked steps — the final answer AND every
 * intermediate subproblem result — replacing each with "?". Givens stay visible,
 * label subscripts (R1, V2, I1) are preserved, and reciprocal numerators ("1/…")
 * are kept, so the method/structure of each step is still legible to the model.
 */
export function redactComputedValues(
  steps: string[],
  answer: number,
  givenValues: number[] = []
): string[] {
  const hide = protectedValues(steps, answer, givenValues);
  return (steps ?? []).map((step) =>
    step.replace(/(?<![A-Za-z_\d])-?\d+(?:\.\d+)?/g, (tok: string, offset: number) => {
      const n = parseFloat(tok);
      if (!Number.isFinite(n)) return tok;
      if (n === 1 && step[offset + tok.length] === "/") return tok; // reciprocal "1/R"
      return hide.some((v) => Math.abs(n - v) <= tolOf(v)) ? "?" : tok;
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
      workedSteps: redactComputedValues(
        ctx.steps,
        ctx.correctAnswer,
        ctx.givens.map((g) => g.value)
      ),
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
      workedSteps: redactComputedValues(
        ctx.steps,
        ctx.correctAnswer,
        ctx.givens.map((g) => g.value)
      ),
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
 * Guardrail: returns true if `text` states ANY value the learner is meant to
 * compute — the final answer OR any intermediate subproblem result. `allowed`
 * lists values that are fine to mention (the givens, plus the learner's own
 * answer, which they already know). Label subscripts like "R1" are ignored.
 * Used to reject (and fall back from) hints/explanations that hand a value over.
 */
export function leaksComputedValue(
  text: string,
  steps: string[],
  answer: number,
  allowed: number[] = []
): boolean {
  const hide = protectedValues(steps, answer, allowed);
  if (hide.length === 0) return false;
  const tokens = text.match(/(?<![A-Za-z_])-?\d+(?:\.\d+)?/g);
  if (!tokens) return false;
  return tokens.some((token) => {
    const n = parseFloat(token);
    return Number.isFinite(n) && hide.some((v) => Math.abs(n - v) <= tolOf(v));
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
