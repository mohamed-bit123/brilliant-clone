# CircuitLab PRD

## Build Brilliant: Learn-by-Doing, Built Deep for One Subject

CircuitLab models the Brilliant approach—learn by doing, not by watching—but commits to **one subject and goes deep instead of wide**. Every lesson drops the learner into a problem, lets them poke at it, gives instant feedback, and only then reveals the idea behind it. The learner plays with a concept until it clicks.

---

## Chosen Subject

**Physics – Electric Circuits**

Stated at the top of the README. The entire platform is built for this subject only.

### Why Circuits Fit

Circuits are teachable through hands-on interaction and visuals: adjust a slider on voltage or resistance and watch current, electron flow, and bulb brightness respond in real time. The subject supports rich problem types beyond multiple choice—sliders, drag-and-drop components, prediction-before-manipulation, and circuit-building challenges.

### Persona

High school students (ages 14–18) learning introductory physics who struggle to understand how voltage, current, and resistance interact in a circuit. They can recite `V = I × R` but do not yet have intuition for what each variable *does* or how they relate in a live circuit.

### Product Vision

Most educational products teach circuits through videos, diagrams, and formulas. CircuitLab teaches circuits through experimentation.

Learners interact directly with a circuit, make predictions, manipulate variables, observe outcomes, receive instant feedback, and discover concepts for themselves.

---

## The Cadence: Three Phases

Build in strict order. Each phase must stand on its own before the next begins.

| Phase | Deadline | Focus |
| ----- | -------- | ----- |
| **Phase 1** | Wednesday | Core learn-by-doing app. **No AI.** |
| **Phase 2** | Friday | Decide what AI should do, then build it. |
| **Phase 3** | Sunday | Layer evidence-based learning science on top. |

**The rule:** If the app does not teach without AI, no AI will save it. Prove the core experience works, then make it smarter, then make it stick.

---

## Depth Over Breadth

This course contains **six lessons** that build on each other in one subject—not a shallow tour of many topics. A learner who starts knowing little should finish understanding something real: how simple circuits behave, how to combine resistors, and how to reason about power and energy.

Each lesson is short (a few minutes), interactive, and ends with a sense of accomplishment. Breadth is easy and forgettable. Depth is what makes Brilliant Brilliant.

---

## Problem Statement

Students often memorize:

```
V = I × R
```

without understanding:

* What voltage actually does
* Why resistance affects current
* How current changes in a circuit
* How components combine in series and parallel
* How power relates to voltage and current

CircuitLab helps learners build intuition by letting them manipulate live circuits and observe effects in real time.

---

# Phase 1: MVP (by Wednesday)

This is a hard gate with a hard rule: **no AI features in the MVP.** No model calls, no generated content, no chatbot tutor. Build the learn-by-doing app by hand so the core experience stands on its own.

## MVP Scope

The MVP requires **one complete, hand-built interactive lesson** (Lesson 1) that actually teaches without AI. The full course path of six lessons is designed in this PRD and built out across Phase 1; Lesson 1 is the gate that must pass first.

## MVP Pass Criteria

* A chosen subject, stated clearly, with the whole app built for the persona above
* **Lesson 1** on a real concept, built around hands-on problems—not video or a wall of text
* At least one problem the learner manipulates directly (drag, tap, slider, plot, reorder)
* A visual element they can interact with (circuit simulation that responds)
* Instant, specific feedback on each answer, right or wrong, with a short explanation—**written by hand, not generated**
* Progress that persists: finish part of a lesson, come back, pick up where you left off
* Accounts and names (auth)
* Works on mobile screen sizes
* Deployed and public

## Success Criteria (After Lesson 1)

After completing Lesson 1, a learner should be able to:

* Explain the relationship between voltage, current, and resistance
* Predict how changing resistance affects current
* Predict how changing voltage affects current
* Apply Ohm's Law to solve basic problems

## Explicitly Not in Phase 1

* AI tutor
* LLM-generated content
* Chatbot assistance
* AI-generated lessons

These are reserved for Phase 2.

---

# Course Structure

## Course: Circuits Fundamentals

