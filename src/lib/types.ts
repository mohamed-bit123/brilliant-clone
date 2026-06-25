export type StepType =
  | "concept"
  | "prediction"
  | "manipulate"
  | "discover"
  | "challenge"
  | "mastery";

export type MasteryQuestion = {
  id: string;
  prompt: string;
  kind: "mcq" | "numeric" | "config";
  options?: string[];
  correctIndex?: number;
  correctAnswer?: number | string;
  tolerance?: number;
  configTarget?: { current?: number; resistance?: number; power?: number };
};

export type CircuitPreview = {
  mode: "simple" | "series" | "parallel";
  voltage: number;
  resistance?: number;
  r1?: number;
  r2?: number;
};

export type SourceArrangement =
  | "single"
  | "series-aiding"
  | "series-opposing"
  | "parallel";

/**
 * A small multi-source network: one or two EMF sources (each with optional
 * internal resistance) driving a single external load. Used by the
 * "Multiple Voltage Sources" lesson and its practice generator.
 */
export type MultiSourceConfig = {
  arrangement: SourceArrangement;
  /** EMF of source 1 (volts). */
  e1: number;
  /** EMF of source 2 (volts); ignored for "single". */
  e2?: number;
  /** Internal resistance of source 1 (ohms). */
  r1?: number;
  /** Internal resistance of source 2 (ohms). */
  r2?: number;
  /** External load resistance (ohms). Omit for an open-circuit (no current). */
  load?: number;
  /** Hide a value the learner is solving for so the diagram can't reveal it. */
  mask?: "current" | "netEmf" | "terminal";
};

export type InteractionConfig =
  | {
      kind: "concept";
      sections: { heading: string; body: string }[];
      analogy?: { title: string; body: string };
      formula?: { expression: string; caption?: string };
      visual?: CircuitPreview;
      multiSource?: MultiSourceConfig;
      keyPoints?: string[];
      continueLabel?: string;
    }
  | {
      kind: "mcq";
      options: string[];
      correctIndex: number;
      circuitPreview?: CircuitPreview;
    }
  | {
      kind: "slider";
      param: "voltage" | "resistance";
      min: number;
      max: number;
      initial?: number;
      fixedVoltage?: number;
      fixedResistance?: number;
      observeOnly?: boolean;
    }
  | {
      kind: "dual-slider";
      targetCurrent?: number;
      targetPower?: number;
      tolerance?: number;
      fixedVoltage?: number;
      initialVoltage?: number;
      initialResistance?: number;
      observeOnly?: boolean;
      sliderStep?: number;
      voltageMin?: number;
      voltageMax?: number;
      resistanceMin?: number;
      resistanceMax?: number;
      constraints?: {
        voltageMin?: number;
        voltageMax?: number;
        currentMin?: number;
        currentMax?: number;
        resistanceMin?: number;
        resistanceMax?: number;
        powerMax?: number;
      };
    }
  | {
      kind: "drag-drop";
      options: string[];
      correctValue: string;
      batteryVoltage: number;
      targetCurrent: number;
    }
  | {
      kind: "discover-table";
      rows: { voltage: number; resistance: number; current: number }[];
      options: string[];
      correctIndex: number;
    }
  | {
      kind: "series-sliders";
      fixedVoltage: number;
      r1Range: [number, number];
      r2Range: [number, number];
      initialR1?: number;
      initialR2?: number;
      observeOnly?: boolean;
    }
  | {
      kind: "parallel-sliders";
      fixedVoltage: number;
      r1Range: [number, number];
      r2Range: [number, number];
      initialR1?: number;
      initialR2?: number;
      observeOnly?: boolean;
    }
  | {
      kind: "tap-label";
      nodes: { id: string; label: string; x: number; y: number }[];
      correctIds: string[];
      maxSelections?: number;
    }
  | {
      kind: "match-pairs";
      items: { id: string; left: string }[];
      options: { id: string; right: string }[];
      correctPairs: Record<string, string>;
    }
  | {
      kind: "circuit-config";
      mode: "series" | "parallel" | "simple";
      fixedVoltage: number;
      targetCurrent?: number;
      targetResistance?: number;
      targetPower?: number;
      tolerance?: number;
      initialR1?: number;
      initialR2?: number;
    }
  | { kind: "mastery"; questions: MasteryQuestion[] }
  | {
      kind: "numeric-calc";
      givens: { label: string; value: number; unit: string }[];
      solveFor: "current" | "voltage" | "resistance" | "power" | "rTotal" | "branchCurrent";
      branchIndex?: 1 | 2;
      correctAnswer: number;
      tolerance?: number;
      answerUnit: string;
      circuitPreview?: CircuitPreview;
      multiSourcePreview?: MultiSourceConfig;
    }
  | {
      kind: "graph";
      graphType: "current-vs-resistance" | "current-vs-voltage" | "power-vs-voltage";
      fixedVoltage?: number;
      fixedResistance?: number;
      questionType: "mcq" | "numeric" | "plot";
      options?: string[];
      correctIndex?: number;
      correctAnswer?: number;
      tolerance?: number;
      scenario?: string;
      /** x-values the learner must plot the matching y for (plot mode) */
      plotXs?: number[];
    };

