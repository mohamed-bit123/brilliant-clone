import type { InteractionConfig, StepFeedback } from "@/lib/types";

/**
 * Shared AI types used by both the client and the server.
 * NOTE: nothing in this file imports server-only modules, so it is safe to
 * import from client components.
 */

export type PracticeTopic =
  | "ohms"
  | "series"
  | "parallel"
  | "equivalent"
  | "power"
  | "mixed";

/** Difficulty tier. 1 = single-step recall, 5 = multi-step synthesis. */
export type Difficulty = 1 | 2 | 3 | 4 | 5;

/** Maps each lesson to the topic its "Practice more" mode should drill. */
export const LESSON_TOPIC: Record<string, PracticeTopic> = {
  "lesson-1": "ohms",
  "lesson-2": "series",
  "lesson-3": "parallel",
  "lesson-4": "equivalent",
  "lesson-5": "power",
  "lesson-6": "mixed",
};

export const TOPIC_LABEL: Record<PracticeTopic, string> = {
  ohms: "Ohm's Law",
  series: "Series Circuits",
  parallel: "Parallel Circuits",
  equivalent: "Equivalent Resistance",
  power: "Power & Energy",
  mixed: "Mixed Challenge",
};

/** The verified solution for a generated problem. The engine is the source of truth. */
export type VerifiedSolution = {
  answer: number;
  unit: string;
  /** Human-readable worked steps, produced deterministically by the engine. */
  steps: string[];
};

/**
 * A fully-verified practice problem. The `interaction` is always a
 * `numeric-calc` config so it renders through the existing CalcStep component.
 * The numbers in `interaction` and `solution` ALWAYS come from the deterministic
 * engine — never from the model — so a generated problem can never have a wrong
 * answer.
 */
export type GeneratedProblem = {
  id: string;
  topic: PracticeTopic;
  difficulty: Difficulty;
  title: string;
  prompt: string;
  /** Optional real-world framing added by the model (purely cosmetic). */
  scenario?: string;
  interaction: Extract<InteractionConfig, { kind: "numeric-calc" }>;
  feedback: StepFeedback;
  solution: VerifiedSolution;
  /** Whether the prose came from the model or the deterministic fallback. */
  source: "ai" | "procedural";
};

/**
 * Structured, grounded context for a single question. Built from lesson state +
 * the deterministic engine, and passed to the model as JSON (never raw prose).
 */
export type StepContext = {
  topic: PracticeTopic;
  topicLabel: string;
  stepTitle: string;
  prompt: string;
  givens: { label: string; value: number; unit: string }[];
  solveFor: string;
  answerUnit: string;
  correctAnswer: number;
  steps: string[];
  learnerAnswer?: number;
  attempts?: number;
};

export type HintResponse = {
  hint: string;
  source: "ai" | "fallback";
};

export type ExplainResponse = {
  explanation: string;
  /** Short label of the diagnosed misconception, when one was detected. */
  misconception?: string;
  source: "ai" | "fallback";
};

export type PracticeRequest = {
  topic: PracticeTopic;
  difficulty: Difficulty;
};