Six lessons in a clear learning path. Each lesson is a short sequence of interactive steps: introduce an idea, make the learner do something with it, give instant feedback. Wrong answers get a hint or explanation, not just a red X.

| # | Lesson | Status | Core Concept |
| - | ------ | ------ | ------------ |
| 1 | Discovering Ohm's Law | **MVP gate** | V, I, R relationship through experimentation |
| 2 | Series Circuits | Phase 1 | Current and voltage in series; adding resistors |
| 3 | Parallel Circuits | Phase 1 | Current splits; voltage is shared |
| 4 | Equivalent Resistance | Phase 1 | Combining series and parallel into one value |
| 5 | Power and Energy | Phase 1 | P = IV, heat, and bulb brightness |
| 6 | Circuit Challenge Lab | Phase 1 | Multi-step design puzzles using everything learned |

### Learning Path

```
Lesson 1: Ohm's Law
    ↓
Lesson 2: Series Circuits
    ↓
Lesson 3: Parallel Circuits
    ↓
Lesson 4: Equivalent Resistance
    ↓
Lesson 5: Power and Energy
    ↓
Lesson 6: Circuit Challenge Lab
```

Lessons unlock sequentially based on mastery. When a learner gets something wrong repeatedly, surface a review step or an easier problem before advancing.

---

# Core User Flow

1. User creates an account or signs in
2. User starts the **Circuits Fundamentals** course
3. User sees the lesson path and their current position
4. User completes a lesson through interactive steps and simulations
5. User receives instant feedback after each interaction
6. User leaves mid-lesson and returns later without losing progress
7. User completes a lesson, sees mastery progress, streak update, and next recommended lesson
8. User continues through the six-lesson path

---

# Lesson 1: Discovering Ohm's Law

**MVP gate lesson.** Full hand-built specification below.

## Learning Objective

Learners discover the relationship between voltage, current, and resistance through experimentation—not by being told the formula first.

---

## Step 1: Prediction

### Scenario

Display a simple circuit:

* 9V battery
* resistor
* light bulb

### Question

"If resistance doubles, what happens to current?"

Options:

* Increases
* Decreases
* Stays the same

### Feedback

Correct:

> Increasing resistance reduces current because the electrons encounter more opposition.

Incorrect:

> Try adjusting resistance in the next step and observe what happens.

---

## Step 2: Manipulate Resistance

### Interaction

Resistance slider: `1Ω → 20Ω`

### Visual Updates

As resistance changes:

* Current value updates
* Electron flow animation changes speed
* Bulb brightness changes

### Learning Outcome

Learner observes that increasing resistance decreases current.

### Feedback

> Notice that current drops as resistance increases. Resistance limits the flow of charge through the circuit.

---

## Step 3: Manipulate Voltage

### Interaction

Voltage slider: `1V → 20V`

### Visual Updates

As voltage changes:

* Current value updates
* Electron flow animation speeds up
* Bulb brightness increases

### Feedback

> Higher voltage pushes more charge through the circuit each second, increasing current.

---

## Step 4: Discover the Formula

Display observations collected from learner experiments.

| Voltage | Resistance | Current |
| ------- | ---------- | ------- |
| 10V     | 2Ω         | 5A      |
| 10V     | 5Ω         | 2A      |
| 20V     | 5Ω         | 4A      |

### Prompt

"What pattern do you notice?"

### Reveal

```
Current = Voltage / Resistance
```

Then introduce:

```
V = I × R
```

### Feedback

> This relationship is known as Ohm's Law.

---

## Step 5: Circuit Challenge

### Goal

Create a circuit with exactly `Current = 3A`.

### Interaction

Learner adjusts voltage and resistance sliders.

### Success Condition

```
Current = 3.0A ± 0.1A
```

### Feedback

Correct:

> Great job. You successfully balanced voltage and resistance to achieve the target current.

Incorrect:

> Try increasing voltage or reducing resistance.

---

## Step 6: Drag-and-Drop Puzzle

### Scenario

Given: `Battery = 12V`, `Target Current = 2A`

### Task

Choose the correct resistor and drag it into the circuit.

Available options: 2Ω, 4Ω, 6Ω, 8Ω, 10Ω

### Correct Answer

```
6Ω
```

### Feedback

