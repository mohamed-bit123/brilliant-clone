import type { Lesson } from "@/lib/types";

export const lesson4: Lesson = {
  id: "lesson-4",
  title: "Equivalent Resistance",
  order: 4,
  description: "Combine series and parallel rules to simplify mixed circuits.",
  masteryThreshold: 1,
  steps: [
    {
      id: "l4-s0",
      type: "concept",
      title: "Combining the Rules",
      prompt: "Real circuits mix series and parallel. Here's how to tame them.",
      interaction: {
        kind: "concept",
        sections: [
          {
            heading: "Real circuits mix both",
            body: "Most circuits combine series and parallel sections. To analyze them, you replace a group of resistors with a single 'equivalent resistance' (R_eq) that behaves exactly the same way.",
          },
          {
            heading: "Simplify from the inside out",
            body: "Find the smallest series or parallel group you can combine, replace it with one resistor, and repeat. Keep going until the whole circuit is a single equivalent resistance — then Ohm's Law applies to the whole thing.",
          },
        ],
        formula: {
          expression: "Series: add   ·   Parallel: 1/R_total = Σ 1/Rᵢ",
          caption: "Pick the right rule for each group you combine",
        },
        visual: { mode: "series", voltage: 12, r1: 2, r2: 4 },
        keyPoints: [
          "Combine one group at a time, working inside out.",
          "Series groups add; parallel groups use the reciprocal rule.",
          "Once you have a single R_eq, use I = V / R_eq.",
        ],
        continueLabel: "Start Simplifying",
      },
      feedback: { correct: "", incorrect: "" },
    },
    {
      id: "l4-s1",
      type: "prediction",
      title: "Mixed Circuit",
      prompt:
        "A circuit has R₁=2Ω and R₂=2Ω in series, then R₃=4Ω in parallel with that pair. Is R_total more or less than 4Ω?",
      interaction: {
        kind: "mcq",
        options: ["More than 4Ω", "Less than 4Ω", "Exactly 4Ω"],
        correctIndex: 1,
      },
      feedback: {
        correct:
          "Series pair = 4Ω. Parallel with another 4Ω gives 2Ω — parallel always reduces total R.",
        incorrect:
          "First combine the series pair (2+2=4Ω), then parallel with 4Ω: (4×4)/(4+4)=2Ω.",
      },
    },
    {
      id: "l4-s2",
      type: "manipulate",
      title: "Simplify Step by Step",
      prompt:
        "Adjust R₁, R₂ (series) and R₃ (parallel branch). Watch R_eq update live.",
      interaction: {
        kind: "parallel-sliders",
        fixedVoltage: 12,
        r1Range: [1, 8],
        r2Range: [1, 8],
        initialR1: 2,
        initialR2: 2,
        observeOnly: true,
      },
      feedback: {
        correct:
          "Mixed circuits simplify to one R_eq, then Ohm's Law applies: I = V / R_eq.",
        incorrect: "",
      },
    },
    {
      id: "l4-s3",
      type: "discover",
      title: "Simplification Order",
      prompt: "When simplifying a mixed circuit, what do you do first?",
      interaction: {
        kind: "mcq",
        options: [
          "Combine parallel groups first always",
          "Combine series groups first always",
          "Combine the innermost/simplest group first",
        ],
        correctIndex: 2,
      },
      feedback: {
        correct:
          "Work from the inside out — simplify series or parallel groups one at a time until one R_eq remains.",
        incorrect: "Start with the smallest group you can combine.",
      },
    },
    {
      id: "l4-s4",
      type: "challenge",
      title: "Hit 2A Total",
      prompt:
        "Configure a parallel circuit (12V) so total current is 2A (±0.1A). R_total must equal 6Ω.",
      interaction: {
        kind: "circuit-config",
        mode: "parallel",
        fixedVoltage: 12,
        targetCurrent: 2,
        tolerance: 0.1,
      },
      feedback: {
        correct: "R_eq = 6Ω confirmed. You can simplify any circuit this way.",
        incorrect: "R_eq = V / I = 12 / 2 = 6Ω.",
        hint: "Set branch resistances so 1/R₁ + 1/R₂ = 1/6.",
      },
    },
    {
      id: "l4-s5",
      type: "challenge",
      title: "Find Equivalent R",
      prompt:
        "Calculate the equivalent resistance: R₁ = 2Ω and R₂ = 4Ω in series, with a 12V source. What is R_total?",
      interaction: {
        kind: "numeric-calc",
        givens: [
          { label: "R₁", value: 2, unit: "Ω" },
          { label: "R₂", value: 4, unit: "Ω" },
        ],
        solveFor: "rTotal",
        correctAnswer: 6,
        tolerance: 0.1,
        answerUnit: "Ω",
        circuitPreview: { mode: "series", voltage: 12, r1: 2, r2: 4 },
      },
      feedback: {
        correct: "Series: R_total = 2 + 4 = 6Ω.",
        incorrect: "In series, resistances add directly.",
        hint: "R_total = R₁ + R₂.",
      },
    },
    {
      id: "l4-s6",
      type: "challenge",
      title: "Simplify & Calculate",
      prompt:
        "Two 3Ω resistors are in series, then that pair is in parallel with a 6Ω resistor. The battery is 12V. Calculate total current.",
      interaction: {
        kind: "numeric-calc",
        givens: [
          { label: "Voltage", value: 12, unit: "V" },
          { label: "Series pair", value: 6, unit: "Ω (3+3)" },
          { label: "Parallel branch", value: 6, unit: "Ω" },
        ],
        solveFor: "current",
        correctAnswer: 4,
        tolerance: 0.1,
        answerUnit: "A",
      },
      feedback: {
        correct: "R_eq = 3Ω (two 6Ω in parallel), I = 12/3 = 4A.",
        incorrect: "Combine the series pair first, then parallel with 6Ω, then I = V/R_eq.",
        hint: "Two 6Ω in parallel → R_eq = 3Ω.",
      },
    },
    {
      id: "l4-s7",
      type: "challenge",
      title: "Mixed Network Capstone",
      prompt:
        "R₁ = 6Ω and R₂ = 3Ω are in parallel. That group is in series with R₃ = 4Ω. With a 12V battery, find the total current. (A)",
      interaction: {
        kind: "numeric-calc",
        givens: [
          { label: "Voltage", value: 12, unit: "V" },
          { label: "R₁ (parallel)", value: 6, unit: "Ω" },
          { label: "R₂ (parallel)", value: 3, unit: "Ω" },
          { label: "R₃ (series)", value: 4, unit: "Ω" },
        ],
        solveFor: "current",
        correctAnswer: 2,
        tolerance: 0.1,
        answerUnit: "A",
      },
      feedback: {
        correct: "6 ∥ 3 = 2Ω; add the series 4Ω → R_eq = 6Ω; I = 12 / 6 = 2A.",
        incorrect: "Combine the parallel pair first, add the series resistor, then I = V / R_eq.",
        hint: "6 ∥ 3 = 2Ω, then + 4Ω = 6Ω.",
      },
    },
    {
      id: "l4-s8",
      type: "mastery",
      title: "Equivalent Resistance Mastery",
      prompt: "Simplify and calculate.",
      interaction: {
        kind: "mastery",
        questions: [
          {
            id: "l4-m1",
            prompt: "After finding R_eq, you apply:",
            kind: "mcq",
            options: ["P = I × V only", "Ohm's Law I = V/R_eq", "Skip to power"],
            correctIndex: 1,
          },
          {
            id: "l4-m2",
            prompt: "12V, R_eq = 4Ω. Total current (A)?",
            kind: "numeric",
            correctAnswer: 3,
            tolerance: 0.1,
          },
          {
            id: "l4-m3",
            prompt: "3Ω and 3Ω in series, then parallel with 6Ω. R_eq (Ω)?",
            kind: "numeric",
            correctAnswer: 3,
            tolerance: 0.1,
          },
        ],
      },
      feedback: {
        correct: "Equivalent resistance mastered!",
        incorrect: "Review simplification steps and try again.",
      },
    },
  ],
};
