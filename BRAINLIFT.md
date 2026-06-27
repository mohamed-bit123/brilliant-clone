# BrainLift: Grounded AI for Learn-by-Doing STEM Education

*Built from the CircuitLab project — a deep, single-subject interactive course on electric circuits with three optional, deterministically-grounded AI features. This document is curated context for reasoning about how to build trustworthy AI in any subject that has a computable ground truth.*

---

## Owners

- **Mohamed Shawgi** — author, engineer, and curriculum designer of CircuitLab.

---

## Purpose

### Purpose

**The purpose of this BrainLift is to redefine how AI should be used inside quantitative ("STEM") education products.** The dominant pattern — bolt a conversational LLM onto a subject and let it both *generate* and *grade* the content — is exactly backwards for any subject that has a ground truth. The thesis I defend: **in any domain where the answer is computable, the LLM must be a language layer over a verified deterministic engine — never the source of truth.** The model phrases, frames, and motivates; a closed-form engine authors and checks every number. AI is layered on only after the core teaches on its own, and only where learning science says a human tutor would add value.

CircuitLab is the artifact that tests the thesis: it teaches introductory circuits to teenagers by letting them manipulate live circuits, then adds AI exactly where a verified engine can keep the model honest — generating practice, hinting without leaking, and explaining a *specific* wrong answer.

### In Scope

- Architecting AI features so a model **cannot** emit a wrong answer in a math/physics subject (grounding, deterministic oracles, leak guardrails, verify-then-accept).
- The learning science of *why* the core works without AI — cognitive load, retrieval practice, spacing, desirable difficulties, mastery, explicit instruction — and which AI features that science actually endorses.
- Designing "genuinely harder" problems (structural/topological complexity) versus "fake harder" problems (trickier wording).
- Turning a learner's mistake into a *structured diagnosis* before any model touches it.
- Spiky points of view a generic AI would not produce if asked "should my ed-tech app have an AI tutor?"

### Out of Scope

- Using AI to **invent** the physics, the numbers, or the correctness judgment. This is the failure mode the whole document exists to avoid.
- A free-form chatbot tutor. Ungrounded chat invites hallucinated physics; explicitly rejected, not merely "not yet built."
- General multi-loop mesh analysis and unequal-EMF parallel sources — beyond the single-loop intro scope of the engine.
- RAG pipelines and vector stores. This is *direct context*, not a retrieval database.
- Breadth across many physics topics. CircuitLab goes deep on one subject by design.

---

## DOK 4: Spiky Points of View (SPOVs)

### SPOV 1 — In a subject with a ground truth, the LLM must never author a number. Most "AI math tutors" are less reliable than a 50-line solver wearing a language coat, and they market the wrong component as the innovation.

The reflexive ed-tech move — "add an AI tutor that answers questions" — is a category error for arithmetic-bearing subjects. Transformers reduce multi-step computation to pattern matching, and their accuracy collapses as problem complexity grows (Dziri et al., *Faith and Fate*, 2023). CircuitLab makes the model **structurally incapable** of handing a learner a wrong answer: closed-form engines (`src/lib/types.ts` for single-loop circuits, `src/lib/network.ts` for series-parallel networks) compute and own every value; the model only ever emits prose. Every AI surface runs the same backbone — **structured state → engine computes/verifies the truth → model writes language → guardrail re-checks against the engine.** This is the program-aided-language-model insight (Gao et al., *PAL*, 2022) taken to its conclusion: don't ask the model to be careful with numbers, *remove its ability to produce them.* The contrarian, defensible claim is that the model's inability to do the math is a feature to celebrate, not a gap to patch — the domain engine both generates and checks, which is simpler and more trustworthy than delegating arithmetic to a general model.

### SPOV 2 — "Adaptive learning paths" are mostly theater for a well-designed curriculum. The only adaptivity that compounds mastery is difficulty escalation *within* a concept, governed by a near-90% success target.

