# BRAINLIFT — CircuitLab Phase 2 (AI)

This is the decision record for adding AI to CircuitLab. The MVP already teaches
circuits well on its own; Phase 2 adds AI **only** where it genuinely improves
learning, and only as additions that the app keeps working without.

## Guiding principles

1. **Ground everything in structured state, never raw text.** Every AI call is
   fed a typed JSON object built from the lesson's interaction config and the
   deterministic circuit engine — not lesson prose.
2. **The engine owns every number.** Circuit math (`computeCurrent`,
   `computePower`, `seriesResistance`, `parallelResistance` in `src/lib/types.ts`)
   is exact closed-form arithmetic. It is the single source of truth for every
   answer and the oracle that verifies anything the model produces. The model
   only ever generates *language*. This is why no AI feature can give a wrong
   answer — there is no path for the model to author a numeric result.
3. **AI is additive, never load-bearing.** With no API key, all three features
   degrade to a fully-working non-AI experience.

## What we considered

| Candidate | Verdict | Why |
|---|---|---|
| Generate new practice problems at the right difficulty | **Shipped (#3)** | The subject is perfectly parametric and the engine guarantees correctness. Highest "course never runs dry" value. The user also ranked this #1. |
| Targeted hint when stuck (no answer) | **Shipped (#2)** | We already track per-step attempts; structured state + a leak guardrail make this safe and high-value. |
| Explain a wrong answer, tuned to what the learner did | **Shipped (#1)** | A deterministic misconception classifier diagnoses the *specific* error; the model only phrases it. Highest pedagogical value. |
| Adapt the path / pick the next lesson | **Deliberately cut** | The course is a short, strictly linear chain with hard prerequisites (you can't teach parallel before Ohm's law). There's almost nothing to reorder. The *useful* sliver — escalate when the learner is succeeding — is folded into the adaptive difficulty of #3. |
| General chatbot | **Deliberately cut** | Ungrounded, invites hallucinated physics. Explicitly avoided. |

## What we shipped

All three features share one backbone:
**structured state → engine computes/verifies the truth → model writes prose → guardrail re-checks against the engine.**

### 1. Explain my mistake (`/api/ai/explain`)
- A pure-TS **misconception classifier** (`src/lib/ai/diagnose.ts`) reproduces
  common wrong computations (multiplied instead of divided, used one resistor,
  treated parallel as series, stopped at current for a power question, etc.) and
  matches them against the learner's actual answer.
- The model receives the diagnosis and only rephrases it. It is instructed not to
  reveal the final number, and a guardrail rejects any explanation that leaks it.
- AI off → the deterministic diagnosis is shown directly.

### 2. Smart hints (`/api/ai/hint`)
- Triggered after the learner has attempted a numeric step.
- The model gets the grounded context (givens, what's being solved for, the
  verified answer, the worked method) and must produce a single next-step nudge.
- **Hard guardrail** (`hintLeaksAnswer`): if the hint contains the answer value,
  it is discarded and a non-leaking fallback (the method/formula) is shown.
- AI off → the existing static `feedback.hint` is shown.

### 3. Adaptive practice (`/api/ai/practice`, `PracticeSession`)
- Each lesson has a "Practice more" mode (entry points on the lesson completion
  screen, the lesson sidebar, and each unlocked course card).
- The **engine authors the problem**: `src/lib/ai/practice.ts` generates verified,
  clean problems per topic (Ohm's law, series, parallel, equivalent resistance,
  power, multiple voltage sources, mixed) across five difficulty tiers, building
  problems "backward" from clean operands so answers stay tidy.
- Difficulty **escalates on a clean solve and eases off after a struggle**, so it
  gets "harder and harder" as the learner succeeds — this is the absorbed part of
  the adaptive-path idea.
- The **top tiers reach university-introductory rigor** (in response to feedback
  that the easy questions don't build real mastery): battery charging with
  opposing EMFs, parallel cells with combined internal resistance, and full
  Kirchhoff's-voltage-law synthesis. Early tiers stay gentle so the ramp is real.
- **Genuinely harder _circuits_, not just harder wording** (in response to
  feedback that complexity had been coming from trickier phrasing): a second
  engine, `src/lib/network.ts`, models any series-parallel network as a recursive
  tree and solves it exactly — equivalent resistance plus the current, voltage,
  and power for every individual resistor. The harder `equivalent`-topic tiers now
  build real topologies (a parallel pair feeding a series resistor, a sandwich of
  series/parallel/series, a two-branch ladder), render them as actual schematics
  via `NetworkVisual`, and ask multi-step questions — a branch current, a node
  voltage, or the power dissipated deep in the network. The original lessons keep
  their simple two-resistor templates; only the extra AI practice escalates.
- **No answer leakage from diagrams**: network schematics run in "quiz" mode that
  shows only the givens (resistor values + battery), never the computed readings,
  and AI scenario rewording is skipped for diagram problems so the wording can't
  contradict the picture.
- When AI is on, the model only adds a **real-world scenario / rewording**; a
  verifier (`scenarioPreservesNumbers`) confirms every original number survived,
  otherwise the engine's wording is kept. The numbers and answer always come from
  the engine.
- AI off → identical problems with the engine's own wording. Practice never runs
  dry either way.

## Architecture notes

- **Provider-agnostic** (`src/lib/ai/provider.ts`): one env var picks the backend.
  `AI_PROVIDER=openai` (default, model `gpt-4o-mini`), `anthropic` (Claude), or
  `gemini` — supply the matching key and no code changes are needed. If
  `AI_PROVIDER` is unset it auto-selects whichever key is present.
- **Keys are server-only.** All AI calls run in Next.js route handlers under
  `src/app/api/ai/`. The key is never `NEXT_PUBLIC_` and never reaches the client
  bundle. The client learns whether AI is on via `GET /api/ai/status`.
- **Why no SymPy/math.js?** The circuit math is exact closed-form arithmetic, not
  symbolic algebra. Domain-specific verified engines (`types.ts` for single-loop
  circuits, `network.ts` for series-parallel networks) are stronger and simpler
  than delegating arithmetic to a general CAS — they both generate and check every
  value.

## Deliberately left out (for now)

- AI hints/explanations on MCQ and interactive (slider/config) steps — v1 focuses
  AI on numeric calculation steps and practice, where misconceptions are
  mathematical and verification is crisp.
- Lesson reordering / path adaptation (see table above).
- A free-form chat tutor.
- Unequal-EMF parallel sources and general multi-loop mesh analysis — these need
  simultaneous-equation solving beyond an intro single-loop treatment; the new
  lesson and its generator stay within one-loop KVL and identical parallel cells.

## Content expansion shipped alongside Phase 2

- **Lesson 6 — Multiple Voltage Sources** (the topic learners find most
  confusing): EMF vs. terminal voltage, internal resistance (V = ε − I·r),
  series-aiding/opposing sources (battery charging), identical parallel cells,
  and Kirchhoff's voltage law. A new `MultiSourceVisual` component draws one-
  and two-source loops; `solveMultiSource` in `types.ts` is the verified engine
  for this topic and powers the new `sources` practice generator. Physics is
  grounded in OpenStax *University Physics Vol. 2*, Ch. 10 (CC-licensed) rather
  than any copyrighted textbook.

## Future ideas

- Extend grounded hints to MCQ/interactive steps.
- Unequal-EMF parallel sources and multi-loop mesh analysis (would need a small
  linear-system solver added to the engine).
- Spaced-repetition review that resurfaces a learner's historically-missed topics
  (keys off `stepResults`, which we already persist).
