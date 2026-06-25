import type { Lesson } from "@/lib/types";

export const lesson6: Lesson = {
  id: "lesson-6",
  title: "Circuit Challenge Lab",
  order: 7,
  description: "Apply everything you've learned in multi-step circuit design puzzles.",
  masteryThreshold: 1,
  steps: [
    {
      id: "l6-s0",
      type: "concept",
      title: "Mission Briefing",
      prompt: "No new theory here — this lab puts everything you've learned to work.",
      interaction: {
        kind: "concept",
        sections: [
          {
            heading: "Your toolkit",
            body: "You already have everything you need: Ohm's Law links voltage, current, and resistance; series resistances add; parallel branches share voltage and split current; and power is current times voltage.",
          },
          {
            heading: "How this lab works",
            body: "You'll work through applied challenges that get progressively harder — fix a broken circuit, balance branches, optimize power, and finish with a boss challenge that demands all four readings at once.",
          },
        ],
        formula: {
          expression: "V = I × R    ·    P = I × V",
          caption: "Keep these two within reach",
        },
        keyPoints: [
          "Reuse Ohm's Law, the series/parallel rules, and the power formula.",
          "Each challenge is tougher than the one before it.",
          "The boss challenge needs every sensor reading in spec together.",
        ],
        continueLabel: "Enter the Lab",
      },
      feedback: { correct: "", incorrect: "" },
    },
    {
      id: "l6-s1",
      type: "challenge",
      title: "Find the Voltage",
      prompt:
        "A 5Ω resistor carries 2A. Calculate the voltage across it.",
      interaction: {
        kind: "numeric-calc",
        givens: [
          { label: "Current", value: 2, unit: "A" },
          { label: "Resistance", value: 5, unit: "Ω" },
        ],
        solveFor: "voltage",
        correctAnswer: 10,
        tolerance: 0.1,
        answerUnit: "V",
        circuitPreview: { mode: "simple", voltage: 10, resistance: 5 },
      },
      feedback: {
        correct: "V = I × R = 2 × 5 = 10V.",
        incorrect: "Rearrange Ohm's Law: V = I × R.",
        hint: "Multiply current by resistance.",
      },
    },
    {
      id: "l6-s2",
      type: "challenge",
      title: "Find the Resistance",
      prompt:
        "A circuit draws 4A from a 12V battery. Calculate the resistance.",
      interaction: {
        kind: "numeric-calc",
        givens: [
          { label: "Voltage", value: 12, unit: "V" },
          { label: "Current", value: 4, unit: "A" },
        ],
        solveFor: "resistance",
        correctAnswer: 3,
        tolerance: 0.1,
        answerUnit: "Ω",
        circuitPreview: { mode: "simple", voltage: 12, resistance: 3 },
      },
      feedback: {
        correct: "R = V / I = 12 / 4 = 3Ω.",
        incorrect: "Use R = V / I.",
        hint: "Divide voltage by current.",
      },
    },
    {
      id: "l6-s3",
      type: "challenge",
      title: "Fix the Circuit",
      prompt:
        "This 12V circuit should draw 2A but the resistor is wrong. Set R to fix it (±0.1A).",
      interaction: {
        kind: "dual-slider",
        fixedVoltage: 12,
        targetCurrent: 2,
        tolerance: 0.1,
        initialVoltage: 12,
        initialResistance: 10,
      },
      feedback: {
        correct: "R = 6Ω restores 2A. You fixed the circuit!",
        incorrect: "I = V/R. For 2A at 12V, R = 6Ω.",
        hint: "R = 12 / 2 = 6Ω.",
      },
    },
    {
      id: "l6-s4",
      type: "challenge",
      title: "Parallel Balance",
      prompt:
        "A 12V battery feeds two equal parallel branches. Configure R₁ and R₂ so total current is 3A, with the same current in each branch.",
      interaction: {
        kind: "circuit-config",
        mode: "parallel",
        fixedVoltage: 12,
        targetCurrent: 3,
        tolerance: 0.2,
        initialR1: 8,
        initialR2: 6,
      },
      feedback: {
        correct: "Equal 8Ω branches give 1.5A each — 3A total. Well done!",
        incorrect:
          "Find R_total first: R_total = V / I. For two equal branches, each resistor is twice R_total.",
        hint: "Each branch should draw 1.5A. Use R = V / I for one branch, then set both equal.",
      },
    },
    {
      id: "l6-s5",
      type: "challenge",
      title: "Power Optimization",
      prompt: "Hit exactly 6W (±0.3W) at 12V by tuning resistance.",
      interaction: {
        kind: "dual-slider",
        fixedVoltage: 12,
        targetPower: 6,
        tolerance: 0.3,
        initialVoltage: 12,
        initialResistance: 8,
      },
      feedback: {
        correct: "6W at 12V — efficient and correct!",
        incorrect: "P = V²/R → R = 144/6 = 24Ω.",
      },
    },
    {
      id: "l6-s6",
      type: "challenge",
      title: "Boss Challenge",
      prompt:
        "Three lab sensors monitor this circuit at once. Tune both voltage and resistance until every reading on the spec sheet is in the green — all four must pass together.",
      interaction: {
        kind: "dual-slider",
        initialVoltage: 9,
        initialResistance: 4,
        sliderStep: 0.1,
        voltageMin: 8,
        voltageMax: 16,
        resistanceMin: 3,
        resistanceMax: 10,
        constraints: {
          voltageMin: 11.5,
          voltageMax: 13.5,
          currentMin: 1.8,
          currentMax: 2.2,
          resistanceMin: 5.5,
          resistanceMax: 6.5,
          powerMax: 28,
        },
      },
      feedback: {
        correct:
          "All sensors in spec — you balanced voltage, current, resistance, and power together.",
        incorrect: "Not all sensors are in spec yet.",
        hint: "Voltage must come up from where you started. Find a voltage and resistance pair where current, power, and resistance all land in range.",
      },
    },
    {
      id: "l6-s7",
      type: "mastery",
      title: "Final Mastery",
      prompt: "Final verification — you've earned this.",
      interaction: {
        kind: "mastery",
        questions: [
          {
            id: "l6-m1",
            prompt: "Ohm's Law states:",
            kind: "mcq",
            options: ["V = I × R", "P = I + V", "R = I × V"],
            correctIndex: 0,
          },
          {
            id: "l6-m2",
            prompt: "Two 3Ω in parallel: R_total (Ω)?",
            kind: "numeric",
            correctAnswer: 1.5,
            tolerance: 0.1,
          },
          {
            id: "l6-m3",
            prompt: "6V, 2Ω resistor. Power (W)?",
            kind: "numeric",
            correctAnswer: 18,
            tolerance: 0.5,
          },
        ],
      },
      feedback: {
        correct: "Congratulations! You've completed Circuits Fundamentals.",
        incorrect: "Review the course and try again.",
      },
    },
  ],
};