The canonical "good AI ed-tech features" list includes *adapt the path: pick the next lesson based on what the learner struggles with.* I evaluated it and **deliberately cut it.** A coherent intro course is a short, strictly-ordered chain with hard prerequisites — you cannot teach parallel circuits before Ohm's law, or power before current — so a path-adapting AI mostly invents pseudo-personalization to justify itself. The genuinely useful sliver — *escalate when succeeding, ease off when struggling* — is real, and the science is specific about its target: Rosenshine's high-success-rate principle (~80% correct during guided practice) and Bjork's *desirable difficulties* both say keep the learner near the edge of their competence, not lost and not bored. So I shipped it inside the **practice generator** (difficulty climbs on a clean solve, drops after a miss, scaling to university rigor across 8 tiers via `maxLevelForTopic`), not as lesson-graph routing. The same gating enforces an invariant a path-router would violate: **practice never asks about a concept not yet taught** (no power question inside equivalent-resistance practice). Personalization in education is overwhelmingly *vertical* (right difficulty on the next rep), not *horizontal* (clever reordering).

### SPOV 3 — "Harder" must mean *structurally* harder, not *verbally* harder. Left undefined, an AI optimizes the cheapest proxy — longer sentences — and calls it rigor.

When I asked for harder practice, the naive LLM behavior appeared instantly: the *circuits* stayed trivial (two resistors) while the *wording* got trickier. That is fake difficulty — it trains reading comprehension, not circuit reasoning, and it inflates extraneous cognitive load (Sweller) without raising the germane load that builds schemas. Real circuit mastery lives in *topology*: a parallel pair whose combined current then flows through a third resistor; a series-parallel-series "sandwich"; a two-branch ladder. So I built a second engine (`src/lib/network.ts`) that models any series-parallel network as a recursive tree and solves it exactly — equivalent resistance plus current, voltage, and power for *every* resistor — rendered as a real schematic (`NetworkVisual`) with multi-step questions (a branch current, a node voltage, the power dissipated deep inside). The general rule for any AI content generator: define your difficulty axis in terms of the *domain's* irreducible complexity, or the model will scale the proxy that's cheapest to fake.

### SPOV 4 — A wrong answer is a *data structure*, not a vibe. Diagnose it deterministically; let the LLM only do the empathy.

"Explain a wrong answer in plain language" is usually built by handing the wrong answer to an LLM and asking it to guess what happened — which is unreliable and routinely invents a misconception the learner never had. CircuitLab inverts it: a pure-TypeScript **misconception classifier** (`src/lib/ai/diagnose.ts`) *reproduces* the common wrong computations — multiplied instead of divided, used one resistor instead of the combination, treated parallel as series, stopped at an intermediate value like equivalent resistance when a branch current was asked — and matches them against the learner's *actual* number. The diagnosis is computed deterministically; the model only rephrases it warmly and walks the correct *method* without revealing the final number. This is also good pedagogy: feedback is only powerful when it targets the specific error (Bloom's corrective loop; Rosenshine's "check for understanding"), and the trustworthy part of that loop should almost never be the LLM's job. The model is the bedside manner, not the diagnostician.

### SPOV 5 — AI in an education product must be *load-bearing-free*. If pulling the API key degrades the product, the core never actually taught.

The discipline that makes the other four SPOVs safe is a hard rule: **every AI feature degrades to a fully-working non-AI experience.** No key → adaptive practice still runs (engine wording), hints fall back to the authored static hint, "explain my mistake" shows the deterministic diagnosis directly. This is not graceful-degradation hygiene; it is a forcing function on product honesty. Willingham's dictum — *memory is the residue of thought; students remember what they think about* — means the learning happens in the learner's effortful retrieval and manipulation, not in the model's paragraphs. If an app only teaches *with* AI on, the LLM was quietly doing the cognitive work and the "core experience" was a Potemkin village. Building the core to stand alone first (Phase 1, zero AI) and adding AI strictly as additive lift (Phase 2) proves the teaching is real. The implication for builders and funders: "remove the AI and demo it" should be a standard acceptance test — and most AI-education products would fail it.

---

## Experts

### Daniel Willingham
- **Who:** Cognitive psychologist, Professor at the University of Virginia; author of *Why Don't Students Like School?*
- **Focus:** How memory and attention actually work; why factual knowledge precedes skill; "memory is the residue of thought."
- **Why Follow:** The foundational primer on why deep knowledge underpins understanding. It grounds SPOV 5 — the learning is in what the *learner* thinks about, which is why AI must stay additive and never do the thinking.
- **Where:** https://www.danielwillingham.com

