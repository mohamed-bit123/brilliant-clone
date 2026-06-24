import type { Lesson } from "@/lib/types";

export const lesson5: Lesson = {
  id: "lesson-5",
  title: "Power and Energy",
  order: 5,
  description: "Connect power to brightness and heat using P = IV.",
  masteryThreshold: 1,
  steps: [
    {
      id: "l5-s0",
      type: "concept",
      title: "What Is Power?",
      prompt: "Power explains why some bulbs glow brighter and some resistors run hot.",
      interaction: {
        kind: "concept",
        sections: [
          {
            heading: "Power is energy per second",
            body: "Power (P, in watts) is how fast a component converts electrical energy into light, heat, or motion. A brighter bulb or a hotter resistor is simply using more power.",
          },
          {
            heading: "It comes from current and voltage",
            body: "Power is the voltage across a component times the current through it. Using Ohm's Law, you can also rewrite it in terms of just resistance with either voltage or current.",
          },
        ],
        formula: {
          expression: "P = I × V = I²R = V²/R",
          caption: "Three equivalent ways to find power",
        },
        analogy: {
          title: "Water turning a wheel",
          body: "Power is how much work the moving water does each second — it grows with both the pressure (voltage) and the flow rate (current).",
        },
        visual: { mode: "simple", voltage: 12, resistance: 6 },
        keyPoints: [
          "Power is energy used per second, measured in watts.",
          "P = I × V is the core formula.",
          "At fixed resistance, doubling voltage quadruples power.",
        ],
        continueLabel: "Explore Power",
      },
      feedback: { correct: "", incorrect: "" },
    },
    {
      id: "l5-s1",
      type: "prediction",
      title: "Power Prediction",
      prompt: "You double the voltage across a fixed resistor. What happens to power?",
      interaction: {
        kind: "mcq",
        options: ["Doubles", "Quadruples", "Stays the same"],
        correctIndex: 1,
      },
      feedback: {
        correct:
          "P = V²/R — doubling V quadruples power (V² goes up 4×).",
        incorrect: "Power depends on V² when R is fixed: P = V²/R.",
      },
    },
    {
      id: "l5-s2",
      type: "manipulate",
      title: "Feel the Power",
      prompt:
        "Adjust voltage and resistance. Watch the power meter and bulb heat indicator.",
      interaction: {
        kind: "dual-slider",
        initialVoltage: 12,
        initialResistance: 6,
        observeOnly: true,
      },
      feedback: {
        correct:
          "Power = I × V. More power means brighter bulb and more heat dissipated.",
        incorrect: "",
      },
    },
    {
      id: "l5-s3",
      type: "discover",
      title: "Power Formulas",
      prompt: "Which set of power formulas is correct?",
      interaction: {
        kind: "mcq",
        options: [
          "P = IV, P = I²R, P = V²/R",
          "P = I/R, P = V×R",
          "P = V - I",
        ],
        correctIndex: 0,
      },
      feedback: {
        correct: "All three forms are equivalent when Ohm's Law holds.",
        incorrect: "Power relates voltage, current, and resistance together.",
      },
    },
    {
      id: "l5-s4",
      type: "challenge",
      title: "6W Target",
      prompt: "Configure the circuit to draw exactly 6W (±0.3W) with a 12V battery.",
      interaction: {
        kind: "dual-slider",
        fixedVoltage: 12,
        targetPower: 6,
        tolerance: 0.3,
        initialVoltage: 12,
        initialResistance: 4,
      },
      feedback: {
        correct: "P = 6W achieved! At 12V that means I = 0.5A and R = 24Ω.",
        incorrect: "P = V²/R. At 12V, R = 144/P.",
        hint: "For 6W at 12V: R = 12²/6 = 24Ω.",
      },
    },
    {
      id: "l5-s5",
      type: "challenge",
      title: "Power Graph",
      prompt:
        "With resistance fixed at 4Ω, this graph shows power vs. voltage. Read it or use P = V²/R.",
      interaction: {
        kind: "graph",
        graphType: "power-vs-voltage",
        fixedResistance: 4,
        questionType: "numeric",
        scenario: "What is power when voltage is 12V?",
        correctAnswer: 36,
        tolerance: 0.5,
      },
      feedback: {
        correct: "P = V²/R = 144/4 = 36W. Power grows with the square of voltage.",
        incorrect: "Use P = V²/R or read the graph at V = 12.",
        hint: "P = 12² / 4.",
      },
    },
    {
      id: "l5-s6",
      type: "challenge",
      title: "Calculate Power",
      prompt:
        "A component carries 2.5A at 8V. Calculate the power dissipated.",
      interaction: {
        kind: "numeric-calc",
        givens: [
          { label: "Current", value: 2.5, unit: "A" },
          { label: "Voltage", value: 8, unit: "V" },
        ],
        solveFor: "power",
        correctAnswer: 20,
        tolerance: 0.2,
        answerUnit: "W",
      },
      feedback: {
        correct: "P = I × V = 2.5 × 8 = 20W.",
        incorrect: "Multiply current by voltage.",
        hint: "P = I × V.",
      },
    },
    {
      id: "l5-s7",
      type: "challenge",
      title: "Power After a Voltage Change",
      prompt:
        "A heater draws 3A from a 24V supply. You halve the supply voltage but keep the same resistance. What power does it now dissipate? (W)",
      interaction: {
        kind: "numeric-calc",
        givens: [
          { label: "Voltage", value: 24, unit: "V" },
          { label: "Current", value: 3, unit: "A" },
        ],
        solveFor: "power",
        correctAnswer: 18,
        tolerance: 0.3,
        answerUnit: "W",
      },
      feedback: {
        correct: "R = 24 / 3 = 8Ω. At 12V, I = 1.5A, so P = 12 × 1.5 = 18W (quarter of the original).",
        incorrect: "Find R first, then the new current at half voltage, then P = I × V.",
        hint: "R = 8Ω; at 12V, I = 1.5A.",
      },
    },
    {
      id: "l5-s8",
      type: "mastery",
      title: "Power Mastery",
      prompt: "Prove you understand power in circuits.",
      interaction: {
        kind: "mastery",
        questions: [
          {
            id: "l5-m1",
            prompt: "Higher power in a resistor means:",
            kind: "mcq",
            options: [
              "Less heat",
              "More heat and brightness",
              "No change",
            ],
            correctIndex: 1,
          },
          {
            id: "l5-m2",
            prompt: "2A through a component at 10V. Power (W)?",
            kind: "numeric",
            correctAnswer: 20,
            tolerance: 0.1,
          },
          {
            id: "l5-m3",
            prompt: "12V, R=4Ω. Power (W)?",
            kind: "numeric",
            correctAnswer: 36,
            tolerance: 0.5,
          },
        ],
      },
      feedback: {
        correct: "Power and energy mastered!",
        incorrect: "Review P = IV and try again.",
      },
    },
  ],
};
