"use client";

import { useState } from "react";
import type { InteractionConfig } from "@/lib/types";
import type { PracticeTopic } from "@/lib/ai/types";
import { FeedbackBanner } from "@/components/ui/FeedbackBanner";
import { CircuitVisual, previewResistance } from "@/components/CircuitVisual";
import { useAIStatus } from "@/hooks/useAIStatus";
import { contextFromNumeric } from "@/lib/ai/context";
import { AIHint, AIExplain } from "@/components/ai/AITutor";

type CalcStepProps = {
  interaction: Extract<InteractionConfig, { kind: "numeric-calc" }>;
  feedback: { correct: string; incorrect: string; hint?: string };
  onComplete: (correct: boolean) => void;
  attempts: number;
  /** When set (with AI configured), enables grounded AI hints + explanations. */
  topic?: PracticeTopic;
  questionPrompt?: string;
  stepTitle?: string;
};

const SOLVE_LABELS: Record<
  Extract<InteractionConfig, { kind: "numeric-calc" }>["solveFor"],
  string
> = {
  current: "Current (A)",
  voltage: "Voltage (V)",
  resistance: "Resistance (Ω)",
  power: "Power (W)",
  rTotal: "Total resistance (Ω)",
  branchCurrent: "Branch current (A)",
};

export function CalcStep({
  interaction,
  feedback,
  onComplete,
  attempts,
  topic,
  questionPrompt,
  stepTitle,
}: CalcStepProps) {
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [wrongCount, setWrongCount] = useState(0);
  const aiEnabled = useAIStatus();

  const num = parseFloat(value);
  const tol = interaction.tolerance ?? 0.15;
  const isCorrect =
    !Number.isNaN(num) &&
    Math.abs(num - interaction.correctAnswer) <= tol;

  const aiReady = aiEnabled && Boolean(topic);
  const baseContext = topic
    ? contextFromNumeric(interaction, {
        topic,
        prompt: questionPrompt ?? stepTitle ?? "this problem",
        stepTitle: stepTitle ?? "Practice",
        attempts,
      })
    : null;

  const preview = interaction.circuitPreview;
  const branchLabel =
    interaction.solveFor === "branchCurrent" && interaction.branchIndex
      ? ` (Branch ${interaction.branchIndex === 1 ? "A" : "B"})`
      : "";

  return (
    <div>
      {preview && (
        <div className="mb-4">
          <CircuitVisual
            mode={preview.mode}
            voltage={preview.voltage}
            resistance={previewResistance(preview)}
            r1={preview.r1}
            r2={preview.r2}
            maskSolveFor={interaction.solveFor}
            maskBranchIndex={interaction.branchIndex}
          />
        </div>
      )}

      <div className="mb-4 rounded-xl border border-slate-600 bg-slate-800/50 p-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-400">
          Given
        </p>
        <div className="grid grid-cols-2 gap-2">
          {interaction.givens.map((g) => (
            <div key={g.label} className="rounded-lg bg-slate-900/60 px-3 py-2">
              <div className="text-xs text-slate-500">{g.label}</div>
              <div className="font-mono text-sm text-slate-200">
                {g.value} {g.unit}
              </div>
            </div>
          ))}
        </div>
      </div>

      <label className="mb-2 block text-sm text-slate-300">
        Calculate:{" "}
        <span className="font-medium text-sky-400">
          {SOLVE_LABELS[interaction.solveFor]}
          {branchLabel}
        </span>
      </label>
      <input
        type="number"
        step="any"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={`Answer in ${interaction.answerUnit}`}
        disabled={submitted && isCorrect}
        className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 font-mono outline-none focus:border-sky-500"
      />

      {!submitted && (
        <>
          <button
            type="button"
            disabled={value.trim() === ""}
            onClick={() => setSubmitted(true)}
            className="mt-4 w-full rounded-xl bg-sky-600 py-3 font-medium text-white disabled:opacity-40 hover:bg-sky-500"
          >
            Check Answer
          </button>
          {aiReady && baseContext && (attempts >= 1 || wrongCount >= 1) && (
            <AIHint key={wrongCount} context={baseContext} />
          )}
          {!aiReady && attempts >= 2 && feedback.hint && !showHint && (
            <button
              type="button"
              onClick={() => setShowHint(true)}
              className="mt-3 text-sm text-amber-400 underline"
            >
              Show hint
            </button>
          )}
          {!aiReady && showHint && feedback.hint && (
            <FeedbackBanner message={feedback.hint} variant="hint" />
          )}
        </>
      )}

      {submitted && (
        <FeedbackBanner
          message={isCorrect ? feedback.correct : feedback.incorrect}
          variant={isCorrect ? "correct" : "incorrect"}
        />
      )}

      {submitted && isCorrect && (
        <button
          type="button"
          onClick={() => onComplete(true)}
          className="mt-4 w-full rounded-xl bg-emerald-600 py-3 font-medium text-white hover:bg-emerald-500"
        >
          Continue
        </button>
      )}

      {submitted && !isCorrect && aiReady && baseContext && (
        <AIExplain context={{ ...baseContext, learnerAnswer: num }} />
      )}

      {submitted && !isCorrect && (
        <button
          type="button"
          onClick={() => {
            onComplete(false);
            setWrongCount((c) => c + 1);
            setValue("");
            setSubmitted(false);
            setShowHint(false);
          }}
          className="mt-4 w-full rounded-xl bg-slate-600 py-3 font-medium text-white hover:bg-slate-500"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
