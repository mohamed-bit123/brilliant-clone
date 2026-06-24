import type { Lesson } from "@/lib/types";

export const lesson1: Lesson = {
  id: "lesson-1",
  title: "Discovering Ohm's Law",
  order: 1,
  description: "Discover the relationship between voltage, current, and resistance through experimentation.",
  masteryThreshold: 1,
  steps: [
    {
      id: "l1-s0",
      type: "concept",
      title: "The Basics",
      prompt: "Before you experiment, here's the language of circuits in plain terms.",
      interaction: {
        kind: "concept",
        sections: [
          {
            heading: "What is a circuit?",
            body: "An electric circuit is a closed loop. A battery pushes electric charge out one terminal; the charge travels through wires and components and returns to the other terminal. Break the loop anywhere and the flow stops.",
          },
          {
            heading: "Voltage, current, and resistance",
            body: "Voltage (V, in volts) is the push from the battery. Current (I, in amps) is how much charge actually flows each second. Resistance (R, in ohms) is how strongly a component fights that flow.",
          },
        ],
        analogy: {
          title: "Think of water in a pipe",
          body: "Voltage is the water pressure, current is how fast the water flows, and resistance is how narrow the pipe is. More pressure means more flow; a narrower pipe means less flow.",
        },
        visual: { mode: "simple", voltage: 9, resistance: 5 },
        keyPoints: [
          "Voltage pushes, current flows, resistance resists.",
          "More voltage means more current; more resistance means less current.",
          "In this lesson you'll discover the exact formula linking all three.",
        ],
        continueLabel: "Start Experimenting",
      },
      feedback: { correct: "", incorrect: "" },
    },
    {
      id: "l1-s1",
      type: "prediction",
      title: "Make a Prediction",
      prompt:
        "Look at this circuit: a 9V battery, a resistor, and a light bulb. If resistance doubles, what happens to current?",
      interaction: {
        kind: "mcq",
        options: ["Increases", "Decreases", "Stays the same"],
        correctIndex: 1,
        circuitPreview: {
          mode: "simple",
          voltage: 9,
          resistance: 5,
        },
      },
      feedback: {
        correct:
          "Increasing resistance reduces current because the electrons encounter more opposition.",
        incorrect:
          "Try adjusting resistance in the next step and observe what happens.",
      },
    },
    {
      id: "l1-s2",
      type: "manipulate",
      title: "Manipulate Resistance",
      prompt:
        "Drag the resistance slider and watch how current and bulb brightness change.",
      interaction: {
        kind: "slider",
        param: "resistance",
        min: 1,
        max: 20,
        initial: 5,
        fixedVoltage: 9,
        observeOnly: true,
      },
      feedback: {
        correct:
          "Notice that current drops as resistance increases. Resistance limits the flow of charge through the circuit.",
        incorrect: "",
      },
    },
    {
      id: "l1-s3",
      type: "manipulate",
      title: "Manipulate Voltage",
      prompt:
        "Now adjust the voltage slider. What happens to current when you push harder?",
      interaction: {
        kind: "slider",
        param: "voltage",
        min: 1,
        max: 20,
        initial: 9,
        fixedResistance: 5,
        observeOnly: true,
      },
      feedback: {
        correct:
          "Higher voltage pushes more charge through the circuit each second, increasing current.",
        incorrect: "",
      },
    },
    {
      id: "l1-s4",
      type: "discover",
      title: "Discover the Formula",
      prompt: "What pattern do you notice in these observations?",
      interaction: {
        kind: "discover-table",
        rows: [
          { voltage: 10, resistance: 2, current: 5 },
          { voltage: 10, resistance: 5, current: 2 },
          { voltage: 20, resistance: 5, current: 4 },
        ],
        options: [
          "Current = Voltage + Resistance",
          "Current = Voltage / Resistance",
          "Current = Resistance / Voltage",
        ],
        correctIndex: 1,
      },
      feedback: {
        correct:
          "This relationship is known as Ohm's Law: V = I × R, or Current = Voltage / Resistance.",
        incorrect:
          "Look at each row: when resistance goes up at the same voltage, current goes down. When voltage doubles, current doubles.",
      },
    },
    {
      id: "l1-s5",
      type: "challenge",
      title: "Circuit Challenge",
      prompt: "Configure the circuit so current is exactly 3A (±0.1A).",
      interaction: {
        kind: "dual-slider",
        targetCurrent: 3,
        tolerance: 0.1,
        initialVoltage: 9,
        initialResistance: 5,
      },
      feedback: {
        correct:
          "Great job. You successfully balanced voltage and resistance to achieve the target current.",
        incorrect: "Try increasing voltage or reducing resistance.",
        hint: "Remember: I = V / R. Pick values where V ÷ R ≈ 3.",
      },
    },
    {
      id: "l1-s6",
      type: "challenge",
      title: "Choose the Resistor",
      prompt:
        "Battery = 12V, target current = 2A. Drag the correct resistor into the circuit.",
      interaction: {
        kind: "drag-drop",
        options: ["2Ω", "4Ω", "6Ω", "8Ω", "10Ω"],
        correctValue: "6Ω",
        batteryVoltage: 12,
        targetCurrent: 2,
      },
      feedback: {
        correct: "Using Ohm's Law, R = V ÷ I = 12 ÷ 2 = 6Ω.",
        incorrect: "Use R = V ÷ I. What resistance gives 2A at 12V?",
        hint: "Divide voltage by target current: 12 ÷ 2 = ?",
      },
    },
    {
      id: "l1-s7",
      type: "challenge",
      title: "Read the Graph",
      prompt:
        "This graph shows current vs. resistance with voltage held at 12V. Use it to reason about Ohm's Law — no sliders.",
      interaction: {
        kind: "graph",
        graphType: "current-vs-resistance",
        fixedVoltage: 12,
        questionType: "mcq",
        scenario: "Resistance increases from 4Ω to 8Ω.",
        options: [
          "Current doubles",
          "Current is cut in half",
          "Current stays the same",
        ],
        correctIndex: 1,
      },
      feedback: {
        correct: "At fixed voltage, I = V/R — doubling R halves current.",
        incorrect: "Find current at 4Ω and 8Ω on the graph: 3A and 1.5A.",
        hint: "I at 4Ω is 3A. What is I at 8Ω?",
      },
    },
    {
      id: "l1-s8",
      type: "challenge",
      title: "Calculate Current",
      prompt:
        "A 24V source drives current through a 8Ω resistor. Calculate the current.",
      interaction: {
        kind: "numeric-calc",
        givens: [
          { label: "Voltage", value: 24, unit: "V" },
          { label: "Resistance", value: 8, unit: "Ω" },
        ],
        solveFor: "current",
        correctAnswer: 3,
        tolerance: 0.1,
        answerUnit: "A",
        circuitPreview: { mode: "simple", voltage: 24, resistance: 8 },
      },
      feedback: {
        correct: "I = V / R = 24 / 8 = 3A.",
        incorrect: "Use I = V / R.",
        hint: "Divide voltage by resistance.",
      },
    },
    {
      id: "l1-s9",
      type: "challenge",
      title: "Two-Step Reasoning",
      prompt:
        "A 12V battery drives 4A through a resistor. To dim the bulb, you triple the resistance. What is the new current? (A)",
      interaction: {
        kind: "numeric-calc",
        givens: [
          { label: "Voltage", value: 12, unit: "V" },
          { label: "Starting current", value: 4, unit: "A" },
        ],
        solveFor: "current",
        correctAnswer: 1.33,
        tolerance: 0.1,
        answerUnit: "A",
      },
      feedback: {
        correct: "R = 12 / 4 = 3Ω. Tripled → 9Ω, so I = 12 / 9 ≈ 1.33A.",
        incorrect: "Find the original resistance first, triple it, then use I = V / R.",
        hint: "R = 3Ω, then ×3 = 9Ω, then 12 ÷ 9.",
      },
    },
    {
      id: "l1-s10",
      type: "mastery",
      title: "Mastery Check",
      prompt: "Answer these three questions to prove you've mastered Ohm's Law.",
      interaction: {
        kind: "mastery",
        questions: [
          {
            id: "l1-m1",
            prompt: "Resistance increases while voltage stays the same. Current will:",
            kind: "mcq",
            options: ["Increase", "Decrease", "Stay the same"],
            correctIndex: 1,
          },
          {
            id: "l1-m2",
            prompt: "A 15V battery drives 3A through a resistor. What is R? (Ω)",
            kind: "numeric",
            correctAnswer: 5,
            tolerance: 0.1,
          },
          {
            id: "l1-m3",
            prompt: "Set the circuit to exactly 4A using the sliders.",
            kind: "config",
            configTarget: { current: 4 },
            tolerance: 0.1,
          },
        ],
      },
      feedback: {
        correct: "Excellent! You've mastered Ohm's Law.",
        incorrect: "Review the feedback and try again.",
      },
    },
  ],
};
