"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Difficulty, GeneratedProblem } from "@/lib/ai/types";
import { requestPractice } from "@/lib/ai/client";
import { generateProblem } from "@/lib/ai/practice";
import {
  CONCEPT_LABEL,
  dueConcepts,
  introducedConcepts,
  reviewDifficulty,
  strength,
  todayISO,
  type ConceptId,
  type ConceptMemory,
} from "@/lib/review";
import { CalcStep } from "@/components/steps/CalcStep";
import { useAuth } from "@/context/AuthContext";
import { useAIStatus } from "@/hooks/useAIStatus";

type QueueItem = { concept: ConceptId; difficulty: Difficulty };

/** Fisher–Yates shuffle so problem types interleave instead of grouping. */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQueue(
  due: ConceptMemory[],
  introduced: ConceptMemory[]
): { items: QueueItem[]; mode: "due" | "extra" } {
  if (due.length > 0) {
    // Interleave the due concepts so consecutive problems differ in type.
    return {
      items: shuffle(due).map((m) => ({
        concept: m.concept,
        difficulty: reviewDifficulty(m),
      })),
      mode: "due",
    };
  }
  // Nothing due — offer a short refresher on the weakest few concepts.
  const weakest = [...introduced]
    .sort((a, b) => strength(a) - strength(b))
    .slice(0, Math.min(4, introduced.length));
  return {
    items: shuffle(weakest).map((m) => ({
      concept: m.concept,
      difficulty: reviewDifficulty(m),
    })),
    mode: "extra",
  };
}

