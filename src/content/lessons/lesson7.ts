import type { Lesson } from "@/lib/types";

/**
 * Lesson 7 — Multiple Voltage Sources.
 *
 * Inserted at order 6 (between Power and the Challenge Lab). Builds on series
 * and parallel resistance to introduce real batteries: EMF vs. terminal
 * voltage, internal resistance, sources in series (aiding/opposing) and
 * parallel, and Kirchhoff's voltage law as the unifying tool.
 *
 * Physics grounded in OpenStax University Physics Vol. 2, Ch. 10:
 *   V_terminal = ε − I·r ; series sources add EMF and internal resistance;
 *   opposing sources subtract; identical parallel sources keep EMF but lower r.
 */
export const lesson7: Lesson = {
  id: "lesson-7",
  title: "Multiple Voltage Sources",
  order: 6,
  description: "Real batteries, internal resistance, and combining sources with Kirchhoff's voltage law.",
  masteryThreshold: 1,
  steps: [
    {
      id: "l7-s0",
      type: "concept",
      title: "Real Batteries Aren't Perfect",
      prompt: "Every real battery quietly loses some of its own voltage. Here's why.",
      interaction: {
        kind: "concept",
        sections: [
          {
            heading: "EMF is the ideal voltage",
            body: "A source's electromotive force (EMF, ε) is the voltage it would supply if nothing slowed the charges down — the push per unit charge. It's what a voltmeter reads when no current flows.",
          },
          {
            heading: "Internal resistance steals some of it",
            body: "Real sources have a small internal resistance r. Once current flows, some voltage is dropped inside the battery itself, so the voltage you actually get at the terminals is less than the EMF.",
          },
          {
            heading: "Terminal voltage",
            body: "The voltage delivered to the circuit is the terminal voltage: V = ε − I·r. The bigger the current, the bigger the internal drop, and the lower the terminal voltage sags.",
          },
        ],
        formula: {
          expression: "V_terminal = ε − I·r",
          caption: "Terminal voltage = EMF minus the internal drop",
        },
        analogy: {
          title: "A tired water pump",
          body: "Think of the EMF as a pump's rated pressure. Push a lot of water (current) through and some pressure is lost inside the pump's own pipes — what reaches the hose (terminal voltage) is a bit less.",
        },
        multiSource: { arrangement: "single", e1: 12, r1: 1, load: 5 },
        keyPoints: [
          "EMF (ε) is the ideal, no-current voltage.",
          "Internal resistance r drops voltage inside the source.",
          "Terminal voltage V = ε − I·r is what the circuit actually sees.",
        ],
        continueLabel: "Start Learning",
      },
      feedback: { correct: "", incorrect: "" },
    },
    {
      id: "l7-s1",
      type: "prediction",
      title: "When Does V Equal ε?",
      prompt: "A real battery's terminal voltage equals its full EMF only when…",
      interaction: {
        kind: "mcq",
        options: [
          "no current is being drawn",
          "a very large current is drawn",
          "the battery is short-circuited",
        ],
        correctIndex: 0,
      },
      feedback: {
        correct: "Right — with I = 0 the internal drop I·r vanishes, so V = ε.",
        incorrect: "Look at V = ε − I·r. The drop I·r is zero only when I = 0.",
      },
    },
    {
      id: "l7-s2",
      type: "challenge",
      title: "Current From a Real Battery",
      prompt:
        "A 12 V battery has an internal resistance of 2 Ω and drives a 10 Ω load. What current flows? (I = ε / (r + R))",
      interaction: {
        kind: "numeric-calc",
        givens: [
          { label: "EMF", value: 12, unit: "V" },
          { label: "Internal resistance", value: 2, unit: "Ω" },
          { label: "Load resistance", value: 10, unit: "Ω" },
        ],
        solveFor: "current",
        correctAnswer: 1,
        tolerance: 0.05,
        answerUnit: "A",
        multiSourcePreview: { arrangement: "single", e1: 12, r1: 2, load: 10, mask: "current" },
      },
      feedback: {
        correct: "I = ε / (r + R) = 12 / (2 + 10) = 1 A. The internal resistance is in series with the load.",
        incorrect: "Add the internal resistance to the load, then use Ohm's law: I = ε / (r + R).",
        hint: "Total resistance is r + R = 12 Ω.",
      },
    },
    {
      id: "l7-s3",
      type: "challenge",
      title: "Terminal Voltage Under Load",
      prompt:
        "A 12 V battery (r = 1 Ω) drives a 5 Ω load. What is the terminal voltage — the voltage actually across the load?",
      interaction: {
        kind: "numeric-calc",
        givens: [
          { label: "EMF", value: 12, unit: "V" },
          { label: "Internal resistance", value: 1, unit: "Ω" },
          { label: "Load resistance", value: 5, unit: "Ω" },
        ],
        solveFor: "voltage",
        correctAnswer: 10,
        tolerance: 0.1,
        answerUnit: "V",
        multiSourcePreview: { arrangement: "single", e1: 12, r1: 1, load: 5, mask: "terminal" },
      },
      feedback: {
        correct: "I = 12 / 6 = 2 A, so V = ε − I·r = 12 − 2 = 10 V (also I·R = 2 × 5 = 10 V).",
        incorrect: "First find the current, then V = ε − I·r (or simply I × R across the load).",
        hint: "Current is 12 / (1 + 5) = 2 A.",
      },
    },
    {
      id: "l7-s4",
      type: "concept",
      title: "Sources in Series: Adding Up",
      prompt: "Stack batteries head-to-tail and their pushes combine.",
      interaction: {
        kind: "concept",
        sections: [
          {
            heading: "EMFs add",
            body: "When sources are connected in series so they push the same way (aiding), the positive terminal of one feeds the negative of the next. Their EMFs simply add: ε_total = ε₁ + ε₂.",
          },
          {
            heading: "So do the internal resistances",
            body: "Because the same current flows through every cell, their internal resistances are in series too: r_total = r₁ + r₂. This is exactly why flashlights stack cells — to reach a higher voltage.",
          },
        ],
        formula: {
          expression: "ε_total = ε₁ + ε₂      r_total = r₁ + r₂",
          caption: "Series-aiding sources",
        },
        multiSource: { arrangement: "series-aiding", e1: 6, e2: 6, r1: 0.5, r2: 0.5, load: 11 },
        keyPoints: [
          "Series-aiding EMFs add to a larger total voltage.",
          "Internal resistances add in series as well.",
          "Same current flows through every source.",
        ],
        continueLabel: "Continue",
      },
      feedback: { correct: "", incorrect: "" },
    },
    {
      id: "l7-s5",
      type: "challenge",
      title: "Two Cells, Same Direction",
      prompt:
        "A 9 V and a 3 V source are connected in series, aiding, driving a 4 Ω load (ignore internal resistance). What current flows?",
      interaction: {
        kind: "numeric-calc",
        givens: [
          { label: "EMF 1", value: 9, unit: "V" },
          { label: "EMF 2", value: 3, unit: "V" },
          { label: "Load resistance", value: 4, unit: "Ω" },
        ],
        solveFor: "current",
        correctAnswer: 3,
        tolerance: 0.1,
        answerUnit: "A",
        multiSourcePreview: { arrangement: "series-aiding", e1: 9, e2: 3, load: 4, mask: "current" },
      },
      feedback: {
        correct: "Net EMF = 9 + 3 = 12 V, so I = 12 / 4 = 3 A.",
        incorrect: "Add the EMFs first (they aid each other), then divide by the load.",
        hint: "Net EMF is 9 + 3 = 12 V.",
      },
    },
    {
      id: "l7-s6",
      type: "concept",
      title: "Sources in Opposition",
      prompt: "Point two sources against each other and they fight — this is how charging works.",
      interaction: {
        kind: "concept",
        sections: [
          {
            heading: "EMFs subtract",
            body: "If one source is reversed so it pushes against the other (opposing), the net driving EMF is the difference: ε_net = |ε₁ − ε₂|. The stronger source wins and sets the current direction.",
          },
          {
            heading: "This is a battery charger",
            body: "A charger is a higher-EMF source wired to oppose the battery it charges. Current is forced backward into the lower battery: I = (ε₁ − ε₂) / (r₁ + r₂ + R). The internal resistances still add.",
          },
        ],
        formula: {
          expression: "I = (ε₁ − ε₂) / (r₁ + r₂ + R)",
          caption: "Opposing sources — the difference drives the current",
        },
        multiSource: { arrangement: "series-opposing", e1: 14, e2: 12, r1: 0.3, r2: 0.2, load: 0.5 },
        keyPoints: [
          "Opposing EMFs subtract: only the difference drives current.",
          "The higher EMF sets the current's direction (charging the lower one).",
          "Resistances still add in series.",
        ],
        continueLabel: "Continue",
      },
      feedback: { correct: "", incorrect: "" },
    },
    {
      id: "l7-s7",
      type: "challenge",
      title: "Charging a Battery",
      prompt:
        "A 14 V charger (r = 0.3 Ω) is connected to oppose a 12 V battery (r = 0.2 Ω) through a 0.5 Ω resistor. What charging current flows?",
      interaction: {
        kind: "numeric-calc",
        givens: [
          { label: "Charger EMF", value: 14, unit: "V" },
          { label: "Battery EMF", value: 12, unit: "V" },
          { label: "Charger internal r", value: 0.3, unit: "Ω" },
          { label: "Battery internal r", value: 0.2, unit: "Ω" },
          { label: "Series resistor", value: 0.5, unit: "Ω" },
        ],
        solveFor: "current",
        correctAnswer: 2,
        tolerance: 0.1,
        answerUnit: "A",
        multiSourcePreview: {
          arrangement: "series-opposing",
          e1: 14,
          e2: 12,
          r1: 0.3,
          r2: 0.2,
          load: 0.5,
          mask: "current",
        },
      },
      feedback: {
        correct: "Net EMF = 14 − 12 = 2 V; total R = 0.3 + 0.2 + 0.5 = 1.0 Ω; I = 2 / 1 = 2 A.",
        incorrect: "Subtract the opposing EMFs, add all three resistances, then use Ohm's law.",
        hint: "Driving voltage is only 14 − 12 = 2 V.",
      },
    },
    {
      id: "l7-s8",
      type: "concept",
      title: "Sources in Parallel",
      prompt: "Wire identical batteries side by side for more current, not more voltage.",
      interaction: {
        kind: "concept",
        sections: [
          {
            heading: "Voltage stays the same",
            body: "Connecting identical sources in parallel (all + terminals together, all − terminals together) keeps the EMF the same — you do not get a higher voltage.",
          },
          {
            heading: "Internal resistance drops",
            body: "What you gain is current capacity: the internal resistances combine in parallel, so r_eq is smaller than either one. A smaller internal resistance means less voltage sag and more current available to the load.",
          },
        ],
        formula: {
          expression: "ε_eq = ε      1/r_eq = 1/r₁ + 1/r₂",
          caption: "Identical parallel sources",
        },
        analogy: {
          title: "More checkout lanes",
          body: "Parallel cells are like opening extra checkout lanes: the price (voltage) is unchanged, but more customers (current) can be served at once because the bottleneck (internal resistance) shrinks.",
        },
        multiSource: { arrangement: "parallel", e1: 12, e2: 12, r1: 2, r2: 2, load: 5 },
        keyPoints: [
          "Identical parallel sources keep the same EMF.",
          "Internal resistances combine in parallel (smaller r_eq).",
          "Use parallel sources for more current, series for more voltage.",
        ],
        continueLabel: "Continue",
      },
      feedback: { correct: "", incorrect: "" },
    },
    {
      id: "l7-s9",
      type: "challenge",
      title: "Parallel Cells",
      prompt:
        "Two identical 12 V cells, each with 2 Ω internal resistance, are wired in parallel and drive a 5 Ω load. What current flows through the load?",
      interaction: {
        kind: "numeric-calc",
        givens: [
          { label: "EMF (each cell)", value: 12, unit: "V" },
          { label: "Internal r (cell 1)", value: 2, unit: "Ω" },
          { label: "Internal r (cell 2)", value: 2, unit: "Ω" },
          { label: "Load resistance", value: 5, unit: "Ω" },
        ],
        solveFor: "current",
        correctAnswer: 2,
        tolerance: 0.1,
        answerUnit: "A",
        multiSourcePreview: { arrangement: "parallel", e1: 12, e2: 12, r1: 2, r2: 2, load: 5, mask: "current" },
      },
      feedback: {
        correct: "r_eq = (2 × 2)/(2 + 2) = 1 Ω; total = 1 + 5 = 6 Ω; I = 12 / 6 = 2 A.",
        incorrect: "Combine the internal resistances in parallel first, then add the load.",
        hint: "Two equal 2 Ω in parallel give r_eq = 1 Ω.",
      },
    },
    {
      id: "l7-s10",
      type: "concept",
      title: "Kirchhoff's Voltage Law",
      prompt: "One rule ties every loop together — sources, drops, and all.",
      interaction: {
        kind: "concept",
        sections: [
          {
            heading: "Energy is conserved around a loop",
            body: "Kirchhoff's voltage law (KVL): travel once around any closed loop and the voltages must sum to zero. Every EMF you pass adds or subtracts, and every resistor drops I·R.",
          },
          {
            heading: "The working form",
            body: "Rearranged, the sources you gain must equal the drops you spend: Σε = Σ(I·R). Counting internal resistances as just more series R, this single equation reproduces every result in this lesson.",
          },
        ],
        formula: {
          expression: "Σε = Σ I·R   (around a closed loop)",
          caption: "Kirchhoff's voltage law",
        },
        keyPoints: [
          "Around any loop, voltage gains equal voltage drops.",
          "Add EMFs that aid the loop, subtract those that oppose it.",
          "Internal resistance is just another series resistance in the sum.",
        ],
        continueLabel: "Continue",
      },
      feedback: { correct: "", incorrect: "" },
    },
    {
      id: "l7-s11",
      type: "challenge",
      title: "KVL Showdown",
      prompt:
        "A 9 V and a 3 V source aid each other in a loop. Each has 0.5 Ω internal resistance and they drive a 4 Ω load. Using KVL, what is the voltage across the load?",
      interaction: {
        kind: "numeric-calc",
        givens: [
          { label: "EMF 1", value: 9, unit: "V" },
          { label: "EMF 2", value: 3, unit: "V" },
          { label: "Internal r 1", value: 0.5, unit: "Ω" },
          { label: "Internal r 2", value: 0.5, unit: "Ω" },
          { label: "Load resistance", value: 4, unit: "Ω" },
        ],
        solveFor: "voltage",
        correctAnswer: 9.6,
        tolerance: 0.2,
        answerUnit: "V",
        multiSourcePreview: {
          arrangement: "series-aiding",
          e1: 9,
          e2: 3,
          r1: 0.5,
          r2: 0.5,
          load: 4,
          mask: "terminal",
        },
      },
      feedback: {
        correct: "Σε = 12 V; ΣR = 0.5 + 0.5 + 4 = 5 Ω; I = 12 / 5 = 2.4 A; V_load = I·R = 2.4 × 4 = 9.6 V.",
        incorrect: "Find the loop current first (Σε / ΣR), then the load voltage is I × R.",
        hint: "Loop current = 12 / 5 = 2.4 A.",
      },
    },
    {
      id: "l7-s12",
      type: "mastery",
      title: "Sources Mastery",
      prompt: "Show you can handle real sources and combinations.",
      interaction: {
        kind: "mastery",
        questions: [
          {
            id: "l7-m1",
            prompt: "Two 1.5 V cells in series, aiding. Net EMF?",
            kind: "mcq",
            options: ["3 V", "1.5 V", "0 V"],
            correctIndex: 0,
          },
          {
            id: "l7-m2",
            prompt: "A 12 V battery (r = 0.5 Ω) delivers 4 A. Terminal voltage (V)?",
            kind: "numeric",
            correctAnswer: 10,
            tolerance: 0.1,
          },
          {
            id: "l7-m3",
            prompt: "A 16 V charger opposes a 12 V battery; total loop resistance is 2 Ω. Charging current (A)?",
            kind: "numeric",
            correctAnswer: 2,
            tolerance: 0.1,
          },
        ],
      },
      feedback: {
        correct: "Multiple voltage sources mastered — series, parallel, and KVL.",
        incorrect: "Review EMF vs. terminal voltage and how sources combine, then try again.",
      },
    },
  ],
};