export type StepFeedback = {
  correct: string;
  incorrect: string;
  hint?: string;
};

export type Step = {
  id: string;
  type: StepType;
  title: string;
  prompt: string;
  interaction: InteractionConfig;
  feedback: StepFeedback;
};

export type Lesson = {
  id: string;
  title: string;
  order: number;
  description: string;
  masteryThreshold: number;
  steps: Step[];
};

export type Course = {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
};

export type StepResult = {
  stepId: string;
  correct: boolean;
  attempts: number;
};

export type LessonProgress = {
  lessonId: string;
  currentStep: number;
  completed: boolean;
  masteryScore: number;
  stepResults: Record<string, StepResult>;
  completedStepIndices: number[];
};

export type UserProfile = {
  id: string;
  email: string;
  displayName: string;
};

export type StreakData = {
  currentStreak: number;
  lastActiveDate: string;
};

export type UserState = {
  profile: UserProfile;
  lessonProgress: Record<string, LessonProgress>;
  unlockedLessons: string[];
  streak: StreakData;
};

export type CircuitState = {
  voltage: number;
  resistance: number;
  r1?: number;
  r2?: number;
  mode: "simple" | "series" | "parallel";
};

export function computeCurrent(voltage: number, resistance: number): number {
  if (resistance <= 0) return 0;
  return voltage / resistance;
}

export function computePower(voltage: number, current: number): number {
  return voltage * current;
}

export function seriesResistance(r1: number, r2: number): number {
  return r1 + r2;
}

export function parallelResistance(r1: number, r2: number): number {
  if (r1 <= 0 || r2 <= 0) return 0;
  return (r1 * r2) / (r1 + r2);
}

export type MultiSourceSolution = {
  /** Net driving EMF around the loop (volts). */
  netEmf: number;
  /** Total resistance in the loop, internal + load (ohms). */
  totalResistance: number;
  /** Loop current (amps). 0 if there is no closed load. */
  current: number;
  /** Terminal voltage delivered to the load (volts). */
  terminalVoltage: number;
};

/**
 * Solve a one- or two-source single-loop network. The deterministic source of
 * truth for the "Multiple Voltage Sources" lesson and practice generator.
 *
 *   single / series-aiding : net EMF = ε₁ (+ ε₂)
 *   series-opposing        : net EMF = |ε₁ − ε₂|
 *   parallel (equal EMFs)  : net EMF = ε₁, internal r's combine in parallel
 */
export function solveMultiSource(config: MultiSourceConfig): MultiSourceSolution {
  const e1 = config.e1;
  const e2 = config.e2 ?? 0;
  const ri1 = config.r1 ?? 0;
  const ri2 = config.r2 ?? 0;
  const load = config.load ?? 0;

  let netEmf: number;
  let internal: number;

  switch (config.arrangement) {
    case "series-aiding":
      netEmf = e1 + e2;
      internal = ri1 + ri2;
      break;
    case "series-opposing":
      netEmf = Math.abs(e1 - e2);
      internal = ri1 + ri2;
      break;
    case "parallel":
      // Identical-EMF parallel cells: EMF unchanged, internal r's in parallel.
      netEmf = e1;
      internal = ri1 > 0 && ri2 > 0 ? parallelResistance(ri1, ri2) : ri1 || ri2;
      break;
    default:
      netEmf = e1;
      internal = ri1;
  }

  const totalResistance = internal + load;
  const current = totalResistance > 0 ? netEmf / totalResistance : 0;
  const terminalVoltage = current * load;

  return { netEmf, totalResistance, current, terminalVoltage };
}
