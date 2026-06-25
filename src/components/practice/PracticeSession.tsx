"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Difficulty, GeneratedProblem, PracticeTopic } from "@/lib/ai/types";
import { TOPIC_LABEL } from "@/lib/ai/types";
import { requestPractice } from "@/lib/ai/client";
import { generateProblem } from "@/lib/ai/practice";
import { CalcStep } from "@/components/steps/CalcStep";
import { useAIStatus } from "@/hooks/useAIStatus";

type PracticeSessionProps = {
  lessonId: string;
  topic: PracticeTopic;
  lessonTitle: string;
};

const MAX_LEVEL: Difficulty = 5;

export function PracticeSession({ lessonId, topic, lessonTitle }: PracticeSessionProps) {
  const aiEnabled = useAIStatus();
  const [problem, setProblem] = useState<GeneratedProblem | null>(null);
  const [loading, setLoading] = useState(true);
  const [difficulty, setDifficulty] = useState<Difficulty>(1);
  const [solved, setSolved] = useState(0);
  const [streak, setStreak] = useState(0);
  // Tracks whether the learner missed the current problem at least once.
  const missedCurrent = useRef(false);

  const loadProblem = useCallback(
    async (level: Difficulty) => {
      setLoading(true);
      missedCurrent.current = false;
      try {
        const p = await requestPractice(topic, level);
        setProblem(p);
      } catch {
        // Network failure → generate locally so practice never breaks.
        setProblem(generateProblem(topic, level));
      } finally {
        setLoading(false);
      }
    },
    [topic]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProblem(1);
  }, [loadProblem]);

  const handleComplete = useCallback(
    (correct: boolean) => {
      if (!correct) {
        // CalcStep handles the retry itself; just remember they missed it so we
        // don't escalate difficulty on a struggled-through problem.
        missedCurrent.current = true;
        setStreak(0);
        return;
      }

      const cleanSolve = !missedCurrent.current;
      setSolved((s) => s + 1);
      setStreak((s) => (cleanSolve ? s + 1 : 0));

      // Escalate on a clean solve, ease off slightly after a struggle.
      const nextLevel = (
        cleanSolve
          ? Math.min(MAX_LEVEL, difficulty + 1)
          : Math.max(1, difficulty - 1)
      ) as Difficulty;
      setDifficulty(nextLevel);
      loadProblem(nextLevel);
    },
    [difficulty, loadProblem]
  );

  return (
    <div className="mx-auto max-w-xl px-4 py-6 sm:px-6 lg:py-10">
      <div className="mb-5 flex items-center justify-between">
        <Link
          href={`/lesson/${lessonId}`}
          className="text-sm text-slate-400 hover:text-slate-200"
        >
          ← Back to lesson
        </Link>
        <Link href="/course" className="text-sm text-slate-500 hover:text-slate-300">
          Course
        </Link>
      </div>

      <div className="mb-5">
        <p className="text-xs font-medium uppercase tracking-wide text-sky-400">
          Practice · {TOPIC_LABEL[topic]}
        </p>
        <h1 className="mt-1 text-2xl font-bold">{lessonTitle}</h1>
        <p className="mt-1 text-sm text-slate-400">
          Problems get harder as you get them right. {aiEnabled ? "Fresh scenarios are AI-generated and answer-checked by the circuit engine." : "Endless verified problems — even with AI off."}
        </p>
      </div>

      <div className="mb-5 flex items-center gap-3">
        <LevelMeter level={difficulty} />
        <div className="ml-auto flex gap-4 text-sm">
          <span className="text-slate-400">
            Solved <span className="font-semibold text-slate-200">{solved}</span>
          </span>
          {streak >= 2 && (
            <span className="font-semibold text-orange-300">🔥 {streak} in a row</span>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 sm:p-6">
        {loading || !problem ? (
          <div className="flex items-center justify-center gap-3 py-10 text-slate-400">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-600 border-t-sky-400" />
            Generating a problem…
          </div>
        ) : (
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-sky-400">
              {problem.title}
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
              topic={topic}
              questionPrompt={problem.prompt}
              stepTitle={problem.title}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function LevelMeter({ level }: { level: Difficulty }) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`Difficulty level ${level} of 5`}>
      <span className="mr-1 text-xs text-slate-500">Level</span>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={`h-2.5 w-2.5 rounded-full ${
            n <= level ? "bg-gradient-to-r from-sky-500 to-emerald-400" : "bg-slate-700"
          }`}
        />
      ))}
    </div>
  );
}