export function ReviewSession() {
  const { state, recordReview, noteReviewSession } = useAuth();
  const aiEnabled = useAIStatus();

  // Snapshot the queue + "before" strengths once (lazy initializer runs a
  // single time), so recording results mid-session doesn't reshuffle the queue.
  const [snapshot] = useState<{
    items: QueueItem[];
    mode: "due" | "extra";
    before: Partial<Record<ConceptId, number>>;
  }>(() => {
    const review = state?.review;
    const today = todayISO();
    const introduced = introducedConcepts(review);
    const built = buildQueue(dueConcepts(review, today), introduced);
    const before: Partial<Record<ConceptId, number>> = {};
    for (const m of introduced) before[m.concept] = strength(m, today);
    return { items: built.items, mode: built.mode, before };
  });
  const { items, mode, before } = snapshot;

  const [index, setIndex] = useState(0);
  const [problem, setProblem] = useState<GeneratedProblem | null>(null);
  const [loading, setLoading] = useState(items.length > 0);
  const [results, setResults] = useState<{ concept: ConceptId; correct: boolean }[]>([]);
  const missedCurrent = useRef(false);
  const noted = useRef(false);

  const current = items[index];
  const done = index >= items.length;

  const loadProblem = useCallback(async (item: QueueItem) => {
    setLoading(true);
    missedCurrent.current = false;
    try {
      setProblem(await requestPractice(item.concept, item.difficulty));
    } catch {
      setProblem(generateProblem(item.concept, item.difficulty));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (current) loadProblem(current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  // Mark the session as run once we reach the summary.
  useEffect(() => {
    if (done && items.length > 0 && !noted.current) {
      noted.current = true;
      noteReviewSession();
    }
  }, [done, items.length, noteReviewSession]);

  const handleComplete = useCallback(
    (correct: boolean) => {
      if (!correct) {
        missedCurrent.current = true;
        return; // CalcStep keeps the learner on this problem to retry
      }
      const clean = !missedCurrent.current;
      recordReview(current.concept, clean);
      setResults((r) => [...r, { concept: current.concept, correct: clean }]);
      setIndex((i) => i + 1);
    },
    [current, recordReview]
  );

  // --- Empty state: no concepts learned yet ---
  if (items.length === 0) {
    return (
      <Shell>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center">
          <div className="text-4xl">🌱</div>
          <h2 className="mt-3 text-xl font-bold">Nothing to review yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-400">
            Master your first lesson and its concept will start showing up here for
            spaced review.
          </p>
          <Link
            href="/course"
            className="mt-6 inline-block rounded-xl bg-sky-600 px-5 py-3 font-medium text-white hover:bg-sky-500"
          >
            Go to the course
          </Link>
        </div>
      </Shell>
    );
  }

  // --- Summary state ---
  if (done) {
    const correctCount = results.filter((r) => r.correct).length;
    return (
      <Shell>
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/20 p-6 text-center sm:p-8">
          <div className="text-4xl">✅</div>
          <h2 className="mt-3 text-2xl font-bold">Review complete</h2>
          <p className="mt-2 text-slate-300">
            You recalled <span className="font-semibold text-emerald-300">{correctCount}</span>{" "}
            of <span className="font-semibold">{results.length}</span> concepts cleanly.
            Spaced out, the ones you nailed won&apos;t come back for a while — the ones
            you missed will return sooner.
          </p>

          <ul className="mx-auto mt-6 max-w-sm space-y-2 text-left">
            {results.map((r, i) => {
              const mem = state?.review?.concepts?.[r.concept];
              const after = mem ? strength(mem) : 0;
              const delta = after - (before[r.concept] ?? 0);
              return (
                <li
                  key={`${r.concept}-${i}`}
                  className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm"
                >
                  <span className="flex items-center gap-2">
                    <span aria-hidden>{r.correct ? "✓" : "↻"}</span>
                    {CONCEPT_LABEL[r.concept]}
                  </span>
                  <span className="flex items-center gap-2">
                    <StrengthDot value={after} />
                    <span
                      className={`text-xs ${delta >= 0 ? "text-emerald-400" : "text-amber-400"}`}
                    >
                      {delta >= 0 ? "+" : ""}
                      {Math.round(delta * 100)}%
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="mt-7 flex flex-col gap-3">
            <Link
              href="/course"
              className="rounded-xl bg-emerald-600 py-3 font-medium text-white hover:bg-emerald-500"
            >
              Back to course
            </Link>
          </div>
        </div>
      </Shell>
    );
  }

  // --- Active question ---
  return (
    <Shell>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-violet-300">
          {mode === "due" ? "Daily Review · due now" : "Refresher · weakest concepts"}
        </p>
        <span className="text-sm text-slate-400">
          {index + 1} / {items.length}
        </span>
      </div>

      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-sky-400 transition-all"
          style={{ width: `${(index / items.length) * 100}%` }}
        />
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 sm:p-6">
        {loading || !problem ? (
          <div className="flex items-center justify-center gap-3 py-10 text-slate-400">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-600 border-t-violet-400" />
            Pulling up a problem…
          </div>
        ) : (
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-violet-300">
              {CONCEPT_LABEL[current.concept]}
            </p>
            {problem.scenario && (
              <p className="mb-2 text-sm italic text-slate-400">{problem.scenario}</p>
            )}
            <p className="mb-5 text-lg leading-relaxed text-slate-200">{problem.prompt}</p>
            <CalcStep
              key={problem.id}
              interaction={problem.interaction}
              feedback={problem.feedback}
              attempts={0}
              onComplete={handleComplete}
              topic={current.concept}
              questionPrompt={problem.prompt}
              stepTitle={problem.title}
              solutionSteps={problem.solution.steps}
              quizVisual
            />
          </div>
        )}
      </div>

      <p className="mt-4 text-center text-xs text-slate-400">
        Mixed concepts, recalled from memory.{" "}
        {aiEnabled ? "Scenarios are AI-generated and engine-verified." : "Verified by the circuit engine — works with AI off."}
      </p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-6 sm:px-6 lg:py-10">
      <div className="mb-5 flex items-center justify-between">
        <Link href="/course" className="text-sm text-slate-400 hover:text-slate-200">
          ← Course
        </Link>
      </div>
      <h1 className="mb-5 text-2xl font-bold">Daily Review</h1>
      {children}
    </div>
  );
}

function StrengthDot({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color =
    value >= 0.66 ? "bg-emerald-400" : value >= 0.33 ? "bg-amber-400" : "bg-rose-400";
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {pct}%
    </span>
  );
}
