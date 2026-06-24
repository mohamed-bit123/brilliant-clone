"use client";

import { useState } from "react";
import type { InteractionConfig } from "@/lib/types";
import { FeedbackBanner } from "@/components/ui/FeedbackBanner";
import { CircuitVisual } from "@/components/CircuitVisual";

type DiscoverTableStepProps = {
  interaction: Extract<InteractionConfig, { kind: "discover-table" }>;
  feedback: { correct: string; incorrect: string };
  onComplete: (correct: boolean) => void;
};

export function DiscoverTableStep({
  interaction,
  feedback,
  onComplete,
}: DiscoverTableStepProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const isCorrect = selected === interaction.correctIndex;

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-slate-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 bg-slate-800/80">
              <th className="px-4 py-2 text-left text-slate-400">Voltage</th>
              <th className="px-4 py-2 text-left text-slate-400">Resistance</th>
              <th className="px-4 py-2 text-left text-slate-400">Current</th>
            </tr>
          </thead>
          <tbody>
            {interaction.rows.map((row) => (
              <tr key={`${row.voltage}-${row.resistance}`} className="border-b border-slate-700/50">
                <td className="px-4 py-2 font-mono text-amber-300">{row.voltage}V</td>
                <td className="px-4 py-2 font-mono text-emerald-300">{row.resistance}Ω</td>
                <td className="px-4 py-2 font-mono text-sky-300">{row.current}A</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {interaction.options.map((opt, i) => (
          <button
            key={opt}
            type="button"
            disabled={submitted && isCorrect}
            onClick={() => !submitted && setSelected(i)}
            className={`rounded-xl border px-4 py-3 text-left text-sm ${
              selected === i
                ? submitted
                  ? isCorrect
                    ? "border-emerald-500 bg-emerald-950/50"
                    : "border-red-500 bg-red-950/50"
                  : "border-sky-500 bg-sky-950/50"
                : "border-slate-600 bg-slate-800/50"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      {!submitted && (
        <button
          type="button"
          disabled={selected === null}
          onClick={() => setSubmitted(true)}
          className="mt-4 w-full rounded-xl bg-sky-600 py-3 font-medium text-white disabled:opacity-40"
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

      {submitted && isCorrect && (
        <button type="button" onClick={() => onComplete(true)} className="mt-4 w-full rounded-xl bg-emerald-600 py-3 font-medium text-white">
          Continue
        </button>
      )}

      {submitted && !isCorrect && (
        <button type="button" onClick={() => { setSelected(null); setSubmitted(false); }} className="mt-4 w-full rounded-xl bg-slate-600 py-3 font-medium text-white">
          Try Again
        </button>
      )}
    </div>
  );
}

type DragDropStepProps = {
  interaction: Extract<InteractionConfig, { kind: "drag-drop" }>;
  feedback: { correct: string; incorrect: string; hint?: string };
  onComplete: (correct: boolean) => void;
  attempts: number;
};

export function DragDropStep({
  interaction,
  feedback,
  onComplete,
  attempts,
}: DragDropStepProps) {
  const [placed, setPlaced] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const isCorrect = placed === interaction.correctValue;
  const r = placed ? parseFloat(placed) : 10;
  const current = interaction.batteryVoltage / r;

  function handleDrop(value: string) {
    setPlaced(value);
    setDragging(null);
  }

  return (
    <div>
      <p className="mb-3 text-sm text-slate-400">
        Battery: {interaction.batteryVoltage}V · Target: {interaction.targetCurrent}A
      </p>

      <CircuitVisual
        voltage={interaction.batteryVoltage}
        resistance={r}
        mode="simple"
      />

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => dragging && handleDrop(dragging)}
        className={`mt-4 flex min-h-[60px] items-center justify-center rounded-xl border-2 border-dashed ${
          placed ? "border-emerald-500/50 bg-emerald-950/20" : "border-slate-600 bg-slate-800/30"
        }`}
      >
        {placed ? (
          <span className="font-mono text-lg text-emerald-300">{placed} placed · I = {current.toFixed(2)}A</span>
        ) : (
          <span className="text-sm text-slate-500">Drop a resistor here</span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {interaction.options.map((opt) => (
          <button
            key={opt}
            type="button"
            draggable
            onDragStart={() => setDragging(opt)}
            onClick={() => handleDrop(opt)}
            className="cursor-grab rounded-lg border border-pink-500/50 bg-pink-950/40 px-4 py-2 font-mono text-sm text-pink-200 active:cursor-grabbing"
          >
            {opt}
          </button>
        ))}
      </div>

      {placed && !submitted && (
        <>
          <button type="button" onClick={() => setSubmitted(true)} className="mt-4 w-full rounded-xl bg-sky-600 py-3 font-medium text-white">
            Check Answer
          </button>
          {attempts >= 2 && feedback.hint && !showHint && (
            <button type="button" onClick={() => setShowHint(true)} className="mt-3 text-sm text-amber-400 underline">
              Show hint
            </button>
          )}
          {showHint && feedback.hint && <FeedbackBanner message={feedback.hint} variant="hint" />}
        </>
      )}

      {submitted && (
        <FeedbackBanner message={isCorrect ? feedback.correct : feedback.incorrect} variant={isCorrect ? "correct" : "incorrect"} />
      )}

      {submitted && isCorrect && (
        <button type="button" onClick={() => onComplete(true)} className="mt-4 w-full rounded-xl bg-emerald-600 py-3 font-medium text-white">
          Continue
        </button>
      )}

      {submitted && !isCorrect && (
        <button type="button" onClick={() => { setPlaced(null); setSubmitted(false); }} className="mt-4 w-full rounded-xl bg-slate-600 py-3 font-medium text-white">
          Try Again
        </button>
      )}
    </div>
  );
}
