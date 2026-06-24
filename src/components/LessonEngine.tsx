"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Lesson, Step } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { createDefaultProgress } from "@/lib/storage";
import { getNextLesson } from "@/content/course";
import { ProgressBar, FeedbackBanner } from "@/components/ui/FeedbackBanner";
import { McqStep } from "@/components/steps/McqStep";
import {
  SliderStep,
  DualSliderStep,
  SeriesParallelStep,
  CircuitConfigStep,
} from "@/components/steps/InteractiveSteps";
import { DiscoverTableStep, DragDropStep } from "@/components/steps/DiscoverDragSteps";
import { MasteryStep } from "@/components/steps/MasteryStep";
import { CalcStep } from "@/components/steps/CalcStep";
import { GraphStep } from "@/components/steps/GraphStep";
import { ConceptStep } from "@/components/steps/ConceptStep";
import Link from "next/link";

type LessonEngineProps = {
  lesson: Lesson;
};

export function LessonEngine({ lesson }: LessonEngineProps) {
  const { state, updateLessonProgress, completeStep } = useAuth();
  const saved = state?.lessonProgress[lesson.id] ?? createDefaultProgress(lesson.id);
  const [stepIndex, setStepIndex] = useState(saved.currentStep);
  const [showComplete, setShowComplete] = useState(false);
  const [localAttempts, setLocalAttempts] = useState<Record<number, number>>({});

  const mastery = state?.lessonProgress[lesson.id]?.masteryScore ?? saved.masteryScore;
  const passed = mastery >= lesson.masteryThreshold;
  const wasCompleted = saved.completed || passed;

  useEffect(() => {
    if (saved.completed && saved.masteryScore >= lesson.masteryThreshold) {
      setShowComplete(true);
    }
  }, [saved.completed, saved.masteryScore, lesson.masteryThreshold]);

  const step = lesson.steps[stepIndex];
  const progress = (stepIndex + (showComplete ? 1 : 0)) / lesson.steps.length;
  const nextLesson = getNextLesson(lesson.id);
  const masteryQuestions = lesson.steps[lesson.steps.length - 1]?.interaction;
  const masteryTotal =
    masteryQuestions?.kind === "mastery" ? masteryQuestions.questions.length : 3;
  const masteryCorrect = Math.round(mastery * masteryTotal);

  useEffect(() => {
    if (!showComplete) {
      updateLessonProgress(lesson.id, {
        ...saved,
        currentStep: stepIndex,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex, showComplete]);

  const attempts = useMemo(
    () => localAttempts[stepIndex] ?? saved.stepResults[`step-${stepIndex}`]?.attempts ?? 0,
    [localAttempts, stepIndex, saved.stepResults]
  );

  const recordAttempt = useCallback(() => {
    setLocalAttempts((prev) => ({
      ...prev,
      [stepIndex]: (prev[stepIndex] ?? 0) + 1,
    }));
  }, [stepIndex]);

  const startReview = useCallback(() => {
    setShowComplete(false);
    setStepIndex(0);
    setLocalAttempts({});
  }, []);

  const completedSet = useMemo(
    () => new Set(saved.completedStepIndices ?? []),
    [saved.completedStepIndices]
  );
  const maxReached = Math.max(
    stepIndex,
    saved.currentStep ?? 0,
    ...(saved.completedStepIndices?.length ? saved.completedStepIndices : [0])
  );

  const goToStep = useCallback((i: number) => {
    setShowComplete(false);
    setStepIndex(i);
    setLocalAttempts({});
  }, []);

  const retryMastery = useCallback(() => {
    setShowComplete(false);
    setStepIndex(lesson.steps.length - 1);
    setLocalAttempts({});
  }, [lesson.steps.length]);

  const advanceStep = useCallback(
    (correct: boolean, masteryScore?: number) => {
      if (masteryScore !== undefined) {
        completeStep(lesson.id, stepIndex, correct, masteryScore);
        setShowComplete(true);
        return;
      }

      completeStep(lesson.id, stepIndex, correct);

      if (stepIndex + 1 >= lesson.steps.length) {
        setShowComplete(true);
      } else {
        setStepIndex(stepIndex + 1);
      }
    },
    [completeStep, lesson.id, stepIndex]
  );

  if (showComplete) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 lg:py-20">
        <div className="text-center">
          <div className="text-5xl">{passed ? "⚡" : "📖"}</div>
          <h2 className="mt-4 text-2xl font-bold">
            {passed ? `${lesson.title} Mastered` : "Keep Practicing"}
          </h2>
          <p className="mt-2 text-slate-400">
            {passed
              ? "You answered every mastery question correctly."
              : `You got ${masteryCorrect} of ${masteryTotal} mastery questions correct. Get all ${masteryTotal} right to unlock the next lesson.`}
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          {!passed && (
            <button
              type="button"
              onClick={retryMastery}
              className="w-full rounded-xl bg-sky-600 py-3.5 font-medium text-white hover:bg-sky-500"
            >
              Retry Mastery Check
            </button>
          )}

          <button
            type="button"
            onClick={startReview}
            className="w-full rounded-xl border border-slate-600 bg-slate-800/60 py-3.5 font-medium text-slate-200 hover:border-slate-500 hover:bg-slate-800"
          >
            {wasCompleted ? "Review Lesson Again" : "Review Full Lesson"}
          </button>

          {passed && nextLesson && (
            <Link
              href={`/lesson/${nextLesson.id}`}
              className="w-full rounded-xl bg-emerald-600 py-3.5 text-center font-medium text-white hover:bg-emerald-500"
            >
              Start Next Lesson — {nextLesson.title}
            </Link>
          )}

          <Link
            href="/course"
            className="w-full rounded-xl border border-slate-700 py-3.5 text-center text-sm font-medium text-slate-400 hover:border-slate-600 hover:text-slate-300"
          >
            Back to Course
          </Link>
        </div>
      </div>
    );
  }

  if (!step) {
    return (
      <div className="p-8 text-center">
        <p>Lesson complete!</p>
        <Link href="/course" className="text-sky-400 underline">
          Back to Course
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:py-10">
      <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-10">
        {/* Desktop sidebar with step tracker */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-5">
            <Link
              href="/course"
              className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200"
            >
              ← Back to course
            </Link>
            <div>
              <h1 className="text-lg font-bold leading-tight">{lesson.title}</h1>
              <div className="mt-3">
                <ProgressBar value={progress} label="Progress" />
              </div>
            </div>
            <ol className="space-y-1">
              {lesson.steps.map((s, i) => {
                const isDone = completedSet.has(i);
                const isCurrent = i === stepIndex;
                const reachable = i <= maxReached;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      disabled={!reachable}
                      onClick={() => reachable && goToStep(i)}
                      className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition ${
                        isCurrent
                          ? "bg-sky-950/60 text-sky-200 ring-1 ring-sky-500/40"
                          : reachable
                            ? "text-slate-300 hover:bg-slate-800/60"
                            : "cursor-not-allowed text-slate-600"
                      }`}
                    >
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                          isDone
                            ? "bg-emerald-600 text-white"
                            : isCurrent
                              ? "bg-sky-600 text-white"
                              : reachable
                                ? "bg-slate-700 text-slate-300"
                                : "bg-slate-800 text-slate-600"
                        }`}
                      >
                        {isDone ? "✓" : i + 1}
                      </span>
                      <span className="truncate">{s.title}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        </aside>

        {/* Main content */}
        <div className="mx-auto w-full max-w-xl lg:mx-0">
          {/* Mobile header */}
          <div className="mb-6 lg:hidden">
            <div className="mb-1 flex items-center justify-between">
              <Link href="/course" className="text-sm text-slate-400 hover:text-slate-300">
                ← Course
              </Link>
              <span className="text-xs text-slate-500">
                Step {stepIndex + 1}/{lesson.steps.length}
              </span>
            </div>
            <h1 className="text-xl font-bold">{lesson.title}</h1>
            <div className="mt-3">
              <ProgressBar value={progress} label="Lesson Progress" />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 sm:p-6 lg:p-8">
            <p className="text-xs font-medium uppercase tracking-wide text-sky-400">
              {step.title}
            </p>
            <p className="mt-2 mb-5 text-lg leading-relaxed text-slate-200">
              {step.prompt}
            </p>

            <StepRenderer
              key={step.id}
              step={step}
              attempts={attempts}
              onAttempt={recordAttempt}
              onComplete={advanceStep}
              masteryThreshold={lesson.masteryThreshold}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StepRenderer({
  step,
  attempts,
  onAttempt,
  onComplete,
  masteryThreshold,
}: {
  step: Step;
  attempts: number;
  onAttempt: () => void;
  onComplete: (correct: boolean, masteryScore?: number) => void;
  masteryThreshold: number;
}) {
  const { interaction, feedback } = step;

  const wrapComplete = (correct: boolean) => {
    if (!correct) onAttempt();
    if (correct) onComplete(true);
  };

  switch (interaction.kind) {
    case "concept":
      return (
        <ConceptStep interaction={interaction} onComplete={() => onComplete(true)} />
      );
    case "mcq":
      return (
        <McqStep
          interaction={interaction}
          feedback={feedback}
          attempts={attempts}
          onComplete={(correct) => {
            if (!correct) onAttempt();
            else onComplete(true);
          }}
        />
      );
    case "slider":
      return (
        <SliderStep
          interaction={interaction}
          feedback={feedback}
          onComplete={() => onComplete(true)}
        />
      );
    case "dual-slider":
      return (
        <DualSliderStep
          interaction={interaction}
          feedback={feedback}
          attempts={attempts}
          showPower={step.id.startsWith("l5") || step.id.startsWith("l6")}
          onComplete={(correct) => {
            if (!correct) onAttempt();
            else onComplete(true);
          }}
        />
      );
    case "series-sliders":
    case "parallel-sliders":
      return (
        <SeriesParallelStep
          interaction={interaction}
          feedback={feedback}
          onComplete={() => onComplete(true)}
        />
      );
    case "circuit-config":
      return (
        <CircuitConfigStep
          interaction={interaction}
          feedback={feedback}
          attempts={attempts}
          onComplete={wrapComplete}
        />
      );
    case "discover-table":
      return (
        <DiscoverTableStep
          interaction={interaction}
          feedback={feedback}
          onComplete={wrapComplete}
        />
      );
    case "drag-drop":
      return (
        <DragDropStep
          interaction={interaction}
          feedback={feedback}
          attempts={attempts}
          onComplete={wrapComplete}
        />
      );
    case "mastery":
      return (
        <MasteryStep
          questions={interaction.questions}
          feedback={feedback}
          masteryThreshold={masteryThreshold}
          onComplete={(score) => onComplete(score >= masteryThreshold, score)}
        />
      );
    case "numeric-calc":
      return (
        <CalcStep
          interaction={interaction}
          feedback={feedback}
          attempts={attempts}
          onComplete={wrapComplete}
        />
      );
    case "graph":
      return (
        <GraphStep
          interaction={interaction}
          feedback={feedback}
          attempts={attempts}
          onComplete={wrapComplete}
        />
      );
    default:
      return <FeedbackBanner message="Unknown step type" variant="incorrect" />;
  }
}
