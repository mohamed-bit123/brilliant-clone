import type { InteractionConfig } from "@/lib/types";
import type { PracticeTopic, StepContext } from "@/lib/ai/types";
import { TOPIC_LABEL } from "@/lib/ai/types";

type NumericInteraction = Extract<InteractionConfig, { kind: "numeric-calc" }>;

/** A one-line method reminder per quantity — used to ground hints/fallbacks. */
export function methodHintFor(solveFor: NumericInteraction["solveFor"]): string {
  switch (solveFor) {
    case "current":
      return "Use Ohm's law: I = V / R.";
    case "voltage":
      return "Use Ohm's law rearranged: V = I × R.";
    case "resistance":
      return "Use Ohm's law rearranged: R = V / I.";
    case "power":
      return "Use the power formula: P = V × I.";
    case "rTotal":
      return "Combine the resistors using the series (add) or parallel (reciprocal) rule.";
    case "branchCurrent":
      return "Each parallel branch sees the full battery voltage: I = V / R for that branch.";
    default:
      return "Identify the formula that links the givens to the unknown.";
  }
}

/**
 * Builds grounded StepContext from a numeric-calc interaction. Used for in-lesson
 * calc steps (which don't ship worked steps) so hint/explain still have structure.
 */
export function contextFromNumeric(
  interaction: NumericInteraction,
  opts: {
    topic: PracticeTopic;
    prompt: string;
    stepTitle: string;
    learnerAnswer?: number;
    attempts?: number;
  }
): StepContext {
  return {
    topic: opts.topic,
    topicLabel: TOPIC_LABEL[opts.topic],
    stepTitle: opts.stepTitle,
    prompt: opts.prompt,
    givens: interaction.givens,
    solveFor: interaction.solveFor,
    answerUnit: interaction.answerUnit,
    correctAnswer: interaction.correctAnswer,
    steps: [
      opts.topic === "sources"
        ? "Combine the sources first (series EMFs add, opposing subtract, identical parallel cells keep EMF), treat internal resistance as series R, then apply I = ε_net / R_total and V = ε − I·r."
        : methodHintFor(interaction.solveFor),
    ],
    learnerAnswer: opts.learnerAnswer,
    attempts: opts.attempts,
  };
}
