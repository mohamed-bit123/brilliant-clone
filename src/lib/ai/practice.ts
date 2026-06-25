import {
  computeCurrent,
  computePower,
  parallelResistance,
  seriesResistance,
  type CircuitPreview,
  type InteractionConfig,
} from "@/lib/types";
import type {
  Difficulty,
  GeneratedProblem,
  PracticeTopic,
  VerifiedSolution,
} from "@/lib/ai/types";
import { TOPIC_LABEL } from "@/lib/ai/types";

/**
 * Deterministic circuit problem generator.
 *
 * This module is the single source of truth for every practice answer. Problems
 * are built "backward" from clean operands wherever possible so answers stay
 * tidy, and every value is computed with the verified engine in `types.ts`.
 *
 * It serves three roles:
 *   1. The AI-off fallback (generates real problems with no model).
 *   2. The verification oracle (recomputes/validates anything the model proposes).
 *   3. The difficulty ladder for "Practice more".
 */

type NumericInteraction = Extract<InteractionConfig, { kind: "numeric-calc" }>;

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Tolerance scales with the answer so messy parallel values still validate. */
function toleranceFor(answer: number): number {
  return Math.max(0.1, Math.abs(round2(answer)) * 0.03);
}

function uid(topic: string): string {
  return `practice-${topic}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

type Built = {
  prompt: string;
  interaction: NumericInteraction;
  solution: VerifiedSolution;
};

function build(
  givens: { label: string; value: number; unit: string }[],
  solveFor: NumericInteraction["solveFor"],
  answer: number,
  answerUnit: string,
  steps: string[],
  prompt: string,
  preview?: CircuitPreview,
  branchIndex?: 1 | 2
): Built {
  const rounded = round2(answer);
  return {
    prompt,
    interaction: {
      kind: "numeric-calc",
      givens,
      solveFor,
      correctAnswer: rounded,
      tolerance: toleranceFor(rounded),
      answerUnit,
      circuitPreview: preview,
      ...(branchIndex ? { branchIndex } : {}),
    },
    solution: { answer: rounded, unit: answerUnit, steps },
  };
}

// ---------------------------------------------------------------------------
// Ohm's law (V = I·R)
// ---------------------------------------------------------------------------

function genOhms(d: Difficulty): Built {
  const rPool =
    d <= 1 ? [2, 3, 4, 5, 6] : d === 2 ? [2, 3, 4, 5, 6, 8, 10] : [3, 4, 6, 8, 10, 12, 15];
  const iPool =
    d <= 1 ? [1, 2, 3] : d === 2 ? [1, 2, 3, 4, 5] : d >= 4 ? [1, 1.5, 2, 2.5, 3, 4] : [2, 3, 4, 5, 6];

  const R = pick(rPool);
  const I = pick(iPool);
  const V = round2(R * I);

  // Two-step variant for the hardest tiers: change R, find the new current.
  if (d >= 4 && Math.random() < 0.6) {
    const delta = pick([2, 3, 4, 5]);
    const grew = Math.random() < 0.5;
    const newR = grew ? R + delta : Math.max(1, R - Math.min(delta, R - 1));
    const newI = computeCurrent(V, newR);
    return build(
      [
        { label: "Battery", value: V, unit: "V" },
        { label: "Original resistance", value: R, unit: "Ω" },
        { label: grew ? "Resistance increased to" : "Resistance decreased to", value: newR, unit: "Ω" },
      ],
      "current",
      newI,
      "A",
      [
        "Ohm's law: I = V / R.",
        `The voltage is unchanged at ${V} V; only resistance changes to ${newR} Ω.`,
        `I = ${V} / ${newR} = ${round2(newI)} A.`,
      ],
      `A ${V} V battery first drives a ${R} Ω resistor. The resistor is swapped for a ${newR} Ω one. What current flows now?`,
      { mode: "simple", voltage: V, resistance: newR }
    );
  }

  const variant = d <= 1 ? "current" : pick(["current", "resistance", "voltage"] as const);

  if (variant === "current") {
    return build(
      [
        { label: "Voltage", value: V, unit: "V" },
        { label: "Resistance", value: R, unit: "Ω" },
      ],
      "current",
      I,
      "A",
      ["Ohm's law: I = V / R.", `I = ${V} / ${R} = ${round2(I)} A.`],
      `A ${V} V battery is connected across a ${R} Ω resistor. What current flows?`,
      { mode: "simple", voltage: V, resistance: R }
    );
  }

  if (variant === "resistance") {
    return build(
      [
        { label: "Voltage", value: V, unit: "V" },
        { label: "Current", value: I, unit: "A" },
      ],
      "resistance",
      R,
      "Ω",
      ["Rearrange Ohm's law: R = V / I.", `R = ${V} / ${I} = ${round2(R)} Ω.`],
      `A resistor carries ${I} A when ${V} V is applied across it. What is its resistance?`,
      { mode: "simple", voltage: V, resistance: R }
    );
  }

  return build(
    [
      { label: "Current", value: I, unit: "A" },
      { label: "Resistance", value: R, unit: "Ω" },
    ],
    "voltage",
    V,
    "V",
    ["Rearrange Ohm's law: V = I × R.", `V = ${I} × ${R} = ${round2(V)} V.`],
    `${I} A flows through a ${R} Ω resistor. What voltage is across it?`,
    { mode: "simple", voltage: V, resistance: R }
  );
}

// ---------------------------------------------------------------------------
// Series circuits (R_total = R1 + R2)
// ---------------------------------------------------------------------------

function genSeries(d: Difficulty): Built {
  const pool = d <= 2 ? [2, 3, 4, 5, 6] : [3, 4, 5, 6, 8, 10, 12];
  const r1 = pick(pool);
  const r2 = pick(pool);
  const rTotal = seriesResistance(r1, r2);

  // Design problem (hard): find the missing resistor to hit a target current.
  if (d >= 4) {
    const targetI = pick([0.5, 1, 1.5, 2]);
    const V = round2(targetI * (r1 + r2));
    const missing = r2;
    return build(
      [
        { label: "Battery", value: V, unit: "V" },
        { label: "Resistor 1", value: r1, unit: "Ω" },
        { label: "Target total current", value: targetI, unit: "A" },
      ],
      "resistance",
      missing,
      "Ω",
      [
        "In series the same current flows everywhere, so R_total = V / I.",
        `R_total = ${V} / ${targetI} = ${round2(r1 + r2)} Ω.`,
        "The two resistors add in series, so R2 = R_total − R1.",
        `R2 = ${round2(r1 + r2)} − ${r1} = ${round2(missing)} Ω.`,
      ],
      `A ${V} V battery should push exactly ${targetI} A through two series resistors. One is ${r1} Ω. What must the second resistor be?`,
      { mode: "series", voltage: V, r1, r2 }
    );
  }

  const V = round2(rTotal * pick(d === 1 ? [1, 2] : [1, 2, 3]));
  const I = computeCurrent(V, rTotal);

  if (d >= 3 && Math.random() < 0.5) {
    // Voltage drop across one resistor.
    const drop = I * r1;
    return build(
      [
        { label: "Battery", value: V, unit: "V" },
        { label: "Resistor 1", value: r1, unit: "Ω" },
        { label: "Resistor 2", value: r2, unit: "Ω" },
      ],
      "voltage",
      drop,
      "V",
      [
        `Series total resistance: R = ${r1} + ${r2} = ${rTotal} Ω.`,
        `Current: I = V / R = ${V} / ${rTotal} = ${round2(I)} A.`,
        `Voltage across R1: V1 = I × R1 = ${round2(I)} × ${r1} = ${round2(drop)} V.`,
      ],
      `Two resistors (${r1} Ω and ${r2} Ω) are in series across a ${V} V battery. What is the voltage drop across the ${r1} Ω resistor?`,
      { mode: "series", voltage: V, r1, r2 }
    );
  }

  return build(
    [
      { label: "Battery", value: V, unit: "V" },
      { label: "Resistor 1", value: r1, unit: "Ω" },
      { label: "Resistor 2", value: r2, unit: "Ω" },
    ],
    "current",
    I,
    "A",
    [
      `Series resistors add: R_total = ${r1} + ${r2} = ${rTotal} Ω.`,
      `Ohm's law: I = V / R_total = ${V} / ${rTotal} = ${round2(I)} A.`,
    ],
    `Two resistors of ${r1} Ω and ${r2} Ω are in series across a ${V} V battery. What is the total current?`,
    { mode: "series", voltage: V, r1, r2 }
  );
}

