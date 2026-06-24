import {
  computeCurrent,
  computePower,
  parallelResistance,
  seriesResistance,
  type InteractionConfig,
} from "@/lib/types";

type SimpleTarget = {
  current?: number;
  power?: number;
  tolerance?: number;
};

function simpleCircuitMatches(
  voltage: number,
  resistance: number,
  target: SimpleTarget
): boolean {
  const tol = target.tolerance ?? 0.1;
  const current = computeCurrent(voltage, resistance);
  const power = computePower(voltage, current);

  if (target.current !== undefined && Math.abs(current - target.current) <= tol) {
    return true;
  }
  if (target.power !== undefined && Math.abs(power - target.power) <= tol) {
    return true;
  }
  return false;
}

/** Pick voltage/resistance that do not already satisfy a current or power target. */
export function pickNonMatchingSimpleCircuit(
  target: SimpleTarget,
  options: {
    fixedVoltage?: number;
    initialVoltage?: number;
    initialResistance?: number;
    voltageMin?: number;
    voltageMax?: number;
    resistanceMin?: number;
    resistanceMax?: number;
  } = {}
): { voltage: number; resistance: number } {
  const tol = target.tolerance ?? 0.1;
  const vMin = options.voltageMin ?? 1;
  const vMax = options.voltageMax ?? 24;
  const rMin = options.resistanceMin ?? 1;
  const rMax = options.resistanceMax ?? 30;
  const fixedV = options.fixedVoltage;

  const candidates: { voltage: number; resistance: number }[] = [];

  if (options.initialVoltage !== undefined && options.initialResistance !== undefined) {
    candidates.push({
      voltage: fixedV ?? options.initialVoltage,
      resistance: options.initialResistance,
    });
  }

  const voltages = fixedV ? [fixedV] : [6, 9, 12, 15, 18, 21];
  const resistances = [2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 24];

  for (const voltage of voltages) {
    for (const resistance of resistances) {
      if (resistance < rMin || resistance > rMax) continue;
      if (!fixedV && (voltage < vMin || voltage > vMax)) continue;
      candidates.push({ voltage: fixedV ?? voltage, resistance });
    }
  }

  for (const { voltage, resistance } of candidates) {
    if (!simpleCircuitMatches(voltage, resistance, { ...target, tolerance: tol })) {
      return { voltage, resistance };
    }
  }

  return { voltage: fixedV ?? 12, resistance: 5 };
}

export function pickNonMatchingCircuitConfig(
  interaction: Extract<InteractionConfig, { kind: "circuit-config" }>
): { r1: number; r2: number } {
  const tol = interaction.tolerance ?? 0.1;
  const v = interaction.fixedVoltage;

  const candidates: { r1: number; r2: number }[] = [];
  if (interaction.initialR1 !== undefined && interaction.initialR2 !== undefined) {
    candidates.push({ r1: interaction.initialR1, r2: interaction.initialR2 });
  }

  for (let r1 = 2; r1 <= 16; r1 += 1) {
    for (let r2 = 2; r2 <= 16; r2 += 1) {
      candidates.push({ r1, r2 });
    }
  }

  for (const { r1, r2 } of candidates) {
    const totalR =
      interaction.mode === "series"
        ? seriesResistance(r1, r2)
        : parallelResistance(r1, r2);
    const current = computeCurrent(v, totalR);
    const power = computePower(v, current);

    let matches = false;
    if (interaction.targetCurrent !== undefined) {
      matches = Math.abs(current - interaction.targetCurrent) <= tol;
    } else if (interaction.targetResistance !== undefined) {
      matches = Math.abs(totalR - interaction.targetResistance) <= (interaction.tolerance ?? 0.2);
    } else if (interaction.targetPower !== undefined) {
      matches = Math.abs(power - interaction.targetPower) <= (interaction.tolerance ?? 0.3);
    }

    if (!matches) {
      return { r1, r2 };
    }
  }

  return { r1: 6, r2: 8 };
}

type DualSliderInteraction = Extract<InteractionConfig, { kind: "dual-slider" }>;

function constraintsAllPass(
  interaction: DualSliderInteraction,
  voltage: number,
  resistance: number
): boolean {
  const c = interaction.constraints;
  if (!c) return false;

  const current = computeCurrent(voltage, resistance);
  const power = computePower(voltage, current);

  const voltageOk =
    (c.voltageMin === undefined || voltage >= c.voltageMin) &&
    (c.voltageMax === undefined || voltage <= c.voltageMax);
  const currentOk =
    (c.currentMin === undefined || current >= c.currentMin) &&
    (c.currentMax === undefined || current <= c.currentMax);
  const resistanceOk =
    (c.resistanceMin === undefined || resistance >= c.resistanceMin) &&
    (c.resistanceMax === undefined || resistance <= c.resistanceMax);
  const powerOk = c.powerMax === undefined || power <= c.powerMax;

  return voltageOk && currentOk && resistanceOk && powerOk;
}

export function pickNonMatchingDualSlider(
  interaction: DualSliderInteraction
): { voltage: number; resistance: number } {
  if (interaction.constraints) {
    const vMin = interaction.voltageMin ?? 1;
    const vMax = interaction.voltageMax ?? 24;
    const rMin = interaction.resistanceMin ?? 1;
    const rMax = interaction.resistanceMax ?? 30;
    const step = interaction.sliderStep ?? 0.5;

    const candidates: { voltage: number; resistance: number }[] = [];
    if (interaction.initialVoltage !== undefined && interaction.initialResistance !== undefined) {
      candidates.push({
        voltage: interaction.initialVoltage,
        resistance: interaction.initialResistance,
      });
    }

    for (let v = vMin; v <= vMax; v += step) {
      for (let r = rMin; r <= rMax; r += step) {
        candidates.push({ voltage: Math.round(v * 10) / 10, resistance: Math.round(r * 10) / 10 });
      }
    }

    for (const { voltage, resistance } of candidates) {
      if (!constraintsAllPass(interaction, voltage, resistance)) {
        return { voltage, resistance };
      }
    }

    return { voltage: interaction.initialVoltage ?? 9, resistance: interaction.initialResistance ?? 4 };
  }

  return pickNonMatchingSimpleCircuit(
    {
      current: interaction.targetCurrent,
      power: interaction.targetPower,
      tolerance: interaction.tolerance,
    },
    {
      fixedVoltage: interaction.fixedVoltage,
      initialVoltage: interaction.initialVoltage,
      initialResistance: interaction.initialResistance,
      voltageMin: interaction.voltageMin,
      voltageMax: interaction.voltageMax,
      resistanceMin: interaction.resistanceMin,
      resistanceMax: interaction.resistanceMax,
    }
  );
}
