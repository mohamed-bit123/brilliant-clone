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
      <div className="mx-auto max-w-lg px-4 py-8">
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
    <div className="mx-auto max-w-lg px-4 py-6">
      <div className="mb-6">
        <div className="mb-1 flex items-center justify-between">
          <Link href="/course" className="text-sm text-slate-400 hover:text-slate-300">
            ← Course
          </Link>
          <span className="text-xs text-slate-500">
            Step {stepIndex + 1}/{lesson.steps.length}
          </span>
        </div>
        <h1 className="text-xl font-bold">{lesson.title}</h1>
        <p className="mt-1 text-sm font-medium text-sky-400">{step.title}</p>
        <div className="mt-3">
          <ProgressBar value={progress} label="Lesson Progress" />
        </div>
      </div>

      <p className="mb-4 leading-relaxed text-slate-300">{step.prompt}</p>

      <StepRenderer
        key={step.id}
        step={step}
        attempts={attempts}
        onAttempt={recordAttempt}
        onComplete={advanceStep}
        masteryThreshold={lesson.masteryThreshold}
      />
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
