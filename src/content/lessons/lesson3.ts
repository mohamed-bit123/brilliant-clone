import type { Lesson } from "@/lib/types";

export const lesson3: Lesson = {
  id: "lesson-3",
  title: "Parallel Circuits",
  order: 3,
  description:
    "Understand how current splits across branches and voltage stays shared.",
  masteryThreshold: 1,
  steps: [
    {
      id: "l3-s0",
      type: "concept",
      title: "What 'In Parallel' Means",
      prompt: "Parallel circuits behave very differently from series ones. Here's the idea.",
      interaction: {
        kind: "concept",
        sections: [
          {
            heading: "Multiple branches",
            body: "In a parallel circuit, components connect across the same two points, creating separate branches. Current reaches a junction and splits, with some flowing down each branch before rejoining.",
          },
          {
            heading: "Voltage is shared, current splits",
            body: "Every parallel branch feels the full battery voltage. The branch with less resistance draws more current, because charge prefers the easier path.",
          },
        ],
        formula: {
          expression: "1 / R_total = 1/R₁ + 1/R₂",
          caption: "Total resistance is always smaller than the smallest branch",
        },
        analogy: {
          title: "Checkout lines at a store",
          body: "Shoppers (the current) split across several open registers (branches). A faster register (lower resistance) handles more shoppers, and adding registers lets more people through overall.",
        },
        visual: { mode: "parallel", voltage: 12, r1: 4, r2: 8 },
        keyPoints: [
          "Parallel = multiple branches sharing the same voltage.",
          "Current splits; lower-resistance branches carry more.",
          "Adding branches lowers total resistance and raises total current.",
        ],
        continueLabel: "Explore Parallel",
      },
      feedback: { correct: "", incorrect: "" },
    },
    {
      id: "l3-s1",
      type: "prediction",
      title: "Parallel Prediction",
      prompt:
        "Two branches in parallel: Branch A has 2Ω, Branch B has 8Ω. Which branch gets more current?",
      interaction: {
        kind: "mcq",
        options: ["Branch A (2Ω)", "Branch B (8Ω)", "Equal current"],
        correctIndex: 0,
        circuitPreview: {
          mode: "parallel",
          voltage: 12,
          r1: 2,
          r2: 8,
        },
      },
      feedback: {
        correct:
          "Lower resistance draws more current — electrons take the easier path.",
        incorrect:
          "Same voltage across both branches, but less resistance means more current.",
      },
    },
    {
      id: "l3-s2",
      type: "manipulate",
      title: "Explore Parallel",
      prompt: "Adjust branch resistances and watch current split at the junction.",
      interaction: {
        kind: "parallel-sliders",
        fixedVoltage: 12,
        r1Range: [1, 15],
        r2Range: [1, 15],
        initialR1: 4,
        initialR2: 8,
        observeOnly: true,
      },
      feedback: {
        correct:
          "Voltage is the same across parallel branches, but current splits inversely with resistance.",
        incorrect: "",
      },
    },
    {
      id: "l3-s3",
      type: "discover",
      title: "Parallel Formula",
      prompt: "What is the formula for two resistors in parallel?",
      interaction: {
        kind: "mcq",
        options: [
          "R_total = R₁ + R₂",
          "1/R_total = 1/R₁ + 1/R₂",
          "R_total = R₁ × R₂",
        ],
        correctIndex: 1,
      },
      feedback: {
        correct:
          "Parallel resistance: 1/R_total = 1/R₁ + 1/R₂. Total R is always less than the smallest branch.",
        incorrect: "Parallel adds conductance (1/R), not resistance directly.",
      },
    },
    {
      id: "l3-s4",
      type: "challenge",
      title: "4A Parallel Circuit",
      prompt:
        "Configure two parallel branches so total current is 4A (±0.1A) with a 12V battery.",
      interaction: {
        kind: "circuit-config",
        mode: "parallel",
        fixedVoltage: 12,
        targetCurrent: 4,
        tolerance: 0.1,
      },
      feedback: {
        correct: "R_total = 3Ω for 4A at 12V. Well done!",
        incorrect: "Find R_total = V/I first, then set branch values.",
        hint: "R_total = 12/4 = 3Ω. Try R₁=6Ω, R₂=6Ω.",
      },
    },
    {
      id: "l3-s5",
      type: "challenge",
      title: "Branch Current",
      prompt:
        "In a parallel circuit, V = 12V across both branches. R₁ = 4Ω (Branch A). Calculate the current through Branch A only.",
      interaction: {
        kind: "numeric-calc",
        givens: [
          { label: "Voltage", value: 12, unit: "V" },
          { label: "R₁ (Branch A)", value: 4, unit: "Ω" },
        ],
        solveFor: "branchCurrent",
        branchIndex: 1,
        correctAnswer: 3,
        tolerance: 0.1,
        answerUnit: "A",
        circuitPreview: { mode: "parallel", voltage: 12, r1: 4, r2: 12 },
      },
      feedback: {
        correct: "Branch A: I₁ = V / R₁ = 12 / 4 = 3A.",
        incorrect: "Each branch has full voltage. Use I = V / R for that branch only.",
        hint: "Don't use total resistance — just Branch A.",
      },
    },
    {
      id: "l3-s6",
      type: "challenge",
      title: "Parallel Graph",
      prompt:
        "At fixed 12V, total parallel current vs. total equivalent resistance follows the same inverse pattern. Read the graph.",
      interaction: {
        kind: "graph",
        graphType: "current-vs-resistance",
        fixedVoltage: 12,
        questionType: "mcq",
        scenario: "Total equivalent resistance drops from 6Ω to 3Ω.",
        options: [
          "Total current decreases",
          "Total current doubles",
          "Total current stays the same",
        ],
        correctIndex: 1,
      },
      feedback: {
        correct: "Lower R_total means more total current: I = V / R_total.",
        incorrect: "At 6Ω, I = 2A. At 3Ω, I = 4A on the graph.",
        hint: "Same inverse curve as a single resistor — it's still Ohm's Law.",
      },
    },
    {
      id: "l3-s7",
      type: "challenge",
      title: "Find the Missing Branch",
      prompt:
        "A 12V parallel circuit draws 5A total. Branch A has 4Ω. What is Branch B's resistance? (Ω)",
      interaction: {
        kind: "numeric-calc",
        givens: [
          { label: "Voltage", value: 12, unit: "V" },
          { label: "Total current", value: 5, unit: "A" },
          { label: "Branch A", value: 4, unit: "Ω" },
        ],
        solveFor: "resistance",
        correctAnswer: 6,
        tolerance: 0.1,
        answerUnit: "Ω",
      },
      feedback: {
        correct: "I_A = 12 / 4 = 3A, so I_B = 5 − 3 = 2A. R_B = 12 / 2 = 6Ω.",
        incorrect: "Find Branch A's current, subtract from the total to get Branch B's current, then R = V / I.",
        hint: "I_A = 3A → I_B = 2A → R_B = 12 / 2.",
      },
    },
    {
      id: "l3-s8",
      type: "mastery",
      title: "Parallel Mastery",
      prompt: "Prove you understand parallel circuits.",
      interaction: {
        kind: "mastery",
        questions: [
          {
            id: "l3-m1",
            prompt: "Two 6Ω resistors in parallel: R_total (Ω)?",
            kind: "numeric",
            correctAnswer: 3,
            tolerance: 0.1,
          },
          {
            id: "l3-m2",
            prompt: "In parallel, voltage across each branch is:",
            kind: "mcq",
            options: ["Different", "The same", "Zero"],
            correctIndex: 1,
          },
          {
            id: "l3-m3",
            prompt: "12V, 4Ω and 12Ω in parallel. Total current (A)?",
            kind: "numeric",
            correctAnswer: 4,
            tolerance: 0.1,
          },
        ],
      },
      feedback: {
        correct: "Parallel circuits mastered!",
        incorrect: "Review parallel rules and try again.",
      },
    },
  ],
};