// ---------------------------------------------------------------------------
// Parallel circuits (1/R_total = 1/R1 + 1/R2)
// ---------------------------------------------------------------------------

function genParallel(d: Difficulty): Built {
  // Choose a voltage that both resistors divide for clean branch currents.
  const V = pick(d <= 2 ? [12, 24] : [24, 36, 48]);
  const divisors = [2, 3, 4, 6, 8, 12].filter((r) => V % r === 0);
  const r1 = pick(divisors);
  const r2 = pick(divisors);

  if (d >= 4) {
    // Find the missing branch resistance to reach a target total current.
    const i1 = V / r1;
    const targetTotal = i1 + V / r2;
    const i2 = targetTotal - i1;
    const missing = V / i2;
    return build(
      [
        { label: "Battery", value: V, unit: "V" },
        { label: "Branch 1 resistor", value: r1, unit: "Ω" },
        { label: "Target total current", value: round2(targetTotal), unit: "A" },
      ],
      "resistance",
      missing,
      "Ω",
      [
        "Parallel branches share the full battery voltage.",
        `Branch 1 current: I1 = V / R1 = ${V} / ${r1} = ${round2(i1)} A.`,
        `Branch 2 must carry the rest: I2 = I_total − I1 = ${round2(targetTotal)} − ${round2(i1)} = ${round2(i2)} A.`,
        `R2 = V / I2 = ${V} / ${round2(i2)} = ${round2(missing)} Ω.`,
      ],
      `A ${V} V battery feeds two parallel branches and should draw ${round2(targetTotal)} A total. Branch 1 is ${r1} Ω. What resistance is branch 2?`,
      { mode: "parallel", voltage: V, r1, r2 }
    );
  }

  if (d >= 2 && Math.random() < 0.45) {
    // Single branch current.
    const branch = pick([1, 2] as const);
    const r = branch === 1 ? r1 : r2;
    const i = V / r;
    return build(
      [
        { label: "Battery", value: V, unit: "V" },
        { label: "Branch 1 resistor", value: r1, unit: "Ω" },
        { label: "Branch 2 resistor", value: r2, unit: "Ω" },
      ],
      "branchCurrent",
      i,
      "A",
      [
        "Every parallel branch sees the full battery voltage.",
        `Branch ${branch === 1 ? "A" : "B"} current: I = V / R = ${V} / ${r} = ${round2(i)} A.`,
      ],
      `A ${V} V battery feeds a ${r1} Ω and a ${r2} Ω resistor in parallel. What current flows through the ${r} Ω (branch ${branch === 1 ? "A" : "B"})?`,
      { mode: "parallel", voltage: V, r1, r2 },
      branch
    );
  }

  const total = V / r1 + V / r2;
  return build(
    [
      { label: "Battery", value: V, unit: "V" },
      { label: "Branch 1 resistor", value: r1, unit: "Ω" },
      { label: "Branch 2 resistor", value: r2, unit: "Ω" },
    ],
    "current",
    total,
    "A",
    [
      "Each branch carries its own current at the full battery voltage.",
      `I1 = ${V} / ${r1} = ${round2(V / r1)} A, I2 = ${V} / ${r2} = ${round2(V / r2)} A.`,
      `Total current is the sum: I = ${round2(V / r1)} + ${round2(V / r2)} = ${round2(total)} A.`,
    ],
    `A ${V} V battery feeds a ${r1} Ω and a ${r2} Ω resistor in parallel. What is the total current drawn from the battery?`,
    { mode: "parallel", voltage: V, r1, r2 }
  );
}

