import type { Lesson } from "@/lib/types";

export const lesson2: Lesson = {
  id: "lesson-2",
  title: "Series Circuits",
  order: 2,
  description:
    "Learn how current and resistance behave when components are connected in series.",
  masteryThreshold: 1,
  steps: [
    {
      id: "l2-s0",
      type: "concept",
      title: "What 'In Series' Means",
      prompt: "First, what does it mean for components to be connected in series?",
      interaction: {
        kind: "concept",
        sections: [
          {
            heading: "One single path",
            body: "In a series circuit, components are connected end-to-end so there is only one path for current. The exact same current flows through every component, one after another.",
          },
          {
            heading: "Resistances stack up",
            body: "Because the charge has to pass through each resistor in turn, their resistances add together. Two resistors in series oppose the flow more than either one alone.",
          },
        ],
        formula: {
          expression: "R_total = R₁ + R₂ + …",
          caption: "Series resistances simply add",
        },
        analogy: {
          title: "A single-lane road",
          body: "Cars (the current) travel one road with several toll booths (resistors) in a row. Every car passes through every booth, and each booth slows everyone down a little more.",
        },
        visual: { mode: "series", voltage: 12, r1: 3, r2: 3 },
        keyPoints: [
          "Series = one path, with the same current everywhere.",
          "Add the resistances to get the total.",
          "More resistors in series means less current.",
        ],
        continueLabel: "Explore Series",
      },
      feedback: { correct: "", incorrect: "" },
    },
    {
      id: "l2-s1",
      type: "prediction",
      title: "Series Prediction",
      prompt:
        "You add a second resistor in series to a circuit. What happens to the total current?",
      interaction: {
        kind: "mcq",
        options: ["Increases", "Decreases", "Stays the same"],
        correctIndex: 1,
      },
      feedback: {
        correct:
          "Adding resistance in series increases total R, so current decreases (I = V / R_total).",
        incorrect:
          "Think about it: more opposition in the same path means less flow.",
      },
    },
    {
      id: "l2-s2",
      type: "manipulate",
      title: "Explore Series",
      prompt:
        "Adjust both resistors and watch total resistance and current update.",
      interaction: {
        kind: "series-sliders",
        fixedVoltage: 12,
        r1Range: [1, 10],
        r2Range: [1, 10],
        initialR1: 3,
        initialR2: 3,
        observeOnly: true,
      },
      feedback: {
        correct:
          "In series, total resistance is R₁ + R₂. More total R means less current.",
        incorrect: "",
      },
    },
    {
      id: "l2-s3",
      type: "discover",
      title: "Series Formula",
      prompt: "How do you find total resistance in a series circuit?",
      interaction: {
        kind: "mcq",
        options: [
          "R_total = R₁ × R₂",
          "R_total = R₁ + R₂",
          "R_total = 1/R₁ + 1/R₂",
        ],
        correctIndex: 1,
      },
      feedback: {
        correct: "In series, resistances add: R_total = R₁ + R₂ + …",
        incorrect: "Series means one path — resistances stack up.",
      },
    },
    {
      id: "l2-s4",
      type: "challenge",
      title: "Build 2A Series Circuit",
      prompt:
        "With a fixed 12V battery, configure R₁ and R₂ so total current is 2A (±0.1A).",
      interaction: {
        kind: "circuit-config",
        mode: "series",
        fixedVoltage: 12,
        targetCurrent: 2,
        tolerance: 0.1,
      },
      feedback: {
        correct: "R_total must be 6Ω (12V ÷ 2A). Nice work!",
        incorrect: "I = V / R_total. For 2A at 12V, what should R_total be?",
        hint: "R_total = V / I = 12 / 2 = 6Ω.",
      },
    },
    {
      id: "l2-s5",
      type: "challenge",
      title: "Plot: Current vs Voltage",
      prompt:
        "With resistance fixed at 6Ω, plot how the current responds to voltage yourself.",
      interaction: {
        kind: "graph",
        graphType: "current-vs-voltage",
        fixedResistance: 6,
        questionType: "plot",
        plotXs: [0, 6, 12, 18],
        scenario: "Tap the graph to plot the current (I = V / R) at each marked voltage.",
      },
      feedback: {
        correct: "A straight line through the origin — current rises 1A for every 6V (I = V/R).",
        incorrect: "For each voltage, compute I = V / 6 and place the point at that height.",
        hint: "0V → 0A, 6V → 1A, 12V → 2A, 18V → 3A.",
      },
    },
    {
      id: "l2-s6",
      type: "challenge",
      title: "Series Calculation",
      prompt:
        "Two resistors in series: R₁ = 3Ω and R₂ = 5Ω, powered by 12V. Calculate the total current.",
      interaction: {
        kind: "numeric-calc",
        givens: [
          { label: "Voltage", value: 12, unit: "V" },
          { label: "R₁", value: 3, unit: "Ω" },
          { label: "R₂", value: 5, unit: "Ω" },
        ],
        solveFor: "current",
        correctAnswer: 1.5,
        tolerance: 0.1,
        answerUnit: "A",
        circuitPreview: { mode: "series", voltage: 12, r1: 3, r2: 5 },
      },
      feedback: {
        correct: "R_total = 8Ω, I = 12/8 = 1.5A. Same current everywhere in series.",
        incorrect: "Add resistances first, then I = V / R_total.",
        hint: "R_total = 3 + 5 = 8Ω.",
      },
    },
    {
      id: "l2-s7",
      type: "challenge",
      title: "Design the Missing Resistor",
      prompt:
        "A 24V battery must push exactly 2A through three resistors in series. Two of them are 4Ω and 5Ω. What must the third resistor be? (Ω)",
      interaction: {
        kind: "numeric-calc",
        givens: [
          { label: "Voltage", value: 24, unit: "V" },
          { label: "Target current", value: 2, unit: "A" },
          { label: "R₁", value: 4, unit: "Ω" },
          { label: "R₂", value: 5, unit: "Ω" },
        ],
        solveFor: "resistance",
        correctAnswer: 3,
        tolerance: 0.1,
        answerUnit: "Ω",
      },
      feedback: {
        correct: "R_total = 24 / 2 = 12Ω. Subtract the known resistors: 12 − 4 − 5 = 3Ω.",
        incorrect: "Find the required R_total = V / I first, then subtract the two known resistors.",
        hint: "R_total must be 12Ω; you already have 4 + 5 = 9Ω.",
      },
    },
    {
      id: "l2-s8",
      type: "mastery",
      title: "Series Mastery",
      prompt: "Prove you understand series circuits.",
      interaction: {
        kind: "mastery",
        questions: [
          {
            id: "l2-m1",
            prompt: "Two 4Ω resistors in series have total resistance:",
            kind: "numeric",
            correctAnswer: 8,
            tolerance: 0.1,
          },
          {
            id: "l2-m2",
            prompt: "In a series circuit, current through each component is:",
            kind: "mcq",
            options: ["Different in each", "The same everywhere", "Zero"],
            correctIndex: 1,
          },
          {
            id: "l2-m3",
            prompt: "12V, R₁=2Ω, R₂=4Ω in series. Total current (A)?",
            kind: "numeric",
            correctAnswer: 2,
            tolerance: 0.1,
          },
        ],
      },
      feedback: {
        correct: "Series circuits mastered!",
        incorrect: "Review series rules and try again.",
      },
    },
  ],
};
