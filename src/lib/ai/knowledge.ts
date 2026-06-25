import type { PracticeTopic } from "./types";

/**
 * Grounding reference for AI-authored problem framing.
 *
 * This is a curated, condensed reference distilled from open, CC-licensed
 * physics material — primarily **OpenStax, *University Physics Volume 2*,
 * Chapters 9–10 (Current/Resistance and Direct-Current Circuits)**, which is
 * released under CC BY 4.0 — plus standard intro-physics conventions. It is NOT
 * a copy of any copyrighted textbook.
 *
 * It is fed to the model ONLY as context to make problem *framing* (devices,
 * realistic value ranges, phrasing) more authentic and varied. It never affects
 * the numbers or the answer: the deterministic engine in `practice.ts` /
 * `types.ts` remains the single source of truth for every value. The model is
 * still forbidden from changing any given number.
 */

export const REFERENCE_ATTRIBUTION =
  "Distilled from OpenStax, University Physics Volume 2, Ch. 9–10 (CC BY 4.0). https://openstax.org/books/university-physics-volume-2";

/** Shared formula sheet + house style for every topic. */
export const GENERAL_REFERENCE = `CIRCUITS FORMULA SHEET (exact, SI units):
- Ohm's law: V = I·R  (I in amps A, V in volts V, R in ohms Ω).
- Power: P = I·V = I²·R = V²/R  (P in watts W).
- Series resistors: R_total = R1 + R2 + … (same current through each).
- Parallel resistors: 1/R_total = 1/R1 + 1/R2 + … (same voltage across each); R_total is smaller than the smallest branch.
- Real source: terminal voltage V = ε − I·r, where ε is EMF and r is internal resistance.
- Energy: E = P·t; utilities bill energy in kilowatt-hours (1 kWh = 1000 W for 1 hour).

WRITING STYLE:
- Frame problems with concrete, age-appropriate devices and settings (see the device bank for the topic).
- Use realistic component values from the ranges given; never contradict the engine's numbers.
- One or two sentences. Plain, vivid language. SI units with digits.`;

const TOPIC_REFERENCE: Record<PracticeTopic, string> = {
  ohms: `TOPIC: Ohm's law (V = I·R).
Real contexts: a flashlight bulb on a AA/AAA cell, an LED with a current-limiting resistor, a phone-charger output, a heating element, a resistor on a breadboard, a car's 12 V accessory socket.
Typical values: cells 1.5 V / 9 V, USB 5 V, car 12 V; small resistors 2–50 Ω; currents 0.1–5 A.
Common archetypes: find the current a known voltage drives through a resistor; find the resistance from a measured voltage and current; find the voltage needed for a target current; predict how current changes when the resistor is swapped.`,

  series: `TOPIC: Series circuits (one loop, current shared, resistances add).
Real contexts: old-style string lights wired end-to-end, two resistors in a sensor divider, a dimmer (series resistor) feeding a bulb, AA cells stacked in a flashlight.
Typical values: supply 6–24 V; resistors 2–12 Ω each; currents 0.5–4 A.
Key facts: the SAME current flows through every series element; voltage drops add up to the source voltage; the largest resistor drops the most voltage.
Common archetypes: total current through two series resistors; the voltage drop across one resistor (V1 = I·R1); choose a series resistor to set a target current.`,

  parallel: `TOPIC: Parallel circuits (branches share voltage, currents split).
Real contexts: household outlets / room lighting, a car's headlights + radio on the same 12 V, USB hub ports — each subsystem gets the full source voltage and runs independently.
Typical values: supply 12–48 V chosen so branch currents are clean; branch resistors 2–12 Ω; total currents 1–8 A.
Key facts: EVERY branch sees the full source voltage; the lower-resistance branch carries more current; total current is the sum of branch currents; equivalent resistance is below the smallest branch.
Common archetypes: current in one branch (I = V/R_branch); total current drawn from the source; size a branch to hit a target total current.`,

  equivalent: `TOPIC: Equivalent resistance of mixed networks.
Real contexts: a circuit board where wire resistance + components combine, a speaker network, a sensor array reduced for analysis.
Typical values: resistors 2–12 Ω; supplies 12–48 V.
Method (from OpenStax): reduce from the inside out — collapse the innermost pure-series or pure-parallel group to one equivalent resistor, redraw, and repeat until one R_eq remains; then I = V/R_eq.
Common archetypes: a series pair in parallel with a third resistor; a parallel pair in series with a third; two series pairs joined in parallel (ladder); after reducing, find total current or a sub-current.`,

  power: `TOPIC: Power and energy (P = I·V = I²R = V²/R).
Real contexts: bulb brightness, a resistor heating up, an electric kettle/heater, a motor's draw, the running cost of an appliance.
Typical values: 5–240 V; 2–12 Ω; 1–4 A; powers a few watts to a few hundred watts.
Key facts: at fixed R, power scales with V² (double V → 4× power); in a series resistor P = I²R; total power supplied equals the sum dissipated.
Common archetypes: power from V and I; power after a voltage change (find R, then new I, then P); power dissipated in one resistor of a series pair.`,

  sources: `TOPIC: Multiple voltage sources, internal resistance, and Kirchhoff's voltage law.
Real contexts: AA cells in series in a flashlight (more voltage), cells in parallel for longer runtime / more current, a battery charger driving current backward into a battery, jump-starting a car.
Typical values: cells 1.5 V / 6 V / 9 V / 12 V; internal resistance 0.1–2 Ω; loads 0.5–12 Ω; charger 14 V vs battery 12 V.
Key facts (from OpenStax Ch. 10): terminal voltage V = ε − I·r; series sources add EMF and internal resistance; opposing sources subtract (charging: I = (ε1 − ε2)/(r1 + r2 + R)); identical parallel cells keep the EMF but their internal resistances combine lower, supplying more current; KVL: around any loop Σε = ΣI·R.
Common archetypes: current from a real battery into a load; terminal voltage under load; series-aiding cells; charging current from opposing sources; load current from parallel cells; full single-loop KVL.`,

  mixed: `TOPIC: Mixed review — any of Ohm's law, series, parallel, equivalent resistance, power, or multiple sources.
Use whichever real-world device bank fits the specific problem you are given. Keep the framing concrete and the numbers exactly as provided.`,
};

/** Returns the grounding context (general + topic-specific) for a topic. */
export function getTopicReference(topic: PracticeTopic): string {
  return `${GENERAL_REFERENCE}\n\n${TOPIC_REFERENCE[topic] ?? TOPIC_REFERENCE.mixed}`;
}