// ---------------------------------------------------------------------------
// Equivalent resistance (mixed series + parallel)
// ---------------------------------------------------------------------------

function genEquivalent(d: Difficulty): Built {
  const pool = [2, 3, 4, 6, 8, 12];
  const r1 = pick(pool);
  const r2 = pick(pool);
  const r3 = pick(pool);

  const seriesFirst = Math.random() < 0.5;
  const rTotal = seriesFirst
    ? parallelResistance(seriesResistance(r1, r2), r3)
    : seriesResistance(parallelResistance(r1, r2), r3);

  const desc = seriesFirst
    ? `R1 (${r1} Ω) and R2 (${r2} Ω) are in series, and that pair is in parallel with R3 (${r3} Ω)`
    : `R1 (${r1} Ω) and R2 (${r2} Ω) are in parallel, and that pair is in series with R3 (${r3} Ω)`;

  const steps = seriesFirst
    ? [
        `First combine the series pair: ${r1} + ${r2} = ${seriesResistance(r1, r2)} Ω.`,
        `Then parallel with R3: (${seriesResistance(r1, r2)} × ${r3}) / (${seriesResistance(r1, r2)} + ${r3}) = ${round2(rTotal)} Ω.`,
      ]
    : [
        `First combine the parallel pair: (${r1} × ${r2}) / (${r1} + ${r2}) = ${round2(parallelResistance(r1, r2))} Ω.`,
        `Then add R3 in series: ${round2(parallelResistance(r1, r2))} + ${r3} = ${round2(rTotal)} Ω.`,
      ];

  if (d >= 4) {
    const V = pick([12, 24, 36]);
    const I = computeCurrent(V, rTotal);
    return build(
      [
        { label: "Battery", value: V, unit: "V" },
        { label: "R1", value: r1, unit: "Ω" },
        { label: "R2", value: r2, unit: "Ω" },
        { label: "R3", value: r3, unit: "Ω" },
      ],
      "current",
      I,
      "A",
      [
        ...steps,
        `Finally, total current: I = V / R_total = ${V} / ${round2(rTotal)} = ${round2(I)} A.`,
      ],
      `${desc}. A ${V} V battery drives the network. What is the total current?`,
      { mode: "series", voltage: V, r1, r2 }
    );
  }

  return build(
    [
      { label: "R1", value: r1, unit: "Ω" },
      { label: "R2", value: r2, unit: "Ω" },
      { label: "R3", value: r3, unit: "Ω" },
    ],
    "rTotal",
    rTotal,
    "Ω",
    steps,
    `${desc}. What is the equivalent resistance of the whole network?`,
    { mode: "series", voltage: 12, r1, r2 }
  );
}

