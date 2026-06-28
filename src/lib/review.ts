import type { Difficulty, PracticeTopic } from "@/lib/ai/types";
import { maxLevelForTopic, TOPIC_LABEL } from "@/lib/ai/types";

/**
 * Phase 3 — spaced repetition + interleaving memory model.
 *
 * A "concept" is one of the course's recurring ideas (a PracticeTopic minus the
 * meta "mixed"). Each concept the learner has been taught gets a ConceptMemory
 * scheduled with a Leitner-box algorithm: a correct recall promotes it to a
 * longer interval, a miss demotes it so it resurfaces sooner. This is the
 * deterministic substrate the Daily Review and the retention dashboard read
 * from — no AI involved, so it works with AI off.
 */

export type ConceptId =
  | "ohms"
  | "series"
  | "parallel"
  | "equivalent"
  | "power"
  | "sources";

/** Ordered list of schedulable concepts (matches lesson order). */
export const CONCEPTS: ConceptId[] = [
  "ohms",
  "series",
  "parallel",
  "equivalent",
  "power",
  "sources",
];

export const CONCEPT_LABEL: Record<ConceptId, string> = {
  ohms: TOPIC_LABEL.ohms,
  series: TOPIC_LABEL.series,
  parallel: TOPIC_LABEL.parallel,
  equivalent: TOPIC_LABEL.equivalent,
  power: TOPIC_LABEL.power,
  sources: TOPIC_LABEL.sources,
};

/** The lesson that teaches each concept (inverse of LESSON_TOPIC, minus mixed). */
export const CONCEPT_LESSON: Record<ConceptId, string> = {
  ohms: "lesson-1",
  series: "lesson-2",
  parallel: "lesson-3",
  equivalent: "lesson-4",
  power: "lesson-5",
  sources: "lesson-7",
};

export function isConcept(topic: PracticeTopic): topic is ConceptId {
  return topic !== "mixed";
}

export type ConceptMemory = {
  concept: ConceptId;
  /** Leitner box 0..5. Higher = stronger, longer interval. */
  box: number;
  /** ISO yyyy-mm-dd of the last review, or "" if only just introduced. */
  lastReviewed: string;
  /** ISO yyyy-mm-dd this concept next becomes due. */
  dueDate: string;
  /** Total reviews and correct reviews (for the accuracy figure). */
  seen: number;
  correct: number;
  /** Recent correctness, newest last, capped at HISTORY_CAP. */
  history: boolean[];
};

export type ReviewState = {
  concepts: Partial<Record<ConceptId, ConceptMemory>>;
  /** ISO yyyy-mm-dd a Daily Review last ran (for "reviewed today"). */
  lastReviewDate?: string;
};

export const MAX_BOX = 5;
const HISTORY_CAP = 8;

/** Days until a concept in each box is due again (index = box). */
const BOX_INTERVAL_DAYS = [0, 1, 3, 7, 14, 30];

// --- date helpers (UTC day granularity, matching storage.ts) ---------------

