import type { StepContext } from "@/lib/ai/types";
import { redactComputedValues, stepResultValues } from "@/lib/ai/prompts";

/**
 * Deterministic misconception classifier.
 *
 * Given the structured step context and the learner's wrong answer, this tries
 * to identify the *specific* error by reproducing common wrong computations and
 * checking which one matches what the learner typed. The result is grounded in
 * the circuit logic — the model only ever rephrases a diagnosis produced here,
 * so an explanation can't invent a wrong reason.
 *
 * Detail strings intentionally describe the *method* and avoid stating the final
 * answer, so "try again" stays meaningful.
 */

export type Diagnosis = {
  label: string;
  detail: string;
};

function valuesByUnit(ctx: StepContext) {
  const voltage = ctx.givens.find((g) => g.unit === "V")?.value;
  const current = ctx.givens.find((g) => g.unit === "A")?.value;
  const power = ctx.givens.find((g) => g.unit === "W")?.value;
  const resistances = ctx.givens
    .filter((g) => g.unit === "Ω")
    .map((g) => g.value);
  return { voltage, current, power, resistances };
}

export function diagnose(ctx: StepContext): Diagnosis | null {
  const learner = ctx.learnerAnswer;
  if (learner === undefined || Number.isNaN(learner)) return null;

  const correct = ctx.correctAnswer;
  // A candidate "wrong computation" matches if the learner is near it AND it is
  // clearly different from the correct answer.
  const matches = (candidate: number) =>
    Number.isFinite(candidate) &&
    Math.abs(learner - candidate) <= Math.max(0.15, Math.abs(candidate) * 0.04) &&
    Math.abs(candidate - correct) > Math.max(0.15, Math.abs(correct) * 0.04);

  const { voltage, current, power, resistances } = valuesByUnit(ctx);
  const r1 = resistances[0];
  const r2 = resistances[1];
  const rSum = resistances.reduce((a, b) => a + b, 0);

  switch (ctx.solveFor) {
    case "current": {
      if (voltage !== undefined && r1 !== undefined) {
        if (matches(voltage * r1)) {
          return {
            label: "Multiplied instead of divided",
            detail:
              "You appear to have multiplied voltage by resistance. Current is voltage divided by resistance (I = V ÷ R), not V × R.",
          };
        }
        if (r2 !== undefined && matches(voltage / r1) && matches(voltage / r2) === false) {
          return {
            label: "Used only one resistor",
            detail:
              "It looks like you used a single resistor. These resistors combine first — find the total resistance, then divide the voltage by that total.",
          };
        }
        if (r2 !== undefined && ctx.topic === "parallel" && matches(voltage / rSum)) {
          return {
            label: "Treated parallel as series",
            detail:
              "You combined the resistors by adding them, which is the series rule. In parallel each branch gets the full voltage, so add the branch currents instead.",
          };
        }
        if (r2 !== undefined && ctx.topic === "series" && (matches(voltage / r1) || matches(voltage / r2))) {
          return {
            label: "Forgot to add series resistors",
            detail:
              "In series the resistors add up first (R_total = R1 + R2). You seem to have divided by just one of them.",
          };
        }
      }
      break;
    }
    case "resistance": {
      if (voltage !== undefined && current !== undefined) {
        if (matches(voltage * current)) {
          return {
            label: "Multiplied instead of divided",
            detail:
              "Resistance is voltage divided by current (R = V ÷ I). You appear to have multiplied them.",
          };
        }
        if (matches(current / voltage)) {
          return {
            label: "Divided the wrong way",
            detail:
              "The division is upside-down. Resistance = voltage ÷ current, not current ÷ voltage.",
          };
        }
      }
      break;
    }
    case "voltage": {
      if (current !== undefined && r1 !== undefined) {
        if (matches(current / r1) || matches(r1 / current)) {
          return {
            label: "Divided instead of multiplied",
            detail:
              "To get voltage you multiply: V = I × R. You appear to have divided the two givens.",
          };
        }
      }
      if (power !== undefined && r1 !== undefined && matches(power / r1)) {
        return {
          label: "Skipped the square root",
          detail:
            "For power in a resistor, P = V² ÷ R, so V = √(P × R). It looks like you computed P ÷ R and forgot the square root.",
        };
      }
      break;
    }
    case "power": {
      if (voltage !== undefined && current !== undefined) {
        if (matches(voltage / current) || matches(current / voltage)) {
          return {
            label: "Divided instead of multiplied",
            detail:
              "Power is voltage times current (P = V × I). You appear to have divided them.",
          };
        }
      }
      if (voltage !== undefined && r1 !== undefined && matches(voltage / r1)) {
        return {
          label: "Stopped at current",
          detail:
            "You found the current (V ÷ R) but didn't finish. Power needs one more step: multiply that current by the voltage (P = V × I).",
        };
      }
      break;
    }
    case "rTotal": {
      if (r1 !== undefined && r2 !== undefined && ctx.topic !== "series" && matches(rSum)) {
        return {
          label: "Added parallel resistors",
          detail:
            "You added the resistors, but a parallel combination is always smaller than the smallest resistor. Use 1/R = 1/R1 + 1/R2 for the parallel part.",
        };
      }
      break;
    }
    case "branchCurrent": {
      if (voltage !== undefined && r1 !== undefined && matches(voltage * r1)) {
        return {
          label: "Multiplied instead of divided",
          detail:
            "A branch current is the full voltage divided by that branch's resistance (I = V ÷ R). You appear to have multiplied.",
        };
      }
      break;
    }
  }

  const la = Math.round(learner * 100) / 100;
  const unit = ctx.answerUnit;

  // Did they just report ONE of the given component values without combining
  // anything? (e.g. answering "5 Ω" when only a single resistor is 5 Ω.) This is
  // distinct from stopping at a computed intermediate, so name it precisely.
  const givenVals = ctx.givens.map((g) => g.value);
  if (givenVals.some((g) => matches(g))) {
    return {
      label: "Reported a single given value",
      detail: `Your answer (${la} ${unit}) is just one of the values already given, on its own. The question is about the whole circuit, so the components have to be combined the way they're connected — reduce each parallel group, then add the series parts — before you can read off what it asks for.`,
    };
  }

  // Did they answer a genuine intermediate RESULT computed partway through the
  // solution (the result of a step, not a given)? Common on multi-step problems.
  const tolFor = (n: number) => Math.max(0.15, Math.abs(n) * 0.04);
  const stepResults = stepResultValues(ctx.steps ?? []).filter(
    (v) => Math.abs(v - correct) > tolFor(correct)
  );
  if (stepResults.some((n) => matches(n))) {
    return {
      label: "Stopped one step early",
      detail: `Your answer (${la} ${unit}) is a value from partway through the solution, not the final quantity asked for. You set it up correctly but stopped before the last step — take that result and finish the remaining operation.`,
    };
  }

  // Generic fallbacks when no specific pattern matched.
  if (Math.abs(learner) > Math.abs(correct) * 3) {
    return {
      label: "Answer far too large",
      detail:
        "Your value is much larger than expected — double-check whether a step should have been a division rather than a multiplication.",
    };
  }
  if (Math.abs(learner) < Math.abs(correct) / 3 && learner !== 0) {
    return {
      label: "Answer far too small",
      detail:
        "Your value is much smaller than expected — re-check the order of operations and which quantity is on top of the division.",
    };
  }

  return null;
}

/** Builds a plain-language explanation with no AI, for the AI-off fallback. */
export function fallbackExplanation(ctx: StepContext): {
  explanation: string;
  misconception?: string;
} {
  const d = diagnose(ctx);

  // When we have a specific diagnosis it already names the mistake and the next
  // move, so keep it tight — don't dump the whole worked method on top.
  if (d) {
    return { explanation: d.detail, misconception: d.label };
  }

  // No specific pattern: give a short method nudge from the first step, with all
  // computed values hidden so nothing is handed over.
  const [firstStep] = redactComputedValues(
    ctx.steps ?? [],
    ctx.correctAnswer,
    (ctx.givens ?? []).map((g) => g.value)
  );
  const nudge =
    firstStep ??
    "Re-read the question, pick the formula that links the givens to the unknown, and substitute one value at a time.";
  return { explanation: `Let's work through it. ${nudge}` };
}
