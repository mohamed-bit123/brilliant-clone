/**
 * Series-parallel resistor network engine.
 *
 * Represents any series-parallel network as a recursive tree and solves it
 * exactly: equivalent resistance plus the current, voltage, and power for every
 * individual resistor. This is the deterministic source of truth for the
 * "complex circuit" practice problems — the AI never authors these numbers.
 *
 * Scope: series-parallel topologies (which cover the vast majority of intro
 * circuits, including a parallel pair feeding a series resistor). Non-planar /
 * bridge networks that need mesh analysis are intentionally out of scope.
 */

export type ResistorNode = { kind: "resistor"; label: string; ohms: number };
export type SeriesNode = { kind: "series"; parts: NetworkNode[] };
export type ParallelNode = { kind: "parallel"; parts: NetworkNode[] };
export type NetworkNode = ResistorNode | SeriesNode | ParallelNode;

export type NetworkSpec = {
  /** Source EMF driving the whole network (volts). */
  voltage: number;
  root: NetworkNode;
};

export type ResistorReading = {
  label: string;
  ohms: number;
  current: number;
  voltage: number;
  power: number;
};

export type NetworkSolution = {
  equivalentResistance: number;
  totalCurrent: number;
  /** Per-resistor readings keyed by label. */
  readings: Record<string, ResistorReading>;
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Equivalent resistance of a (sub)network. */
export function equivalentResistance(node: NetworkNode): number {
  if (node.kind === "resistor") return node.ohms;
  if (node.kind === "series") {
    return node.parts.reduce((sum, p) => sum + equivalentResistance(p), 0);
  }
  // parallel
  const inv = node.parts.reduce((s, p) => s + 1 / equivalentResistance(p), 0);
  return inv > 0 ? 1 / inv : 0;
}

/** Distributes a voltage across a node, recording each resistor's readings. */
function distribute(
  node: NetworkNode,
  voltageAcross: number,
  out: Record<string, ResistorReading>
): void {
  if (node.kind === "resistor") {
    const current = node.ohms > 0 ? voltageAcross / node.ohms : 0;
    out[node.label] = {
      label: node.label,
      ohms: node.ohms,
      current,
      voltage: voltageAcross,
      power: voltageAcross * current,
    };
    return;
  }
  if (node.kind === "series") {
    const req = equivalentResistance(node);
    const current = req > 0 ? voltageAcross / req : 0;
    for (const part of node.parts) {
      distribute(part, current * equivalentResistance(part), out);
    }
    return;
  }
  // parallel: every branch sees the full voltage
  for (const part of node.parts) {
    distribute(part, voltageAcross, out);
  }
}

/** Full solve: equivalent resistance, total current, and every resistor reading. */
export function solveNetwork(spec: NetworkSpec): NetworkSolution {
  const req = equivalentResistance(spec.root);
  const readings: Record<string, ResistorReading> = {};
  distribute(spec.root, spec.voltage, readings);
  return {
    equivalentResistance: req,
    totalCurrent: req > 0 ? spec.voltage / req : 0,
    readings,
  };
}

/** A short human-readable description of the topology (for prompts). */
export function describeNetwork(node: NetworkNode): string {
  if (node.kind === "resistor") return `${node.label} (${node.ohms} Ω)`;
  const joined = node.parts.map(describeNetwork);
  if (node.kind === "series") {
    return joined.length === 2
      ? `${joined[0]} in series with ${joined[1]}`
      : `${joined.join(", then ")} in series`;
  }
  return joined.length === 2
    ? `${joined[0]} in parallel with ${joined[1]}`
    : `${joined.join(" and ")} all in parallel`;
}

/**
 * Worked reduction steps that collapse the tree to a single equivalent
 * resistance, naming each intermediate result. Returns the steps and the value.
 */
export function reductionSteps(node: NetworkNode): { value: number; expr: string; steps: string[] } {
  if (node.kind === "resistor") {
    return { value: node.ohms, expr: `${node.label}=${node.ohms} Ω`, steps: [] };
  }
  const children = node.parts.map(reductionSteps);
  const steps = children.flatMap((c) => c.steps);
  if (node.kind === "series") {
    const value = round2(children.reduce((s, c) => s + c.value, 0));
    steps.push(
      `Series: ${children.map((c) => `${c.value}`).join(" + ")} = ${value} Ω.`
    );
    return { value, expr: `${value} Ω`, steps };
  }
  const inv = children.reduce((s, c) => s + 1 / c.value, 0);
  const value = round2(inv > 0 ? 1 / inv : 0);
  steps.push(
    `Parallel: (${children.map((c) => `1/${c.value}`).join(" + ")})⁻¹ = ${value} Ω.`
  );
  return { value, expr: `${value} Ω`, steps };
}

/** Unicode subscript for resistor labels (R₁, R₂, …). */
export function subscriptLabel(base: string, i: number): string {
  const subs = "₀₁₂₃₄₅₆₇₈₉";
  return `${base}${String(i)
    .split("")
    .map((d) => subs[Number(d)])
    .join("")}`;
}