> Using Ohm's Law, R = V ÷ I = 12 ÷ 2 = 6Ω.

---

## Step 7: Mastery Check

Three questions:

1. Predict circuit behavior
2. Calculate a missing variable
3. Configure a circuit to meet a target current

### Completion Criteria

70% or higher mastery score unlocks Lesson 2.

---

# Lesson 2: Series Circuits

## Learning Objective

Learners understand that current is the same through every component in series, and that total resistance is the sum of individual resistors.

## Key Interactions

* **Prediction:** Before manipulating, predict what happens when a second resistor is added in series
* **Slider:** Add resistors in series and watch total resistance and current update
* **Tap-to-label:** Identify which points in a series circuit share the same current
* **Drag-and-drop:** Arrange resistors in the correct series order to achieve a target current

## Steps (Summary)

1. Prediction — "You add a second resistor in series. What happens to current?"
2. Manipulate — Add/remove series resistors via slider or tap; watch current drop and bulb dim
3. Discover — Total resistance = R₁ + R₂ + …
4. Challenge — Build a series circuit with exactly 2A given a fixed 12V battery
5. Mastery check — Predict behavior, calculate total R, configure a series circuit

## Problem Types

Slider manipulation, prediction MCQ, drag-and-drop resistor placement

---

# Lesson 3: Parallel Circuits

## Learning Objective

Learners understand that voltage is the same across parallel branches, current splits among paths, and parallel resistance is less than any single resistor.

## Key Interactions

* **Prediction:** Predict how current splits when a second branch is added
* **Slider:** Adjust resistance in one branch and watch current redistribution
* **Visual split:** Animated current flow splitting at a junction, recombined downstream
* **Tap-to-compare:** Compare brightness of bulbs in parallel vs. series (callback to Lesson 2)

## Steps (Summary)

1. Prediction — "Two branches in parallel: which gets more current?"
2. Manipulate — Add a parallel branch; observe current split and unchanged voltage
3. Discover — 1/R_total = 1/R₁ + 1/R₂ + …
4. Challenge — Configure two parallel resistors to draw exactly 4A total
5. Mastery check — Predict split, calculate parallel R, build a parallel circuit

## Problem Types

Slider manipulation, prediction MCQ, tap-to-label junctions

---

# Lesson 4: Equivalent Resistance

## Learning Objective

Learners combine series and parallel rules to simplify mixed circuits into a single equivalent resistance.

## Key Interactions

* **Tap-to-group:** Tap components to mark them as series or parallel groups
* **Step-by-step simplify:** Collapse groups one at a time and watch total R update
* **Drag-and-drop:** Reorder simplification steps (which group to combine first)
* **Circuit builder:** Given a target current, choose series/parallel layout and values

## Steps (Summary)

1. Warm-up — Simplify a circuit with one series pair and one parallel pair
2. Guided simplify — Tap groups in the right order; feedback on each step
3. Discover — Mixed circuits reduce to one R_eq, then Ohm's Law applies
4. Challenge — Simplify a three-resistor mixed circuit and predict total current
5. Mastery check — Simplify, calculate, and verify with the simulator

## Problem Types

Tap-to-group, drag-and-drop step ordering, slider verification

---

# Lesson 5: Power and Energy

## Learning Objective

Learners connect power to everyday observations (brightness, heat) and use P = IV, P = I²R, and P = V²/R.

## Key Interactions

* **Slider:** Adjust voltage or resistance and watch power meter and bulb brightness/heat indicator
* **Prediction:** Which resistor dissipates more power in a given configuration?
* **Match pairs:** Match a circuit setup to its power reading
* **Challenge:** Configure a circuit so the bulb draws exactly 6W

## Steps (Summary)

1. Prediction — "Double the voltage. What happens to power?"
2. Manipulate — Voltage/resistance sliders with live power readout and heat animation
3. Discover — P = IV, and the equivalent forms P = I²R and P = V²/R
4. Challenge — Hit a target power of 6W with a 12V battery
5. Mastery check — Predict, calculate, and configure power

## Problem Types

Slider manipulation, prediction MCQ, match-pairs, target-configuration challenge

---

# Lesson 6: Circuit Challenge Lab

## Learning Objective