export function todayISO(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function addDaysISO(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Whole days from `a` to `b` (b − a); negative if b precedes a. */
function daysBetween(a: string, b: string): number {
  const ms =
    new Date(`${b}T00:00:00Z`).getTime() - new Date(`${a}T00:00:00Z`).getTime();
  return Math.round(ms / 86_400_000);
}

// --- core scheduler ---------------------------------------------------------

export function emptyReview(): ReviewState {
  return { concepts: {} };
}

/**
 * Coerces any persisted/legacy value into a valid ReviewState. Older saves and
 * the Supabase `'{}'` column default lack a `concepts` map, which would crash
 * reads like `review.concepts[id]`; this guarantees the shape.
 */
export function normalizeReview(review: ReviewState | undefined | null): ReviewState {
  if (!review || typeof review !== "object" || !review.concepts) {
    return { concepts: {}, lastReviewDate: review?.lastReviewDate };
  }
  return review;
}

function freshMemory(concept: ConceptId, today: string): ConceptMemory {
  return {
    concept,
    box: 0,
    lastReviewed: "",
    dueDate: today,
    seen: 0,
    correct: 0,
    history: [],
  };
}

/** Applies one recall outcome to a memory and reschedules it. Pure. */
export function applyResult(
  mem: ConceptMemory,
  correct: boolean,
  today: string
): ConceptMemory {
  // Correct → promote one box; miss → drop two so it resurfaces sooner.
  const box = correct
    ? Math.min(MAX_BOX, mem.box + 1)
    : Math.max(0, mem.box - 2);
  const history = [...mem.history, correct].slice(-HISTORY_CAP);
  return {
    ...mem,
    box,
    lastReviewed: today,
    dueDate: addDaysISO(today, BOX_INTERVAL_DAYS[box]),
    seen: mem.seen + 1,
    correct: mem.correct + (correct ? 1 : 0),
    history,
  };
}

/**
 * Records a recall result for a concept, introducing it if unseen. Returns a
 * new ReviewState (immutable). Used both when a lesson is mastered (seeds the
 * concept as a correct first exposure) and after each Daily Review answer.
 */
export function recordResult(
  review: ReviewState | undefined,
  concept: ConceptId,
  correct: boolean,
  today = todayISO()
): ReviewState {
  const base = normalizeReview(review);
  const existing = base.concepts[concept] ?? freshMemory(concept, today);
  return {
    ...base,
    concepts: {
      ...base.concepts,
      [concept]: applyResult(existing, correct, today),
    },
  };
}

/** Marks that a Daily Review session ran today. */
export function markReviewedToday(
  review: ReviewState | undefined,
  today = todayISO()
): ReviewState {
  return { ...normalizeReview(review), lastReviewDate: today };
}

// --- read models for UI -----------------------------------------------------

export function isDue(mem: ConceptMemory, today = todayISO()): boolean {
  return daysBetween(mem.dueDate, today) >= 0;
}

/** Days until this concept is next due. <= 0 means it's due now/overdue. */
export function daysUntilDue(mem: ConceptMemory, today = todayISO()): number {
  return daysBetween(today, mem.dueDate);
}

/**
 * Estimated retention 0..1 for the dashboard. Base strength comes from the box
 * (how many successful spaced recalls); it decays once a concept is overdue, so
 * the bar visibly drops the longer a learner neglects a due concept.
 */
export function strength(mem: ConceptMemory, today = todayISO()): number {
  const base = mem.box / MAX_BOX;
  const overdue = daysBetween(mem.dueDate, today); // >0 means overdue
  if (overdue <= 0) return base;
  const interval = Math.max(1, BOX_INTERVAL_DAYS[mem.box]);
  const decay = Math.min(1, overdue / (interval * 2)); // fully decayed at 2× interval
  return Math.max(0, base * (1 - 0.6 * decay));
}

export function accuracy(mem: ConceptMemory): number {
  return mem.seen === 0 ? 0 : mem.correct / mem.seen;
}

/** Concepts the learner has been introduced to, in course order. */
export function introducedConcepts(review: ReviewState | undefined): ConceptMemory[] {
  const r = normalizeReview(review);
  return CONCEPTS.map((c) => r.concepts[c]).filter(
    (m): m is ConceptMemory => Boolean(m)
  );
}

/**
 * Due concepts, weakest/most-overdue first — the queue the Daily Review pulls
 * from. Interleaving is applied by the session on top of this ordering.
 */
export function dueConcepts(
  review: ReviewState | undefined,
  today = todayISO()
): ConceptMemory[] {
  return introducedConcepts(review)
    .filter((m) => isDue(m, today))
    .sort((a, b) => {
      const overdueA = daysBetween(a.dueDate, today);
      const overdueB = daysBetween(b.dueDate, today);
      if (overdueB !== overdueA) return overdueB - overdueA; // more overdue first
      return strength(a, today) - strength(b, today); // then weaker first
    });
}

export function dueCount(review: ReviewState | undefined, today = todayISO()): number {
  return dueConcepts(review, today).length;
}

/** Difficulty to pitch a review problem at, scaled by the concept's strength. */
export function reviewDifficulty(mem: ConceptMemory): Difficulty {
  const cap = maxLevelForTopic(mem.concept);
  const level = Math.min(cap, Math.max(1, mem.box + 1));
  return level as Difficulty;
}

/** Overall retention across introduced concepts (0..1), for the headline stat. */
export function overallRetention(
  review: ReviewState | undefined,
  today = todayISO()
): number {
  const items = introducedConcepts(review);
  if (items.length === 0) return 0;
  return items.reduce((s, m) => s + strength(m, today), 0) / items.length;
}