// ---------------------------------------------------------------------------
// Power & energy (P = I·V, with V = I·R)
// ---------------------------------------------------------------------------

function genPower(d: Difficulty): Built {
  const rPool = d <= 2 ? [2, 3, 4, 5, 6] : [3, 4, 6, 8, 10, 12];
  const iPool = d <= 2 ? [1, 2, 3] : [1, 2, 3, 4];
  const R = pick(rPool);
  const I = pick(iPool);
  const V = round2(R * I);
  const P = computePower(V, I);

  if (d >= 4) {
    // Find the voltage required to reach a target power for a fixed resistor.
    const targetP = P;
    return build(
      [
        { label: "Resistor", value: R, unit: "Ω" },
        { label: "Target power", value: round2(targetP), unit: "W" },
      ],
      "voltage",
      V,
      "V",
      [
        "Power in a resistor: P = V² / R, so V = √(P × R).",
        `V = √(${round2(targetP)} × ${R}) = √${round2(targetP * R)} = ${round2(V)} V.`,
      ],
      `A ${R} Ω resistor must dissipate ${round2(targetP)} W. What voltage is needed across it?`,
      { mode: "simple", voltage: V, resistance: R }
    );
  }

  if (d >= 2 && Math.random() < 0.5) {
    return build(
      [
        { label: "Voltage", value: V, unit: "V" },
        { label: "Resistance", value: R, unit: "Ω" },
      ],
      "power",
      P,
      "W",
      [
        `First find the current: I = V / R = ${V} / ${R} = ${round2(I)} A.`,
        `Then power: P = V × I = ${V} × ${round2(I)} = ${round2(P)} W.`,
      ],
      `A ${V} V battery drives a ${R} Ω resistor. How much power does the resistor dissipate?`,
      { mode: "simple", voltage: V, resistance: R }
    );
  }

  return build(
    [
      { label: "Voltage", value: V, unit: "V" },
      { label: "Current", value: I, unit: "A" },
    ],
    "power",
    P,
    "W",
    ["Power delivered: P = V × I.", `P = ${V} × ${I} = ${round2(P)} W.`],
    `A device runs at ${V} V and draws ${I} A. What power does it use?`,
    { mode: "simple", voltage: V, resistance: R }
  );
}

const GENERATORS: Record<PracticeTopic, (d: Difficulty) => Built> = {
  ohms: genOhms,
  series: genSeries,
  parallel: genParallel,
  equivalent: genEquivalent,
  power: genPower,
  mixed: (d) => {
    const topics: PracticeTopic[] = ["ohms", "series", "parallel", "power"];
    if (d >= 3) topics.push("equivalent");
    return GENERATORS[pick(topics)](d);
  },
};

/**
 * Generate a fully-verified practice problem with no AI involvement.
 * Used directly when AI is off, and as the answer oracle when AI is on.
 */
export function generateProblem(
  topic: PracticeTopic,
  difficulty: Difficulty
): GeneratedProblem {
  const built = GENERATORS[topic](difficulty);
  return {
    id: uid(topic),
    topic,
    difficulty,
    title: `${TOPIC_LABEL[topic]} · Level ${difficulty}`,
    prompt: built.prompt,
    interaction: built.interaction,
    feedback: {
      correct: "Correct — nicely reasoned.",
      incorrect: "Not quite. Check each step and try again.",
    },
    solution: built.solution,
    source: "procedural",
  };
}

/** Convert a generated problem into the grounded context used by hint/explain. */
export function problemToContext(problem: GeneratedProblem, learnerAnswer?: number) {
  return {
    topic: problem.topic,
    topicLabel: TOPIC_LABEL[problem.topic],
    stepTitle: problem.title,
    prompt: problem.prompt,
    givens: problem.interaction.givens,
    solveFor: problem.interaction.solveFor,
    answerUnit: problem.interaction.answerUnit,
    correctAnswer: problem.solution.answer,
    steps: problem.solution.steps,
    learnerAnswer,
  };
}
