"use client";

import { useState } from "react";
import type { InteractionConfig } from "@/lib/types";
import { FeedbackBanner } from "@/components/ui/FeedbackBanner";
import { CircuitVisual, previewResistance } from "@/components/CircuitVisual";

type McqStepProps = {
  interaction: Extract<InteractionConfig, { kind: "mcq" }>;
  feedback: { correct: string; incorrect: string; hint?: string };
  onComplete: (correct: boolean) => void;
  attempts: number;
};

export function McqStep({ interaction, feedback, onComplete, attempts }: McqStepProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const isCorrect = selected === interaction.correctIndex;

  function handleSubmit() {
    if (selected === null) return;
    setSubmitted(true);
  }

  const preview = interaction.circuitPreview;

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
          />
        </div>
      )}
      <div className="flex flex-col gap-2">
        {interaction.options.map((opt, i) => (
          <button
            key={opt}
            type="button"
            disabled={submitted && isCorrect}
            onClick={() => !submitted && setSelected(i)}
            className={`rounded-xl border px-4 py-3 text-left text-sm transition-all ${
              selected === i
                ? submitted
                  ? isCorrect
                    ? "border-emerald-500 bg-emerald-950/50"
                    : "border-red-500 bg-red-950/50"
                  : "border-sky-500 bg-sky-950/50"
                : "border-slate-600 bg-slate-800/50 hover:border-slate-500"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      {!submitted && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={selected === null}
          className="mt-4 w-full rounded-xl bg-sky-600 py-3 font-medium text-white disabled:opacity-40 hover:bg-sky-500"
        >
          Check Answer
        </button>
      )}

      {submitted && (
        <FeedbackBanner
          message={isCorrect ? feedback.correct : feedback.incorrect}
          variant={isCorrect ? "correct" : "incorrect"}
        />
      )}

      {!submitted && attempts >= 2 && feedback.hint && !showHint && (
        <button
          type="button"
          onClick={() => setShowHint(true)}
          className="mt-3 text-sm text-amber-400 underline"
        >
          Show hint
        </button>
      )}

      {showHint && feedback.hint && (
        <FeedbackBanner message={feedback.hint} variant="hint" />
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

      {submitted && !isCorrect && (
        <button
          type="button"
          onClick={() => {
            onComplete(false);
            setSelected(null);
            setSubmitted(false);
          }}
          className="mt-4 w-full rounded-xl bg-slate-600 py-3 font-medium text-white hover:bg-slate-500"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
