import {
  computeCurrent,
  computePower,
  seriesResistance,
  solveMultiSource,
  type CircuitPreview,
  type InteractionConfig,
  type MultiSourceConfig,
} from "@/lib/types";
import {
  reductionSteps,
  solveNetwork,
  type NetworkNode,
  type NetworkSpec,
} from "@/lib/network";
import type {
  Difficulty,
  GeneratedProblem,
  PracticeTopic,
  VerifiedSolution,
} from "@/lib/ai/types";
import { TOPIC_LABEL, maxLevelForTopic } from "@/lib/ai/types";

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

/** Like build(), but attaches a multi-source schematic instead of a single-source one. */
function buildMS(
  givens: { label: string; value: number; unit: string }[],
  solveFor: NumericInteraction["solveFor"],
  answer: number,
  answerUnit: string,
  steps: string[],
  prompt: string,
  multiSource: MultiSourceConfig
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
      multiSourcePreview: multiSource,
    },
    solution: { answer: rounded, unit: answerUnit, steps },
  };
}

/** Like build(), but attaches a series-parallel network diagram. */
function buildNet(
  spec: NetworkSpec,
  givens: { label: string; value: number; unit: string }[],
  solveFor: NumericInteraction["solveFor"],
  answer: number,
  answerUnit: string,
  steps: string[],
  prompt: string
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
      networkPreview: spec,
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
      { mode: "series", voltage: V, r1, r2: missing, maskResistor: 2 }
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
      { mode: "parallel", voltage: V, r1, r2: round2(missing), maskResistor: 2 }
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
// Equivalent resistance & complex series-parallel networks
//
// These are the genuinely harder problems: real multi-resistor topologies
// (e.g. a parallel pair whose combined current then flows through another
// resistor) rendered as an actual schematic, with multi-step questions that
// ask for a branch current, a node voltage, or power deep inside the network.
// ---------------------------------------------------------------------------

const NICE_PAIRS: [number, number][] = [
  [6, 3], [6, 12], [4, 4], [8, 8], [2, 2], [3, 6],
  [10, 10], [12, 4], [12, 6], [20, 5], [6, 6], [4, 12],
];

function nicePair(): [number, number] {
  return pick(NICE_PAIRS);
}

function res(label: string, ohms: number): NetworkNode {
  return { kind: "resistor", label, ohms };
}
function ser(...parts: NetworkNode[]): NetworkNode {
  return { kind: "series", parts };
}
function par(...parts: NetworkNode[]): NetworkNode {
  return { kind: "parallel", parts };
}

const S1 = "R₁";
const S2 = "R₂";
const S3 = "R₃";
const S4 = "R₄";
const S5 = "R₅";
const S6 = "R₆";

function collectResistors(node: NetworkNode): { label: string; ohms: number }[] {
  if (node.kind === "resistor") return [{ label: node.label, ohms: node.ohms }];
  return node.parts.flatMap(collectResistors);
}

/** Returns each archetype as a spec along with which resistors sit in a parallel branch. */
function buildArchetype(d: Difficulty): NetworkSpec {
  const small = [2, 3, 4, 5, 6, 8];

  // d<=2: parallel pair fed in series by a third resistor (the canonical case).
  if (d <= 2) {
    const [a, b] = nicePair();
    const c = pick(small);
    const root =
      Math.random() < 0.5
        ? ser(par(res(S1, a), res(S2, b)), res(S3, c)) // P(R1,R2) then R3
        : ser(res(S1, c), par(res(S2, a), res(S3, b))); // R1 then P(R2,R3)
    return { voltage: pick([12, 24, 36]), root };
  }

  // d==3: source → series resistor → parallel pair → out (lead-in + parallel).
  if (d === 3) {
    const [a, b] = nicePair();
    const c = pick(small);
    const root = ser(res(S1, c), par(res(S2, a), res(S3, b)));
    return { voltage: pick([12, 24, 36, 48]), root };
  }

  // d==4: sandwich — series resistor, a parallel pair, then another series resistor.
  if (d === 4) {
    const [a, b] = nicePair();
    const c = pick(small);
    const e = pick(small);
    const root = ser(res(S1, c), par(res(S2, a), res(S3, b)), res(S4, e));
    return { voltage: pick([24, 36, 48]), root };
  }

  // d==5: a two-branch ladder (each branch a series pair) fed through a resistor.
  if (d === 5) {
    const [a, b] = nicePair();
    const [c, e] = nicePair();
    const lead = pick([1, 2, 3]);
    const root = ser(
      res(S1, lead),
      par(ser(res(S2, a), res(S3, b)), ser(res(S4, c), res(S5, e)))
    );
    return { voltage: pick([24, 36, 48]), root };
  }

  // d==6: a lead resistor feeding THREE parallel branches.
  if (d === 6) {
    const [a, b] = nicePair();
    const c = pick(small);
    const lead = pick([1, 2, 3]);
    const root = ser(res(S1, lead), par(res(S2, a), res(S3, b), res(S4, c)));
    return { voltage: pick([24, 36, 48]), root };
  }

  // d==7: a full ladder with both a lead-in and a trailing resistor.
  if (d === 7) {
    const [a, b] = nicePair();
    const [c, e] = nicePair();
    const lead = pick([1, 2, 3]);
    const tail = pick([1, 2, 3]);
    const root = ser(
      res(S1, lead),
      par(ser(res(S2, a), res(S3, b)), ser(res(S4, c), res(S5, e))),
      res(S6, tail)
    );
    return { voltage: pick([36, 48, 60]), root };
  }

  // d>=8: nested parallels — one branch itself contains a parallel sub-block.
  const [a, b] = nicePair();
  const c = pick(small);
  const lead = pick([1, 2, 3]);
  const tail = pick([2, 3, 4]);
  const root = ser(
    res(S1, lead),
    par(ser(res(S2, c), par(res(S3, a), res(S4, b))), res(S5, pick(small))),
    res(S6, tail)
  );
  return { voltage: pick([36, 48, 60]), root };
}

/** Picks a resistor whose current differs from the total (i.e. inside a parallel split). */
function pickBranchResistor(
  spec: NetworkSpec
): { label: string; ohms: number } | null {
  const sol = solveNetwork(spec);
  const candidates = collectResistors(spec.root).filter(
    (r) => Math.abs(sol.readings[r.label].current - sol.totalCurrent) > 1e-6
  );
  return candidates.length ? pick(candidates) : null;
}

function networkGivens(spec: NetworkSpec, includeBattery: boolean) {
  const givens = collectResistors(spec.root).map((r) => ({
    label: r.label,
    value: r.ohms,
    unit: "Ω",
  }));
  if (includeBattery) {
    givens.unshift({ label: "Battery", value: spec.voltage, unit: "V" });
  }
  return givens;
}

function genEquivalent(d: Difficulty, allowPower = false): Built {
  const spec = buildArchetype(d);
  const sol = solveNetwork(spec);
  const req = round2(sol.equivalentResistance);
  const red = reductionSteps(spec.root);
  const V = spec.voltage;
  const totalI = round2(sol.totalCurrent);

  // Choose a question appropriate to the difficulty.
  type Kind = "rTotal" | "current" | "branchCurrent" | "voltage" | "power";
  let kind: Kind;
  if (d <= 1) kind = "rTotal";
  else if (d === 2) kind = pick(["rTotal", "current"] as const);
  else if (d === 3) kind = pick(["current", "branchCurrent", "voltage"] as const);
  // "power" is only asked when the topic has covered it (Power lesson onward);
  // Equivalent Resistance practice must never ask a power question.
  else if (d === 4)
    kind = pick(
      allowPower ? (["branchCurrent", "voltage", "power"] as const) : (["branchCurrent", "voltage"] as const)
    );
  else
    kind = pick(
      allowPower ? (["branchCurrent", "power", "voltage"] as const) : (["branchCurrent", "voltage"] as const)
    );

  if (kind === "rTotal") {
    return buildNet(
      spec,
      networkGivens(spec, false),
      "rTotal",
      req,
      "Ω",
      red.steps,
      `For the network shown, what is the equivalent resistance seen by the battery?`
    );
  }

  if (kind === "current") {
    return buildNet(
      spec,
      networkGivens(spec, true),
      "current",
      sol.totalCurrent,
      "A",
      [...red.steps, `Total current: I = V / R_eq = ${V} / ${req} = ${totalI} A.`],
      `For the network shown, what total current does the ${V} V battery supply?`
    );
  }

  // Quantities about a specific resistor deep in the network.
  const target =
    kind === "branchCurrent"
      ? pickBranchResistor(spec)
      : pick(collectResistors(spec.root));

  // Fallback if no genuine branch resistor exists (shouldn't happen for these archetypes).
  if (!target) {
    return buildNet(
      spec,
      networkGivens(spec, true),
      "current",
      sol.totalCurrent,
      "A",
      [...red.steps, `Total current: I = V / R_eq = ${V} / ${req} = ${totalI} A.`],
      `For the network shown, what total current does the ${V} V battery supply?`
    );
  }

  const reading = sol.readings[target.label];

  if (kind === "branchCurrent") {
    return buildNet(
      spec,
      networkGivens(spec, true),
      "branchCurrent",
      reading.current,
      "A",
      [
        ...red.steps,
        `Total current from the battery: I = V / R_eq = ${V} / ${req} = ${totalI} A.`,
        `Working voltages back through the network, ${target.label} has ${round2(reading.voltage)} V across it.`,
        `Current through ${target.label}: I = V / R = ${round2(reading.voltage)} / ${target.ohms} = ${round2(reading.current)} A.`,
      ],
      `For the network shown (${V} V battery), how much current flows through ${target.label} (${target.ohms} Ω)?`
    );
  }

  if (kind === "voltage") {
    return buildNet(
      spec,
      networkGivens(spec, true),
      "voltage",
      reading.voltage,
      "V",
      [
        ...red.steps,
        `Total current: I = V / R_eq = ${V} / ${req} = ${totalI} A.`,
        `Voltage across ${target.label} = I_branch × R = ${round2(reading.current)} × ${target.ohms} = ${round2(reading.voltage)} V.`,
      ],
      `For the network shown (${V} V battery), what is the voltage across ${target.label} (${target.ohms} Ω)?`
    );
  }

  // power
  return buildNet(
    spec,
    networkGivens(spec, true),
    "power",
    reading.power,
    "W",
    [
      ...red.steps,
      `Total current: I = V / R_eq = ${V} / ${req} = ${totalI} A.`,
      `Current through ${target.label} = ${round2(reading.current)} A.`,
      `Power dissipated: P = I²·R = ${round2(reading.current)}² × ${target.ohms} = ${round2(reading.power)} W.`,
    ],
    `For the network shown (${V} V battery), how much power is dissipated in ${target.label} (${target.ohms} Ω)?`
  );
}

// ---------------------------------------------------------------------------
// Power & energy (P = I·V, with V = I·R)
// ---------------------------------------------------------------------------

function genPower(d: Difficulty): Built {
  const rPool = d <= 2 ? [2, 3, 4, 5, 6] : [3, 4, 6, 8, 10, 12];
  const iPool = d <= 2 ? [1, 2, 3] : [1, 2, 3, 4];

  // Level 5: power dissipated in one resistor of a series pair (P = I²R).
  if (d >= 5) {
    const r1 = pick([3, 4, 6, 8]);
    const r2 = pick([2, 4, 5, 6]);
    const total = r1 + r2;
    const I = pick([1, 2, 3]);
    const V = round2(I * total);
    const p1 = round2(I * I * r1);
    return build(
      [
        { label: "Battery", value: V, unit: "V" },
        { label: "Resistor 1", value: r1, unit: "Ω" },
        { label: "Resistor 2", value: r2, unit: "Ω" },
      ],
      "power",
      p1,
      "W",
      [
        `Series total resistance: ${r1} + ${r2} = ${total} Ω.`,
        `Current (same everywhere in series): I = V / R = ${V} / ${total} = ${I} A.`,
        `Power in R1: P = I²·R = ${I}² × ${r1} = ${p1} W.`,
      ],
      `A ${V} V battery drives a ${r1} Ω and a ${r2} Ω resistor in series. How much power is dissipated in the ${r1} Ω resistor?`,
      { mode: "series", voltage: V, r1, r2 }
    );
  }

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

// ---------------------------------------------------------------------------
// Multiple voltage sources (EMF, internal resistance, KVL)
// ---------------------------------------------------------------------------

/** Single real battery: find the loop current. */
function sourcesSingleCurrent(d: Difficulty): Built {
  const r = pick(d <= 2 ? [1, 2] : [0.5, 1, 2]);
  const R = pick([4, 5, 6, 8, 10]);
  const I = pick([1, 2, 3]);
  const emf = round2(I * (r + R));
  const cfg: MultiSourceConfig = { arrangement: "single", e1: emf, r1: r, load: R, mask: "current" };
  return buildMS(
    [
      { label: "EMF", value: emf, unit: "V" },
      { label: "Internal resistance", value: r, unit: "Ω" },
      { label: "Load resistance", value: R, unit: "Ω" },
    ],
    "current",
    solveMultiSource(cfg).current,
    "A",
    [
      "The internal resistance is in series with the load.",
      `Total resistance = r + R = ${r} + ${R} = ${round2(r + R)} Ω.`,
      `I = ε / (r + R) = ${emf} / ${round2(r + R)} = ${I} A.`,
    ],
    `A ${emf} V battery has an internal resistance of ${r} Ω and drives a ${R} Ω load. What current flows?`,
    cfg
  );
}

/** Single real battery: find the terminal voltage under load. */
function sourcesSingleTerminal(d: Difficulty): Built {
  const r = pick(d <= 2 ? [1, 2] : [0.5, 1, 2]);
  const R = pick([4, 5, 6, 8]);
  const I = pick([1, 2, 3]);
  const emf = round2(I * (r + R));
  const cfg: MultiSourceConfig = { arrangement: "single", e1: emf, r1: r, load: R, mask: "terminal" };
  const sol = solveMultiSource(cfg);
  return buildMS(
    [
      { label: "EMF", value: emf, unit: "V" },
      { label: "Internal resistance", value: r, unit: "Ω" },
      { label: "Load resistance", value: R, unit: "Ω" },
    ],
    "voltage",
    sol.terminalVoltage,
    "V",
    [
      `Current: I = ε / (r + R) = ${emf} / ${round2(r + R)} = ${I} A.`,
      `Terminal voltage: V = ε − I·r = ${emf} − ${I}×${r} = ${round2(sol.terminalVoltage)} V.`,
      `(Equivalently V = I·R = ${I} × ${R} = ${round2(sol.terminalVoltage)} V.)`,
    ],
    `A ${emf} V battery with ${r} Ω internal resistance drives a ${R} Ω load. What is the terminal voltage across the load?`,
    cfg
  );
}

/** Two sources in series, aiding. */
function sourcesSeriesAiding(d: Difficulty, askVoltage = false): Built {
  const e1 = pick([6, 9, 12]);
  const e2 = pick([3, 6, 9]);
  const r1 = d >= 4 ? pick([0.5, 1]) : 0;
  const r2 = r1;
  const net = e1 + e2;
  const I = pick([1, 2, 3]);
  const R = round2(net / I - (r1 + r2));
  if (R <= 0) return sourcesSeriesAiding(d, askVoltage);
  const cfg: MultiSourceConfig = {
    arrangement: "series-aiding",
    e1,
    e2,
    r1: r1 || undefined,
    r2: r2 || undefined,
    load: R,
    mask: askVoltage ? "terminal" : "current",
  };
  const sol = solveMultiSource(cfg);
  const givens = [
    { label: "EMF 1", value: e1, unit: "V" },
    { label: "EMF 2", value: e2, unit: "V" },
    ...(r1 ? [{ label: "Internal r (each)", value: r1, unit: "Ω" }] : []),
    { label: "Load resistance", value: R, unit: "Ω" },
  ];
  if (askVoltage) {
    return buildMS(
      givens,
      "voltage",
      sol.terminalVoltage,
      "V",
      [
        `Series-aiding EMFs add: ε = ${e1} + ${e2} = ${net} V.`,
        `Total resistance = ${r1 ? `${r1} + ${r2} + ` : ""}${R} = ${round2(sol.totalResistance)} Ω.`,
        `Loop current I = ${net} / ${round2(sol.totalResistance)} = ${round2(sol.current)} A.`,
        `Voltage across the load = I·R = ${round2(sol.current)} × ${R} = ${round2(sol.terminalVoltage)} V.`,
      ],
      `A ${e1} V and a ${e2} V source are in series, aiding${r1 ? `, each with ${r1} Ω internal resistance` : ""}, driving a ${R} Ω load. What is the voltage across the load?`,
      cfg
    );
  }
  return buildMS(
    givens,
    "current",
    sol.current,
    "A",
    [
      `Series-aiding EMFs add: ε = ${e1} + ${e2} = ${net} V.`,
      `Total resistance = ${round2(sol.totalResistance)} Ω.`,
      `I = ε / R_total = ${net} / ${round2(sol.totalResistance)} = ${round2(sol.current)} A.`,
    ],
    `A ${e1} V and a ${e2} V source are connected in series, aiding${r1 ? `, each with ${r1} Ω internal resistance` : ""}, across a ${R} Ω load. What current flows?`,
    cfg
  );
}

/** Two sources opposing — the battery-charger case. */
function sourcesOpposing(): Built {
  const e2 = pick([6, 9, 12]);
  const diff = pick([2, 3, 4]);
  const e1 = e2 + diff;
  const r1 = pick([0.2, 0.3, 0.5]);
  const r2 = pick([0.2, 0.3, 0.5]);
  const I = pick([1, 2, 4]);
  const R = round2(diff / I - (r1 + r2));
  if (R <= 0) return sourcesOpposing();
  const cfg: MultiSourceConfig = {
    arrangement: "series-opposing",
    e1,
    e2,
    r1,
    r2,
    load: R,
    mask: "current",
  };
  const sol = solveMultiSource(cfg);
  return buildMS(
    [
      { label: "Charger EMF", value: e1, unit: "V" },
      { label: "Battery EMF", value: e2, unit: "V" },
      { label: "Charger internal r", value: r1, unit: "Ω" },
      { label: "Battery internal r", value: r2, unit: "Ω" },
      { label: "Series resistor", value: R, unit: "Ω" },
    ],
    "current",
    sol.current,
    "A",
    [
      `Opposing EMFs subtract: ε_net = ${e1} − ${e2} = ${diff} V.`,
      `Total resistance = ${r1} + ${r2} + ${R} = ${round2(sol.totalResistance)} Ω.`,
      `I = ε_net / R_total = ${diff} / ${round2(sol.totalResistance)} = ${round2(sol.current)} A.`,
    ],
    `A ${e1} V charger (r = ${r1} Ω) opposes a ${e2} V battery (r = ${r2} Ω) through a ${R} Ω resistor. What charging current flows?`,
    cfg
  );
}

/** Identical sources in parallel driving a load. */
function sourcesParallel(): Built {
  const emf = pick([6, 12, 24]);
  const r = pick([2, 4]);
  const req = r / 2;
  const I = pick([1, 2, 3]);
  const R = round2(emf / I - req);
  if (R <= 0) return sourcesParallel();
  const cfg: MultiSourceConfig = {
    arrangement: "parallel",
    e1: emf,
    e2: emf,
    r1: r,
    r2: r,
    load: R,
    mask: "current",
  };
  const sol = solveMultiSource(cfg);
  return buildMS(
    [
      { label: "EMF (each cell)", value: emf, unit: "V" },
      { label: "Internal r (cell 1)", value: r, unit: "Ω" },
      { label: "Internal r (cell 2)", value: r, unit: "Ω" },
      { label: "Load resistance", value: R, unit: "Ω" },
    ],
    "current",
    sol.current,
    "A",
    [
      "Identical parallel cells keep the same EMF but their internal resistances combine in parallel.",
      `r_eq = (${r} × ${r}) / (${r} + ${r}) = ${req} Ω.`,
      `Total resistance = r_eq + R = ${req} + ${R} = ${round2(sol.totalResistance)} Ω.`,
      `I = ε / R_total = ${emf} / ${round2(sol.totalResistance)} = ${round2(sol.current)} A.`,
    ],
    `Two identical ${emf} V cells, each with ${r} Ω internal resistance, are in parallel driving a ${R} Ω load. What current flows through the load?`,
    cfg
  );
}

function genSources(d: Difficulty): Built {
  if (d <= 1) return sourcesSingleCurrent(d);
  if (d === 2) return Math.random() < 0.5 ? sourcesSingleCurrent(d) : sourcesSingleTerminal(d);
  if (d === 3) return Math.random() < 0.5 ? sourcesSeriesAiding(d) : sourcesSingleTerminal(d);
  if (d === 4) return pick([sourcesOpposing, sourcesParallel, () => sourcesSeriesAiding(d)])();
  // d === 5: full KVL synthesis with internal resistance.
  return pick([() => sourcesSeriesAiding(d, true), sourcesOpposing, sourcesParallel])();
}

const GENERATORS: Record<PracticeTopic, (d: Difficulty) => Built> = {
  ohms: genOhms,
  series: genSeries,
  parallel: genParallel,
  equivalent: genEquivalent,
  power: genPower,
  sources: genSources,
  mixed: (d) => {
    const topics: PracticeTopic[] = ["ohms", "series", "parallel", "power"];
    if (d >= 3) topics.push("equivalent", "sources");
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
  // Never exceed a topic's covered ceiling, so practice can't quiz an untaught
  // concept (e.g. Ohm's-law practice never jumps to a full network).
  const level = Math.min(difficulty, maxLevelForTopic(topic)) as Difficulty;

  // Levels 6-8 push the network-ready topics into genuinely larger circuits.
  // Power & Mixed have covered everything up to power, so their complex circuits
  // may also ask for power; Equivalent uses its own (power-free) generator.
  const useNetwork = level >= 6 && (topic === "power" || topic === "mixed");
  const built = useNetwork ? genEquivalent(level, true) : GENERATORS[topic](level);
  const titleTopic = useNetwork ? "Complex Circuit" : TOPIC_LABEL[topic];
  return {
    id: uid(topic),
    topic,
    difficulty: level,
    title: `${titleTopic} · Level ${level}`,
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