Learners apply the full course—Ohm's Law, series, parallel, equivalent resistance, and power—to solve multi-step circuit design puzzles.

## Key Interactions

* **Circuit builder:** Drag batteries, resistors, and bulbs onto a canvas; wire them in series or parallel
* **Live simulation:** Full simulator responds to every placement and value change
* **Multi-goal challenges:** Meet targets for current, equivalent resistance, and power in one circuit
* **Explain-your-work:** After building, answer "Why does this work?" with a structured prompt (hand-written feedback, not AI)

## Steps (Summary)

1. Warm-up — Fix a broken circuit (wrong resistor value) to restore target current
2. Build — Create a circuit with two bulbs in parallel, each at equal brightness
3. Optimize — Given 12V and a 6W target, choose the simplest circuit that works
4. Boss challenge — Three constraints at once: I = 2A, R_eq = 6Ω, P ≤ 24W
5. Mastery check — Free-build and self-check against three verification questions

## Problem Types

Full circuit builder (drag-and-drop), slider fine-tuning, multi-constraint challenge

---

# Interactive Components

Shared across lessons. At least one rich problem type beyond multiple choice in every lesson.

## Circuit Simulator

Inputs: voltage, resistance (single or multi-component)

Outputs: current, bulb brightness, electron flow speed, power (Lesson 5+)

Formula (single-resistor):

```
Current = Voltage / Resistance
```

The simulation updates in real time as learners manipulate controls. Stays at 60 FPS during interaction.

## Voltage Slider

Adjust battery voltage; observe current, brightness, and power changes.

## Resistance Slider

Adjust circuit resistance; observe current and brightness changes.

## Drag-and-Drop Resistor Puzzle

Place resistor values into a circuit to achieve a desired current or power.

## Circuit Builder (Lesson 6)

Drag components onto a canvas, connect in series or parallel, simulate the result.

---

# Content Model

Lessons are a sequence of interactive steps (concept, problem, feedback)—not a blob of HTML. This lets new lessons be added fast and, in Phase 2, potentially AI-generated.

```typescript
type Lesson = {
  id: string;
  title: string;
  order: number;
  steps: Step[];
  masteryThreshold: number; // e.g. 0.7
};

type Step = {
  id: string;
  type: "prediction" | "manipulate" | "discover" | "challenge" | "mastery";
  prompt: string;
  interaction: InteractionConfig;
  feedback: {
    correct: string;
    incorrect: string;
    hint?: string;
  };
};

type InteractionConfig =
  | { kind: "slider"; param: "voltage" | "resistance"; min: number; max: number }
  | { kind: "drag-drop"; options: string[]; target: string }
  | { kind: "tap-label"; nodes: string[] }
  | { kind: "circuit-builder"; constraints: Constraint[] }
  | { kind: "mcq"; options: string[]; correctIndex: number };
```

---

# Progress, Mastery & Course Path

Track what the learner has mastered, fill gaps before they grow, and recommend what to do next.

## Tracked Data

* Current lesson and step
* Completed steps and attempts
* Correct/incorrect answers per step
* Mastery percentage per lesson
* Course-level completion
* Last active date and streak

```typescript
type UserProgress = {
  userId: string;
  lessonId: string;
  currentStep: number;
  completed: boolean;
  masteryScore: number;
  attempts: Record<string, number>;
};

type CourseProgress = {
  userId: string;
  courseId: string;
  unlockedLessons: string[];
  currentLessonId: string;
};
```

## Adaptive Behavior (Phase 1, rule-based)

* Unlock next lesson when mastery ≥ 70%
* If a learner fails a step 3+ times, surface a hint or an easier review step
* On return, resume at the exact step left off
* After completing a lesson, recommend the next lesson in the path

---

# Habit Loop

People learn when they come back. Streaks, milestones, and daily progress are not decoration—they are the difference between an app people open once and one they open every day.

## Streak Tracking

Store last active date and current streak count.

Display: `🔥 3 Day Streak`

## Progress Bar

Per-lesson and course-level:

```
Lesson Progress
██████░░░░ 60%

Course Progress
██░░░░░░░░ 2/6 Lessons
```

## Completion Reward

Upon finishing a lesson:

