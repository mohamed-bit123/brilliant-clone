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

export type InteractionConfig =
  | {
      kind: "concept";
      sections: { heading: string; body: string }[];
      analogy?: { title: string; body: string };
      formula?: { expression: string; caption?: string };
      visual?: CircuitPreview;
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
    }
  | {
      kind: "graph";
      graphType: "current-vs-resistance" | "current-vs-voltage" | "power-vs-voltage";
      fixedVoltage?: number;
      fixedResistance?: number;
      questionType: "mcq" | "numeric";
      options?: string[];
      correctIndex?: number;
      correctAnswer?: number;
      tolerance?: number;
      scenario?: string;
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