### John Sweller & Paul Kirschner
- **Who:** Sweller — originator of Cognitive Load Theory (UNSW). Kirschner — educational psychologist (Open University of the Netherlands), co-author of *How Learning Happens*.
- **Focus:** Working-memory limits; why explicit, guided instruction beats minimal-guidance discovery learning for novices; the worked-example effect.
- **Why Follow:** CLT is the unifying mechanism behind SPOV 3 (don't inflate extraneous load with word-problem obfuscation) and behind the decision to scaffold difficulty rather than drop learners into unguided exploration.
- **Where:** Kirschner, Sweller & Clark (2006) — https://research.ou.nl/ws/files/1015152/Why%20minimal%20guidance%20during%20instruction%20does%20not%20work.pdf

### Barak Rosenshine
- **Who:** Late professor of educational psychology, University of Illinois; author of *Principles of Instruction*.
- **Focus:** Ten research-based instructional principles — daily review, small steps, questioning, models, guided practice, checking for understanding, and a high (~80%) success rate.
- **Why Follow:** The practical "how to teach" checklist. The high-success-rate principle is the direct basis for SPOV 2's difficulty target; "check for understanding" underpins SPOV 4's diagnostic feedback.
- **Where:** Rosenshine (2012), *American Educator* — https://www.aft.org/sites/default/files/Rosenshine.pdf

### Henry Roediger & Robert Bjork
- **Who:** Roediger (Washington University in St. Louis) and Bjork (UCLA) — memory researchers; the retrieval-practice and desirable-difficulties traditions; Roediger co-authored *Make It Stick*.
- **Focus:** Testing as a learning event (not just measurement); spacing; "desirable difficulties" — conditions that slow apparent learning but boost durable retention.
- **Why Follow:** The science that says practice *is* studying and that struggle is productive — the justification for an endless adaptive-practice generator (SPOV 2) instead of more exposition.
- **Where:** Roediger & Karpicke (2006) — https://journals.sagepub.com/doi/pdf/10.1111/j.1467-9280.2006.01693.x

### Richard Hake & Carl Wieman
- **Who:** Hake — physicist who ran the landmark interactive-engagement study. Wieman — Nobel laureate physicist, founder of PhET Interactive Simulations (Stanford/CU Boulder).
- **Focus:** Active/interactive engagement in physics; manipulable simulations; the empirical case that "doing" beats "watching" for conceptual gain.
- **Why Follow:** The empirical spine of CircuitLab's learn-by-doing core (SPOV 5). PhET is the most direct ancestor of CircuitLab's live, manipulable circuit visuals.
- **Where:** PhET — https://phet.colorado.edu ; Hake (1998), *Am. J. Phys.* — https://doi.org/10.1119/1.18809

### Simon Willison
- **Who:** Co-creator of Django; prolific practitioner-writer on applied LLM engineering.
- **Focus:** Treating models as untrusted components; grounding; verifying fact-bearing output; the unreliability of LLM-authored facts.
- **Why Follow:** The engineering articulation of SPOV 1 — "trust the model for language, not for truth." Directly shaped the verify-then-accept guardrails (`scenarioPreservesNumbers`, `hintLeaksAnswer`).
- **Where:** https://simonwillison.net/tags/llms/

---

## DOK 3: Insights

### From cognitive load & working memory
- **Insight 1 — Difficulty is domain-specific, and an undefined "make it harder" prompt inflates *extraneous* load.** Longer word problems raise the load that competes with learning; harder *topologies* raise the germane load that builds circuit schemas. Naming the axis (structural complexity → a recursive network solver) is what produced real rigor. *(→ SPOV 3.)*
- **Insight 2 — Scaffolding and worked examples beat unguided discovery for novices.** Minimal-guidance "let them explore" is inefficient early; CircuitLab guides each step and reveals the idea *after* the manipulation, then fades support as the learner succeeds. *(→ SPOV 2, SPOV 5.)*

### From retrieval practice, spacing & desirable difficulties
- **Insight 3 — An endless, right-difficulty practice stream is a higher-leverage AI feature than any exposition AI.** Retrieval and spacing build durable memory; "the course never runs dry" matters because *more correct, effortful reps* is the active ingredient. *(→ SPOV 2.)*
- **Insight 4 — Productive struggle has a target band, and it is roughly an ~80% success rate.** Too easy wastes reps; too hard triggers failure spirals. The adaptive escalator exists to *hold* the learner in the desirable-difficulty band, not to maximize raw difficulty. *(→ SPOV 2.)*

### From explicit instruction & corrective feedback
- **Insight 5 — Feedback is only powerful when it names the *specific* error, and that diagnosis can be deterministic.** Replaying common wrong procedures and matching the learner's number identifies the misconception far more reliably than asking a model to guess it. *(→ SPOV 4.)*
- **Insight 6 — "Check for understanding" generalizes to software as a verification pass.** Every AI output is re-checked against the engine before the learner sees it — the machine equivalent of a teacher confirming the answer before endorsing it. *(→ SPOV 1, SPOV 4.)*

### From LLM grounding & the limits of transformers
- **Insight 7 — The model should generate *language*; the engine should generate *truth*.** Circuit math is exact closed-form arithmetic, not symbolic algebra, so a tiny domain engine can both author and verify every value, collapsing the model's role to phrasing. *(→ SPOV 1.)*
- **Insight 8 — Verification is cheaper than generation, so make the model propose and the engine dispose.** The asymmetry (hard to generate, trivial to check) is exactly what makes ungrounded-looking features safe: drop a leaking hint, discard a reworded problem that changed a number, reject an explanation that reveals the answer. *(→ SPOV 1.)*

### From product/pedagogy discipline
- **Insight 9 — "Remove the AI" is the truest acceptance test for an AI-education product.** Building Phase 1 with zero AI forced the core to teach on its own; AI added only in Phase 2 is provably additive lift, not a crutch. *(→ SPOV 5.)*
- **Insight 10 — Generated diagrams can leak answers, so they need a "quiz mode."** Network schematics show only the givens (resistor values + battery) and hide computed readings; unknown targets render as "?Ω" rather than vanishing the diagram. The picture must never pre-empt the question. *(→ SPOV 1, SPOV 3.)*

---

## DOK 2: Knowledge Tree

### Category 1: The Cognitive Science of Learning

#### Subcategory 1.1: Working memory & cognitive load
- **Source: Daniel Willingham — *Why Don't Students Like School?***
  - **DOK 1 – Facts:** "Memory is the residue of thought" — we remember what we think about. Working memory is severely limited; long-term factual knowledge is what frees it. Skill (critical thinking) is not generic; it rides on domain knowledge.
  - **DOK 2 – Summary:** Learning happens in the learner's effortful processing, not in the explanation handed to them. This is the cognitive basis for keeping AI additive (it must not do the thinking) and for learn-by-doing over watching.
  - **Link:** https://www.danielwillingham.com
- **Source: Sweller (1988) — *Cognitive Load During Problem Solving*; and Kirschner, Sweller & Clark (2006) — *Why Minimal Guidance Does Not Work***
  - **DOK 1 – Facts:** Working memory holds only a few elements at once. Means-ends problem solving imposes heavy *extraneous* load that crowds out schema formation; *worked examples* reduce it. Minimally-guided/discovery instruction is less effective and less efficient than guided instruction for novices.
  - **DOK 2 – Summary:** Manage load and guide novices explicitly; reserve open exploration for once schemas exist. Justifies CircuitLab's scaffolded steps and the warning against fake "harder = wordier" problems.
  - **Links:** https://onlinelibrary.wiley.com/doi/10.1207/s15516709cog1202_4 · https://research.ou.nl/ws/files/1015152/Why%20minimal%20guidance%20during%20instruction%20does%20not%20work.pdf

#### Subcategory 1.2: What makes learning stick — retrieval, spacing, desirable difficulties
- **Source: Brown, Roediger & McDaniel — *Make It Stick*; Roediger & Karpicke (2006) — *Test-Enhanced Learning***
  - **DOK 1 – Facts:** Retrieval practice (testing) produces far better long-term retention than re-reading; in Roediger & Karpicke, repeated *testing* beat repeated *studying* at a one-week delay even though restudy looked better immediately. Spacing and interleaving outperform massed practice. Rereading creates an "illusion of fluency."
  - **DOK 2 – Summary:** Practice *is* studying; an endless, spaced, retrieval-heavy practice stream is the single highest-leverage learning feature — which is why adaptive practice (not more exposition) was the flagship AI feature.
  - **Link:** https://journals.sagepub.com/doi/pdf/10.1111/j.1467-9280.2006.01693.x
- **Source: Bjork & Bjork (2011) — *Desirable Difficulties*; Dunlosky et al. (2013) — *Improving Students' Learning With Effective Learning Techniques***
  - **DOK 1 – Facts:** Conditions that *slow* apparent learning (spacing, testing, varying) enhance durable retention (storage vs. retrieval strength). Dunlosky's review ranks practice testing and distributed practice as *high*-utility; highlighting, rereading, and summarization as *low*-utility.
  - **DOK 2 – Summary:** Struggle, properly dosed, is the point. The adaptive escalator deliberately keeps the learner in a productive-difficulty band rather than minimizing effort.
  - **Link:** https://www.academia.edu/13564364/Improving_Students_Learning_With_Effective_Learning_Techniques

### Category 2: Effective Instruction & Mastery

- **Source: Rosenshine (2012) — *Principles of Instruction***
  - **DOK 1 – Facts:** Ten principles: begin with short review; present in small steps; ask many questions; provide models; guide practice; check for understanding; obtain a **high success rate (~80%)**; scaffold hard tasks; require independent practice; weekly/monthly review.
  - **DOK 2 – Summary:** The practical teaching checklist. The ~80% success target sets the adaptive-difficulty band (SPOV 2); "check for understanding" maps to the engine verification pass (Insight 6); "provide models" maps to worked solution steps fed (redacted) to the hint/explain features.
  - **Link:** https://www.aft.org/sites/default/files/Rosenshine.pdf
- **Source: Bloom (1984) — *The 2 Sigma Problem***
  - **DOK 1 – Facts:** One-to-one tutoring with mastery feedback moved the average student ~2σ above conventional instruction; mastery learning alone ~1σ. The active ingredients are frequent feedback and *corrective* procedures keyed to specific errors.
  - **DOK 2 – Summary:** The economic case for AI tutoring — and the trap. It licenses error-specific feedback and right-difficulty practice (shipped) but is routinely misread as licensing a chatbot (cut).
  - **Link:** https://web.mit.edu/5.95/readings/bloom-two-sigma.pdf
- **Source: Kirschner & Hendrick — *How Learning Happens***
  - **DOK 1 – Facts:** Maps 32 seminal works to practice; defines learning as a durable change in long-term memory; synthesizes CLT, worked examples, retrieval, and explicit instruction into one framework.
  - **DOK 2 – Summary:** The one-volume map that ties the above sources into a coherent model: explicit instruction + managed load + retrieval/spacing + mastery feedback. CircuitLab's pedagogy is a small, faithful instance of this stack.
  - **Link:** https://www.routledge.com/How-Learning-Happens-Seminal-Works-in-Educational-Psychology-and-What-They-Mean-in-Practice/Kirschner-Hendrick/p/book/9780367184575

### Category 3: Active Learning in Physics (the subject)

- **Source: Hake (1998) — *Interactive-engagement vs. traditional methods***
  - **DOK 1 – Facts:** A survey of 6,542 students across 62 introductory mechanics courses on the Force Concept Inventory found interactive-engagement courses achieved roughly **double** the average normalized gain of traditional lecture (⟨g⟩ ≈ 0.48 vs. ≈ 0.23).
  - **DOK 2 – Summary:** Hard, large-N evidence that interactive engagement beats lecture *in physics specifically*. The empirical mandate for manipulate-and-observe over read-and-watch.
  - **Link:** https://doi.org/10.1119/1.18809
- **Source: Freeman et al. (2014) — *Active learning increases student performance in STEM* (PNAS)**
  - **DOK 1 – Facts:** Meta-analysis of 225 studies: active learning raised average exam scores ~6% and lowered failure rates from ~34% (lecture) to ~22%; students in lecture were ~1.5× more likely to fail.
  - **DOK 2 – Summary:** Generalizes Hake across STEM. Reinforces that the core teaching mechanism — not the AI — must carry the learning.
  - **Link:** https://doi.org/10.1073/pnas.1319030111
- **Source: OpenStax — *University Physics Volume 2*, Ch. 9–10 (CC BY 4.0)**
  - **DOK 1 – Facts:** Ohm's law V = I·R; power P = I·V = I²R = V²/R; series R_total = ΣRᵢ (shared current); parallel 1/R_total = Σ(1/Rᵢ) (shared voltage, R_total < smallest branch); real source terminal voltage V = ε − I·r; Kirchhoff's voltage law Σε = ΣI·R; mixed networks reduce "inside-out."
  - **DOK 2 – Summary:** The openly-licensed ground truth for every number and for Lesson 6 (EMF, internal resistance, KVL). Exact closed-form relations are precisely why a small deterministic engine — not a CAS — can be the single source of truth.
  - **Link:** https://openstax.org/books/university-physics-volume-2

### Category 4: LLMs as Untrusted Reasoners — Grounding & Verification

- **Source: Dziri et al. (2023) — *Faith and Fate: Limits of Transformers on Compositionality***
  - **DOK 1 – Facts:** On multi-step compositional tasks (e.g., multi-digit multiplication, logic puzzles) transformers largely reduce reasoning to subgraph pattern-matching; accuracy degrades sharply as the required number of sequential steps grows, even for very large models.
  - **DOK 2 – Summary:** Empirical backing for "the LLM must not author numbers." Multi-step exact arithmetic is exactly where models break, so circuit answers must come from an engine.
  - **Link:** https://arxiv.org/abs/2305.18654
- **Source: Gao et al. (2022) — *PAL: Program-Aided Language Models***
  - **DOK 1 – Facts:** Having the model emit *reasoning as code* and offloading the actual computation to a deterministic interpreter substantially improves accuracy on math/word-problem benchmarks versus chain-of-thought alone.
  - **DOK 2 – Summary:** The published version of CircuitLab's pattern: the model frames, a deterministic runtime computes. CircuitLab goes one step further — the engine, not generated code, owns and *verifies* every value.
  - **Link:** https://arxiv.org/abs/2211.10435
- **Source: Lightman et al. (2023) — *Let's Verify Step by Step***
  - **DOK 1 – Facts:** Process supervision / verifiers that check each step outperform pure outcome trust; explicit verification of intermediate work improves reliability on hard math.
  - **DOK 2 – Summary:** Justifies the verify-then-accept guardrail layer (`scenarioPreservesNumbers`, `hintLeaksAnswer`) — never trust a fact-bearing LLM output unchecked.
  - **Link:** https://arxiv.org/abs/2305.20050

### Category 5: The CircuitLab Implementation (primary source — this codebase)

- **Source: Deterministic engines — `src/lib/types.ts`, `src/lib/network.ts`**
  - **DOK 1 – Facts:** `types.ts` provides `computeCurrent`, `computePower`, `seriesResistance`, `parallelResistance`, and `solveMultiSource`. `network.ts` models any series-parallel network as a recursive tree and returns R_eq plus per-resistor current/voltage/power, with human-readable reduction steps.
  - **DOK 2 – Summary:** Two domain engines (single-loop/sources and arbitrary series-parallel) own every number and double as the oracle for verification — no CAS required.
- **Source: AI backbone — `src/lib/ai/*`, `src/app/api/ai/*`**
  - **DOK 1 – Facts:** `diagnose.ts` = deterministic misconception classifier + AI-off fallback walkthrough; `practice.ts` = engine-authored, verified problems across topics × 8 difficulty tiers with `maxLevelForTopic` gating untaught concepts; `prompts.ts` = structured hint/explain prompts, `redactAnswerInSteps`, guardrails `hintLeaksAnswer`/`scenarioPreservesNumbers`; `provider.ts` = provider-agnostic (OpenAI default `gpt-4o-mini`, Anthropic, Gemini) via one env var, keys server-only; route handlers keep keys out of the client bundle.
  - **DOK 2 – Summary:** Shared pattern — structured state → engine truth → model language → guardrail re-check — with a fully-working AI-off fallback for every feature, so AI is additive, never load-bearing.
- **Source: Curriculum & visualization — `src/content/lessons/*`, `CircuitVisual.tsx`, `NetworkVisual.tsx`, `MultiSourceVisual.tsx`**
  - **DOK 1 – Facts:** Seven-lesson prerequisite chain (Ohm → Series → Parallel → Equivalent Resistance → Power → Multiple Sources → Challenge Lab). Visuals run in "quiz" mode hiding computed readings and masking unknown resistors as "?Ω"; parallel branches animate current in *both* branches. Original lessons keep simple two-resistor templates; only AI practice escalates to complex networks.
  - **DOK 2 – Summary:** A linear, prerequisite-chained course (motivating the cut of path-adaptation) with answer-safe diagrams by construction (Insight 10).

---

*The spiky points of view above are the deliverable; the Experts, Insights, and Knowledge Tree exist to defend them. The throughline: build the core so it teaches without AI (cognitive science), then add AI only as a verified language layer over a deterministic engine (grounding science) — never as the source of truth.*