```
✓ Ohm's Law Mastered

Next Up:
Series Circuits
```

## Milestones

* First lesson complete
* 3-day streak
* Half the course (Lesson 3)
* Course complete (Lesson 6)

---

# Architecture

## Frontend

Renders lesson steps from the content model, captures learner interactions, and drives instant feedback from structured step data.

* Next.js
* React
* TypeScript
* Tailwind CSS

## Backend & Persistence

Progress, streaks, and history survive across sessions and devices.

* Supabase (database + auth)

## Database Tables

| Table | Purpose |
| ----- | ------- |
| Users | Account information |
| Progress | Per-lesson step progress and completion |
| Mastery | Mastery scores per lesson |
| Streaks | Last active date, streak count |

---

# Performance Targets

| Target | Requirement |
| ------ | ----------- |
| Feedback latency | Under 100ms after an answer |
| Interactive visuals | 60 FPS while manipulating |
| Lesson load | Under 2 seconds to first interaction |
| Mobile | Fully usable on phone-sized screens with touch input |
| Concurrency | Multiple learners with no slowdown on deployed app |

---

# MVP Testing Scenarios

We test on the deployed app. A reviewer should be able to:

1. **Complete Lesson 1 end to end** — get some problems wrong and use feedback to recover
2. **Manipulate the simulator** — adjust sliders and watch the visual respond in real time
3. **Leave and return** — exit mid-lesson, come back, confirm progress and streak persist
4. **Finish and see the path** — complete Lesson 1 and see Lesson 2 recommended as next step
5. **Use on mobile** — complete the whole flow on a phone-sized screen

### Full Acceptance Checklist

1. Create an account
2. Start the Circuits Fundamentals course
3. Start the Ohm's Law lesson
4. Manipulate voltage and resistance sliders
5. Observe visual changes in real time
6. Receive immediate, specific feedback
7. Leave the lesson midway
8. Return and resume at the same step
9. Complete the lesson
10. View mastery results and streak update
11. See "Series Circuits" as the next recommended lesson
12. Complete the experience on a mobile-sized screen

---

# Phase 1 Build Order

1. Content model and lesson engine (renders steps, captures interactions, drives feedback)
2. Circuit simulator (sliders, animation, real-time values)
3. Lesson 1 content (all seven steps, hand-written feedback)
4. Auth, progress persistence, and streak tracking
5. Course path UI (lesson list, unlock logic, next-lesson recommendation)
6. Mobile-responsive layout
7. Deploy publicly
8. Lessons 2–6 (same engine, new content and interaction configs)

---

# Future Phases

## Phase 2: AI Features (Friday)

Decide what AI should do here, then build it. Candidates:

* Personalized hints based on mistake patterns
* Adaptive remediation when a learner is stuck
* AI-generated practice problems within the circuit domain

The MVP must already teach effectively without any of this.

## Phase 3: Learning Science (Sunday)

Layer evidence-based techniques on top:

* Spaced repetition for concepts missed repeatedly
* Retrieval practice (quick recall before new material)
* Knowledge tracing to refine the learning path
* Review scheduling based on mastery decay

---

# MVP Requirements Checklist

## Required for Wednesday Gate

- [ ] User authentication
- [ ] One complete interactive lesson (Lesson 1)
- [ ] Interactive circuit simulation with real-time visual response
- [ ] Slider-based manipulation
- [ ] Drag-and-drop problem
- [ ] Instant, hand-written feedback on every answer
- [ ] Progress persistence (resume mid-lesson)
- [ ] Mastery tracking
- [ ] Streak tracking
- [ ] Course path with next-lesson recommendation
- [ ] Mobile responsiveness
- [ ] Public deployment

## Required for Full Phase 1 (Six Lessons)

- [ ] Lessons 2–6 built on the same lesson engine
- [ ] Sequential unlock based on mastery
- [ ] At least one unique rich interaction type per lesson (beyond MCQ)
- [ ] Course completion milestone (Lesson 6)
- [ ] Rule-based remediation (hints after repeated failures)

## Explicitly Not Included Until Phase 2

- [ ] AI tutor
- [ ] LLM-generated content
- [ ] Chatbot assistance
- [ ] AI-generated lessons
